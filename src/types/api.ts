// API request and response type definitions

export interface RewriteRequest {
  prompt: string;
  mainText: string;
  contextText?: string;
  requestId: string;
}

export interface RewriteResponse {
  success: boolean;
  data?: {
    rewrittenText: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
}

export interface ApiError {
  code: string;
  message: string;
}

// Error codes enum
export enum ErrorCodes {
  INVALID_PROMPT = 'INVALID_PROMPT',
  INVALID_TEXT = 'INVALID_TEXT',
  API_UNAVAILABLE = 'API_UNAVAILABLE',
  RATE_LIMITED = 'RATE_LIMITED',
  TIMEOUT = 'TIMEOUT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  METHOD_NOT_ALLOWED = 'METHOD_NOT_ALLOWED'
}