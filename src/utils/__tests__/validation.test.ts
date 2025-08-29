import {
  validatePrompt,
  validateMainText,
  validateContextText,
  validateRequestId,
  sanitizeText,
  validateRewriteRequest,
  sanitizeAndValidateRequest
} from '../validation';
import { ErrorCodes } from '../../types/api';

describe('Validation Functions', () => {
  describe('validatePrompt', () => {
    it('should validate a valid prompt', () => {
      const result = validatePrompt('Rewrite this text to be more formal');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty prompt', () => {
      const result = validatePrompt('');
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.INVALID_PROMPT);
    });

    it('should reject null/undefined prompt', () => {
      const result = validatePrompt(null);
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.INVALID_PROMPT);
    });

    it('should reject non-string prompt', () => {
      const result = validatePrompt(123);
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.INVALID_PROMPT);
    });

    it('should reject prompt that is too long', () => {
      const longPrompt = 'a'.repeat(2001);
      const result = validatePrompt(longPrompt);
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.INVALID_PROMPT);
    });

    it('should reject whitespace-only prompt', () => {
      const result = validatePrompt('   ');
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.INVALID_PROMPT);
    });
  });

  describe('validateMainText', () => {
    it('should validate valid main text', () => {
      const result = validateMainText('This is some text to rewrite');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty main text', () => {
      const result = validateMainText('');
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.INVALID_TEXT);
    });

    it('should reject null/undefined main text', () => {
      const result = validateMainText(undefined);
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.INVALID_TEXT);
    });

    it('should reject non-string main text', () => {
      const result = validateMainText(['array']);
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.INVALID_TEXT);
    });

    it('should reject main text that is too long', () => {
      const longText = 'a'.repeat(10001);
      const result = validateMainText(longText);
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.INVALID_TEXT);
    });

    it('should reject whitespace-only main text', () => {
      const result = validateMainText('   \n\t  ');
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.INVALID_TEXT);
    });
  });

  describe('validateContextText', () => {
    it('should validate valid context text', () => {
      const result = validateContextText('Additional context information');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should allow empty/null context text (optional)', () => {
      expect(validateContextText('').isValid).toBe(true);
      expect(validateContextText(null).isValid).toBe(true);
      expect(validateContextText(undefined).isValid).toBe(true);
    });

    it('should reject non-string context text', () => {
      const result = validateContextText(123);
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.INVALID_TEXT);
    });

    it('should reject context text that is too long', () => {
      const longText = 'a'.repeat(5001);
      const result = validateContextText(longText);
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.INVALID_TEXT);
    });
  });

  describe('validateRequestId', () => {
    it('should validate valid UUID', () => {
      const result = validateRequestId('123e4567-e89b-12d3-a456-426614174000');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty request ID', () => {
      const result = validateRequestId('');
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('INVALID_REQUEST_ID');
    });

    it('should reject null/undefined request ID', () => {
      const result = validateRequestId(null);
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('INVALID_REQUEST_ID');
    });

    it('should reject non-string request ID', () => {
      const result = validateRequestId(123);
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('INVALID_REQUEST_ID');
    });

    it('should reject invalid UUID format', () => {
      const result = validateRequestId('not-a-uuid');
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('INVALID_REQUEST_ID');
    });
  });

  describe('sanitizeText', () => {
    it('should remove control characters', () => {
      const input = 'Hello\x00\x01World\x7F';
      const result = sanitizeText(input);
      expect(result).toBe('HelloWorld');
    });

    it('should preserve newlines and tabs', () => {
      const input = 'Hello\nWorld\tTest';
      const result = sanitizeText(input);
      expect(result).toBe('Hello\nWorld\tTest');
    });

    it('should normalize line endings', () => {
      const input = 'Hello\r\nWorld\rTest';
      const result = sanitizeText(input);
      expect(result).toBe('Hello\nWorld\nTest');
    });

    it('should trim whitespace', () => {
      const input = '  Hello World  ';
      const result = sanitizeText(input);
      expect(result).toBe('Hello World');
    });

    it('should handle non-string input', () => {
      expect(sanitizeText(null as any)).toBe('');
      expect(sanitizeText(undefined as any)).toBe('');
      expect(sanitizeText(123 as any)).toBe('');
    });
  });

  describe('validateRewriteRequest', () => {
    const validRequest = {
      prompt: 'Rewrite this text',
      mainText: 'Hello world',
      contextText: 'Additional context',
      requestId: '123e4567-e89b-12d3-a456-426614174000'
    };

    it('should validate a complete valid request', () => {
      const result = validateRewriteRequest(validRequest);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate request without optional contextText', () => {
      const request = {
        prompt: validRequest.prompt,
        mainText: validRequest.mainText,
        requestId: validRequest.requestId
      };
      const result = validateRewriteRequest(request);
      expect(result.isValid).toBe(true);
    });

    it('should reject null/undefined body', () => {
      const result = validateRewriteRequest(null);
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('INVALID_REQUEST');
    });

    it('should reject non-object body', () => {
      const result = validateRewriteRequest('string');
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('INVALID_REQUEST');
    });

    it('should reject request with invalid prompt', () => {
      const request = { ...validRequest, prompt: '' };
      const result = validateRewriteRequest(request);
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.INVALID_PROMPT);
    });

    it('should reject request with invalid mainText', () => {
      const request = { ...validRequest, mainText: null };
      const result = validateRewriteRequest(request);
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.INVALID_TEXT);
    });

    it('should reject request with invalid requestId', () => {
      const request = { ...validRequest, requestId: 'invalid-uuid' };
      const result = validateRewriteRequest(request);
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('INVALID_REQUEST_ID');
    });
  });

  describe('sanitizeAndValidateRequest', () => {
    const validRequest = {
      prompt: '  Rewrite this text  ',
      mainText: '  Hello\x00world  ',
      contextText: '  Additional\r\ncontext  ',
      requestId: '123e4567-e89b-12d3-a456-426614174000'
    };

    it('should sanitize and validate a valid request', () => {
      const result = sanitizeAndValidateRequest(validRequest);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedRequest).toBeDefined();
      expect(result.sanitizedRequest!.prompt).toBe('Rewrite this text');
      expect(result.sanitizedRequest!.mainText).toBe('Helloworld');
      expect(result.sanitizedRequest!.contextText).toBe('Additional\ncontext');
      expect(result.sanitizedRequest!.requestId).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should handle request without contextText', () => {
      const request = {
        prompt: validRequest.prompt,
        mainText: validRequest.mainText,
        requestId: validRequest.requestId
      };
      const result = sanitizeAndValidateRequest(request);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedRequest!.contextText).toBeUndefined();
    });

    it('should return error for invalid request', () => {
      const invalidRequest = { ...validRequest, prompt: '' };
      const result = sanitizeAndValidateRequest(invalidRequest);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.sanitizedRequest).toBeUndefined();
    });
  });
});