/**
 * Request queue configuration
 */
export interface QueueConfig {
  maxConcurrent: number;
  maxQueueSize: number;
  requestTimeoutMs: number;
  queueTimeoutMs: number;
}

/**
 * Default queue configuration
 */
export const DEFAULT_QUEUE_CONFIG: QueueConfig = {
  maxConcurrent: 5,
  maxQueueSize: 100,
  requestTimeoutMs: 30000, // 30 seconds
  queueTimeoutMs: 60000 // 1 minute
};

/**
 * Queued request information
 */
export interface QueuedRequest<T> {
  id: string;
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
  timestamp: number;
  context?: string;
}

/**
 * Queue statistics
 */
export interface QueueStats {
  activeRequests: number;
  queuedRequests: number;
  totalProcessed: number;
  totalErrors: number;
  averageProcessingTime: number;
}

/**
 * Request queue for managing concurrent operations
 */
export class RequestQueue {
  private config: QueueConfig;
  private queue: QueuedRequest<any>[] = [];
  private activeRequests = new Set<string>();
  private stats = {
    totalProcessed: 0,
    totalErrors: 0,
    totalProcessingTime: 0
  };

  constructor(config: Partial<QueueConfig> = {}) {
    this.config = { ...DEFAULT_QUEUE_CONFIG, ...config };
  }

  /**
   * Adds a request to the queue
   */
  public async enqueue<T>(
    fn: () => Promise<T>,
    context?: string
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const requestId = this.generateRequestId();
      const timestamp = Date.now();

      // Check queue size limit
      if (this.queue.length >= this.config.maxQueueSize) {
        reject(new Error('Request queue is full'));
        return;
      }

      const queuedRequest: QueuedRequest<T> = {
        id: requestId,
        fn,
        resolve,
        reject,
        timestamp,
        context
      };

      this.queue.push(queuedRequest);

      // Set queue timeout
      setTimeout(() => {
        this.timeoutRequest(requestId, 'Queue timeout');
      }, this.config.queueTimeoutMs);

      // Process queue
      this.processQueue();
    });
  }

  /**
   * Processes the queue by executing requests up to the concurrency limit
   */
  private async processQueue(): Promise<void> {
    while (this.queue.length > 0 && this.activeRequests.size < this.config.maxConcurrent) {
      const request = this.queue.shift()!;
      this.activeRequests.add(request.id);

      // Execute request asynchronously
      this.executeRequest(request);
    }
  }

  /**
   * Executes a single request
   */
  private async executeRequest<T>(request: QueuedRequest<T>): Promise<void> {
    const startTime = Date.now();

    try {
      // Set request timeout
      const timeoutId = setTimeout(() => {
        this.timeoutRequest(request.id, 'Request timeout');
      }, this.config.requestTimeoutMs);

      // Execute the function
      const result = await request.fn();
      
      clearTimeout(timeoutId);

      // Update stats
      const processingTime = Date.now() - startTime;
      this.updateStats(processingTime, false);

      // Resolve the promise
      request.resolve(result);

      console.info(`Request ${request.id} completed in ${processingTime}ms${request.context ? ` (${request.context})` : ''}`);
    } catch (error: any) {
      // Update stats
      const processingTime = Date.now() - startTime;
      this.updateStats(processingTime, true);

      // Reject the promise
      request.reject(error);

      console.error(`Request ${request.id} failed after ${processingTime}ms${request.context ? ` (${request.context})` : ''}: ${error.message}`);
    } finally {
      // Remove from active requests
      this.activeRequests.delete(request.id);

      // Process next requests in queue
      this.processQueue();
    }
  }

  /**
   * Times out a request
   */
  private timeoutRequest(requestId: string, reason: string): void {
    // Find request in queue
    const queueIndex = this.queue.findIndex(req => req.id === requestId);
    if (queueIndex !== -1) {
      const request = this.queue.splice(queueIndex, 1)[0];
      request.reject(new Error(reason));
      return;
    }

    // If not in queue, it might be active (timeout will be handled by executeRequest)
  }

  /**
   * Updates queue statistics
   */
  private updateStats(processingTime: number, isError: boolean): void {
    this.stats.totalProcessed++;
    this.stats.totalProcessingTime += processingTime;
    
    if (isError) {
      this.stats.totalErrors++;
    }
  }

  /**
   * Gets current queue statistics
   */
  public getStats(): QueueStats {
    return {
      activeRequests: this.activeRequests.size,
      queuedRequests: this.queue.length,
      totalProcessed: this.stats.totalProcessed,
      totalErrors: this.stats.totalErrors,
      averageProcessingTime: this.stats.totalProcessed > 0 
        ? this.stats.totalProcessingTime / this.stats.totalProcessed 
        : 0
    };
  }

  /**
   * Clears the queue and rejects all pending requests
   */
  public clear(reason: string = 'Queue cleared'): void {
    while (this.queue.length > 0) {
      const request = this.queue.shift()!;
      request.reject(new Error(reason));
    }
  }

  /**
   * Updates queue configuration
   */
  public updateConfig(config: Partial<QueueConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Gets current configuration
   */
  public getConfig(): QueueConfig {
    return { ...this.config };
  }

  /**
   * Generates a unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Checks if the queue is healthy
   */
  public isHealthy(): boolean {
    const stats = this.getStats();
    const errorRate = stats.totalProcessed > 0 ? stats.totalErrors / stats.totalProcessed : 0;
    
    return (
      stats.queuedRequests < this.config.maxQueueSize * 0.8 && // Queue not too full
      errorRate < 0.5 && // Error rate below 50%
      stats.averageProcessingTime < this.config.requestTimeoutMs * 0.8 // Processing time reasonable
    );
  }
}

/**
 * Global request queue instance
 */
export const globalRequestQueue = new RequestQueue();

/**
 * Convenience function for queuing requests
 */
export async function queueRequest<T>(
  fn: () => Promise<T>,
  context?: string,
  config?: Partial<QueueConfig>
): Promise<T> {
  if (config) {
    const customQueue = new RequestQueue(config);
    return customQueue.enqueue(fn, context);
  }
  
  return globalRequestQueue.enqueue(fn, context);
}