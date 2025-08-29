import { VercelRequest, VercelResponse } from '@vercel/node';
import { RewriteRequest, RewriteResponse, ErrorCodes } from '../src/types/api';
import { sanitizeAndValidateRequest } from '../src/utils/validation';
import { createCerebrasService } from '../src/services/cerebras';
import { ErrorHandler } from '../src/utils/errorHandler';
import { recordPerformanceMetric } from '../src/utils/performanceMonitor';

/**
 * Main API handler for text rewriting requests
 * Deployed as Vercel serverless function
 */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] || req.body?.requestId || `req_${Date.now()}`;
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    const { apiError, httpStatus } = ErrorHandler.handleError(
      'METHOD_NOT_ALLOWED',
      null,
      ErrorHandler.createErrorContext(req)
    );
    
    const errorResponse: RewriteResponse = {
      success: false,
      error: apiError
    };
    
    // Record performance metric for failed request
    recordPerformanceMetric({
      requestId: requestId as string,
      endpoint: '/api/rewrite',
      totalDuration: Date.now() - startTime,
      queueTime: 0,
      processingTime: 0,
      responseTime: Date.now() - startTime,
      requestSize: 0,
      responseSize: JSON.stringify(errorResponse).length,
      retryCount: 0,
      success: false,
      errorCode: 'METHOD_NOT_ALLOWED',
      statusCode: httpStatus
    });
    
    res.status(httpStatus).json(errorResponse);
    return;
  }

  try {
    const errorContext = ErrorHandler.createErrorContext(req);

    // Validate and sanitize request
    const validationResult = sanitizeAndValidateRequest(req.body);
    
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
      res.status(httpStatus).json(errorResponse);
      return;
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
      res.status(httpStatus).json(errorResponse);
      return;
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
      res.status(httpStatus).json(errorResponse);
      return;
    }

    const response: RewriteResponse = {
      success: true,
      data: {
        rewrittenText: cerebrasResponse.rewrittenText!
      }
    };

    // Record successful performance metric
    recordPerformanceMetric({
      requestId: requestId as string,
      endpoint: '/api/rewrite',
      totalDuration: Date.now() - startTime,
      queueTime: 0, // Would be populated by queue if used
      processingTime: Date.now() - startTime, // Approximate processing time
      responseTime: Date.now() - startTime,
      requestSize: JSON.stringify(req.body).length,
      responseSize: JSON.stringify(response).length,
      retryCount: 0, // Would be populated by retry logic if used
      success: true,
      statusCode: 200
    });

    res.status(200).json(response);
  } catch (error: any) {
    const { apiError, httpStatus } = ErrorHandler.handleError(
      ErrorHandler.determineErrorCode(error),
      error,
      ErrorHandler.createErrorContext(req)
    );
    
    const errorResponse: RewriteResponse = {
      success: false,
      error: apiError
    };
    
    res.status(httpStatus).json(errorResponse);
  }
}