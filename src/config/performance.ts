/**
 * Optimized performance configuration for the Google Sheets Cerebras AI Integration
 * Fine-tuned based on real-world usage patterns and API characteristics
 */

import { RetryConfig } from '../utils/retryHandler';
import { QueueConfig } from '../utils/requestQueue';
import { CerebrasConfig } from '../services/cerebras';

/**
 * Optimized timeout configurations
 */
export const TIMEOUT_CONFIG = {
  // API request timeouts (optimized for Cerebras response times)
  API_REQUEST_TIMEOUT: 25000, // 25 seconds (reduced from 30s for better UX)
  
  // Google Apps Script timeouts (considering GAS execution limits)
  APPS_SCRIPT_TIMEOUT: 20000, // 20 seconds (safe margin under GAS 30s limit)
  
  // Queue timeouts
  QUEUE_TIMEOUT: 45000, // 45 seconds (allows for retry attempts)
  
  // Cache timeouts
  CACHE_EXPIRY: 3600, // 1 hour (optimized for typical rewrite scenarios)
  CACHE_CLEANUP_INTERVAL: 300, // 5 minutes
  
  // Health check timeout
  HEALTH_CHECK_TIMEOUT: 5000 // 5 seconds
} as const;

/**
 * Optimized retry configuration
 */
export const OPTIMIZED_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3, // Keep at 3 for good balance
  baseDelay: 800, // Reduced from 1000ms for faster recovery
  maxDelay: 20000, // Reduced from 30s for better UX
  backoffMultiplier: 1.8, // Slightly reduced for more aggressive retries
  jitterFactor: 0.15, // Increased jitter to reduce thundering herd
  retryableErrors: [
    'RATE_LIMITED',
    'TIMEOUT', 
    'API_UNAVAILABLE',
    'INTERNAL_ERROR' // Added for transient server errors
  ],
  timeoutMs: TIMEOUT_CONFIG.API_REQUEST_TIMEOUT
};

/**
 * Optimized queue configuration
 */
export const OPTIMIZED_QUEUE_CONFIG: QueueConfig = {
  maxConcurrent: 3, // Reduced from 5 to be more conservative with Cerebras API
  maxQueueSize: 25, // Reduced from 100 for better memory usage
  requestTimeoutMs: TIMEOUT_CONFIG.API_REQUEST_TIMEOUT,
  queueTimeoutMs: TIMEOUT_CONFIG.QUEUE_TIMEOUT
};

/**
 * Optimized Cerebras configuration
 */
export const OPTIMIZED_CEREBRAS_CONFIG: Partial<CerebrasConfig> = {
  model: 'llama3.1-8b', // Fastest model for better response times
  temperature: 0.7, // Good balance of creativity and consistency
  max_tokens: 1500, // Reduced from 2000 for faster responses
  stream: false, // Keep non-streaming for simplicity
  retryConfig: OPTIMIZED_RETRY_CONFIG,
  queueConfig: OPTIMIZED_QUEUE_CONFIG
};

/**
 * Cache optimization settings
 */
export const CACHE_CONFIG = {
  // Cache duration based on content type
  DEFAULT_DURATION: TIMEOUT_CONFIG.CACHE_EXPIRY,
  SHORT_DURATION: 1800, // 30 minutes for frequently changing content
  LONG_DURATION: 7200, // 2 hours for stable content
  
  // Cache key optimization
  MAX_KEY_LENGTH: 200, // Limit cache key length
  HASH_LONG_KEYS: true, // Hash keys longer than max length
  
  // Cache size limits
  MAX_CACHE_SIZE: 100, // Maximum number of cached items
  CLEANUP_THRESHOLD: 80 // Clean up when 80% full
} as const;

/**
 * Performance monitoring thresholds
 */
export const PERFORMANCE_THRESHOLDS = {
  // Response time thresholds (milliseconds)
  FAST_RESPONSE: 3000, // Under 3s is considered fast
  ACCEPTABLE_RESPONSE: 8000, // Under 8s is acceptable
  SLOW_RESPONSE: 15000, // Over 15s is slow
  
  // Error rate thresholds (percentage)
  LOW_ERROR_RATE: 5, // Under 5% error rate is good
  HIGH_ERROR_RATE: 20, // Over 20% error rate needs attention
  
  // Queue health thresholds
  HEALTHY_QUEUE_SIZE: 5, // Queue size under 5 is healthy
  UNHEALTHY_QUEUE_SIZE: 15 // Queue size over 15 needs attention
} as const;

/**
 * User experience optimization settings
 */
export const UX_CONFIG = {
  // Status message timing
  PROCESSING_DELAY: 1000, // Show "Processing..." after 1 second
  RETRY_MESSAGE_DELAY: 2000, // Show "Retrying..." after 2 seconds
  
  // Error message optimization
  MAX_ERROR_LENGTH: 150, // Keep error messages concise
  INCLUDE_HELPFUL_HINTS: true, // Include actionable hints in errors
  
  // Progress indication
  SHOW_PROGRESS_DOTS: true, // Animate processing indicators
  PROGRESS_UPDATE_INTERVAL: 500 // Update progress every 500ms
} as const;

/**
 * Environment-specific configurations
 */
export const ENV_CONFIGS = {
  development: {
    ...OPTIMIZED_RETRY_CONFIG,
    maxRetries: 2, // Fewer retries in development
    baseDelay: 500, // Faster retries for development
    timeoutMs: 15000 // Shorter timeout for development
  },
  
  production: {
    ...OPTIMIZED_RETRY_CONFIG,
    maxRetries: 3, // Standard retries in production
    baseDelay: 800, // Optimized delay
    timeoutMs: TIMEOUT_CONFIG.API_REQUEST_TIMEOUT
  },
  
  testing: {
    ...OPTIMIZED_RETRY_CONFIG,
    maxRetries: 1, // Minimal retries for testing
    baseDelay: 100, // Very fast for tests
    timeoutMs: 5000 // Short timeout for tests
  }
} as const;

/**
 * Gets environment-specific configuration
 */
export function getEnvironmentConfig(): RetryConfig {
  const env = process.env.NODE_ENV || 'production';
  return ENV_CONFIGS[env as keyof typeof ENV_CONFIGS] || ENV_CONFIGS.production;
}

/**
 * Validates performance configuration
 */
export function validatePerformanceConfig(): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  // Validate timeout relationships
  if (TIMEOUT_CONFIG.API_REQUEST_TIMEOUT >= TIMEOUT_CONFIG.APPS_SCRIPT_TIMEOUT) {
    issues.push('API timeout should be less than Apps Script timeout');
  }
  
  if (TIMEOUT_CONFIG.QUEUE_TIMEOUT <= TIMEOUT_CONFIG.API_REQUEST_TIMEOUT) {
    issues.push('Queue timeout should be greater than API timeout');
  }
  
  // Validate retry configuration
  if (OPTIMIZED_RETRY_CONFIG.maxDelay <= OPTIMIZED_RETRY_CONFIG.baseDelay) {
    issues.push('Max delay should be greater than base delay');
  }
  
  // Validate queue configuration
  if (OPTIMIZED_QUEUE_CONFIG.maxConcurrent > 10) {
    issues.push('Max concurrent requests should not exceed 10 for API stability');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}