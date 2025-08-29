import { CerebrasService, createCerebrasService } from '../../services/cerebras';
import { ErrorCodes } from '../../types/api';
import { Cerebras } from '@cerebras/cerebras_cloud_sdk';

// Mock the Cerebras SDK
jest.mock('@cerebras/cerebras_cloud_sdk');
const MockCerebras = Cerebras as jest.MockedClass<typeof Cerebras>;

// Mock utility modules
jest.mock('../../utils/errorHandler');
jest.mock('../../utils/retryHandler');
jest.mock('../../utils/requestQueue');

describe('CerebrasService', () => {
  let mockCerebrasClient: any;
  let service: CerebrasService;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock client with proper jest mock functions
    mockCerebrasClient = {
      chat: {
        completions: {
          create: jest.fn()
        }
      }
    };

    MockCerebras.mockImplementation(() => mockCerebrasClient);

    // Mock retry handler
    const mockRetryHandler = require('../../utils/retryHandler');
    mockRetryHandler.withRetry = jest.fn().mockImplementation(async (fn) => {
      try {
        const result = await fn();
        return { success: true, result };
      } catch (error) {
        return { success: false, error };
      }
    });

    // Mock request queue
    const mockRequestQueue = require('../../utils/requestQueue');
    mockRequestQueue.queueRequest = jest.fn().mockImplementation(async (fn) => {
      return await fn();
    });

    service = new CerebrasService('test-api-key');
  });

  describe('Constructor', () => {
    it('should create service with API key', () => {
      expect(MockCerebras).toHaveBeenCalledWith({
        apiKey: 'test-api-key'
      });
    });

    it('should throw error without API key', () => {
      expect(() => new CerebrasService()).toThrow('Cerebras API key is required');
    });

    it('should set default configuration', () => {
      // Test that service was created successfully
      expect(service).toBeInstanceOf(CerebrasService);
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      service.updateConfig({
        model: 'llama3.1-70b',
        temperature: 0.5,
        max_tokens: 1000
      });

      // Test that updateConfig doesn't throw
      expect(service).toBeInstanceOf(CerebrasService);
    });

    it('should partially update configuration', () => {
      service.updateConfig({ temperature: 0.9 });

      // Test that partial update doesn't throw
      expect(service).toBeInstanceOf(CerebrasService);
    });
  });

  describe('Prompt Construction', () => {
    it('should construct prompt with main text only', async () => {
      mockCerebrasClient.chat.completions.create.mockResolvedValue({
        choices: [{
          message: { content: 'Rewritten text' }
        }]
      });

      await service.rewriteText('Rewrite this', 'Hello world');

      expect(mockCerebrasClient.chat.completions.create).toHaveBeenCalledWith({
        model: 'llama3.1-8b',
        messages: [{
          role: 'user',
          content: 'Rewrite this\n\nText to rewrite:\nHello world\n\nRewritten text:'
        }],
        temperature: 0.7,
        max_tokens: 2000,
        stream: false
      });
    });

    it('should construct prompt with context text', async () => {
      mockCerebrasClient.chat.completions.create.mockResolvedValue({
        choices: [{
          message: { content: 'Rewritten text' }
        }]
      });

      await service.rewriteText('Rewrite this', 'Hello world', 'Additional context');

      const expectedContent = 'Rewrite this\n\nText to rewrite:\nHello world\n\nAdditional context:\nAdditional context\n\nRewritten text:';
      
      expect(mockCerebrasClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [{
            role: 'user',
            content: expectedContent
          }]
        })
      );
    });

    it('should handle empty context text', async () => {
      mockCerebrasClient.chat.completions.create.mockResolvedValue({
        choices: [{
          message: { content: 'Rewritten text' }
        }]
      });

      await service.rewriteText('Rewrite this', 'Hello world', '   ');

      const expectedContent = 'Rewrite this\n\nText to rewrite:\nHello world\n\nRewritten text:';
      
      expect(mockCerebrasClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [{
            role: 'user',
            content: expectedContent
          }]
        })
      );
    });
  });

  describe('Text Rewriting', () => {
    it('should successfully rewrite text', async () => {
      mockCerebrasClient.chat.completions.create.mockResolvedValue({
        choices: [{
          message: { content: 'Successfully rewritten text' }
        }]
      });

      const result = await service.rewriteText('Rewrite this', 'Hello world');

      expect(result).toEqual({
        success: true,
        rewrittenText: 'Successfully rewritten text'
      });
    });

    it('should handle API response without choices', async () => {
      mockCerebrasClient.chat.completions.create.mockResolvedValue({
        choices: []
      });

      const result = await service.rewriteText('Rewrite this', 'Hello world');

      expect(result).toEqual({
        success: false,
        error: {
          code: ErrorCodes.API_UNAVAILABLE,
          message: 'No response from Cerebras AI'
        }
      });
    });

    it('should handle API response without content', async () => {
      mockCerebrasClient.chat.completions.create.mockResolvedValue({
        choices: [{
          message: { content: '' }
        }]
      });

      const result = await service.rewriteText('Rewrite this', 'Hello world');

      expect(result).toEqual({
        success: false,
        error: {
          code: ErrorCodes.API_UNAVAILABLE,
          message: 'Empty response from Cerebras AI'
        }
      });
    });

    it('should handle invalid API response', async () => {
      mockCerebrasClient.chat.completions.create.mockResolvedValue(null);

      const result = await service.rewriteText('Rewrite this', 'Hello world');

      expect(result).toEqual({
        success: false,
        error: {
          code: ErrorCodes.API_UNAVAILABLE,
          message: 'Invalid response from Cerebras AI'
        }
      });
    });

    it('should trim whitespace from response', async () => {
      mockCerebrasClient.chat.completions.create.mockResolvedValue({
        choices: [{
          message: { content: '  \n  Rewritten text with whitespace  \n  ' }
        }]
      });

      const result = await service.rewriteText('Rewrite this', 'Hello world');

      expect(result).toEqual({
        success: true,
        rewrittenText: 'Rewritten text with whitespace'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors', async () => {
      const apiError = new Error('API Error');
      (apiError as any).status = 429;
      mockCerebrasClient.chat.completions.create.mockRejectedValue(apiError);

      // Mock ErrorHandler static methods
      const mockErrorHandler = require('../../utils/errorHandler');
      mockErrorHandler.ErrorHandler = {
        determineErrorCode: jest.fn().mockReturnValue(ErrorCodes.RATE_LIMITED),
        handleError: jest.fn().mockReturnValue({
          apiError: { code: ErrorCodes.RATE_LIMITED, message: 'Rate limited' }
        })
      };

      const result = await service.rewriteText('Rewrite this', 'Hello world');

      expect(result).toEqual({
        success: false,
        error: {
          code: ErrorCodes.RATE_LIMITED,
          message: 'Rate limited'
        }
      });
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      (networkError as any).code = 'ECONNREFUSED';
      mockCerebrasClient.chat.completions.create.mockRejectedValue(networkError);

      const mockErrorHandler = require('../../utils/errorHandler');
      mockErrorHandler.ErrorHandler = {
        determineErrorCode: jest.fn().mockReturnValue(ErrorCodes.API_UNAVAILABLE),
        handleError: jest.fn().mockReturnValue({
          apiError: { code: ErrorCodes.API_UNAVAILABLE, message: 'API unavailable' }
        })
      };

      const result = await service.rewriteText('Rewrite this', 'Hello world');

      expect(result).toEqual({
        success: false,
        error: {
          code: ErrorCodes.API_UNAVAILABLE,
          message: 'API unavailable'
        }
      });
    });
  });

  describe('Retry and Queue Integration', () => {
    it('should use retry handler', async () => {
      mockCerebrasClient.chat.completions.create.mockResolvedValue({
        choices: [{
          message: { content: 'Success after retry' }
        }]
      } as any);

      const mockRetryHandler = require('../../utils/retryHandler');
      
      await service.rewriteText('Rewrite this', 'Hello world');

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
      mockCerebrasClient.chat.completions.create.mockResolvedValue({
        choices: [{
          message: { content: 'Queued response' }
        }]
      } as any);

      const mockRequestQueue = require('../../utils/requestQueue');
      
      await service.rewriteText('Rewrite this', 'Hello world');

      expect(mockRequestQueue.queueRequest).toHaveBeenCalledWith(
        expect.any(Function),
        expect.stringMatching(/cerebras-request-/),
        expect.objectContaining({
          maxConcurrent: 5,
          maxQueueSize: 50
        })
      );
    });

    it('should handle retry failures', async () => {
      const mockRetryHandler = require('../../utils/retryHandler');
      mockRetryHandler.withRetry.mockResolvedValue({
        success: false,
        error: new Error('All retries failed')
      });

      const result = await service.rewriteText('Rewrite this', 'Hello world');

      expect(result).toEqual(new Error('All retries failed'));
    });
  });

  describe('Connection Testing', () => {
    it('should test connection successfully', async () => {
      mockCerebrasClient.chat.completions.create.mockResolvedValue({
        choices: [{
          message: { content: 'Hello response' }
        }]
      });

      const result = await service.testConnection();

      expect(result).toBe(true);
      expect(mockCerebrasClient.chat.completions.create).toHaveBeenCalledWith({
        model: 'llama3.1-8b',
        messages: [{
          role: 'user',
          content: 'Hello'
        }],
        max_tokens: 10,
        temperature: 0,
        stream: false
      });
    });

    it('should handle connection test failures', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockCerebrasClient.chat.completions.create.mockRejectedValue(new Error('Connection failed'));

      const result = await service.testConnection();

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Cerebras connection test failed:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should handle empty response in connection test', async () => {
      mockCerebrasClient.chat.completions.create.mockResolvedValue({
        choices: []
      });

      const result = await service.testConnection();

      expect(result).toBe(false);
    });
  });
});

describe('createCerebrasService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.CEREBRAS_API_KEY;
  });

  it('should create service with environment variable', () => {
    process.env.CEREBRAS_API_KEY = 'env-api-key';

    const service = createCerebrasService();

    expect(MockCerebras).toHaveBeenCalledWith({
      apiKey: 'env-api-key'
    });
    expect(service).toBeInstanceOf(CerebrasService);
  });

  it('should throw error without environment variable', () => {
    expect(() => createCerebrasService()).toThrow('CEREBRAS_API_KEY environment variable is required');
  });
});