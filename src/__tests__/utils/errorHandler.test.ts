import { ErrorHandler, ErrorSeverity } from '../../utils/errorHandler';
import { ErrorCodes } from '../../types/api';

describe('ErrorHandler', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'info').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.restoreAllMocks();
  });

  describe('createApiError', () => {
    it('should create API error with proper structure', () => {
      const result = ErrorHandler.createApiError(ErrorCodes.INVALID_PROMPT);

      expect(result.apiError).toEqual({
        code: ErrorCodes.INVALID_PROMPT,
        message: 'The prompt parameter is required and must be a non-empty string'
      });
      expect(result.httpStatus).toBe(400);
      expect(result.internalError.code).toBe(ErrorCodes.INVALID_PROMPT);
      expect(result.internalError.severity).toBe(ErrorSeverity.LOW);
    });

    it('should include context in internal error', () => {
      const context = {
        requestId: 'test-123',
        endpoint: '/api/test'
      };

      const result = ErrorHandler.createApiError(ErrorCodes.RATE_LIMITED, null, context);

      expect(result.internalError.context).toEqual(
        expect.objectContaining({
          requestId: 'test-123',
          endpoint: '/api/test',
          timestamp: expect.any(String)
        })
      );
    });

    it('should sanitize original error', () => {
      const originalError = {
        message: 'Test error',
        apiKey: 'secret-key',
        password: 'secret-password',
        status: 500
      };

      const result = ErrorHandler.createApiError(ErrorCodes.INTERNAL_ERROR, originalError);

      expect(result.internalError.originalError).toEqual({
        name: undefined,
        message: 'Test error',
        code: undefined,
        status: 500
        // apiKey and password should be excluded
      });
    });

    it('should handle unknown error codes', () => {
      const result = ErrorHandler.createApiError('UNKNOWN_ERROR');

      expect(result.apiError.code).toBe('UNKNOWN_ERROR');
      expect(result.httpStatus).toBe(500); // Should default to internal error
      expect(result.internalError.severity).toBe(ErrorSeverity.CRITICAL);
    });
  });

  describe('logError', () => {
    it('should log low severity errors with info level', () => {
      const error = {
        code: ErrorCodes.INVALID_PROMPT,
        message: 'Test message',
        severity: ErrorSeverity.LOW,
        context: {
          timestamp: '2023-01-01T00:00:00.000Z',
          requestId: 'test-123'
        }
      };

      ErrorHandler.logError(error);

      expect(console.info).toHaveBeenCalledWith(
        'API Error (Low):',
        expect.stringContaining(ErrorCodes.INVALID_PROMPT)
      );
    });

    it('should log medium severity errors with warn level', () => {
      const error = {
        code: ErrorCodes.RATE_LIMITED,
        message: 'Test message',
        severity: ErrorSeverity.MEDIUM,
        context: {
          timestamp: '2023-01-01T00:00:00.000Z'
        }
      };

      ErrorHandler.logError(error);

      expect(console.warn).toHaveBeenCalledWith(
        'API Error (Medium):',
        expect.stringContaining(ErrorCodes.RATE_LIMITED)
      );
    });

    it('should log high severity errors with error level', () => {
      const error = {
        code: ErrorCodes.API_UNAVAILABLE,
        message: 'Test message',
        severity: ErrorSeverity.HIGH,
        context: {
          timestamp: '2023-01-01T00:00:00.000Z'
        }
      };

      ErrorHandler.logError(error);

      expect(console.error).toHaveBeenCalledWith(
        'API Error (High):',
        expect.stringContaining(ErrorCodes.API_UNAVAILABLE)
      );
    });

    it('should log critical severity errors with error level', () => {
      const error = {
        code: ErrorCodes.INTERNAL_ERROR,
        message: 'Test message',
        severity: ErrorSeverity.CRITICAL,
        context: {
          timestamp: '2023-01-01T00:00:00.000Z'
        }
      };

      ErrorHandler.logError(error);

      expect(console.error).toHaveBeenCalledWith(
        'API Error (Critical):',
        expect.stringContaining(ErrorCodes.INTERNAL_ERROR)
      );
    });

    it('should not include sensitive data in logs', () => {
      const error = {
        code: ErrorCodes.INTERNAL_ERROR,
        message: 'Test message',
        severity: ErrorSeverity.CRITICAL,
        context: {
          timestamp: '2023-01-01T00:00:00.000Z',
          requestId: 'test-123'
        },
        originalError: {
          apiKey: 'secret-key',
          message: 'Original error'
        }
      };

      ErrorHandler.logError(error);

      const logCall = (console.error as jest.Mock).mock.calls[0][1];
      expect(logCall).not.toContain('secret-key');
      expect(logCall).toContain('test-123');
    });
  });

  describe('handleError', () => {
    it('should create and log error', () => {
      const result = ErrorHandler.handleError(ErrorCodes.TIMEOUT, new Error('Timeout'));

      expect(result.apiError.code).toBe(ErrorCodes.TIMEOUT);
      expect(result.httpStatus).toBe(408);
      expect(console.warn).toHaveBeenCalled(); // TIMEOUT is medium severity
    });

    it('should include context in error handling', () => {
      const context = {
        requestId: 'test-456',
        endpoint: '/api/rewrite'
      };

      const result = ErrorHandler.handleError(ErrorCodes.RATE_LIMITED, null, context);

      expect(result.apiError.code).toBe(ErrorCodes.RATE_LIMITED);
      expect(console.warn).toHaveBeenCalledWith(
        'API Error (Medium):',
        expect.stringContaining('test-456')
      );
    });
  });

  describe('determineErrorCode', () => {
    it('should determine error code from HTTP status', () => {
      const error = { status: 429 };
      expect(ErrorHandler.determineErrorCode(error)).toBe(ErrorCodes.RATE_LIMITED);

      const error2 = { statusCode: 408 };
      expect(ErrorHandler.determineErrorCode(error2)).toBe(ErrorCodes.TIMEOUT);

      const error3 = { status: 503 };
      expect(ErrorHandler.determineErrorCode(error3)).toBe(ErrorCodes.API_UNAVAILABLE);
    });

    it('should determine error code from error code', () => {
      const error = { code: 'ECONNREFUSED' };
      expect(ErrorHandler.determineErrorCode(error)).toBe(ErrorCodes.API_UNAVAILABLE);

      const error2 = { code: 'ETIMEDOUT' };
      expect(ErrorHandler.determineErrorCode(error2)).toBe(ErrorCodes.TIMEOUT);
    });

    it('should determine error code from error name', () => {
      const error = { name: 'TimeoutError' };
      expect(ErrorHandler.determineErrorCode(error)).toBe(ErrorCodes.TIMEOUT);

      const error2 = { name: 'ValidationError' };
      expect(ErrorHandler.determineErrorCode(error2)).toBe(ErrorCodes.INVALID_TEXT);
    });

    it('should default to internal error for unknown errors', () => {
      const error = { unknown: 'property' };
      expect(ErrorHandler.determineErrorCode(error)).toBe(ErrorCodes.INTERNAL_ERROR);

      expect(ErrorHandler.determineErrorCode(null)).toBe(ErrorCodes.INTERNAL_ERROR);
      expect(ErrorHandler.determineErrorCode(undefined)).toBe(ErrorCodes.INTERNAL_ERROR);
    });
  });

  describe('createErrorContext', () => {
    it('should create error context from request', () => {
      const mockReq = {
        headers: {
          'x-request-id': 'header-request-id',
          'user-agent': 'test-agent',
          'x-forwarded-for': '192.168.1.1'
        },
        body: {
          requestId: 'body-request-id'
        },
        url: '/api/rewrite',
        connection: {
          remoteAddress: '127.0.0.1'
        }
      };

      const context = ErrorHandler.createErrorContext(mockReq);

      expect(context).toEqual({
        requestId: 'header-request-id', // Should prefer header over body
        endpoint: '/api/rewrite',
        timestamp: expect.any(String),
        userAgent: 'test-agent',
        ip: '192.168.1.1'
      });
    });

    it('should handle missing request properties', () => {
      const mockReq = {};

      const context = ErrorHandler.createErrorContext(mockReq);

      expect(context).toEqual({
        requestId: undefined,
        endpoint: undefined,
        timestamp: expect.any(String),
        userAgent: undefined,
        ip: undefined
      });
    });

    it('should use body requestId when header is missing', () => {
      const mockReq = {
        body: {
          requestId: 'body-request-id'
        }
      };

      const context = ErrorHandler.createErrorContext(mockReq);

      expect(context.requestId).toBe('body-request-id');
    });

    it('should use connection.remoteAddress when x-forwarded-for is missing', () => {
      const mockReq = {
        connection: {
          remoteAddress: '127.0.0.1'
        }
      };

      const context = ErrorHandler.createErrorContext(mockReq);

      expect(context.ip).toBe('127.0.0.1');
    });
  });

  describe('Error Mappings', () => {
    it('should have correct mappings for all error codes', () => {
      const testCases = [
        { code: ErrorCodes.INVALID_PROMPT, expectedStatus: 400, expectedSeverity: ErrorSeverity.LOW },
        { code: ErrorCodes.INVALID_TEXT, expectedStatus: 400, expectedSeverity: ErrorSeverity.LOW },
        { code: ErrorCodes.API_UNAVAILABLE, expectedStatus: 503, expectedSeverity: ErrorSeverity.HIGH },
        { code: ErrorCodes.RATE_LIMITED, expectedStatus: 429, expectedSeverity: ErrorSeverity.MEDIUM },
        { code: ErrorCodes.TIMEOUT, expectedStatus: 408, expectedSeverity: ErrorSeverity.MEDIUM },
        { code: ErrorCodes.INTERNAL_ERROR, expectedStatus: 500, expectedSeverity: ErrorSeverity.CRITICAL },
        { code: ErrorCodes.METHOD_NOT_ALLOWED, expectedStatus: 405, expectedSeverity: ErrorSeverity.LOW }
      ];

      testCases.forEach(({ code, expectedStatus, expectedSeverity }) => {
        const result = ErrorHandler.createApiError(code);
        expect(result.httpStatus).toBe(expectedStatus);
        expect(result.internalError.severity).toBe(expectedSeverity);
      });
    });

    it('should have user-friendly messages', () => {
      const result = ErrorHandler.createApiError(ErrorCodes.RATE_LIMITED);
      expect(result.apiError.message).toBe('Rate limit exceeded. Please wait a moment before trying again.');
      expect(result.apiError.message).not.toContain('internal');
      expect(result.apiError.message).not.toContain('debug');
    });
  });
});