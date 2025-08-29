import { RequestQueue } from '../../utils/requestQueue';
import { RetryHandler } from '../../utils/retryHandler';
import { CerebrasService } from '../../services/cerebras';

// Mock Cerebras SDK
jest.mock('@cerebras/cerebras_cloud_sdk');

describe('Performance and Load Tests', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Request Queue Load Testing', () => {
    it('should handle high concurrent request load', async () => {
      const queue = new RequestQueue({ 
        maxConcurrent: 10, 
        maxQueueSize: 100,
        requestTimeoutMs: 5000
      });

      const requestCount = 50;
      const mockFn = jest.fn().mockImplementation((id: number) => 
        new Promise(resolve => setTimeout(() => resolve(`result-${id}`), 100))
      );

      // Create many concurrent requests
      const promises = Array.from({ length: requestCount }, (_, i) => 
        queue.enqueue(() => mockFn(i), `request-${i}`)
      );

      // Process all requests
      jest.runAllTimers();
      const results = await Promise.all(promises);

      expect(results).toHaveLength(requestCount);
      expect(mockFn).toHaveBeenCalledTimes(requestCount);
      
      // Check that all results are unique
      const uniqueResults = new Set(results);
      expect(uniqueResults.size).toBe(requestCount);

      // Verify queue statistics
      const stats = queue.getStats();
      expect(stats.totalProcessed).toBe(requestCount);
      expect(stats.totalErrors).toBe(0);
      expect(stats.activeRequests).toBe(0);
      expect(stats.queuedRequests).toBe(0);
    });

    it('should maintain performance under sustained load', async () => {
      const queue = new RequestQueue({ 
        maxConcurrent: 5, 
        maxQueueSize: 200 
      });

      const batchSize = 20;
      const batchCount = 5;
      const totalRequests = batchSize * batchCount;

      const mockFn = jest.fn().mockImplementation((id: number) => 
        new Promise(resolve => setTimeout(() => resolve(`batch-result-${id}`), 50))
      );

      const startTime = Date.now();
      const allPromises: Promise<any>[] = [];

      // Submit requests in batches
      for (let batch = 0; batch < batchCount; batch++) {
        const batchPromises = Array.from({ length: batchSize }, (_, i) => {
          const requestId = batch * batchSize + i;
          return queue.enqueue(() => mockFn(requestId), `batch-${batch}-request-${i}`);
        });
        
        allPromises.push(...batchPromises);
        
        // Small delay between batches
        jest.advanceTimersByTime(10);
      }

      // Process all requests
      jest.runAllTimers();
      const results = await Promise.all(allPromises);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(results).toHaveLength(totalRequests);
      expect(mockFn).toHaveBeenCalledTimes(totalRequests);

      // Verify performance metrics
      const stats = queue.getStats();
      expect(stats.totalProcessed).toBe(totalRequests);
      expect(stats.averageProcessingTime).toBeLessThan(1000); // Should be reasonable
      expect(queue.isHealthy()).toBe(true);

      console.log(`Processed ${totalRequests} requests in ${totalTime}ms`);
      console.log(`Average processing time: ${stats.averageProcessingTime}ms`);
    });

    it('should handle mixed success and failure scenarios', async () => {
      const queue = new RequestQueue({ maxConcurrent: 5 });

      const successCount = 30;
      const errorCount = 10;
      const totalRequests = successCount + errorCount;

      const mockSuccessFn = jest.fn().mockResolvedValue('success');
      const mockErrorFn = jest.fn().mockRejectedValue(new Error('Test error'));

      const promises: Promise<any>[] = [];

      // Add successful requests
      for (let i = 0; i < successCount; i++) {
        promises.push(
          queue.enqueue(mockSuccessFn, `success-${i}`)
        );
      }

      // Add failing requests
      for (let i = 0; i < errorCount; i++) {
        promises.push(
          queue.enqueue(mockErrorFn, `error-${i}`).catch(err => ({ error: err.message }))
        );
      }

      jest.runAllTimers();
      const results = await Promise.all(promises);

      const successResults = results.filter(r => r === 'success');
      const errorResults = results.filter(r => r && r.error);

      expect(successResults).toHaveLength(successCount);
      expect(errorResults).toHaveLength(errorCount);

      const stats = queue.getStats();
      expect(stats.totalProcessed).toBe(totalRequests);
      expect(stats.totalErrors).toBe(errorCount);
    });
  });

  describe('Retry Handler Load Testing', () => {
    it('should handle multiple retry scenarios efficiently', async () => {
      const retryHandler = new RetryHandler({
        maxRetries: 3,
        baseDelay: 10, // Faster for testing
        backoffMultiplier: 1.5
      });

      const requestCount = 20;
      const results: any[] = [];

      // Mix of immediate success, retry success, and failure
      const scenarios = [
        () => Promise.resolve('immediate-success'), // 50% immediate success
        () => Promise.resolve('immediate-success'),
        () => { // 25% success after 1 retry
          let attempts = 0;
          return () => {
            attempts++;
            if (attempts === 1) throw new Error('Temporary failure');
            return Promise.resolve('retry-success');
          };
        }(),
        () => { // 25% failure after all retries
          return () => Promise.reject(new Error('Permanent failure'));
        }()
      ];

      const promises = Array.from({ length: requestCount }, (_, i) => {
        const scenarioIndex = i % scenarios.length;
        const fn = scenarios[scenarioIndex];
        
        return retryHandler.execute(fn, `load-test-${i}`)
          .then(result => ({ success: result.success, attempts: result.attempts.length }));
      });

      jest.runAllTimers();
      const results_data = await Promise.all(promises);

      const successCount = results_data.filter(r => r.success).length;
      const failureCount = results_data.filter(r => !r.success).length;

      expect(successCount).toBeGreaterThan(0);
      expect(failureCount).toBeGreaterThan(0);
      expect(successCount + failureCount).toBe(requestCount);

      // Verify retry attempts distribution
      const totalAttempts = results_data.reduce((sum, r) => sum + r.attempts, 0);
      expect(totalAttempts).toBeGreaterThan(requestCount); // Should have some retries
    });

    it('should maintain performance with high retry rates', async () => {
      const retryHandler = new RetryHandler({
        maxRetries: 2,
        baseDelay: 5,
        backoffMultiplier: 2
      });

      const requestCount = 30;
      let callCount = 0;

      // Function that fails first 2 times, succeeds on 3rd
      const flakyFn = () => {
        callCount++;
        if (callCount % 3 !== 0) {
          const error = new Error('Flaky error');
          (error as any).status = 503; // Retryable error
          throw error;
        }
        return Promise.resolve(`success-${Math.floor(callCount / 3)}`);
      };

      const promises = Array.from({ length: requestCount }, (_, i) => 
        retryHandler.execute(flakyFn, `flaky-${i}`)
      );

      jest.runAllTimers();
      const results = await Promise.all(promises);

      const successCount = results.filter(r => r.success).length;
      expect(successCount).toBe(requestCount);

      // Each request should succeed on the 3rd attempt (2 retries)
      expect(callCount).toBe(requestCount * 3);
    });
  });

  describe('Cerebras Service Load Testing', () => {
    beforeEach(() => {
      // Mock Cerebras SDK
      const MockCerebras = require('@cerebras/cerebras_cloud_sdk').Cerebras;
      const mockClient = {
        chat: {
          completions: {
            create: jest.fn()
          }
        }
      };
      MockCerebras.mockImplementation(() => mockClient);

      // Mock retry and queue utilities
      jest.doMock('../../utils/retryHandler', () => ({
        withRetry: jest.fn().mockImplementation(async (fn) => {
          const result = await fn();
          return { success: true, result };
        })
      }));

      jest.doMock('../../utils/requestQueue', () => ({
        queueRequest: jest.fn().mockImplementation(async (fn) => await fn())
      }));
    });

    it('should handle multiple concurrent rewrite requests', async () => {
      const service = new CerebrasService('test-api-key');
      const MockCerebras = require('@cerebras/cerebras_cloud_sdk').Cerebras;
      const mockClient = MockCerebras.mock.results[0].value;

      // Mock successful responses
      mockClient.chat.completions.create.mockImplementation((params: any) => {
        const prompt = params.messages[0].content;
        const textMatch = prompt.match(/Text to rewrite:\n(.+?)\n/);
        const originalText = textMatch ? textMatch[1] : 'text';
        
        return Promise.resolve({
          choices: [{
            message: {
              content: `Rewritten: ${originalText}`
            }
          }]
        });
      });

      const requestCount = 25;
      const requests = Array.from({ length: requestCount }, (_, i) => ({
        prompt: `Rewrite request ${i}`,
        mainText: `Original text ${i}`,
        contextText: `Context ${i}`
      }));

      const promises = requests.map((req, i) => 
        service.rewriteText(req.prompt, req.mainText, req.contextText)
      );

      jest.runAllTimers();
      const results = await Promise.all(promises);

      // All requests should succeed
      expect(results.every(r => r.success)).toBe(true);
      expect(results).toHaveLength(requestCount);

      // Verify each result is unique
      const rewrittenTexts = results.map(r => r.rewrittenText);
      const uniqueTexts = new Set(rewrittenTexts);
      expect(uniqueTexts.size).toBe(requestCount);

      // Verify Cerebras was called for each request
      expect(mockClient.chat.completions.create).toHaveBeenCalledTimes(requestCount);
    });

    it('should handle large text inputs efficiently', async () => {
      const service = new CerebrasService('test-api-key');
      const MockCerebras = require('@cerebras/cerebras_cloud_sdk').Cerebras;
      const mockClient = MockCerebras.mock.results[0].value;

      // Mock response for large text
      mockClient.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: 'Rewritten large text content'
          }
        }]
      });

      // Create large text inputs
      const largePrompt = 'Rewrite this text to be more professional. '.repeat(50); // ~2000 chars
      const largeMainText = 'This is a very long text that needs to be rewritten. '.repeat(100); // ~5000 chars
      const largeContextText = 'Additional context information. '.repeat(75); // ~2500 chars

      const startTime = Date.now();
      
      const result = await service.rewriteText(largePrompt, largeMainText, largeContextText);
      
      jest.runAllTimers();
      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(result.success).toBe(true);
      expect(result.rewrittenText).toBe('Rewritten large text content');
      
      // Should handle large inputs efficiently
      expect(processingTime).toBeLessThan(1000);

      // Verify the full prompt was constructed correctly
      const callArgs = mockClient.chat.completions.create.mock.calls[0][0];
      const fullPrompt = callArgs.messages[0].content;
      
      expect(fullPrompt).toContain(largePrompt.trim());
      expect(fullPrompt).toContain(largeMainText);
      expect(fullPrompt).toContain(largeContextText);
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should not leak memory with many requests', async () => {
      const queue = new RequestQueue({ maxConcurrent: 3 });
      
      // Track initial memory usage (simplified)
      const initialStats = queue.getStats();
      
      const requestCount = 100;
      const batchSize = 10;

      // Process requests in batches to simulate real usage
      for (let batch = 0; batch < requestCount / batchSize; batch++) {
        const batchPromises = Array.from({ length: batchSize }, (_, i) => {
          const requestId = batch * batchSize + i;
          return queue.enqueue(
            () => Promise.resolve(`batch-${batch}-result-${i}`),
            `memory-test-${requestId}`
          );
        });

        jest.runAllTimers();
        await Promise.all(batchPromises);

        // Verify queue is cleaned up between batches
        const stats = queue.getStats();
        expect(stats.activeRequests).toBe(0);
        expect(stats.queuedRequests).toBe(0);
      }

      const finalStats = queue.getStats();
      expect(finalStats.totalProcessed).toBe(requestCount);
      expect(finalStats.totalErrors).toBe(0);
    });

    it('should handle queue overflow gracefully', async () => {
      const queue = new RequestQueue({ 
        maxConcurrent: 1, 
        maxQueueSize: 5 
      });

      // Block the concurrent slot
      const blockingPromise = queue.enqueue(
        () => new Promise(resolve => setTimeout(() => resolve('blocking'), 1000)),
        'blocking-request'
      );

      // Fill the queue
      const queuePromises = Array.from({ length: 5 }, (_, i) => 
        queue.enqueue(() => Promise.resolve(`queued-${i}`), `queued-${i}`)
      );

      // These should be rejected due to queue overflow
      const overflowPromises = Array.from({ length: 3 }, (_, i) => 
        queue.enqueue(() => Promise.resolve(`overflow-${i}`), `overflow-${i}`)
          .catch(err => ({ error: err.message }))
      );

      jest.runAllTimers();
      
      const overflowResults = await Promise.all(overflowPromises);
      
      // All overflow requests should be rejected
      expect(overflowResults.every(r => r.error === 'Request queue is full')).toBe(true);

      // Queue should still be healthy for normal operations
      const stats = queue.getStats();
      expect(stats.queuedRequests).toBe(5); // Queue should be full but not broken
    });
  });
});