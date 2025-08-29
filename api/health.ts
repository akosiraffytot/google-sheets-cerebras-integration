import { VercelRequest, VercelResponse } from '@vercel/node';
import { HealthResponse } from '../src/types/api';

/**
 * Health check endpoint for monitoring
 * Deployed as Vercel serverless function
 */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    res.status(405).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      error: 'Method not allowed'
    });
    return;
  }

  try {
    const healthResponse: HealthResponse = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };

    res.status(200).json(healthResponse);
  } catch (error) {
    console.error('Error in health check:', error);
    
    const errorResponse = {
      status: 'unhealthy' as const,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      error: 'Internal server error'
    };
    
    res.status(500).json(errorResponse);
  }
}