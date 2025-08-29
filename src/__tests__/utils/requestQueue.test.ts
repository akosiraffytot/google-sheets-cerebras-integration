import { RequestQueue, queueRequest, DEFAULT_QUEUE_CONFIG } from '../../utils/requestQueue';

describe('RequestQueue', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'info').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.useFakeTimers();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  describe('Constructor', () => {
    it('should use default configuration', () => {
      const queue = new RequestQueue();
      const config = queue.getConfig();

      expect(config).toEqual(DEFAULT_QUEUE_CONFIG);
    });

    it('should merge custom configuration with defaults', () => {
      const customConfig = {
        maxConcurrent: 10,
        maxQueueSize: 200
      };

      const queue = new RequestQueue(customConfig);
      const config = queue.getConfig();

      expect(config.maxConcurrent).toBe(10);
      expect(config.maxQueueSize).toBe(200);
      expect(config.requestTimeoutMs).toBe(DEFAULT_QUEUE_CONFIG.requestTimeoutMs);
    });
  });

  describe('enqueue', () => {
    it('should execute request immediately when under concurrency limit', async () => {
      const queue = new RequestQueue({ maxConcurrent: 2 });
      const mockFn = jest.fn().mockResolvedValue('result1');

      const promise = queue.enqueue(mockFn, 'test-request');
      jest.runAllTimers();
      const result = await promise;

      expect(result).toBe('result1');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should queue requests when at concurrency limit', async () => {
      const queue = new RequestQueue({ maxConcurrent: 1 });
      
      // First request - should execute immediately
      const mockFn1 = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('result1'), 100))
      );
      
      // Second request - should be queued
      const mockFn2 = jest.fn().mockResolvedValue('result2');

      const promise1 = queue.enqueue(mockFn1, 'request1');
      const promise2 = queue.enqueue(mockFn2, 'request2');

      // First request should start immediately
      expect(mockFn1).toHaveBeenCalledTimes(1);
      expect(mockFn2).toHaveBeenCalledTimes(0);

      // Complete first request
      jest.advanceTimersByTime(100);
      await promise1;

      // Second request should now execute
      jest.runAllTimers();
      const result2 = await promise2;

      expect(result2).toBe('result2');
      expect(mockFn2).toHaveBeenCalledTimes(1);
    });

    it('should reject when queue is full', async () => {
      const queue = new RequestQueue({ maxConcurrent: 1, maxQueueSize: 1 });
      
      // Fill up the concurrent slot
      const longRunningFn = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('long'), 1000))
      );
      
      // Fill up the queue
      const queuedFn = jest.fn().mockResolvedValue('queued');
      
      // This should exceed the queue limit
      const overflowFn = jest.fn().mockResolvedValue('overflow');

      queue.enqueue(longRunningFn, 'long-running');
      queue.enqueue(queuedFn, 'queued');

      await expect(queue.enqueue(overflowFn, 'overflow')).rejects.toThrow('Request queue is full');
    });

    it('should handle request timeouts', async () => {
      const queue = new RequestQueue({ requestTimeoutMs: 100 });
      
      const slowFn = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('slow'), 200))
      );

      const promise = queue.enqueue(slowFn, 'slow-request');
      
      // Advance past the timeout
      jest.advanceTimersByTime(150);
      
      await expect(promise).rejects.toThrow('Request timeout');
    });

    it('should handle queue timeouts', async () => {
      const queue = new RequestQueue({ 
        maxConcurrent: 1, 
        queueTimeoutMs: 100 
      });
      
      // Block the concurrent slot
      const blockingFn = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('blocking'), 1000))
      );
      
      const queuedFn = jest.fn().mockResolvedValue('queued');

      queue.enqueue(blockingFn, 'blocking');
      const queuedPromise = queue.enqueue(queuedFn, 'queued');

      // Advance past queue timeout
      jest.advanceTimersByTime(150);
      
      await expect(queuedPromise).rejects.toThrow('Queue timeout');
    });

    it('should update statistics correctly', async () => {
      const queue = new RequestQueue();
      
      const mockFn1 = jest.fn().mockResolvedValue('result1');
      const mockFn2 = jest.fn().mockRejectedValue(new Error('error2'));

      const promise1 = queue.enqueue(mockFn1, 'request1');
      const promise2 = queue.enqueue(mockFn2, 'request2');

      jest.runAllTimers();
      
      await promise1;
      await expect(promise2).rejects.toThrow('error2');

      const stats = queue.getStats();
      expect(stats.totalProcessed).toBe(2);
      expect(stats.totalErrors).toBe(1);
      expect(stats.averageProcessingTime).toBeGreaterThan(0);
    });

    it('should log successful requests', async () => {
      const queue = new RequestQueue();
      const mockFn = jest.fn().mockResolvedValue('success');

      const promise = queue.enqueue(mockFn, 'test-request');
      jest.runAllTimers();
      await promise;

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('completed')
      );
    });

    it('should log failed requests', async () => {
      const queue = new RequestQueue();
      const mockFn = jest.fn().mockRejectedValue(new Error('Test error'));

      const promise = queue.enqueue(mockFn, 'test-request');
      jest.runAllTimers();
      
      await expect(promise).rejects.toThrow('Test error');

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('failed')
      );
    });
  });

  describe('getStats', () => {
    it('should return current queue statistics', async () => {
      const queue = new RequestQueue({ maxConcurrent: 1 });
      
      // Add a long-running request to create active requests
      const longRunningFn = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('long'), 100))
      );
      
      // Add a queued request
      const queuedFn = jest.fn().mockResolvedValue('queued');

      queue.enqueue(longRunningFn, 'long-running');
      queue.enqueue(queuedFn, 'queued');

      const stats = queue.getStats();
      expect(stats.activeRequests).toBe(1);
      expect(stats.queuedRequests).toBe(1);
      expect(stats.totalProcessed).toBe(0); // Not completed yet
      expect(stats.totalErrors).toBe(0);
      expect(stats.averageProcessingTime).toBe(0);
    });

    it('should calculate average processing time correctly', async () => {
      const queue = new RequestQueue();
      
      // Mock functions with different execution times
      const fastFn = jest.fn().mockResolvedValue('fast');
      const slowFn = jest.fn().mockResolvedValue('slow');

      // Execute requests
      const promise1 = queue.enqueue(fastFn, 'fast');
      jest.advanceTimersByTime(10);
      await promise1;

      const promise2 = queue.enqueue(slowFn, 'slow');
      jest.advanceTimersByTime(30);
      await promise2;

      const stats = queue.getStats();
      expect(stats.totalProcessed).toBe(2);
      expect(stats.averageProcessingTime).toBeGreaterThan(0);
    });
  });

  describe('clear', () => {
    it('should clear all queued requests', async () => {
      const queue = new RequestQueue({ maxConcurrent: 1 });
      
      // Block the concurrent slot
      const blockingFn = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('blocking'), 100))
      );
      
      // Add queued requests
      const queuedFn1 = jest.fn().mockResolvedValue('queued1');
      const queuedFn2 = jest.fn().mockResolvedValue('queued2');

      queue.enqueue(blockingFn, 'blocking');
      const promise1 = queue.enqueue(queuedFn1, 'queued1');
      const promise2 = queue.enqueue(queuedFn2, 'queued2');

      // Clear the queue
      queue.clear('Test clear');

      // Queued requests should be rejected
      await expect(promise1).rejects.toThrow('Test clear');
      await expect(promise2).rejects.toThrow('Test clear');

      // Queue should be empty
      const stats = queue.getStats();
      expect(stats.queuedRequests).toBe(0);
    });

    it('should use default reason when none provided', async () => {
      const queue = new RequestQueue();
      const mockFn = jest.fn().mockResolvedValue('test');
      
      const promise = queue.enqueue(mockFn, 'test');
      queue.clear();

      await expect(promise).rejects.toThrow('Queue cleared');
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      const queue = new RequestQueue();
      
      queue.updateConfig({
        maxConcurrent: 10,
        maxQueueSize: 200
      });

      const config = queue.getConfig();
      expect(config.maxConcurrent).toBe(10);
      expect(config.maxQueueSize).toBe(200);
      expect(config.requestTimeoutMs).toBe(DEFAULT_QUEUE_CONFIG.requestTimeoutMs);
    });
  });

  describe('isHealthy', () => {
    it('should return true for healthy queue', () => {
      const queue = new RequestQueue();
      expect(queue.isHealthy()).toBe(true);
    });

    it('should return false when queue is too full', async () => {
      const queue = new RequestQueue({ maxConcurrent: 1, maxQueueSize: 10 });
      
      // Block the concurrent slot
      const blockingFn = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('blocking'), 1000))
      );
      
      queue.enqueue(blockingFn, 'blocking');

      // Fill queue to 90% capacity (9 out of 10)
      for (let i = 0; i < 9; i++) {
        queue.enqueue(jest.fn().mockResolvedValue(`queued${i}`), `queued${i}`);
      }

      expect(queue.isHealthy()).toBe(false);
    });

    it('should return false when error rate is too high', async () => {
      const queue = new RequestQueue();
      
      // Execute requests with high error rate
      const errorFn = jest.fn().mockRejectedValue(new Error('Test error'));
      const successFn = jest.fn().mockResolvedValue('success');

      // 3 errors, 1 success = 75% error rate
      for (let i = 0; i < 3; i++) {
        const promise = queue.enqueue(errorFn, `error${i}`);
        jest.runAllTimers();
        await expect(promise).rejects.toThrow();
      }

      const promise = queue.enqueue(successFn, 'success');
      jest.runAllTimers();
      await promise;

      expect(queue.isHealthy()).toBe(false);
    });

    it('should return false when processing time is too high', async () => {
      const queue = new RequestQueue({ requestTimeoutMs: 1000 });
      
      // Mock a slow function that takes 90% of timeout
      const slowFn = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('slow'), 900))
      );

      const promise = queue.enqueue(slowFn, 'slow');
      jest.advanceTimersByTime(900);
      await promise;

      expect(queue.isHealthy()).toBe(false);
    });
  });

  describe('generateRequestId', () => {
    it('should generate unique request IDs', () => {
      const queue = new RequestQueue();
      
      const id1 = (queue as any).generateRequestId();
      const id2 = (queue as any).generateRequestId();

      expect(id1).toMatch(/^req_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^req_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });
});

describe('queueRequest', () => {
  beforeEach(() => {
    jest.spyOn(console, 'info').mockImplementation();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('should use global queue when no config provided', async () => {
    const mockFn = jest.fn().mockResolvedValue('global');

    const promise = queueRequest(mockFn, 'global-test');
    jest.runAllTimers();
    const result = await promise;

    expect(result).toBe('global');
  });

  it('should create custom queue when config provided', async () => {
    const mockFn = jest.fn().mockResolvedValue('custom');
    const customConfig = { maxConcurrent: 10 };

    const promise = queueRequest(mockFn, 'custom-test', customConfig);
    jest.runAllTimers();
    const result = await promise;

    expect(result).toBe('custom');
  });

  it('should pass context to queue', async () => {
    const mockFn = jest.fn().mockResolvedValue('context-test');

    const promise = queueRequest(mockFn, 'test-context');
    jest.runAllTimers();
    await promise;

    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('test-context')
    );
  });
});