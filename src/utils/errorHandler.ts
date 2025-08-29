import { ErrorCodes, ApiError } from '../types/api';

/**
 * Error severity levels for logging
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Error context for debugging
 */
export interface ErrorContext {
  requestId?: string;
  userId?: string;
  endpoint?: string;
  timestamp: string;
  userAgent?: string;
  ip?: string;
}

/**
 * Internal error details for logging
 */
export interface InternalError {
  code: string;
  message: string;
  severity: ErrorSeverity;
  context: ErrorContext;
  originalError?: any;
  stack?: string;
}

/**
 * Error mapping configuration
 */
interface ErrorMapping {
  httpStatus: number;
  severity: ErrorSeverity;
  userMessage: string;
  logMessage: string;
}

/**
 * Error code to HTTP status and message mapping
 */
const ERROR_MAPPINGS: Record<string, ErrorMapping> = {
  [ErrorCodes.INVALID_PROMPT]: {
    httpStatus: 400,
    severity: ErrorSeverity.LOW,
    userMessage: 'The prompt parameter is required and must be a non-empty string',
    logMessage: 'Request validation failed: invalid prompt parameter'
  },
  [ErrorCodes.INVALID_TEXT]: {
    httpStatus: 400,
    severity: ErrorSeverity.LOW,
    userMessage: 'The main text parameter is required and must be a non-empty string',
    logMessage: 'Request validation failed: invalid text parameter'
  },
  [ErrorCodes.API_UNAVAILABLE]: {
    httpStatus: 503,
    severity: ErrorSeverity.HIGH,
    userMessage: 'The AI service is temporarily unavailable. Please try again later.',
    logMessage: 'Cerebras API is unavailable or misconfigured'
  },
  [ErrorCodes.RATE_LIMITED]: {
    httpStatus: 429,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Rate limit exceeded. Please wait a moment before trying again.',
    logMessage: 'Rate limit exceeded for Cerebras API'
  },
  [ErrorCodes.TIMEOUT]: {
    httpStatus: 408,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Request timed out. Please try again.',
    logMessage: 'Request to Cerebras API timed out'
  },
  [ErrorCodes.INTERNAL_ERROR]: {
    httpStatus: 500,
    severity: ErrorSeverity.CRITICAL,
    userMessage: 'An internal error occurred. Please try again later.',
    logMessage: 'Internal server error occurred'
  },
  [ErrorCodes.METHOD_NOT_ALLOWED]: {
    httpStatus: 405,
    severity: ErrorSeverity.LOW,
    userMessage: 'Only POST requests are allowed',
    logMessage: 'Invalid HTTP method used'
  }
};

/**
 * Comprehensive error handler class
 */
export class ErrorHandler {
  /**
   * Creates a structured API error response
   */
  public static createApiError(
    code: string,
    originalError?: any,
    context?: Partial<ErrorContext>
  ): { apiError: ApiError; httpStatus: number; internalError: InternalError } {
    const mapping = ERROR_MAPPINGS[code] || ERROR_MAPPINGS[ErrorCodes.INTERNAL_ERROR];
    
    const fullContext: ErrorContext = {
      timestamp: new Date().toISOString(),
      ...context
    };

    const apiError: ApiError = {
      code,
      message: mapping.userMessage
    };

    const internalError: InternalError = {
      code,
      message: mapping.logMessage,
      severity: mapping.severity,
      context: fullContext,
      originalError: originalError ? this.sanitizeError(originalError) : undefined,
      stack: originalError?.stack
    };

    return {
      apiError,
      httpStatus: mapping.httpStatus,
      internalError
    };
  }

  /**
   * Logs error with appropriate level based on severity
   */
  public static logError(error: InternalError): void {
    const logData = {
      code: error.code,
      message: error.message,
      severity: error.severity,
      timestamp: error.context.timestamp,
      requestId: error.context.requestId,
      endpoint: error.context.endpoint,
      // Don't log sensitive user data
      hasOriginalError: !!error.originalError,
      errorType: error.originalError?.constructor?.name
    };

    switch (error.severity) {
      case ErrorSeverity.LOW:
        console.info('API Error (Low):', JSON.stringify(logData));
        break;
      case ErrorSeverity.MEDIUM:
        console.warn('API Error (Medium):', JSON.stringify(logData));
        break;
      case ErrorSeverity.HIGH:
        console.error('API Error (High):', JSON.stringify(logData));
        break;
      case ErrorSeverity.CRITICAL:
        console.error('API Error (Critical):', JSON.stringify(logData));
        // In production, this could trigger alerts
        break;
    }

    // Log stack trace separately for debugging (only in development)
    if (error.stack && process.env.NODE_ENV !== 'production') {
      console.error('Stack trace:', error.stack);
    }
  }

  /**
   * Sanitizes error objects to remove sensitive information
   */
  private static sanitizeError(error: any): any {
    if (!error) return null;

    const sanitized: any = {
      name: error.name,
      message: error.message,
      code: error.code,
      status: error.status
    };

    // Remove potentially sensitive fields
    const sensitiveFields = ['apiKey', 'token', 'password', 'secret', 'authorization'];
    
    for (const [key, value] of Object.entries(error)) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        continue; // Skip sensitive fields
      }
      
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Handles and logs an error, returning structured response
   */
  public static handleError(
    code: string,
    originalError?: any,
    context?: Partial<ErrorContext>
  ): { apiError: ApiError; httpStatus: number } {
    const { apiError, httpStatus, internalError } = this.createApiError(code, originalError, context);
    
    this.logError(internalError);
    
    return { apiError, httpStatus };
  }

  /**
   * Determines error code from various error types
   */
  public static determineErrorCode(error: any): string {
    if (!error) return ErrorCodes.INTERNAL_ERROR;

    // HTTP status code mapping
    if (error.status || error.statusCode) {
      const status = error.status || error.statusCode;
      switch (status) {
        case 400:
          return ErrorCodes.INVALID_TEXT;
        case 401:
        case 403:
          return ErrorCodes.API_UNAVAILABLE;
        case 408:
          return ErrorCodes.TIMEOUT;
        case 429:
          return ErrorCodes.RATE_LIMITED;
        case 503:
          return ErrorCodes.API_UNAVAILABLE;
        default:
          return ErrorCodes.INTERNAL_ERROR;
      }
    }

    // Error code mapping
    if (error.code) {
      switch (error.code) {
        case 'ECONNREFUSED':
        case 'ENOTFOUND':
        case 'ECONNRESET':
          return ErrorCodes.API_UNAVAILABLE;
        case 'ETIMEDOUT':
          return ErrorCodes.TIMEOUT;
        default:
          return ErrorCodes.INTERNAL_ERROR;
      }
    }

    // Error name mapping
    if (error.name) {
      switch (error.name) {
        case 'TimeoutError':
          return ErrorCodes.TIMEOUT;
        case 'ValidationError':
          return ErrorCodes.INVALID_TEXT;
        default:
          return ErrorCodes.INTERNAL_ERROR;
      }
    }

    return ErrorCodes.INTERNAL_ERROR;
  }

  /**
   * Creates error context from request information
   */
  public static createErrorContext(req: any): ErrorContext {
    return {
      requestId: req.headers?.[`x-request-id`] || req.body?.requestId,
      endpoint: req.url || req.path,
      timestamp: new Date().toISOString(),
      userAgent: req.headers?.[`user-agent`],
      ip: req.headers?.[`x-forwarded-for`] || req.connection?.remoteAddress
    };
  }
}