import { ErrorHandler, ErrorSeverity } from '../errorHandler';
import { ErrorCodes } from '../../types/api';

// Mock console methods
const mockConsoleInfo = jest.spyOn(console, 'info').mockImplementation();
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

describe('ErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createApiError', () => {
    it('should create structured error for known error code', () => {
      const { apiError, httpStatus, internalError } = ErrorHandler.createApiError(
        ErrorCodes.INVALID_PROMPT,
        new Error('Test error'),
        { requestId: 'test-123' }
      );

      expect(apiError.code).toBe(ErrorCodes.INVALID_PROMPT);
      expect(apiError.message).toBe('The prompt parameter is required and must be a non-empty string');
      expect(httpStatus).toBe(400);
      expect(internalError.severity).toBe(ErrorSeverity.LOW);
      expect(internalError.context.requestId).toBe('test-123');
      expect(internalError.context.timestamp).toBeDefined();
    });

    it('should handle unknown error codes with internal error fallback', () => {
      const { apiError, httpStatus, internalError } = ErrorHandler.createApiError('UNKNOWN_ERROR');

      expect(apiError.code).toBe('UNKNOWN_ERROR');
      expect(apiError.message).toBe('An internal error occurred. Please try again later.');
      expect(httpStatus).toBe(500);
      expect(internalError.severity).toBe(ErrorSeverity.CRITICAL);
    });

    it('should sanitize original error', () => {
      const originalError = {
        message: 'API Error',
        apiKey: 'secret-key',
        password: 'secret-password',
        status: 429
      };

      const { internalError } = ErrorHandler.createApiError(
        ErrorCodes.RATE_LIMITED,
        originalError
      );

      expect(internalError.originalError).toBeDefined();
      expect(internalError.originalError.message).toBe('API Error');
      expect(internalError.originalError.status).toBe(429);
      expect(internalError.originalError.apiKey).toBeUndefined();
      expect(internalError.originalError.password).toBeUndefined();
    });
  });

  describe('logError', () => {
    it('should log low severity errors with info level', () => {
      const error = {
        code: ErrorCodes.INVALID_PROMPT,
        message: 'Test error',
        severity: ErrorSeverity.LOW,
        context: {
          timestamp: '2023-01-01T00:00:00.000Z',
          requestId: 'test-123'
        }
      };

      ErrorHandler.logError(error);

      expect(mockConsoleInfo).toHaveBeenCalledWith(
        'API Error (Low):',
        expect.stringContaining(ErrorCodes.INVALID_PROMPT)
      );
    });

    it('should log medium severity errors with warn level', () => {
      const error = {
        code: ErrorCodes.RATE_LIMITED,
        message: 'Test error',
        severity: ErrorSeverity.MEDIUM,
        context: {
          timestamp: '2023-01-01T00:00:00.000Z'
        }
      };

      ErrorHandler.logError(error);

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'API Error (Medium):',
        expect.stringContaining(ErrorCodes.RATE_LIMITED)
      );
    });

    it('should log high severity errors with error level', () => {
      const error = {
        code: ErrorCodes.API_UNAVAILABLE,
        message: 'Test error',
        severity: ErrorSeverity.HIGH,
        context: {
          timestamp: '2023-01-01T00:00:00.000Z'
        }
      };

      ErrorHandler.logError(error);

      expect(mockConsoleError).toHaveBeenCalledWith(
        'API Error (High):',
        expect.stringContaining(ErrorCodes.API_UNAVAILABLE)
      );
    });

    it('should log critical severity errors with error level', () => {
      const error = {
        code: ErrorCodes.INTERNAL_ERROR,
        message: 'Test error',
        severity: ErrorSeverity.CRITICAL,
        context: {
          timestamp: '2023-01-01T00:00:00.000Z'
        }
      };

      ErrorHandler.logError(error);

      expect(mockConsoleError).toHaveBeenCalledWith(
        'API Error (Critical):',
        expect.stringContaining(ErrorCodes.INTERNAL_ERROR)
      );
    });
  });

  describe('determineErrorCode', () => {
    it('should map HTTP status codes correctly', () => {
      expect(ErrorHandler.determineErrorCode({ status: 400 })).toBe(ErrorCodes.INVALID_TEXT);
      expect(ErrorHandler.determineErrorCode({ status: 401 })).toBe(ErrorCodes.API_UNAVAILABLE);
      expect(ErrorHandler.determineErrorCode({ status: 408 })).toBe(ErrorCodes.TIMEOUT);
      expect(ErrorHandler.determineErrorCode({ status: 429 })).toBe(ErrorCodes.RATE_LIMITED);
      expect(ErrorHandler.determineErrorCode({ status: 503 })).toBe(ErrorCodes.API_UNAVAILABLE);
      expect(ErrorHandler.determineErrorCode({ statusCode: 500 })).toBe(ErrorCodes.INTERNAL_ERROR);
    });

    it('should map error codes correctly', () => {
      expect(ErrorHandler.determineErrorCode({ code: 'ECONNREFUSED' })).toBe(ErrorCodes.API_UNAVAILABLE);
      expect(ErrorHandler.determineErrorCode({ code: 'ENOTFOUND' })).toBe(ErrorCodes.API_UNAVAILABLE);
      expect(ErrorHandler.determineErrorCode({ code: 'ETIMEDOUT' })).toBe(ErrorCodes.TIMEOUT);
      expect(ErrorHandler.determineErrorCode({ code: 'UNKNOWN' })).toBe(ErrorCodes.INTERNAL_ERROR);
    });

    it('should map error names correctly', () => {
      expect(ErrorHandler.determineErrorCode({ name: 'TimeoutError' })).toBe(ErrorCodes.TIMEOUT);
      expect(ErrorHandler.determineErrorCode({ name: 'ValidationError' })).toBe(ErrorCodes.INVALID_TEXT);
      expect(ErrorHandler.determineErrorCode({ name: 'UnknownError' })).toBe(ErrorCodes.INTERNAL_ERROR);
    });

    it('should return INTERNAL_ERROR for null/undefined', () => {
      expect(ErrorHandler.determineErrorCode(null)).toBe(ErrorCodes.INTERNAL_ERROR);
      expect(ErrorHandler.determineErrorCode(undefined)).toBe(ErrorCodes.INTERNAL_ERROR);
      expect(ErrorHandler.determineErrorCode({})).toBe(ErrorCodes.INTERNAL_ERROR);
    });
  });

  describe('handleError', () => {
    it('should handle error and return structured response', () => {
      const originalError = new Error('Test error');
      const context = { requestId: 'test-123' };

      const { apiError, httpStatus } = ErrorHandler.handleError(
        ErrorCodes.RATE_LIMITED,
        originalError,
        context
      );

      expect(apiError.code).toBe(ErrorCodes.RATE_LIMITED);
      expect(apiError.message).toBe('Rate limit exceeded. Please wait a moment before trying again.');
      expect(httpStatus).toBe(429);
      expect(mockConsoleWarn).toHaveBeenCalled();
    });
  });

  describe('createErrorContext', () => {
    it('should create error context from request object', () => {
      const mockReq = {
        headers: {
          'x-request-id': 'req-123',
          'user-agent': 'Test Agent',
          'x-forwarded-for': '192.168.1.1'
        },
        url: '/api/rewrite',
        body: {
          requestId: 'body-req-123'
        }
      };

      const context = ErrorHandler.createErrorContext(mockReq);

      expect(context.requestId).toBe('req-123'); // Header takes precedence
      expect(context.endpoint).toBe('/api/rewrite');
      expect(context.userAgent).toBe('Test Agent');
      expect(context.ip).toBe('192.168.1.1');
      expect(context.timestamp).toBeDefined();
    });

    it('should handle missing request properties gracefully', () => {
      const mockReq = {};

      const context = ErrorHandler.createErrorContext(mockReq);

      expect(context.requestId).toBeUndefined();
      expect(context.endpoint).toBeUndefined();
      expect(context.userAgent).toBeUndefined();
      expect(context.ip).toBeUndefined();
      expect(context.timestamp).toBeDefined();
    });

    it('should use body requestId when header is missing', () => {
      const mockReq = {
        body: {
          requestId: 'body-req-123'
        }
      };

      const context = ErrorHandler.createErrorContext(mockReq);

      expect(context.requestId).toBe('body-req-123');
    });
  });

  describe('sanitizeError', () => {
    it('should remove sensitive fields from error objects', () => {
      const error = {
        message: 'API Error',
        apiKey: 'secret-key',
        token: 'secret-token',
        password: 'secret-password',
        authorization: 'Bearer token',
        status: 429,
        code: 'RATE_LIMITED',
        normalField: 'normal-value'
      };

      const { internalError } = ErrorHandler.createApiError(ErrorCodes.RATE_LIMITED, error);

      expect(internalError.originalError.message).toBe('API Error');
      expect(internalError.originalError.status).toBe(429);
      expect(internalError.originalError.code).toBe('RATE_LIMITED');
      expect(internalError.originalError.normalField).toBe('normal-value');
      expect(internalError.originalError.apiKey).toBeUndefined();
      expect(internalError.originalError.token).toBeUndefined();
      expect(internalError.originalError.password).toBeUndefined();
      expect(internalError.originalError.authorization).toBeUndefined();
    });
  });
});