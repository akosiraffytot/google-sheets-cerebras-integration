import {
  validatePrompt,
  validateMainText,
  validateContextText,
  validateRequestId,
  validateRewriteRequest,
  sanitizeAndValidateRequest,
  sanitizeText
} from '../../utils/validation';
import { ErrorCodes } from '../../types/api';

describe('Validation Utils', () => {
  describe('validatePrompt', () => {
    it('should validate valid prompts', () => {
      const result = validatePrompt('Rewrite this text');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject null/undefined prompts', () => {
      expect(validatePrompt(null).isValid).toBe(false);
      expect(validatePrompt(undefined).isValid).toBe(false);
      expect(validatePrompt('').isValid).toBe(false);
    });

    it('should reject non-string prompts', () => {
      const result = validatePrompt(123);
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.INVALID_PROMPT);
      expect(result.error?.message).toBe('Prompt must be a string');
    });

    it('should reject empty prompts', () => {
      const result = validatePrompt('   ');
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.INVALID_PROMPT);
      expect(result.error?.message).toBe('Prompt cannot be empty');
    });

    it('should reject prompts that are too long', () => {
      const longPrompt = 'a'.repeat(2001);
      const result = validatePrompt(longPrompt);
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.INVALID_PROMPT);
      expect(result.error?.message).toBe('Prompt cannot exceed 2000 characters');
    });

    it('should accept prompts at the character limit', () => {
      const maxPrompt = 'a'.repeat(2000);
      const result = validatePrompt(maxPrompt);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateMainText', () => {
    it('should validate valid main text', () => {
      const result = validateMainText('Hello world');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject null/undefined main text', () => {
      expect(validateMainText(null).isValid).toBe(false);
      expect(validateMainText(undefined).isValid).toBe(false);
      expect(validateMainText('').isValid).toBe(false);
    });

    it('should reject non-string main text', () => {
      const result = validateMainText(123);
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.INVALID_TEXT);
      expect(result.error?.message).toBe('Main text must be a string');
    });

    it('should reject empty main text', () => {
      const result = validateMainText('   ');
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.INVALID_TEXT);
      expect(result.error?.message).toBe('Main text cannot be empty');
    });

    it('should reject main text that is too long', () => {
      const longText = 'a'.repeat(10001);
      const result = validateMainText(longText);
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.INVALID_TEXT);
      expect(result.error?.message).toBe('Main text cannot exceed 10000 characters');
    });

    it('should accept main text at the character limit', () => {
      const maxText = 'a'.repeat(10000);
      const result = validateMainText(maxText);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateContextText', () => {
    it('should validate valid context text', () => {
      const result = validateContextText('Additional context');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept null/undefined context text (optional)', () => {
      expect(validateContextText(null).isValid).toBe(true);
      expect(validateContextText(undefined).isValid).toBe(true);
      expect(validateContextText('').isValid).toBe(true);
    });

    it('should reject non-string context text', () => {
      const result = validateContextText(123);
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.INVALID_TEXT);
      expect(result.error?.message).toBe('Context text must be a string');
    });

    it('should reject context text that is too long', () => {
      const longText = 'a'.repeat(5001);
      const result = validateContextText(longText);
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.INVALID_TEXT);
      expect(result.error?.message).toBe('Context text cannot exceed 5000 characters');
    });

    it('should accept context text at the character limit', () => {
      const maxText = 'a'.repeat(5000);
      const result = validateContextText(maxText);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateRequestId', () => {
    it('should validate valid UUID request IDs', () => {
      const validUuid = '12345678-1234-1234-1234-123456789012';
      const result = validateRequestId(validUuid);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject null/undefined request IDs', () => {
      expect(validateRequestId(null).isValid).toBe(false);
      expect(validateRequestId(undefined).isValid).toBe(false);
      expect(validateRequestId('').isValid).toBe(false);
    });

    it('should reject non-string request IDs', () => {
      const result = validateRequestId(123);
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('INVALID_REQUEST_ID');
      expect(result.error?.message).toBe('Request ID must be a string');
    });

    it('should reject invalid UUID formats', () => {
      const invalidFormats = [
        'not-a-uuid',
        '12345678-1234-1234-1234',
        '12345678-1234-1234-1234-12345678901',
        'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
      ];

      invalidFormats.forEach(invalidId => {
        const result = validateRequestId(invalidId);
        expect(result.isValid).toBe(false);
        expect(result.error?.code).toBe('INVALID_REQUEST_ID');
        expect(result.error?.message).toBe('Request ID must be a valid UUID format');
      });
    });

    it('should accept various valid UUID formats', () => {
      const validUuids = [
        '12345678-1234-1234-1234-123456789012',
        'abcdefgh-abcd-abcd-abcd-abcdefghijkl',
        '00000000-0000-0000-0000-000000000000',
        'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF'
      ];

      validUuids.forEach(validId => {
        const result = validateRequestId(validId);
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('sanitizeText', () => {
    it('should sanitize text by removing control characters', () => {
      const dirtyText = 'Hello\x00\x01\x02World\x7F';
      const result = sanitizeText(dirtyText);
      expect(result).toBe('HelloWorld');
    });

    it('should preserve newlines and tabs', () => {
      const textWithWhitespace = 'Hello\n\tWorld\r\n';
      const result = sanitizeText(textWithWhitespace);
      expect(result).toBe('Hello\n\tWorld\n');
    });

    it('should trim whitespace', () => {
      const textWithWhitespace = '  Hello World  ';
      const result = sanitizeText(textWithWhitespace);
      expect(result).toBe('Hello World');
    });

    it('should normalize line endings', () => {
      const textWithMixedEndings = 'Line1\r\nLine2\rLine3\n';
      const result = sanitizeText(textWithMixedEndings);
      expect(result).toBe('Line1\nLine2\nLine3');
    });

    it('should handle null/undefined input', () => {
      expect(sanitizeText(null as any)).toBe('');
      expect(sanitizeText(undefined as any)).toBe('');
    });

    it('should handle non-string input', () => {
      expect(sanitizeText(123 as any)).toBe('');
      expect(sanitizeText({} as any)).toBe('');
    });
  });

  describe('validateRewriteRequest', () => {
    const validRequest = {
      prompt: 'Rewrite this text',
      mainText: 'Hello world',
      contextText: 'Additional context',
      requestId: '12345678-1234-1234-1234-123456789012'
    };

    it('should validate complete valid requests', () => {
      const result = validateRewriteRequest(validRequest);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate requests without context text', () => {
      const requestWithoutContext = { ...validRequest };
      delete requestWithoutContext.contextText;
      
      const result = validateRewriteRequest(requestWithoutContext);
      expect(result.isValid).toBe(true);
    });

    it('should reject null/undefined request body', () => {
      expect(validateRewriteRequest(null).isValid).toBe(false);
      expect(validateRewriteRequest(undefined).isValid).toBe(false);
    });

    it('should reject non-object request body', () => {
      const result = validateRewriteRequest('not an object');
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('INVALID_REQUEST');
      expect(result.error?.message).toBe('Request body must be a valid JSON object');
    });

    it('should reject requests with invalid prompt', () => {
      const invalidRequest = { ...validRequest, prompt: '' };
      const result = validateRewriteRequest(invalidRequest);
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.INVALID_PROMPT);
    });

    it('should reject requests with invalid main text', () => {
      const invalidRequest = { ...validRequest, mainText: '' };
      const result = validateRewriteRequest(invalidRequest);
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.INVALID_TEXT);
    });

    it('should reject requests with invalid context text', () => {
      const invalidRequest = { ...validRequest, contextText: 123 };
      const result = validateRewriteRequest(invalidRequest);
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.INVALID_TEXT);
    });

    it('should reject requests with invalid request ID', () => {
      const invalidRequest = { ...validRequest, requestId: 'invalid-uuid' };
      const result = validateRewriteRequest(invalidRequest);
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('INVALID_REQUEST_ID');
    });
  });

  describe('sanitizeAndValidateRequest', () => {
    const validRequest = {
      prompt: '  Rewrite this text  ',
      mainText: '  Hello world  ',
      contextText: '  Additional context  ',
      requestId: '12345678-1234-1234-1234-123456789012'
    };

    it('should sanitize and validate valid requests', () => {
      const result = sanitizeAndValidateRequest(validRequest);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedRequest).toBeDefined();
      expect(result.sanitizedRequest?.prompt).toBe('Rewrite this text');
      expect(result.sanitizedRequest?.mainText).toBe('Hello world');
      expect(result.sanitizedRequest?.contextText).toBe('Additional context');
      expect(result.sanitizedRequest?.requestId).toBe('12345678-1234-1234-1234-123456789012');
    });

    it('should handle requests without context text', () => {
      const requestWithoutContext = { ...validRequest };
      delete requestWithoutContext.contextText;
      
      const result = sanitizeAndValidateRequest(requestWithoutContext);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedRequest?.contextText).toBeUndefined();
    });

    it('should handle empty context text', () => {
      const requestWithEmptyContext = { ...validRequest, contextText: '   ' };
      
      const result = sanitizeAndValidateRequest(requestWithEmptyContext);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedRequest?.contextText).toBeUndefined();
    });

    it('should return validation errors', () => {
      const invalidRequest = { ...validRequest, prompt: '' };
      const result = sanitizeAndValidateRequest(invalidRequest);
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.INVALID_PROMPT);
      expect(result.sanitizedRequest).toBeUndefined();
    });

    it('should sanitize text with control characters', () => {
      const dirtyRequest = {
        ...validRequest,
        prompt: 'Rewrite\x00this\x01text',
        mainText: 'Hello\x02world\x7F',
        contextText: 'Additional\x03context'
      };
      
      const result = sanitizeAndValidateRequest(dirtyRequest);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedRequest?.prompt).toBe('Rewritethistext');
      expect(result.sanitizedRequest?.mainText).toBe('Helloworld');
      expect(result.sanitizedRequest?.contextText).toBe('Additionalcontext');
    });

    it('should normalize line endings', () => {
      const requestWithMixedEndings = {
        ...validRequest,
        prompt: 'Line1\r\nLine2\rLine3',
        mainText: 'Text1\r\nText2\rText3',
        contextText: 'Context1\r\nContext2\rContext3'
      };
      
      const result = sanitizeAndValidateRequest(requestWithMixedEndings);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedRequest?.prompt).toBe('Line1\nLine2\nLine3');
      expect(result.sanitizedRequest?.mainText).toBe('Text1\nText2\nText3');
      expect(result.sanitizedRequest?.contextText).toBe('Context1\nContext2\nContext3');
    });
  });
});