import { RequestQueue, queueRequest, DEFAULT_QUEUE_CONFIG } from '../requestQueue';

// Mock console methods
const mockConsoleInfo = jest.spyOn(console, 'info').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

describe('RequestQueue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('enqueue', () => {
    it('should execute request immediately when under concurrency limit', async () => {
      const queue = new RequestQueue({ maxConcurrent: 2 });
      const mockFn = jest.fn().mockResolvedValue('success');

      const result = await queue.enqueue(mockFn, 'test-request');

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringContaining('completed')
      );
    });

    it('should queue requests when at concurrency limit', async () => {
      const queue = new RequestQueue({ maxConcurrent: 1 });
      let resolveFirst: (value: string) => void;
      let resolveSecond: (value: string) => void;

      const firstRequest = new Promise<string>(resolve => {
        resolveFirst = resolve;
      });
      const secondRequest = new Promise<string>(resolve => {
        resolveSecond = resolve;
      });

      const mockFn1 = jest.fn().mockReturnValue(firstRequest);
      const mockFn2 = jest.fn().mockReturnValue(secondRequest);

      // Start both requests
      const promise1 = queue.enqueue(mockFn1, 'request-1');
      const promise2 = queue.enqueue(mockFn2, 'request-2');

      // First should start immediately, second should be queued
      expect(mockFn1).toHaveBeenCalledTimes(1);
      expect(mockFn2).toHaveBeenCalledTimes(0);

      // Complete first request
      resolveFirst!('result-1');
      const result1 = await promise1;
      expect(result1).toBe('result-1');

      // Second request should now start
      await new Promise(resolve => setTimeout(resolve, 10)); // Allow async processing
      expect(mockFn2).toHaveBeenCalledTimes(1);

      // Complete second request
      resolveSecond!('result-2');
      const result2 = await promise2;
      expect(result2).toBe('result-2');
    });

    it('should reject when queue is full', async () => {
      const queue = new RequestQueue({ maxConcurrent: 1, maxQueueSize: 1 });
      let resolveFirst: (value: string) => void;

      const firstRequest = new Promise<string>(resolve => {
        resolveFirst = resolve;
      });

      const mockFn1 = jest.fn().mockReturnValue(firstRequest);
      const mockFn2 = jest.fn().mockResolvedValue('result-2');
      const mockFn3 = jest.fn().mockResolvedValue('result-3');

      // Start first request (will be active)
      const promise1 = queue.enqueue(mockFn1, 'request-1');

      // Queue second request (will be queued)
      const promise2 = queue.enqueue(mockFn2, 'request-2');

      // Third request should be rejected (queue full)
      await expect(queue.enqueue(mockFn3, 'request-3')).rejects.toThrow('Request queue is full');

      // Clean up
      resolveFirst!('result-1');
      await promise1;
      await promise2;
    });

    it('should handle request timeout', async () => {
      const queue = new RequestQueue({ requestTimeoutMs: 50 });
      const mockFn = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      await expect(queue.enqueue(mockFn, 'slow-request')).rejects.toThrow('Request timeout');
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('failed')
      );
    });

    it('should handle queue timeout', async () => {
      const queue = new RequestQueue({ 
        maxConcurrent: 1, 
        queueTimeoutMs: 50 
      });
      let resolveFirst: (value: string) => void;

      const firstRequest = new Promise<string>(resolve => {
        resolveFirst = resolve;
      });

      const mockFn1 = jest.fn().mockReturnValue(firstRequest);
      const mockFn2 = jest.fn().mockResolvedValue('result-2');

      // Start first request (will block)
      const promise1 = queue.enqueue(mockFn1, 'request-1');

      // Queue second request (will timeout)
      await expect(queue.enqueue(mockFn2, 'request-2')).rejects.toThrow('Queue timeout');

      // Clean up
      resolveFirst!('result-1');
      await promise1;
    });

    it('should handle request errors', async () => {
      const queue = new RequestQueue();
      const error = new Error('Request failed');
      const mockFn = jest.fn().mockRejectedValue(error);

      await expect(queue.enqueue(mockFn, 'failing-request')).rejects.toThrow('Request failed');
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('failed')
      );
    });
  });

  describe('getStats', () => {
    it('should return accurate statistics', async () => {
      const queue = new RequestQueue();
      const mockFn1 = jest.fn().mockResolvedValue('success');
      const mockFn2 = jest.fn().mockRejectedValue(new Error('failed'));

      // Initial stats
      let stats = queue.getStats();
      expect(stats.activeRequests).toBe(0);
      expect(stats.queuedRequests).toBe(0);
      expect(stats.totalProcessed).toBe(0);
      expect(stats.totalErrors).toBe(0);

      // Execute successful request
      await queue.enqueue(mockFn1, 'success-request');

      // Execute failing request
      try {
        await queue.enqueue(mockFn2, 'failing-request');
      } catch (error) {
        // Expected to fail
      }

      // Check final stats
      stats = queue.getStats();
      expect(stats.totalProcessed).toBe(2);
      expect(stats.totalErrors).toBe(1);
      expect(stats.averageProcessingTime).toBeGreaterThan(0);
    });
  });

  describe('clear', () => {
    it('should clear queue and reject pending requests', async () => {
      const queue = new RequestQueue({ maxConcurrent: 1 });
      let resolveFirst: (value: string) => void;

      const firstRequest = new Promise<string>(resolve => {
        resolveFirst = resolve;
      });

      const mockFn1 = jest.fn().mockReturnValue(firstRequest);
      const mockFn2 = jest.fn().mockResolvedValue('result-2');

      // Start first request and queue second
      const promise1 = queue.enqueue(mockFn1, 'request-1');
      const promise2 = queue.enqueue(mockFn2, 'request-2');

      // Clear queue
      queue.clear('Test clear');

      // Second request should be rejected
      await expect(promise2).rejects.toThrow('Test clear');

      // First request should still complete
      resolveFirst!('result-1');
      const result1 = await promise1;
      expect(result1).toBe('result-1');
    });
  });

  describe('isHealthy', () => {
    it('should return true for healthy queue', () => {
      const queue = new RequestQueue();
      expect(queue.isHealthy()).toBe(true);
    });

    it('should return false for unhealthy queue', async () => {
      const queue = new RequestQueue({ maxQueueSize: 10 });
      
      // Fill queue to 90% capacity
      const promises: Promise<any>[] = [];
      for (let i = 0; i < 9; i++) {
        promises.push(queue.enqueue(() => new Promise(resolve => setTimeout(resolve, 1000))));
      }

      expect(queue.isHealthy()).toBe(false);

      // Clean up
      queue.clear('Test cleanup');
    });
  });

  describe('configuration management', () => {
    it('should update configuration', () => {
      const queue = new RequestQueue();
      const newConfig = { maxConcurrent: 10, maxQueueSize: 200 };

      queue.updateConfig(newConfig);
      const config = queue.getConfig();

      expect(config.maxConcurrent).toBe(10);
      expect(config.maxQueueSize).toBe(200);
      expect(config.requestTimeoutMs).toBe(DEFAULT_QUEUE_CONFIG.requestTimeoutMs); // Should keep default
    });

    it('should get current configuration', () => {
      const customConfig = { maxConcurrent: 10, maxQueueSize: 200 };
      const queue = new RequestQueue(customConfig);

      const config = queue.getConfig();

      expect(config.maxConcurrent).toBe(10);
      expect(config.maxQueueSize).toBe(200);
      expect(config).toEqual(expect.objectContaining(customConfig));
    });
  });

  describe('queueRequest convenience function', () => {
    it('should use global queue by default', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      const result = await queueRequest(mockFn, 'test-request');

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should use custom configuration', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      const result = await queueRequest(
        mockFn,
        'test-request',
        { maxConcurrent: 1, requestTimeoutMs: 5000 }
      );

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });
});