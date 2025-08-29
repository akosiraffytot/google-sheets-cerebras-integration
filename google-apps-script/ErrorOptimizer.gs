/**
 * Optimized error handling and user-friendly message formatting
 * Provides clear, actionable error messages with helpful guidance
 */

/**
 * Error message configuration
 */
const ERROR_CONFIG = {
  MAX_MESSAGE_LENGTH: 150,     // Keep messages concise for cell display
  INCLUDE_EMOJI: true,         // Use emoji for visual clarity
  INCLUDE_HINTS: true,         // Include actionable hints
  SHOW_ERROR_CODES: false,     // Hide technical error codes from users
  CONTEXT_AWARE: true          // Provide context-specific guidance
};

/**
 * Enhanced error message mapping with user-friendly explanations
 */
const OPTIMIZED_ERROR_MESSAGES = {
  // API and Network Errors
  'API_UNAVAILABLE': {
    message: '⚠️ AI Service Temporarily Down',
    hint: 'The AI service is being updated. Try again in 2-3 minutes.',
    severity: 'medium',
    retryable: true,
    retryDelay: 180000 // 3 minutes
  },
  
  'RATE_LIMITED': {
    message: '⏳ Too Many Requests',
    hint: 'You\'re using the service heavily. Wait 1-2 minutes before trying again.',
    severity: 'medium',
    retryable: true,
    retryDelay: 90000 // 1.5 minutes
  },
  
  'TIMEOUT': {
    message: '⏱️ Request Timed Out',
    hint: 'The request took too long. Check your internet connection and try with shorter text.',
    severity: 'medium',
    retryable: true,
    retryDelay: 30000 // 30 seconds
  },
  
  'NETWORK_ERROR': {
    message: '🌐 Connection Problem',
    hint: 'Cannot reach the AI service. Check your internet connection.',
    severity: 'high',
    retryable: true,
    retryDelay: 60000 // 1 minute
  },
  
  // Input Validation Errors
  'INVALID_PROMPT': {
    message: '❌ Invalid Prompt',
    hint: 'First parameter must be instructions in quotes, like "Make this professional"',
    severity: 'low',
    retryable: false
  },
  
  'INVALID_TEXT': {
    message: '❌ Invalid Text Input',
    hint: 'Second parameter must be a cell reference (A1) or text content',
    severity: 'low',
    retryable: false
  },
  
  'EMPTY_CONTENT': {
    message: '❌ No Content to Process',
    hint: 'The referenced cell is empty. Add content to that cell first.',
    severity: 'low',
    retryable: false
  },
  
  // Configuration Errors
  'API_NOT_CONFIGURED': {
    message: '⚙️ Setup Required',
    hint: 'API endpoint not configured. Contact your administrator for setup.',
    severity: 'high',
    retryable: false
  },
  
  'AUTHENTICATION_FAILED': {
    message: '🔐 Authentication Issue',
    hint: 'API key is invalid or expired. Contact your administrator.',
    severity: 'high',
    retryable: false
  },
  
  // System Errors
  'QUOTA_EXCEEDED': {
    message: '📊 Daily Limit Reached',
    hint: 'You\'ve reached your daily usage limit. Try again tomorrow.',
    severity: 'medium',
    retryable: false
  },
  
  'INTERNAL_ERROR': {
    message: '🔧 System Error',
    hint: 'An unexpected error occurred. Try again in a few minutes.',
    severity: 'high',
    retryable: true,
    retryDelay: 300000 // 5 minutes
  }
};

/**
 * Formats error messages with enhanced user experience
 * @param {Object} error - Error object with code and message
 * @param {Object} context - Additional context for error formatting
 * @return {string} Optimized error message
 */
function formatOptimizedErrorMessage(error, context = {}) {
  try {
    const errorCode = error.code || 'INTERNAL_ERROR';
    const errorConfig = OPTIMIZED_ERROR_MESSAGES[errorCode] || OPTIMIZED_ERROR_MESSAGES['INTERNAL_ERROR'];
    
    let message = errorConfig.message;
    
    // Add context-specific guidance
    if (ERROR_CONFIG.CONTEXT_AWARE && context) {
      message = addContextualGuidance(message, errorCode, context);
    }
    
    // Add helpful hints if enabled
    if (ERROR_CONFIG.INCLUDE_HINTS && errorConfig.hint) {
      const separator = message.length > 50 ? '\n' : ' - ';
      message += `${separator}${errorConfig.hint}`;
    }
    
    // Ensure message length is within limits
    if (message.length > ERROR_CONFIG.MAX_MESSAGE_LENGTH) {
      message = message.substring(0, ERROR_CONFIG.MAX_MESSAGE_LENGTH - 3) + '...';
    }
    
    return message;
    
  } catch (formatError) {
    console.error(`Error message formatting failed: ${formatError.message}`);
    return '🔧 System Error - Please try again';
  }
}

/**
 * Adds contextual guidance based on error type and context
 * @param {string} baseMessage - Base error message
 * @param {string} errorCode - Error code
 * @param {Object} context - Error context
 * @return {string} Enhanced message with context
 */
function addContextualGuidance(baseMessage, errorCode, context) {
  try {
    switch (errorCode) {
      case 'TIMEOUT':
        if (context.textLength && context.textLength > 2000) {
          return baseMessage.replace('shorter text', 'text under 2000 characters');
        }
        break;
        
      case 'RATE_LIMITED':
        if (context.requestCount && context.requestCount > 10) {
          return baseMessage.replace('1-2 minutes', '5-10 minutes for heavy usage');
        }
        break;
        
      case 'EMPTY_CONTENT':
        if (context.cellReference) {
          return baseMessage.replace('that cell', `cell ${context.cellReference}`);
        }
        break;
        
      case 'INVALID_PROMPT':
        if (context.promptLength && context.promptLength === 0) {
          return baseMessage + ' (prompt cannot be empty)';
        }
        break;
    }
    
    return baseMessage;
    
  } catch (error) {
    console.error(`Contextual guidance failed: ${error.message}`);
    return baseMessage;
  }
}

/**
 * Determines if an error is retryable and when to retry
 * @param {string} errorCode - Error code
 * @return {Object} Retry information
 */
function getRetryInformation(errorCode) {
  const errorConfig = OPTIMIZED_ERROR_MESSAGES[errorCode];
  
  if (!errorConfig) {
    return { retryable: false };
  }
  
  return {
    retryable: errorConfig.retryable || false,
    retryDelay: errorConfig.retryDelay || 30000,
    severity: errorConfig.severity || 'medium'
  };
}

/**
 * Enhanced network error detection and formatting
 * @param {Error} error - Network error object
 * @param {Object} context - Request context
 * @return {string} Formatted network error message
 */
function formatOptimizedNetworkError(error, context = {}) {
  try {
    if (!error) {
      return formatOptimizedErrorMessage({ code: 'NETWORK_ERROR' }, context);
    }
    
    const errorMessage = error.message.toLowerCase();
    let errorCode = 'NETWORK_ERROR';
    
    // Classify network error types
    if (errorMessage.includes('timeout')) {
      errorCode = 'TIMEOUT';
    } else if (errorMessage.includes('dns') || errorMessage.includes('resolve')) {
      errorCode = 'DNS_ERROR';
    } else if (errorMessage.includes('ssl') || errorMessage.includes('certificate')) {
      errorCode = 'SSL_ERROR';
    } else if (errorMessage.includes('fetch') || errorMessage.includes('endpoint')) {
      errorCode = 'API_NOT_CONFIGURED';
    }
    
    // Add specific error types to mapping if not present
    if (!OPTIMIZED_ERROR_MESSAGES[errorCode]) {
      switch (errorCode) {
        case 'DNS_ERROR':
          return '🌐 DNS Error - Cannot find server. Check your internet connection or contact IT support.';
        case 'SSL_ERROR':
          return '🔒 Security Error - SSL certificate issue. Contact your administrator.';
        default:
          errorCode = 'NETWORK_ERROR';
      }
    }
    
    return formatOptimizedErrorMessage({ code: errorCode }, context);
    
  } catch (formatError) {
    console.error(`Network error formatting failed: ${formatError.message}`);
    return '🌐 Connection Error - Please check your internet connection and try again';
  }
}

/**
 * Enhanced validation error formatting with specific guidance
 * @param {string} validationError - Original validation error
 * @param {Object} context - Validation context
 * @return {string} Optimized validation error message
 */
function formatOptimizedValidationError(validationError, context = {}) {
  try {
    // Extract error type from validation message
    let errorCode = 'INVALID_TEXT';
    
    if (validationError.includes('prompt') || validationError.includes('Prompt')) {
      errorCode = 'INVALID_PROMPT';
    } else if (validationError.includes('empty') || validationError.includes('Empty')) {
      errorCode = 'EMPTY_CONTENT';
    }
    
    return formatOptimizedErrorMessage({ code: errorCode }, context);
    
  } catch (formatError) {
    console.error(`Validation error formatting failed: ${formatError.message}`);
    return validationError; // Return original if formatting fails
  }
}

/**
 * Creates a progress indicator for long-running operations
 * @param {string} operation - Operation description
 * @param {number} elapsed - Elapsed time in milliseconds
 * @return {string} Progress indicator message
 */
function createProgressIndicator(operation, elapsed) {
  try {
    const seconds = Math.floor(elapsed / 1000);
    const dots = '.'.repeat((Math.floor(elapsed / 500) % 4) + 1);
    
    if (seconds < 3) {
      return `🔄 ${operation}${dots}`;
    } else if (seconds < 10) {
      return `⏳ ${operation} (${seconds}s)${dots}`;
    } else {
      return `⏳ ${operation} - This is taking longer than usual${dots}`;
    }
    
  } catch (error) {
    return `🔄 ${operation}...`;
  }
}

/**
 * Logs error statistics for monitoring and optimization
 * @param {string} errorCode - Error code
 * @param {Object} context - Error context
 */
function logErrorStatistics(errorCode, context = {}) {
  try {
    const cache = CacheService.getScriptCache();
    const statsKey = 'error:stats';
    
    let stats = cache.get(statsKey);
    if (stats) {
      stats = JSON.parse(stats);
    } else {
      stats = {
        totalErrors: 0,
        errorCounts: {},
        lastReset: Date.now()
      };
    }
    
    // Update statistics
    stats.totalErrors++;
    stats.errorCounts[errorCode] = (stats.errorCounts[errorCode] || 0) + 1;
    
    // Store updated statistics
    cache.put(statsKey, JSON.stringify(stats), 3600); // 1 hour
    
  } catch (error) {
    console.error(`Failed to log error statistics: ${error.message}`);
  }
}

/**
 * Gets error statistics for monitoring
 * @return {Object} Error statistics
 */
function getErrorStatistics() {
  try {
    const cache = CacheService.getScriptCache();
    const statsKey = 'error:stats';
    const stats = cache.get(statsKey);
    
    if (!stats) {
      return {
        totalErrors: 0,
        errorCounts: {},
        status: 'No error data available'
      };
    }
    
    const parsedStats = JSON.parse(stats);
    
    // Calculate error rates and most common errors
    const sortedErrors = Object.entries(parsedStats.errorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    return {
      ...parsedStats,
      mostCommonErrors: sortedErrors,
      status: 'Active'
    };
    
  } catch (error) {
    return {
      status: 'Error',
      error: error.message
    };
  }
}