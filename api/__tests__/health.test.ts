import { VercelRequest, VercelResponse } from '@vercel/node';
import handler from '../health';

describe('Health API Handler', () => {
  let mockReq: Partial<VercelRequest>;
  let mockRes: Partial<VercelResponse>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockSetHeader: jest.Mock;
  let mockEnd: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnThis();
    mockSetHeader = jest.fn();
    mockEnd = jest.fn();

    mockRes = {
      json: mockJson,
      status: mockStatus,
      setHeader: mockSetHeader,
      end: mockEnd
    };

    mockReq = {
      method: 'GET',
      headers: {},
      url: '/api/health'
    };

    jest.clearAllMocks();
  });

  describe('CORS Headers', () => {
    it('should set CORS headers for all requests', async () => {
      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockSetHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
      expect(mockSetHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET, OPTIONS');
      expect(mockSetHeader).toHaveBeenCalledWith('Access-Control-Allow-Headers', 'Content-Type');
    });

    it('should handle OPTIONS preflight requests', async () => {
      mockReq.method = 'OPTIONS';

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockEnd).toHaveBeenCalled();
      expect(mockJson).not.toHaveBeenCalled();
    });
  });

  describe('HTTP Method Validation', () => {
    it('should reject non-GET requests', async () => {
      mockReq.method = 'POST';

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(405);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'unhealthy',
        timestamp: expect.any(String),
        version: '1.0.0',
        error: 'Method not allowed'
      });
    });

    it('should accept GET requests', async () => {
      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'healthy',
        timestamp: expect.any(String),
        version: '1.0.0'
      });
    });
  });

  describe('Health Check Response', () => {
    it('should return healthy status for successful requests', async () => {
      const beforeTime = new Date().toISOString();
      
      await handler(mockReq as VercelRequest, mockRes as VercelResponse);
      
      const afterTime = new Date().toISOString();

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'healthy',
        timestamp: expect.any(String),
        version: '1.0.0'
      });

      // Verify timestamp is reasonable
      const response = mockJson.mock.calls[0][0];
      expect(response.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(response.timestamp >= beforeTime).toBe(true);
      expect(response.timestamp <= afterTime).toBe(true);
    });

    it('should return proper response structure', async () => {
      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      const response = mockJson.mock.calls[0][0];
      expect(response).toHaveProperty('status');
      expect(response).toHaveProperty('timestamp');
      expect(response).toHaveProperty('version');
      expect(typeof response.status).toBe('string');
      expect(typeof response.timestamp).toBe('string');
      expect(typeof response.version).toBe('string');
    });
  });

  describe('Error Handling', () => {
    it('should handle internal errors gracefully', async () => {
      // Mock console.error to avoid noise in test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Force an error by making JSON.stringify fail
      const originalStringify = JSON.stringify;
      JSON.stringify = jest.fn().mockImplementation(() => {
        throw new Error('JSON stringify error');
      });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'unhealthy',
        timestamp: expect.any(String),
        version: '1.0.0',
        error: 'Internal server error'
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error in health check:', expect.any(Error));

      // Restore original functions
      JSON.stringify = originalStringify;
      consoleSpy.mockRestore();
    });

    it('should log errors without exposing sensitive information', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Force an error
      const originalStringify = JSON.stringify;
      JSON.stringify = jest.fn().mockImplementation(() => {
        throw new Error('Test error with sensitive data: API_KEY=secret123');
      });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      // Error should be logged
      expect(consoleSpy).toHaveBeenCalled();

      // But response should not contain sensitive information
      const response = mockJson.mock.calls[0][0];
      expect(response.error).toBe('Internal server error');
      expect(response.error).not.toContain('secret123');

      // Restore original functions
      JSON.stringify = originalStringify;
      consoleSpy.mockRestore();
    });
  });

  describe('Response Timing', () => {
    it('should respond quickly', async () => {
      const startTime = Date.now();
      
      await handler(mockReq as VercelRequest, mockRes as VercelResponse);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Health check should be very fast (under 100ms)
      expect(responseTime).toBeLessThan(100);
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = Array.from({ length: 10 }, () => 
        handler(mockReq as VercelRequest, mockRes as VercelResponse)
      );

      await Promise.all(requests);

      // All requests should succeed
      expect(mockStatus).toHaveBeenCalledTimes(10);
      expect(mockJson).toHaveBeenCalledTimes(10);
      
      // All should return healthy status
      mockJson.mock.calls.forEach(call => {
        expect(call[0].status).toBe('healthy');
      });
    });
  });
});