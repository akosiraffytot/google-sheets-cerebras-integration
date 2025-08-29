import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { RewriteRequest, RewriteResponse, ErrorCodes } from '../../src/types/api';
import { sanitizeAndValidateRequest } from '../../src/utils/validation';
import { createCerebrasService } from '../../src/services/cerebras';
import { ErrorHandler } from '../../src/utils/errorHandler';

/**
 * Netlify Function handler for text rewriting requests
 */
export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    const { apiError, httpStatus } = ErrorHandler.handleError(
      'METHOD_NOT_ALLOWED',
      null,
      ErrorHandler.createErrorContext({ 
        method: event.httpMethod,
        headers: event.headers,
        body: event.body 
      })
    );
    
    const errorResponse: RewriteResponse = {
      success: false,
      error: apiError
    };
    
    return {
      statusCode: httpStatus,
      headers,
      body: JSON.stringify(errorResponse)
    };
  }

  try {
    const errorContext = ErrorHandler.createErrorContext({
      method: event.httpMethod,
      headers: event.headers,
      body: event.body
    });

    // Parse request body
    let requestBody;
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (error) {
      const { apiError, httpStatus } = ErrorHandler.handleError(
        ErrorCodes.INVALID_REQUEST,
        error,
        errorContext
      );
      
      const errorResponse: RewriteResponse = {
        success: false,
        error: apiError
      };
      
      return {
        statusCode: httpStatus,
        headers,
        body: JSON.stringify(errorResponse)
      };
    }

    // Validate and sanitize request
    const validationResult = sanitizeAndValidateRequest(requestBody);
    
    if (!validationResult.isValid) {
      const { apiError, httpStatus } = ErrorHandler.handleError(
        validationResult.error!.code,
        null,
        errorContext
      );
      
      const errorResponse: RewriteResponse = {
        success: false,
        error: apiError
      };
      
      return {
        statusCode: httpStatus,
        headers,
        body: JSON.stringify(errorResponse)
      };
    }

    const sanitizedRequest = validationResult.sanitizedRequest!;

    // Initialize Cerebras service
    let cerebrasService;
    try {
      cerebrasService = createCerebrasService();
    } catch (error: any) {
      const { apiError, httpStatus } = ErrorHandler.handleError(
        ErrorCodes.API_UNAVAILABLE,
        error,
        errorContext
      );
      
      const errorResponse: RewriteResponse = {
        success: false,
        error: apiError
      };
      
      return {
        statusCode: httpStatus,
        headers,
        body: JSON.stringify(errorResponse)
      };
    }

    // Call Cerebras AI to rewrite the text
    const cerebrasResponse = await cerebrasService.rewriteText(
      sanitizedRequest.prompt,
      sanitizedRequest.mainText,
      sanitizedRequest.contextText
    );

    if (!cerebrasResponse.success) {
      const { apiError, httpStatus } = ErrorHandler.handleError(
        cerebrasResponse.error!.code,
        cerebrasResponse.error,
        errorContext
      );

      const errorResponse: RewriteResponse = {
        success: false,
        error: apiError
      };
      
      return {
        statusCode: httpStatus,
        headers,
        body: JSON.stringify(errorResponse)
      };
    }

    const response: RewriteResponse = {
      success: true,
      data: {
        rewrittenText: cerebrasResponse.rewrittenText!
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };
  } catch (error: any) {
    const { apiError, httpStatus } = ErrorHandler.handleError(
      ErrorHandler.determineErrorCode(error),
      error,
      ErrorHandler.createErrorContext({
        method: event.httpMethod,
        headers: event.headers,
        body: event.body
      })
    );
    
    const errorResponse: RewriteResponse = {
      success: false,
      error: apiError
    };
    
    return {
      statusCode: httpStatus,
      headers,
      body: JSON.stringify(errorResponse)
    };
  }
};