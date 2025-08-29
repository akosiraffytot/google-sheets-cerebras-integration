import { RetryHandler, withRetry, DEFAULT_RETRY_CONFIG } from '../retryHandler';
import { ErrorCodes } from '../../types/api';

// Mock console methods
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();

describe('RetryHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should succeed on first attempt', async () => {
      const retryHandler = new RetryHandler();
      const mockFn = jest.fn().mockResolvedValue('success');

      const result = await retryHandler.execute(mockFn, 'test-operation');

      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(result.attempts).toHaveLength(1);
      expect(result.attempts[0].attemptNumber).toBe(1);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const retryHandler = new RetryHandler({ maxRetries: 2, baseDelay: 10 });
      const mockFn = jest.fn()
        .mockRejectedValueOnce({ code: ErrorCodes.RATE_LIMITED, message: 'Rate limited' })
        .mockResolvedValue('success');

      const result = await retryHandler.execute(mockFn, 'test-operation');

      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(result.attempts).toHaveLength(2);
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('Retry attempt 1/2')
      );
    });

    it('should fail after max retries', async () => {
      const retryHandler = new RetryHandler({ maxRetries: 2, baseDelay: 10 });
      const error = { code: ErrorCodes.RATE_LIMITED, message: 'Rate limited' };
      const mockFn = jest.fn().mockRejectedValue(error);

      const result = await retryHandler.execute(mockFn, 'test-operation');

      expect(result.success).toBe(false);
      expect(result.error).toEqual(error);
      expect(result.attempts).toHaveLength(3); // Initial + 2 retries
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      const retryHandler = new RetryHandler();
      const error = { code: 'NON_RETRYABLE', message: 'Non-retryable error' };
      const mockFn = jest.fn().mockRejectedValue(error);

      const result = await retryHandler.execute(mockFn, 'test-operation');

      expect(result.success).toBe(false);
      expect(result.error).toEqual(error);
      expect(result.attempts).toHaveLength(1);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should handle timeout', async () => {
      const retryHandler = new RetryHandler({ timeoutMs: 50 });
      const mockFn = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      const result = await retryHandler.execute(mockFn, 'test-operation');

      expect(result.success).toBe(false);
      expect(result.error.message).toContain('timed out');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should calculate exponential backoff delays', async () => {
      const retryHandler = new RetryHandler({ 
        maxRetries: 3, 
        baseDelay: 100, 
        backoffMultiplier: 2,
        jitterFactor: 0 // No jitter for predictable testing
      });
      const error = { code: ErrorCodes.RATE_LIMITED, message: 'Rate limited' };
      const mockFn = jest.fn().mockRejectedValue(error);

      const startTime = Date.now();
      const result = await retryHandler.execute(mockFn, 'test-operation');
      const endTime = Date.now();

      expect(result.success).toBe(false);
      expect(result.attempts).toHaveLength(4); // Initial + 3 retries
      
      // Check that delays increase exponentially (approximately)
      expect(result.attempts[1].delay).toBeGreaterThanOrEqual(90); // ~100ms
      expect(result.attempts[2].delay).toBeGreaterThanOrEqual(190); // ~200ms
      expect(result.attempts[3].delay).toBeGreaterThanOrEqual(390); // ~400ms
      
      // Total time should be at least the sum of delays
      const totalDelay = result.attempts.slice(1).reduce((sum, attempt) => sum + attempt.delay, 0);
      expect(endTime - startTime).toBeGreaterThanOrEqual(totalDelay * 0.9); // Allow some variance
    });
  });

  describe('isRetryableError', () => {
    const retryHandler = new RetryHandler();

    it('should identify retryable error codes', () => {
      const retryableErrors = [
        { code: ErrorCodes.RATE_LIMITED },
        { code: ErrorCodes.TIMEOUT },
        { code: ErrorCodes.API_UNAVAILABLE }
      ];

      retryableErrors.forEach(error => {
        expect(retryHandler['isRetryableError'](error)).toBe(true);
      });
    });

    it('should identify retryable HTTP status codes', () => {
      const retryableStatuses = [408, 429, 500, 502, 503, 504];

      retryableStatuses.forEach(status => {
        expect(retryHandler['isRetryableError']({ status })).toBe(true);
        expect(retryHandler['isRetryableError']({ statusCode: status })).toBe(true);
      });
    });

    it('should identify retryable network errors', () => {
      const retryableNetworkErrors = [
        { code: 'ECONNREFUSED' },
        { code: 'ENOTFOUND' },
        { code: 'ETIMEDOUT' },
        { code: 'ECONNRESET' }
      ];

      retryableNetworkErrors.forEach(error => {
        expect(retryHandler['isRetryableError'](error)).toBe(true);
      });
    });

    it('should identify retryable error names', () => {
      const retryableErrorNames = [
        { name: 'TimeoutError' },
        { name: 'NetworkError' }
      ];

      retryableErrorNames.forEach(error => {
        expect(retryHandler['isRetryableError'](error)).toBe(true);
      });
    });

    it('should not retry non-retryable errors', () => {
      const nonRetryableErrors = [
        { code: 'INVALID_INPUT' },
        { status: 400 },
        { status: 401 },
        { status: 403 },
        { name: 'ValidationError' },
        {}
      ];

      nonRetryableErrors.forEach(error => {
        expect(retryHandler['isRetryableError'](error)).toBe(false);
      });
    });
  });

  describe('calculateDelay', () => {
    it('should calculate exponential backoff with jitter', () => {
      const retryHandler = new RetryHandler({
        baseDelay: 1000,
        backoffMultiplier: 2,
        maxDelay: 10000,
        jitterFactor: 0.1
      });

      const delay0 = retryHandler['calculateDelay'](0);
      const delay1 = retryHandler['calculateDelay'](1);
      const delay2 = retryHandler['calculateDelay'](2);

      // Base delay with jitter should be around 1000ms
      expect(delay0).toBeGreaterThanOrEqual(900);
      expect(delay0).toBeLessThanOrEqual(1100);

      // Second delay should be around 2000ms
      expect(delay1).toBeGreaterThanOrEqual(1800);
      expect(delay1).toBeLessThanOrEqual(2200);

      // Third delay should be around 4000ms
      expect(delay2).toBeGreaterThanOrEqual(3600);
      expect(delay2).toBeLessThanOrEqual(4400);
    });

    it('should cap delay at maxDelay', () => {
      const retryHandler = new RetryHandler({
        baseDelay: 1000,
        backoffMultiplier: 2,
        maxDelay: 5000,
        jitterFactor: 0
      });

      const delay10 = retryHandler['calculateDelay'](10); // Would be 1024000ms without cap
      expect(delay10).toBeLessThanOrEqual(5000);
    });
  });

  describe('withRetry convenience function', () => {
    it('should use default retry handler', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      const result = await withRetry(mockFn, undefined, 'test-operation');

      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should use custom configuration', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce({ code: ErrorCodes.RATE_LIMITED })
        .mockResolvedValue('success');

      const result = await withRetry(
        mockFn,
        { maxRetries: 1, baseDelay: 10 },
        'test-operation'
      );

      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('configuration management', () => {
    it('should update configuration', () => {
      const retryHandler = new RetryHandler();
      const newConfig = { maxRetries: 5, baseDelay: 2000 };

      retryHandler.updateConfig(newConfig);
      const config = retryHandler.getConfig();

      expect(config.maxRetries).toBe(5);
      expect(config.baseDelay).toBe(2000);
      expect(config.backoffMultiplier).toBe(DEFAULT_RETRY_CONFIG.backoffMultiplier); // Should keep default
    });

    it('should get current configuration', () => {
      const customConfig = { maxRetries: 5, baseDelay: 2000 };
      const retryHandler = new RetryHandler(customConfig);

      const config = retryHandler.getConfig();

      expect(config.maxRetries).toBe(5);
      expect(config.baseDelay).toBe(2000);
      expect(config).toEqual(expect.objectContaining(customConfig));
    });
  });
});