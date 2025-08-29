import { RewriteRequest, ErrorCodes } from '../types/api';

export interface ValidationResult {
  isValid: boolean;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Validates the prompt parameter
 */
export function validatePrompt(prompt: any): ValidationResult {
  if (!prompt) {
    return {
      isValid: false,
      error: {
        code: ErrorCodes.INVALID_PROMPT,
        message: 'Prompt is required'
      }
    };
  }

  if (typeof prompt !== 'string') {
    return {
      isValid: false,
      error: {
        code: ErrorCodes.INVALID_PROMPT,
        message: 'Prompt must be a string'
      }
    };
  }

  if (prompt.trim().length === 0) {
    return {
      isValid: false,
      error: {
        code: ErrorCodes.INVALID_PROMPT,
        message: 'Prompt cannot be empty'
      }
    };
  }

  if (prompt.length > 2000) {
    return {
      isValid: false,
      error: {
        code: ErrorCodes.INVALID_PROMPT,
        message: 'Prompt cannot exceed 2000 characters'
      }
    };
  }

  return { isValid: true };
}

/**
 * Validates the mainText parameter
 */
export function validateMainText(mainText: any): ValidationResult {
  if (!mainText) {
    return {
      isValid: false,
      error: {
        code: ErrorCodes.INVALID_TEXT,
        message: 'Main text is required'
      }
    };
  }

  if (typeof mainText !== 'string') {
    return {
      isValid: false,
      error: {
        code: ErrorCodes.INVALID_TEXT,
        message: 'Main text must be a string'
      }
    };
  }

  if (mainText.trim().length === 0) {
    return {
      isValid: false,
      error: {
        code: ErrorCodes.INVALID_TEXT,
        message: 'Main text cannot be empty'
      }
    };
  }

  if (mainText.length > 10000) {
    return {
      isValid: false,
      error: {
        code: ErrorCodes.INVALID_TEXT,
        message: 'Main text cannot exceed 10000 characters'
      }
    };
  }

  return { isValid: true };
}

/**
 * Validates the contextText parameter (optional)
 */
export function validateContextText(contextText: any): ValidationResult {
  // Context text is optional
  if (!contextText) {
    return { isValid: true };
  }

  if (typeof contextText !== 'string') {
    return {
      isValid: false,
      error: {
        code: ErrorCodes.INVALID_TEXT,
        message: 'Context text must be a string'
      }
    };
  }

  if (contextText.length > 5000) {
    return {
      isValid: false,
      error: {
        code: ErrorCodes.INVALID_TEXT,
        message: 'Context text cannot exceed 5000 characters'
      }
    };
  }

  return { isValid: true };
}

/**
 * Validates the requestId parameter
 */
export function validateRequestId(requestId: any): ValidationResult {
  if (!requestId) {
    return {
      isValid: false,
      error: {
        code: 'INVALID_REQUEST_ID',
        message: 'Request ID is required'
      }
    };
  }

  if (typeof requestId !== 'string') {
    return {
      isValid: false,
      error: {
        code: 'INVALID_REQUEST_ID',
        message: 'Request ID must be a string'
      }
    };
  }

  // Basic UUID format validation (loose)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(requestId)) {
    return {
      isValid: false,
      error: {
        code: 'INVALID_REQUEST_ID',
        message: 'Request ID must be a valid UUID format'
      }
    };
  }

  return { isValid: true };
}

/**
 * Sanitizes text input by removing potentially harmful content
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Remove null bytes and control characters except newlines and tabs
  let sanitized = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Normalize line endings
  sanitized = sanitized.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  return sanitized;
}

/**
 * Validates the complete request payload
 */
export function validateRewriteRequest(body: any): ValidationResult {
  if (!body || typeof body !== 'object') {
    return {
      isValid: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'Request body must be a valid JSON object'
      }
    };
  }

  // Validate prompt
  const promptValidation = validatePrompt(body.prompt);
  if (!promptValidation.isValid) {
    return promptValidation;
  }

  // Validate mainText
  const mainTextValidation = validateMainText(body.mainText);
  if (!mainTextValidation.isValid) {
    return mainTextValidation;
  }

  // Validate contextText (optional)
  const contextTextValidation = validateContextText(body.contextText);
  if (!contextTextValidation.isValid) {
    return contextTextValidation;
  }

  // Validate requestId
  const requestIdValidation = validateRequestId(body.requestId);
  if (!requestIdValidation.isValid) {
    return requestIdValidation;
  }

  return { isValid: true };
}

/**
 * Sanitizes and validates the complete request
 */
export function sanitizeAndValidateRequest(body: any): {
  isValid: boolean;
  sanitizedRequest?: RewriteRequest;
  error?: {
    code: string;
    message: string;
  };
} {
  const validation = validateRewriteRequest(body);
  if (!validation.isValid) {
    return {
      isValid: false,
      error: validation.error
    };
  }

  const sanitizedRequest: RewriteRequest = {
    prompt: sanitizeText(body.prompt),
    mainText: sanitizeText(body.mainText),
    contextText: body.contextText ? sanitizeText(body.contextText) : undefined,
    requestId: body.requestId.trim()
  };

  return {
    isValid: true,
    sanitizedRequest
  };
}