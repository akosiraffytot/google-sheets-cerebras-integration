import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { HealthResponse } from '../../src/types/api';

/**
 * Netlify Function handler for health check endpoint
 */
export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        error: 'Method not allowed'
      })
    };
  }

  try {
    const healthResponse: HealthResponse = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(healthResponse)
    };
  } catch (error) {
    console.error('Error in health check:', error);
    
    const errorResponse = {
      status: 'unhealthy' as const,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      error: 'Internal server error'
    };
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify(errorResponse)
    };
  }
};