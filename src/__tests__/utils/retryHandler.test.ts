import { RetryHandler, withRetry, DEFAULT_RETRY_CONFIG } from '../../utils/retryHandler';
import { ErrorCodes } from '../../types/api';

describe('RetryHandler', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    jest.useFakeTimers();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.useRealTimers();
  });

  describe('Constructor', () => {
    it('should use default configuration', () => {
      const handler = new RetryHandler();
      const config = handler.getConfig();

      expect(config).toEqual(DEFAULT_RETRY_CONFIG);
    });

    it('should merge custom configuration with defaults', () => {
      const customConfig = {
        maxRetries: 5,
        baseDelay: 2000
      };

      const handler = new RetryHandler(customConfig);
      const config = handler.getConfig();

      expect(config.maxRetries).toBe(5);
      expect(config.baseDelay).toBe(2000);
      expect(config.backoffMultiplier).toBe(DEFAULT_RETRY_CONFIG.backoffMultiplier);
    });
  });

  describe('execute', () => {
    it('should succeed on first attempt', async () => {
      const handler = new RetryHandler();
      const mockFn = jest.fn().mockResolvedValue('success');

      const promise = handler.execute(mockFn, 'test-operation');
      jest.runAllTimers();
      const result = await promise;

      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(result.attempts).toHaveLength(1);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const handler = new RetryHandler({ maxRetries: 2, baseDelay: 100 });
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('Rate limited'))
        .mockResolvedValue('success');

      // Mock the error as retryable
      const originalError = new Error('Rate limited');
      (originalError as any).status = 429;

      mockFn.mockReset();
      mockFn.mockRejectedValueOnce(originalError).mockResolvedValue('success');

      const promise = handler.execute(mockFn, 'test-operation');
      
      // Fast-forward through all timers
      jest.runAllTimers();
      
      const result = await promise;

      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(result.attempts).toHaveLength(2);
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-retryable errors', async () => {
      const handler = new RetryHandler();
      const nonRetryableError = new Error('Validation error');
      (nonRetryableError as any).status = 400;

      const mockFn = jest.fn().mockRejectedValue(nonRetryableError);

      const promise = handler.execute(mockFn, 'test-operation');
      jest.runAllTimers();
      const result = await promise;

      expect(result.success).toBe(false);
      expect(result.error).toBe(nonRetryableError);
      expect(result.attempts).toHaveLength(1);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should fail after max retries', async () => {
      const handler = new RetryHandler({ maxRetries: 2, baseDelay: 100 });
      const retryableError = new Error('Service unavailable');
      (retryableError as any).status = 503;

      const mockFn = jest.fn().mockRejectedValue(retryableError);

      const promise = handler.execute(mockFn, 'test-operation');
      jest.runAllTimers();
      const result = await promise;

      expect(result.success).toBe(false);
      expect(result.error).toBe(retryableError);
      expect(result.attempts).toHaveLength(3); // Initial attempt + 2 retries
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should calculate exponential backoff delays', async () => {
      const handler = new RetryHandler({ 
        maxRetries: 3, 
        baseDelay: 1000, 
        backoffMultiplier: 2,
        jitterFactor: 0 // Remove jitter for predictable testing
      });

      const retryableError = new Error('Timeout');
      (retryableError as any).code = 'ETIMEDOUT';

      const mockFn = jest.fn().mockRejectedValue(retryableError);

      const promise = handler.execute(mockFn, 'test-operation');
      jest.runAllTimers();
      const result = await promise;

      expect(result.attempts).toHaveLength(4);
      expect(result.attempts[1].delay).toBe(1000); // baseDelay * 2^0
      expect(result.attempts[2].delay).toBe(2000); // baseDelay * 2^1
      expect(result.attempts[3].delay).toBe(4000); // baseDelay * 2^2
    });

    it('should cap delays at maxDelay', async () => {
      const handler = new RetryHandler({ 
        maxRetries: 3, 
        baseDelay: 1000, 
        maxDelay: 2500,
        backoffMultiplier: 3,
        jitterFactor: 0
      });

      const retryableError = new Error('Timeout');
      (retryableError as any).code = 'ETIMEDOUT';

      const mockFn = jest.fn().mockRejectedValue(retryableError);

      const promise = handler.execute(mockFn, 'test-operation');
      jest.runAllTimers();
      const result = await promise;

      expect(result.attempts[1].delay).toBe(1000); // baseDelay * 3^0
      expect(result.attempts[2].delay).toBe(2500); // capped at maxDelay
      expect(result.attempts[3].delay).toBe(2500); // capped at maxDelay
    });

    it('should handle timeout errors', async () => {
      const handler = new RetryHandler({ timeoutMs: 100 });
      
      const mockFn = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 200))
      );

      const promise = handler.execute(mockFn, 'test-operation');
      jest.advanceTimersByTime(150); // Advance past timeout
      const result = await promise;

      expect(result.success).toBe(false);
      expect(result.error.message).toContain('timed out');
    });

    it('should log retry attempts', async () => {
      const handler = new RetryHandler({ maxRetries: 1, baseDelay: 100 });
      const retryableError = new Error('Rate limited');
      (retryableError as any).status = 429;

      const mockFn = jest.fn()
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValue('success');

      const promise = handler.execute(mockFn, 'test-operation');
      jest.runAllTimers();
      await promise;

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Retry attempt 1/1 for test-operation')
      );
    });
  });

  describe('isRetryableError', () => {
    let handler: RetryHandler;

    beforeEach(() => {
      handler = new RetryHandler();
    });

    it('should identify retryable HTTP status codes', () => {
      const testCases = [
        { status: 408, expected: true }, // Timeout
        { status: 429, expected: true }, // Rate limited
        { status: 500, expected: true }, // Internal server error
        { status: 502, expected: true }, // Bad gateway
        { status: 503, expected: true }, // Service unavailable
        { status: 504, expected: true }, // Gateway timeout
        { status: 400, expected: false }, // Bad request
        { status: 401, expected: false }, // Unauthorized
        { status: 404, expected: false }  // Not found
      ];

      testCases.forEach(({ status, expected }) => {
        const error = { status };
        const result = (handler as any).isRetryableError(error);
        expect(result).toBe(expected);
      });
    });

    it('should identify retryable error codes', () => {
      const testCases = [
        { code: 'ECONNREFUSED', expected: true },
        { code: 'ENOTFOUND', expected: true },
        { code: 'ETIMEDOUT', expected: true },
        { code: 'ECONNRESET', expected: true },
        { code: 'EACCES', expected: false },
        { code: 'ENOENT', expected: false }
      ];

      testCases.forEach(({ code, expected }) => {
        const error = { code };
        const result = (handler as any).isRetryableError(error);
        expect(result).toBe(expected);
      });
    });

    it('should identify retryable error names', () => {
      const testCases = [
        { name: 'TimeoutError', expected: true },
        { name: 'NetworkError', expected: true },
        { name: 'ValidationError', expected: false },
        { name: 'TypeError', expected: false }
      ];

      testCases.forEach(({ name, expected }) => {
        const error = { name };
        const result = (handler as any).isRetryableError(error);
        expect(result).toBe(expected);
      });
    });

    it('should identify retryable error codes from config', () => {
      const customHandler = new RetryHandler({
        retryableErrors: [ErrorCodes.RATE_LIMITED, ErrorCodes.TIMEOUT]
      });

      const rateLimitError = { code: ErrorCodes.RATE_LIMITED };
      const timeoutError = { code: ErrorCodes.TIMEOUT };
      const invalidError = { code: ErrorCodes.INVALID_PROMPT };

      expect((customHandler as any).isRetryableError(rateLimitError)).toBe(true);
      expect((customHandler as any).isRetryableError(timeoutError)).toBe(true);
      expect((customHandler as any).isRetryableError(invalidError)).toBe(false);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      const handler = new RetryHandler();
      
      handler.updateConfig({
        maxRetries: 5,
        baseDelay: 2000
      });

      const config = handler.getConfig();
      expect(config.maxRetries).toBe(5);
      expect(config.baseDelay).toBe(2000);
      expect(config.backoffMultiplier).toBe(DEFAULT_RETRY_CONFIG.backoffMultiplier);
    });
  });

  describe('sanitizeErrorForLogging', () => {
    let handler: RetryHandler;

    beforeEach(() => {
      handler = new RetryHandler();
    });

    it('should sanitize error for logging', () => {
      const error = {
        name: 'TestError',
        message: 'Test message',
        code: 'TEST_CODE',
        status: 500,
        stack: 'Error stack trace',
        sensitiveData: 'secret'
      };

      const sanitized = (handler as any).sanitizeErrorForLogging(error);

      expect(sanitized).toEqual({
        name: 'TestError',
        message: 'Test message',
        code: 'TEST_CODE',
        status: 500,
        stack: undefined // Should be undefined in production
      });
    });

    it('should include stack trace in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = {
        name: 'TestError',
        message: 'Test message',
        stack: 'Error stack trace'
      };

      const sanitized = (handler as any).sanitizeErrorForLogging(error);

      expect(sanitized.stack).toBe('Error stack trace');

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle null/undefined errors', () => {
      expect((handler as any).sanitizeErrorForLogging(null)).toBeNull();
      expect((handler as any).sanitizeErrorForLogging(undefined)).toBeNull();
    });
  });
});

describe('withRetry', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('should use default retry handler when no config provided', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');

    const promise = withRetry(mockFn, undefined, 'test-operation');
    jest.runAllTimers();
    const result = await promise;

    expect(result.success).toBe(true);
    expect(result.result).toBe('success');
  });

  it('should create custom retry handler when config provided', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    const customConfig = { maxRetries: 5 };

    const promise = withRetry(mockFn, customConfig, 'test-operation');
    jest.runAllTimers();
    const result = await promise;

    expect(result.success).toBe(true);
    expect(result.result).toBe('success');
  });

  it('should pass context to retry handler', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Test error'));

    const promise = withRetry(mockFn, undefined, 'custom-context');
    jest.runAllTimers();
    await promise;

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('custom-context')
    );
  });
});