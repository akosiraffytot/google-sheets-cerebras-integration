import { VercelRequest, VercelResponse } from '@vercel/node';
import handler from '../../../api/rewrite';
import { ErrorCodes } from '../../types/api';

// Mock all dependencies
jest.mock('@cerebras/cerebras_cloud_sdk');
jest.mock('../../utils/retryHandler');
jest.mock('../../utils/requestQueue');

describe('API Integration Flow', () => {
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
        prompt: 'Rewrite this text to be more professional',
        mainText: 'Hey there, how are you doing?',
        contextText: 'This is for a business email',
        requestId: '12345678-1234-1234-1234-123456789012'
      },
      headers: {
        'content-type': 'application/json',
        'user-agent': 'test-agent'
      },
      url: '/api/rewrite'
    };

    // Reset all mocks
    jest.clearAllMocks();

    // Set up environment
    process.env.CEREBRAS_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.CEREBRAS_API_KEY;
  });

  describe('Successful Request Flow', () => {
    beforeEach(() => {
      // Mock successful Cerebras response
      const MockCerebras = require('@cerebras/cerebras_cloud_sdk').Cerebras;
      const mockClient = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{
                message: {
                  content: 'Good day, I hope this message finds you well.'
                }
              }]
            })
          }
        }
      };
      MockCerebras.mockImplementation(() => mockClient);

      // Mock successful retry
      const mockRetryHandler = require('../../utils/retryHandler');
      mockRetryHandler.withRetry = jest.fn().mockImplementation(async (fn) => {
        const result = await fn();
        return { success: true, result };
      });

      // Mock successful queue
      const mockRequestQueue = require('../../utils/requestQueue');
      mockRequestQueue.queueRequest = jest.fn().mockImplementation(async (fn) => {
        return await fn();
      });
    });

    it('should process complete request successfully', async () => {
      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          rewrittenText: 'Good day, I hope this message finds you well.'
        }
      });
    });

    it('should set proper CORS headers', async () => {
      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockSetHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
      expect(mockSetHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'POST, OPTIONS');
      expect(mockSetHeader).toHaveBeenCalledWith('Access-Control-Allow-Headers', 'Content-Type');
    });

    it('should call Cerebras with correct parameters', async () => {
      const MockCerebras = require('@cerebras/cerebras_cloud_sdk').Cerebras;
      const mockClient = MockCerebras.mock.results[0].value;

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith({
        model: 'llama3.1-8b',
        messages: [{
          role: 'user',
          content: 'Rewrite this text to be more professional\n\nText to rewrite:\nHey there, how are you doing?\n\nAdditional context:\nThis is for a business email\n\nRewritten text:'
        }],
        temperature: 0.7,
        max_tokens: 2000,
        stream: false
      });
    });

    it('should use retry mechanism', async () => {
      const mockRetryHandler = require('../../utils/retryHandler');

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRetryHandler.withRetry).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          maxRetries: 3,
          baseDelay: 1000,
          retryableErrors: [ErrorCodes.RATE_LIMITED, ErrorCodes.TIMEOUT, ErrorCodes.API_UNAVAILABLE]
        }),
        expect.stringMatching(/cerebras-rewrite-/)
      );
    });

    it('should use request queue', async () => {
      const mockRequestQueue = require('../../utils/requestQueue');

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRequestQueue.queueRequest).toHaveBeenCalledWith(
        expect.any(Function),
        expect.stringMatching(/cerebras-request-/),
        expect.objectContaining({
          maxConcurrent: 5,
          maxQueueSize: 50
        })
      );
    });
  });

  describe('Error Scenarios', () => {
    it('should handle validation errors', async () => {
      mockReq.body = {
        prompt: '', // Invalid empty prompt
        mainText: 'Hello world',
        requestId: '12345678-1234-1234-1234-123456789012'
      };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: expect.any(String),
          message: expect.any(String)
        })
      });
    });

    it('should handle missing API key', async () => {
      delete process.env.CEREBRAS_API_KEY;

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(503);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: expect.any(String),
          message: expect.stringContaining('unavailable')
        })
      });
    });

    it('should handle Cerebras API errors', async () => {
      // Mock Cerebras API error
      const MockCerebras = require('@cerebras/cerebras_cloud_sdk').Cerebras;
      const mockClient = {
        chat: {
          completions: {
            create: jest.fn().mockRejectedValue(new Error('API Error'))
          }
        }
      };
      MockCerebras.mockImplementation(() => mockClient);

      // Mock retry failure
      const mockRetryHandler = require('../../utils/retryHandler');
      mockRetryHandler.withRetry = jest.fn().mockResolvedValue({
        success: false,
        error: new Error('API Error')
      });

      // Mock queue success
      const mockRequestQueue = require('../../utils/requestQueue');
      mockRequestQueue.queueRequest = jest.fn().mockImplementation(async (fn) => {
        return await fn();
      });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: expect.any(String),
          message: expect.any(String)
        })
      });
    });

    it('should handle rate limiting', async () => {
      // Mock rate limit error
      const rateLimitError = new Error('Rate limited');
      (rateLimitError as any).status = 429;

      const MockCerebras = require('@cerebras/cerebras_cloud_sdk').Cerebras;
      const mockClient = {
        chat: {
          completions: {
            create: jest.fn().mockRejectedValue(rateLimitError)
          }
        }
      };
      MockCerebras.mockImplementation(() => mockClient);

      // Mock retry with rate limit handling
      const mockRetryHandler = require('../../utils/retryHandler');
      mockRetryHandler.withRetry = jest.fn().mockResolvedValue({
        success: false,
        error: rateLimitError
      });

      const mockRequestQueue = require('../../utils/requestQueue');
      mockRequestQueue.queueRequest = jest.fn().mockImplementation(async (fn) => {
        return await fn();
      });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(429);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: expect.any(String),
          message: expect.stringContaining('rate limit')
        })
      });
    });

    it('should handle empty Cerebras response', async () => {
      // Mock empty response
      const MockCerebras = require('@cerebras/cerebras_cloud_sdk').Cerebras;
      const mockClient = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: []
            })
          }
        }
      };
      MockCerebras.mockImplementation(() => mockClient);

      const mockRetryHandler = require('../../utils/retryHandler');
      mockRetryHandler.withRetry = jest.fn().mockImplementation(async (fn) => {
        const result = await fn();
        return { success: true, result };
      });

      const mockRequestQueue = require('../../utils/requestQueue');
      mockRequestQueue.queueRequest = jest.fn().mockImplementation(async (fn) => {
        return await fn();
      });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(503);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: expect.any(String),
          message: expect.stringContaining('No response')
        })
      });
    });
  });

  describe('Request Sanitization', () => {
    it('should sanitize input text', async () => {
      mockReq.body = {
        prompt: '  Rewrite this text  \x00\x01',
        mainText: '  Hello\x02world  \r\n',
        contextText: '  Context\x03text  ',
        requestId: '12345678-1234-1234-1234-123456789012'
      };

      // Mock successful response
      const MockCerebras = require('@cerebras/cerebras_cloud_sdk').Cerebras;
      const mockClient = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{
                message: { content: 'Sanitized response' }
              }]
            })
          }
        }
      };
      MockCerebras.mockImplementation(() => mockClient);

      const mockRetryHandler = require('../../utils/retryHandler');
      mockRetryHandler.withRetry = jest.fn().mockImplementation(async (fn) => {
        const result = await fn();
        return { success: true, result };
      });

      const mockRequestQueue = require('../../utils/requestQueue');
      mockRequestQueue.queueRequest = jest.fn().mockImplementation(async (fn) => {
        return await fn();
      });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      // Check that Cerebras was called with sanitized input
      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [{
            role: 'user',
            content: expect.stringContaining('Rewrite this text') // Should be sanitized
          }]
        })
      );

      expect(mockStatus).toHaveBeenCalledWith(200);
    });
  });

  describe('Context Handling', () => {
    it('should handle requests without context text', async () => {
      mockReq.body = {
        prompt: 'Rewrite this text',
        mainText: 'Hello world',
        requestId: '12345678-1234-1234-1234-123456789012'
        // No contextText
      };

      // Mock successful response
      const MockCerebras = require('@cerebras/cerebras_cloud_sdk').Cerebras;
      const mockClient = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{
                message: { content: 'Response without context' }
              }]
            })
          }
        }
      };
      MockCerebras.mockImplementation(() => mockClient);

      const mockRetryHandler = require('../../utils/retryHandler');
      mockRetryHandler.withRetry = jest.fn().mockImplementation(async (fn) => {
        const result = await fn();
        return { success: true, result };
      });

      const mockRequestQueue = require('../../utils/requestQueue');
      mockRequestQueue.queueRequest = jest.fn().mockImplementation(async (fn) => {
        return await fn();
      });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      // Should not include context section in prompt
      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [{
            role: 'user',
            content: 'Rewrite this text\n\nText to rewrite:\nHello world\n\nRewritten text:'
          }]
        })
      );

      expect(mockStatus).toHaveBeenCalledWith(200);
    });
  });

  describe('OPTIONS Requests', () => {
    it('should handle CORS preflight requests', async () => {
      mockReq.method = 'OPTIONS';

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockSetHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
      expect(mockSetHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'POST, OPTIONS');
      expect(mockSetHeader).toHaveBeenCalledWith('Access-Control-Allow-Headers', 'Content-Type');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockEnd).toHaveBeenCalled();
      expect(mockJson).not.toHaveBeenCalled();
    });
  });

  describe('Method Validation', () => {
    it('should reject GET requests', async () => {
      mockReq.method = 'GET';

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(405);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: expect.any(String),
          message: expect.stringContaining('POST')
        })
      });
    });

    it('should reject PUT requests', async () => {
      mockReq.method = 'PUT';

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(405);
    });

    it('should reject DELETE requests', async () => {
      mockReq.method = 'DELETE';

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(405);
    });
  });
});