import { VercelRequest, VercelResponse } from '@vercel/node';
import handler from '../rewrite';
import { ErrorCodes } from '../../src/types/api';
import { CerebrasService } from '../../src/services/cerebras';
import { ErrorHandler } from '../../src/utils/errorHandler';

// Mock dependencies
jest.mock('../../src/services/cerebras');
jest.mock('../../src/utils/errorHandler');
jest.mock('../../src/utils/validation');

describe('Rewrite API Handler', () => {
  let mockReq: Partial<VercelRequest>;
  let mockRes: Partial<VercelResponse>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockSetHeader: jest.Mock;
  let mockEnd: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnThis();
    mockSetHeader = jest.fn();
    mockEnd = jest.fn();

    mockRes = {
      json: mockJson,
      status: mockStatus,
      setHeader: mockSetHeader,
      end: mockEnd
    };

    mockReq = {
      method: 'POST',
      body: {
        prompt: 'Rewrite this text',
        mainText: 'Hello world',
        contextText: 'Additional context',
        requestId: '12345678-1234-1234-1234-123456789012'
      },
      headers: {},
      url: '/api/rewrite'
    };

    // Reset mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    const mockErrorHandler = require('../../src/utils/errorHandler');
    mockErrorHandler.ErrorHandler = {
      createErrorContext: jest.fn().mockReturnValue({
        endpoint: '/api/rewrite',
        requestId: '12345678-1234-1234-1234-123456789012',
        timestamp: '2023-01-01T00:00:00.000Z'
      }),
      handleError: jest.fn().mockReturnValue({
        apiError: { code: 'TEST_ERROR', message: 'Test error message' },
        httpStatus: 400
      }),
      determineErrorCode: jest.fn().mockReturnValue(ErrorCodes.INTERNAL_ERROR)
    };
  });

  describe('CORS Headers', () => {
    it('should set CORS headers for all requests', async () => {
      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockSetHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
      expect(mockSetHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'POST, OPTIONS');
      expect(mockSetHeader).toHaveBeenCalledWith('Access-Control-Allow-Headers', 'Content-Type');
    });

    it('should handle OPTIONS preflight requests', async () => {
      mockReq.method = 'OPTIONS';

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockEnd).toHaveBeenCalled();
      expect(mockJson).not.toHaveBeenCalled();
    });
  });

  describe('HTTP Method Validation', () => {
    it('should reject non-POST requests', async () => {
      mockReq.method = 'GET';

      const mockErrorHandler = require('../../src/utils/errorHandler');

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockErrorHandler.ErrorHandler.handleError).toHaveBeenCalledWith(
        'METHOD_NOT_ALLOWED',
        null,
        expect.any(Object)
      );
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: { code: 'TEST_ERROR', message: 'Test error message' }
      });
    });

    it('should accept POST requests', async () => {
      // Mock successful validation and service creation
      const mockValidation = require('../../src/utils/validation');
      mockValidation.sanitizeAndValidateRequest = jest.fn().mockReturnValue({
        isValid: true,
        sanitizedRequest: mockReq.body
      });

      const mockCerebrasModule = require('../../src/services/cerebras');
      const mockServiceInstance = {
        rewriteText: jest.fn().mockResolvedValue({
          success: true,
          rewrittenText: 'Rewritten text'
        })
      };
      mockCerebrasModule.createCerebrasService = jest.fn().mockReturnValue(mockServiceInstance);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(200);
    });
  });

  describe('Request Validation', () => {
    it('should handle validation errors', async () => {
      const mockValidation = require('../../src/utils/validation');
      mockValidation.sanitizeAndValidateRequest = jest.fn().mockReturnValue({
        isValid: false,
        error: {
          code: ErrorCodes.INVALID_PROMPT,
          message: 'Invalid prompt'
        }
      });

      const mockErrorHandler = require('../../src/utils/errorHandler');

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockErrorHandler.ErrorHandler.handleError).toHaveBeenCalledWith(
        ErrorCodes.INVALID_PROMPT,
        null,
        expect.any(Object)
      );
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: { code: 'TEST_ERROR', message: 'Test error message' }
      });
    });

    it('should process valid requests', async () => {
      const mockValidation = require('../../src/utils/validation');
      mockValidation.sanitizeAndValidateRequest = jest.fn().mockReturnValue({
        isValid: true,
        sanitizedRequest: {
          prompt: 'Clean prompt',
          mainText: 'Clean text',
          contextText: 'Clean context',
          requestId: '12345678-1234-1234-1234-123456789012'
        }
      });

      const mockCerebrasModule = require('../../src/services/cerebras');
      const mockServiceInstance = {
        rewriteText: jest.fn().mockResolvedValue({
          success: true,
          rewrittenText: 'Successfully rewritten text'
        })
      };
      mockCerebrasModule.createCerebrasService = jest.fn().mockReturnValue(mockServiceInstance);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockServiceInstance.rewriteText).toHaveBeenCalledWith(
        'Clean prompt',
        'Clean text',
        'Clean context'
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          rewrittenText: 'Successfully rewritten text'
        }
      });
    });
  });

  describe('Cerebras Service Integration', () => {
    beforeEach(() => {
      const mockValidation = require('../../src/utils/validation');
      mockValidation.sanitizeAndValidateRequest = jest.fn().mockReturnValue({
        isValid: true,
        sanitizedRequest: mockReq.body
      });
    });

    it('should handle service creation errors', async () => {
      const mockCerebrasModule = require('../../src/services/cerebras');
      mockCerebrasModule.createCerebrasService = jest.fn().mockImplementation(() => {
        throw new Error('API key not found');
      });

      const mockErrorHandler = require('../../src/utils/errorHandler');

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockErrorHandler.ErrorHandler.handleError).toHaveBeenCalledWith(
        ErrorCodes.API_UNAVAILABLE,
        expect.any(Error),
        expect.any(Object)
      );
    });

    it('should handle service response errors', async () => {
      const mockCerebrasModule = require('../../src/services/cerebras');
      const mockServiceInstance = {
        rewriteText: jest.fn().mockResolvedValue({
          success: false,
          error: {
            code: ErrorCodes.RATE_LIMITED,
            message: 'Rate limit exceeded'
          }
        })
      };
      mockCerebrasModule.createCerebrasService = jest.fn().mockReturnValue(mockServiceInstance);

      const mockErrorHandler = require('../../src/utils/errorHandler');

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockErrorHandler.ErrorHandler.handleError).toHaveBeenCalledWith(
        ErrorCodes.RATE_LIMITED,
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should handle successful service responses', async () => {
      const mockCerebrasModule = require('../../src/services/cerebras');
      const mockServiceInstance = {
        rewriteText: jest.fn().mockResolvedValue({
          success: true,
          rewrittenText: 'AI generated response'
        })
      };
      mockCerebrasModule.createCerebrasService = jest.fn().mockReturnValue(mockServiceInstance);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          rewrittenText: 'AI generated response'
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors', async () => {
      const mockValidation = require('../../src/utils/validation');
      mockValidation.sanitizeAndValidateRequest = jest.fn().mockImplementation(() => {
        throw new Error('Unexpected validation error');
      });

      const mockErrorHandler = require('../../src/utils/errorHandler');
      mockErrorHandler.ErrorHandler.determineErrorCode.mockReturnValue(ErrorCodes.INTERNAL_ERROR);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockErrorHandler.ErrorHandler.determineErrorCode).toHaveBeenCalledWith(expect.any(Error));
      expect(mockErrorHandler.ErrorHandler.handleError).toHaveBeenCalledWith(
        ErrorCodes.INTERNAL_ERROR,
        expect.any(Error),
        expect.any(Object)
      );
    });

    it('should create proper error context', async () => {
      const mockErrorHandler = require('../../src/utils/errorHandler');

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockErrorHandler.ErrorHandler.createErrorContext).toHaveBeenCalledWith(mockReq);
    });
  });

  describe('Response Format', () => {
    it('should return proper success response format', async () => {
      const mockValidation = require('../../src/utils/validation');
      mockValidation.sanitizeAndValidateRequest = jest.fn().mockReturnValue({
        isValid: true,
        sanitizedRequest: mockReq.body
      });

      const mockCerebrasModule = require('../../src/services/cerebras');
      const mockServiceInstance = {
        rewriteText: jest.fn().mockResolvedValue({
          success: true,
          rewrittenText: 'Test response'
        })
      };
      mockCerebrasModule.createCerebrasService = jest.fn().mockReturnValue(mockServiceInstance);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          rewrittenText: 'Test response'
        }
      });
    });

    it('should return proper error response format', async () => {
      mockReq.method = 'GET';

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'TEST_ERROR',
          message: 'Test error message'
        }
      });
    });
  });
});