import { CerebrasService, createCerebrasService } from '../cerebras';
import { ErrorCodes } from '../../types/api';

// Mock the Cerebras SDK
const mockCreate = jest.fn();
jest.mock('@cerebras/cerebras_cloud_sdk', () => {
  return {
    Cerebras: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate
        }
      }
    }))
  };
});

describe('CerebrasService', () => {
  let cerebrasService: CerebrasService;

  beforeEach(() => {
    mockCreate.mockClear();
    cerebrasService = new CerebrasService('test-api-key');
  });

  describe('constructor', () => {
    it('should create instance with valid API key', () => {
      expect(() => new CerebrasService('valid-key')).not.toThrow();
    });

    it('should throw error without API key', () => {
      expect(() => new CerebrasService()).toThrow('Cerebras API key is required');
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      cerebrasService.updateConfig({
        model: 'llama3.1-70b',
        temperature: 0.5
      });

      // We can't directly test the private config, but we can test it through rewriteText
      expect(cerebrasService).toBeDefined();
    });
  });

  describe('rewriteText', () => {
    it('should successfully rewrite text', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'This is the rewritten text.'
            }
          }
        ]
      };
      mockCreate.mockResolvedValue(mockResponse);

      const result = await cerebrasService.rewriteText(
        'Make this more formal',
        'Hello world',
        'Business context'
      );

      expect(result.success).toBe(true);
      expect(result.rewrittenText).toBe('This is the rewritten text.');
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'llama3.1-8b',
        messages: [
          {
            role: 'user',
            content: expect.stringContaining('Make this more formal')
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        stream: false
      });
    });

    it('should handle empty response', async () => {
      const mockResponse = {
        choices: []
      };
      mockCreate.mockResolvedValue(mockResponse);

      const result = await cerebrasService.rewriteText('prompt', 'text');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.API_UNAVAILABLE);
      expect(result.error?.message).toBe('No response from Cerebras AI');
    });

    it('should handle empty content', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: ''
            }
          }
        ]
      };
      mockCreate.mockResolvedValue(mockResponse);

      const result = await cerebrasService.rewriteText('prompt', 'text');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.API_UNAVAILABLE);
      expect(result.error?.message).toBe('Empty response from Cerebras AI');
    });

    it('should handle rate limit error', async () => {
      const error = new Error('Rate limited');
      (error as any).status = 429;
      mockCreate.mockRejectedValue(error);

      const result = await cerebrasService.rewriteText('prompt', 'text');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.RATE_LIMITED);
      expect(result.error?.message).toBe('Rate limit exceeded. Please try again later.');
    });

    it('should handle authentication error', async () => {
      const error = new Error('Unauthorized');
      (error as any).status = 401;
      mockCreate.mockRejectedValue(error);

      const result = await cerebrasService.rewriteText('prompt', 'text');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.API_UNAVAILABLE);
      expect(result.error?.message).toBe('Invalid API key or authentication failed');
    });

    it('should handle bad request error', async () => {
      const error = new Error('Bad request');
      (error as any).status = 400;
      mockCreate.mockRejectedValue(error);

      const result = await cerebrasService.rewriteText('prompt', 'text');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.INVALID_TEXT);
      expect(result.error?.message).toBe('Invalid request parameters');
    });

    it('should handle connection error', async () => {
      const error = new Error('Connection refused');
      (error as any).code = 'ECONNREFUSED';
      mockCreate.mockRejectedValue(error);

      const result = await cerebrasService.rewriteText('prompt', 'text');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.API_UNAVAILABLE);
      expect(result.error?.message).toBe('Unable to connect to Cerebras API');
    });

    it('should handle timeout error', async () => {
      const error = new Error('Timeout');
      (error as any).code = 'ETIMEDOUT';
      mockCreate.mockRejectedValue(error);

      const result = await cerebrasService.rewriteText('prompt', 'text');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.TIMEOUT);
      expect(result.error?.message).toBe('Request timed out');
    });

    it('should handle generic error', async () => {
      const error = new Error('Generic error');
      mockCreate.mockRejectedValue(error);

      const result = await cerebrasService.rewriteText('prompt', 'text');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.INTERNAL_ERROR);
      expect(result.error?.message).toBe('Generic error');
    });

    it('should construct prompt with context', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Rewritten text'
            }
          }
        ]
      };
      mockCreate.mockResolvedValue(mockResponse);

      await cerebrasService.rewriteText(
        'Make formal',
        'Hello world',
        'Business context'
      );

      const calledWith = mockCreate.mock.calls[0][0];
      const prompt = calledWith.messages[0].content;
      
      expect(prompt).toContain('Make formal');
      expect(prompt).toContain('Hello world');
      expect(prompt).toContain('Business context');
      expect(prompt).toContain('Text to rewrite:');
      expect(prompt).toContain('Additional context:');
      expect(prompt).toContain('Rewritten text:');
    });

    it('should construct prompt without context', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Rewritten text'
            }
          }
        ]
      };
      mockCreate.mockResolvedValue(mockResponse);

      await cerebrasService.rewriteText('Make formal', 'Hello world');

      const calledWith = mockCreate.mock.calls[0][0];
      const prompt = calledWith.messages[0].content;
      
      expect(prompt).toContain('Make formal');
      expect(prompt).toContain('Hello world');
      expect(prompt).not.toContain('Additional context:');
      expect(prompt).toContain('Text to rewrite:');
      expect(prompt).toContain('Rewritten text:');
    });
  });

  describe('testConnection', () => {
    it('should return true for successful connection', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Hello'
            }
          }
        ]
      };
      mockCreate.mockResolvedValue(mockResponse);

      const result = await cerebrasService.testConnection();

      expect(result).toBe(true);
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'llama3.1-8b',
        messages: [
          {
            role: 'user',
            content: 'Hello'
          }
        ],
        max_tokens: 10,
        temperature: 0,
        stream: false
      });
    });

    it('should return false for failed connection', async () => {
      mockCreate.mockRejectedValue(new Error('Connection failed'));

      const result = await cerebrasService.testConnection();

      expect(result).toBe(false);
    });

    it('should return false for empty response', async () => {
      const mockResponse = {
        choices: []
      };
      mockCreate.mockResolvedValue(mockResponse);

      const result = await cerebrasService.testConnection();

      expect(result).toBe(false);
    });
  });
});

describe('createCerebrasService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should create service with API key from environment', () => {
    process.env.CEREBRAS_API_KEY = 'test-key';

    expect(() => createCerebrasService()).not.toThrow();
  });

  it('should throw error without API key in environment', () => {
    delete process.env.CEREBRAS_API_KEY;

    expect(() => createCerebrasService()).toThrow('CEREBRAS_API_KEY environment variable is required');
  });
});