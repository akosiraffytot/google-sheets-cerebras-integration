import { ErrorCodes } from '../types/api';

/**
 * Retry configuration options
 */
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitterFactor: number;
  retryableErrors: string[];
  timeoutMs: number;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  jitterFactor: 0.1,
  retryableErrors: [
    ErrorCodes.RATE_LIMITED,
    ErrorCodes.TIMEOUT,
    ErrorCodes.API_UNAVAILABLE
  ],
  timeoutMs: 30000 // 30 seconds
};

/**
 * Retry attempt information
 */
export interface RetryAttempt {
  attemptNumber: number;
  delay: number;
  error?: any;
  timestamp: string;
}

/**
 * Retry result
 */
export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: any;
  attempts: RetryAttempt[];
  totalDuration: number;
}

/**
 * Function that can be retried
 */
export type RetryableFunction<T> = () => Promise<T>;

/**
 * Retry handler with exponential backoff and jitter
 */
export class RetryHandler {
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
  }

  /**
   * Executes a function with retry logic
   */
  public async execute<T>(
    fn: RetryableFunction<T>,
    context?: string
  ): Promise<RetryResult<T>> {
    const startTime = Date.now();
    const attempts: RetryAttempt[] = [];
    let lastError: any;

    for (let attempt = 1; attempt <= this.config.maxRetries + 1; attempt++) {
      const attemptStart = Date.now();
      
      try {
        // Add timeout wrapper
        const result = await this.withTimeout(fn(), this.config.timeoutMs);
        
        const attemptInfo: RetryAttempt = {
          attemptNumber: attempt,
          delay: 0,
          timestamp: new Date().toISOString()
        };
        attempts.push(attemptInfo);

        return {
          success: true,
          result,
          attempts,
          totalDuration: Date.now() - startTime
        };
      } catch (error: any) {
        lastError = error;
        
        const attemptInfo: RetryAttempt = {
          attemptNumber: attempt,
          delay: 0,
          error: this.sanitizeErrorForLogging(error),
          timestamp: new Date().toISOString()
        };

        // Check if this is the last attempt
        if (attempt > this.config.maxRetries) {
          attempts.push(attemptInfo);
          break;
        }

        // Check if error is retryable
        if (!this.isRetryableError(error)) {
          attempts.push(attemptInfo);
          break;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateDelay(attempt - 1);
        attemptInfo.delay = delay;
        attempts.push(attemptInfo);

        // Log retry attempt
        console.warn(`Retry attempt ${attempt}/${this.config.maxRetries} for ${context || 'operation'} after ${delay}ms delay. Error: ${error.message}`);

        // Wait before retrying
        await this.sleep(delay);
      }
    }

    return {
      success: false,
      error: lastError,
      attempts,
      totalDuration: Date.now() - startTime
    };
  }

  /**
   * Wraps a promise with a timeout
   */
  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      promise
        .then(resolve)
        .catch(reject)
        .finally(() => clearTimeout(timeoutId));
    });
  }

  /**
   * Determines if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    // Check by error code
    if (error.code && this.config.retryableErrors.includes(error.code)) {
      return true;
    }

    // Check by HTTP status
    if (error.status || error.statusCode) {
      const status = error.status || error.statusCode;
      const retryableStatuses = [408, 429, 500, 502, 503, 504];
      return retryableStatuses.includes(status);
    }

    // Check by error type
    const retryableErrorCodes = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET'];
    if (error.code && retryableErrorCodes.includes(error.code)) {
      return true;
    }

    // Check by error name
    const retryableErrorNames = ['TimeoutError', 'NetworkError'];
    if (error.name && retryableErrorNames.includes(error.name)) {
      return true;
    }

    return false;
  }

  /**
   * Calculates delay with exponential backoff and jitter
   */
  private calculateDelay(attemptNumber: number): number {
    // Exponential backoff: baseDelay * (backoffMultiplier ^ attemptNumber)
    const exponentialDelay = this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attemptNumber);
    
    // Cap at maxDelay
    const cappedDelay = Math.min(exponentialDelay, this.config.maxDelay);
    
    // Add jitter to avoid thundering herd
    const jitter = cappedDelay * this.config.jitterFactor * (Math.random() - 0.5);
    
    return Math.max(0, Math.round(cappedDelay + jitter));
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Sanitizes error for logging (removes sensitive information)
   */
  private sanitizeErrorForLogging(error: any): any {
    if (!error) return null;

    return {
      name: error.name,
      message: error.message,
      code: error.code,
      status: error.status || error.statusCode,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    };
  }

  /**
   * Updates retry configuration
   */
  public updateConfig(config: Partial<RetryConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Gets current configuration
   */
  public getConfig(): RetryConfig {
    return { ...this.config };
  }
}

/**
 * Default retry handler instance
 */
export const defaultRetryHandler = new RetryHandler();

/**
 * Convenience function for retrying operations
 */
export async function withRetry<T>(
  fn: RetryableFunction<T>,
  config?: Partial<RetryConfig>,
  context?: string
): Promise<RetryResult<T>> {
  const retryHandler = config ? new RetryHandler(config) : defaultRetryHandler;
  return retryHandler.execute(fn, context);
}