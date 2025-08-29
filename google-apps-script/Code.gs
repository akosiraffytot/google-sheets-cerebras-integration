/**
 * REWRITE custom function for Google Sheets
 * Processes text data through AI for rewriting
 * 
 * @param {string} prompt - AI instruction/prompt for text rewriting
 * @param {any} mainText - Primary text to be rewritten (cell reference or direct text)
 * @param {any} contextCells - Additional context for AI (cell reference/range, optional)
 * @return {string} The rewritten text or error message
 * @customfunction
 */
function REWRITE(prompt, mainText, contextCells) {
  try {
    const validationResult = validateParameters(prompt, mainText, contextCells);
    if (!validationResult.isValid) {
      return validationResult.error;
    }
    
    const processedMainText = extractCellValue(mainText);
    const processedContextText = contextCells ? extractCellValue(contextCells) : '';
    
    if (!processedMainText || processedMainText.trim() === '') {
      if (typeof mainText === 'string') {
        return '❌ Empty Text: The text you provided is empty. Enter some content to rewrite.';
      } else if (Array.isArray(mainText) || (mainText && typeof mainText === 'object')) {
        return '❌ Empty Cells: The cells you referenced are empty. Check your cell range (e.g., A1:A3).';
      } else {
        return '❌ No Content: The cell you referenced (e.g., A1) is empty. Add content to that cell first.';
      }
    }
    
    if (processedMainText.length < 3) {
      return '❌ Text Too Short: Main text should be at least a few characters long for meaningful rewriting.';
    }
    
    if (processedMainText.length > 5000) {
      return '⚠️ Text Very Long: Text over 5000 characters may take longer to process or hit API limits.';
    }
    
    const cacheKey = generateCacheKey(prompt, processedMainText, processedContextText);
    const cachedResult = getCachedResult(cacheKey);
    
    if (cachedResult) {
      return cachedResult;
    }
    
    const result = makeApiRequest(prompt, processedMainText, processedContextText);
    
    if (result && !isErrorResult(result)) {
      setCachedResult(cacheKey, result);
    }
    
    return result;
    
  } catch (error) {
    console.error(`Unexpected error in REWRITE function: ${error.message}`);
    return formatUnexpectedError(error);
  }
}

/**
 * Validates the input parameters for the REWRITE function
 * @param {any} prompt - The prompt parameter to validate
 * @param {any} mainText - The main text parameter to validate
 * @param {any} contextCells - The context parameter to validate (optional)
 * @return {Object} Validation result with isValid flag and error message
 */
function validateParameters(prompt, mainText, contextCells) {
  const promptValidation = validatePromptParameter(prompt);
  if (!promptValidation.isValid) {
    return promptValidation;
  }
  
  const mainTextValidation = validateMainTextParameter(mainText);
  if (!mainTextValidation.isValid) {
    return mainTextValidation;
  }
  
  if (contextCells !== undefined && contextCells !== null) {
    const contextValidation = validateContextParameter(contextCells);
    if (!contextValidation.isValid) {
      return contextValidation;
    }
  }
  
  return { isValid: true };
}

/**
 * Validates the prompt parameter
 * @param {any} prompt - The prompt parameter to validate
 * @return {Object} Validation result
 */
function validatePromptParameter(prompt) {
  if (prompt === undefined || prompt === null) {
    return {
      isValid: false,
      error: '❌ Missing Prompt: First parameter is required. Example: "Rewrite this text to be more professional"'
    };
  }
  
  if (typeof prompt !== 'string') {
    return {
      isValid: false,
      error: '❌ Invalid Prompt Type: First parameter must be text in quotes. Example: "Make this more concise"'
    };
  }
  
  if (prompt.trim() === '') {
    return {
      isValid: false,
      error: '❌ Empty Prompt: Provide clear instructions for the AI. Example: "Summarize this text"'
    };
  }
  
  if (prompt.trim().length < 3) {
    return {
      isValid: false,
      error: '❌ Prompt Too Short: Provide clearer instructions. Example: "Rewrite in simple language"'
    };
  }
  
  if (prompt.length > 2000) {
    return {
      isValid: false,
      error: '❌ Prompt Too Long: Keep instructions under 2000 characters for better performance'
    };
  }
  
  return { isValid: true };
}

/**
 * Validates the main text parameter
 * @param {any} mainText - The main text parameter to validate
 * @return {Object} Validation result
 */
function validateMainTextParameter(mainText) {
  if (mainText === undefined || mainText === null) {
    return {
      isValid: false,
      error: '❌ Missing Main Text: Second parameter is required. Use a cell reference like A1 or direct text'
    };
  }
  
  if (typeof mainText === 'string' && mainText.trim() === '') {
    return {
      isValid: false,
      error: '❌ Empty Main Text: Second parameter cannot be empty. Reference a cell with content or provide text'
    };
  }
  
  if (typeof mainText === 'number') {
    return { isValid: true };
  }
  
  if (Array.isArray(mainText)) {
    const hasContent = validateCellRangeContent(mainText);
    if (!hasContent) {
      return {
        isValid: false,
        error: '❌ Empty Cell Range: The referenced cells contain no text. Check your cell references'
      };
    }
    return { isValid: true };
  }
  
  return { isValid: true };
}

/**
 * Validates the context parameter
 * @param {any} contextCells - The context parameter to validate
 * @return {Object} Validation result
 */
function validateContextParameter(contextCells) {
  if (contextCells === null || contextCells === undefined) {
    return { isValid: true };
  }
  
  return { isValid: true };
}

/**
 * Validates that a cell range contains meaningful content
 * @param {Array} cellRange - Array representing cell range
 * @return {boolean} True if range contains meaningful content
 */
function validateCellRangeContent(cellRange) {
  try {
    if (Array.isArray(cellRange[0])) {
      for (let row = 0; row < cellRange.length; row++) {
        for (let col = 0; col < cellRange[row].length; col++) {
          const cellValue = cellRange[row][col];
          if (cellValue !== null && cellValue !== undefined && cellValue !== '' && String(cellValue).trim() !== '') {
            return true;
          }
        }
      }
    } else {
      for (let i = 0; i < cellRange.length; i++) {
        const cellValue = cellRange[i];
        if (cellValue !== null && cellValue !== undefined && cellValue !== '' && String(cellValue).trim() !== '') {
          return true;
        }
      }
    }
    
    return false;
    
  } catch (error) {
    return true;
  }
}

/**
 * Extracts and processes cell values, handling both single cells and ranges
 * @param {any} cellValue - Cell reference, range, or direct value
 * @return {string} Processed text value
 */
function extractCellValue(cellValue) {
  try {
    if (typeof cellValue === 'string') {
      return cellValue.trim();
    }
    
    if (typeof cellValue === 'number') {
      return cellValue.toString();
    }
    
    if (typeof cellValue === 'boolean') {
      return cellValue.toString();
    }
    
    if (Array.isArray(cellValue)) {
      return processCellRange(cellValue);
    }
    
    if (cellValue && typeof cellValue === 'object' && cellValue.length !== undefined) {
      return processCellRange(cellValue);
    }
    
    if (cellValue === null || cellValue === undefined) {
      return '';
    }
    
    const stringValue = String(cellValue);
    return stringValue === 'undefined' || stringValue === 'null' ? '' : stringValue.trim();
    
  } catch (error) {
    throw new Error(`Failed to extract cell value: ${error.message}`);
  }
}

/**
 * Processes cell ranges and concatenates values intelligently
 * @param {Array} cellRange - Array of cell values (can be 1D or 2D)
 * @return {string} Concatenated text from all cells
 */
function processCellRange(cellRange) {
  try {
    const values = [];
    
    if (Array.isArray(cellRange[0])) {
      for (let row = 0; row < cellRange.length; row++) {
        for (let col = 0; col < cellRange[row].length; col++) {
          const cellValue = cellRange[row][col];
          if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
            const stringValue = String(cellValue).trim();
            if (stringValue.length > 0) {
              values.push(stringValue);
            }
          }
        }
      }
    } else {
      for (let i = 0; i < cellRange.length; i++) {
        const cellValue = cellRange[i];
        if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
          const stringValue = String(cellValue).trim();
          if (stringValue.length > 0) {
            values.push(stringValue);
          }
        }
      }
    }
    
    if (values.length === 0) {
      return '';
    }
    
    if (values.length === 1) {
      return values[0];
    }
    
    const hasSentences = values.some(value => value.includes('.') && value.length > 20);
    const hasShortItems = values.every(value => value.length < 50 && !value.includes('.'));
    
    if (hasSentences) {
      return values.join(' ');
    } else if (hasShortItems) {
      return values.join(', ');
    } else {
      return values.join(' ');
    }
    
  } catch (error) {
    throw new Error(`Failed to process cell range: ${error.message}`);
  }
}

/**
 * Makes HTTP request to the backend API with retry logic
 * @param {string} prompt - AI instruction/prompt for text rewriting
 * @param {string} mainText - Primary text to be rewritten
 * @param {string} contextText - Additional context for AI (optional)
 * @return {string} The rewritten text or error message
 */
function makeApiRequest(prompt, mainText, contextText) {
  const maxRetries = 3;
  const baseDelay = 1000;
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = callBackendApi(prompt, mainText, contextText);
      
      if (response.success) {
        return response.data.rewrittenText;
      } else {
        // Handle specific error types
        if (isRetryableError(response.error.code) && attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          Utilities.sleep(delay);
          continue;
        } else {
          return formatErrorMessage(response.error);
        }
      }
      
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        Utilities.sleep(delay);
        continue;
      }
    }
  }
  
  return formatNetworkError(lastError);
}

/**
 * Makes the actual HTTP request to the backend API
 * @param {string} prompt - AI instruction/prompt for text rewriting
 * @param {string} mainText - Primary text to be rewritten
 * @param {string} contextText - Additional context for AI (optional)
 * @return {Object} Parsed API response
 */
function callBackendApi(prompt, mainText, contextText) {
  try {
    const payload = {
      prompt: prompt,
      mainText: mainText,
      requestId: Utilities.getUuid()
    };
    
    if (contextText && contextText.trim() !== '') {
      payload.contextText = contextText;
    }
    
    const apiUrl = getApiEndpoint();
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(apiUrl, options);
    
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    if (responseCode !== 200) {
      return {
        success: false,
        error: {
          code: `HTTP_${responseCode}`,
          message: `API request failed with status ${responseCode}`
        }
      };
    }
    
    return JSON.parse(responseText);
    
  } catch (error) {
    throw new Error(`API request failed: ${error.message}`);
  }
}

/**
 * Gets the API endpoint URL from script properties
 * @return {string} API endpoint URL
 */
function getApiEndpoint() {
  const properties = PropertiesService.getScriptProperties();
  let apiUrl = properties.getProperty('API_ENDPOINT');
  
  if (!apiUrl) {
    apiUrl = 'https://your-deployment-url.netlify.app/api/rewrite';
    console.warn('API_ENDPOINT not configured in script properties. Please run configureApiEndpoint() first.');
  }
  
  return apiUrl;
}

/**
 * Sets the API endpoint URL in script properties
 * @param {string} apiUrl - Your deployed API endpoint URL
 */
function setApiEndpoint(apiUrl) {
  const properties = PropertiesService.getScriptProperties();
  properties.setProperty('API_ENDPOINT', apiUrl);
  console.log(`API endpoint set to: ${apiUrl}`);
}

/**
 * Generates a cache key from function parameters
 * @param {string} prompt - AI instruction/prompt for text rewriting
 * @param {string} mainText - Primary text to be rewritten
 * @param {string} contextText - Additional context for AI (optional)
 * @return {string} Cache key
 */
function generateCacheKey(prompt, mainText, contextText) {
  const keyData = `${prompt}|${mainText}|${contextText || ''}`;
  return `rewrite_${Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, keyData)
    .map(byte => (byte + 256).toString(16).slice(-2))
    .join('')
    .substring(0, 16)}`;
}

/**
 * Gets a cached result if available
 * @param {string} cacheKey - The cache key to look up
 * @return {string|null} Cached result or null if not found
 */
function getCachedResult(cacheKey) {
  try {
    const cache = CacheService.getScriptCache();
    return cache.get(cacheKey);
  } catch (error) {
    console.warn(`Cache retrieval failed: ${error.message}`);
    return null;
  }
}

/**
 * Stores a result in the cache
 * @param {string} cacheKey - The cache key
 * @param {string} result - The result to cache
 */
function setCachedResult(cacheKey, result) {
  try {
    const cache = CacheService.getScriptCache();
    cache.put(cacheKey, result, 3600); // Cache for 1 hour
  } catch (error) {
    console.warn(`Cache storage failed: ${error.message}`);
  }
}

/**
 * Checks if an error code is retryable
 * @param {string} errorCode - The error code to check
 * @return {boolean} True if the error is retryable
 */
function isRetryableError(errorCode) {
  const retryableErrors = ['RATE_LIMITED', 'TIMEOUT', 'API_UNAVAILABLE', 'INTERNAL_ERROR'];
  return retryableErrors.includes(errorCode);
}

/**
 * Formats error messages for display in cells
 * @param {Object} error - Error object with code and message
 * @return {string} Formatted error message
 */
function formatErrorMessage(error) {
  switch (error.code) {
    case 'INVALID_PROMPT':
      return '❌ Error: Prompt parameter is required and must be text';
    case 'INVALID_TEXT':
      return '❌ Error: Main text parameter is required and cannot be empty';
    case 'API_UNAVAILABLE':
      return '⚠️ Service Unavailable: AI service is temporarily down - please try again in a few minutes';
    case 'RATE_LIMITED':
      return '⏳ Rate Limited: Too many requests sent - please wait 1-2 minutes before trying again';
    case 'TIMEOUT':
      return '⏱️ Timeout: Request took too long - check your internet connection and try again';
    case 'INTERNAL_ERROR':
      return '🔧 Server Error: Internal server error occurred - please try again in a few minutes';
    case 'HTTP_401':
      return '🔐 Authentication Failed: API key is invalid or missing - contact administrator';
    case 'HTTP_429':
      return '⏳ Rate Limited: Too many requests - please wait 2-3 minutes and try again';
    case 'HTTP_500':
      return '🔧 Server Error: Internal server error - please try again in a few minutes';
    default:
      return `❌ Error: ${error.message || 'Unknown error occurred - please try again'}`;
  }
}

/**
 * Formats network error messages for display in cells
 * @param {Error} error - Network error object
 * @return {string} Formatted network error message
 */
function formatNetworkError(error) {
  if (!error) {
    return '❌ Connection Failed: Request failed after 3 attempts - check your internet connection';
  }
  
  const errorMessage = error.message.toLowerCase();
  
  if (errorMessage.includes('timeout')) {
    return '⏱️ Connection Timeout: Request timed out after retries - check your internet connection';
  } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
    return '🌐 Network Error: Cannot connect to server - check your internet connection';
  } else {
    return `❌ Network Error: ${error.message || 'Failed to connect to server'} - please try again`;
  }
}

/**
 * Formats unexpected errors that occur during function execution
 * @param {Error} error - The unexpected error object
 * @return {string} Formatted error message for display in cell
 */
function formatUnexpectedError(error) {
  console.error(`Unexpected error in REWRITE function: ${error.message}`);
  
  const errorMessage = error.message.toLowerCase();
  
  if (errorMessage.includes('script timeout')) {
    return '⏱️ Script Timeout: Function took too long to execute - try with shorter text';
  } else if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
    return '📊 Quota Exceeded: Daily usage limit reached - please try again tomorrow';
  } else {
    return `🔧 Unexpected Error: ${error.message || 'Unknown error occurred'} - please try again`;
  }
}

/**
 * Checks if a result string represents an error message
 * @param {string} result - The result string to check
 * @return {boolean} True if the result is an error message
 */
function isErrorResult(result) {
  if (!result || typeof result !== 'string') {
    return true;
  }
  
  const errorIndicators = ['❌', '⚠️', '🔧', '⏳', '⏱️', '🌐', '🔐', '🚫', '📊'];
  return errorIndicators.some(indicator => result.includes(indicator));
}

/**
 * Gets the current processing status for debugging and monitoring
 * @return {Object} Status information object
 */
function getProcessingStatus() {
  try {
    const properties = PropertiesService.getScriptProperties();
    const apiUrl = properties.getProperty('API_ENDPOINT');
    
    const status = {
      timestamp: new Date().toISOString(),
      apiEndpointConfigured: !!apiUrl,
      apiEndpoint: apiUrl || 'Not configured',
      cacheAvailable: true,
      propertiesAvailable: true
    };
    
    try {
      const testCache = CacheService.getScriptCache();
      testCache.put('status_test', 'test', 1);
      const testResult = testCache.get('status_test');
      status.cacheWorking = testResult === 'test';
    } catch (cacheError) {
      status.cacheAvailable = false;
      status.cacheError = cacheError.message;
    }
    
    return status;
    
  } catch (error) {
    return {
      timestamp: new Date().toISOString(),
      error: `Failed to get status: ${error.message}`,
      propertiesAvailable: false
    };
  }
}

/**
 * Displays current system status in a user-friendly format
 * @return {string} Formatted status message
 * @customfunction
 */
function getSystemStatus() {
  try {
    const status = getProcessingStatus();
    
    if (status.error) {
      return `🔧 System Error: ${status.error}`;
    }
    
    const statusParts = [];
    
    statusParts.push(status.apiEndpointConfigured ? '✅ API Configured' : '❌ API Not Configured');
    statusParts.push((status.cacheAvailable && status.cacheWorking) ? '✅ Cache Working' : '⚠️ Cache Issues');
    statusParts.push(status.propertiesAvailable ? '✅ Properties OK' : '❌ Properties Error');
    
    return `🔍 System Status: ${statusParts.join(' | ')} | Last Check: ${new Date().toLocaleTimeString()}`;
    
  } catch (error) {
    return `🔧 Status Check Failed: ${error.message}`;
  }
}

/**
 * Configuration function - Run this once to set up your API endpoint
 * Replace the URL with your actual deployment URL
 */
function configureApiEndpoint() {
  // Replace this URL with your actual deployment URL (Vercel or Netlify)
  const apiUrl = 'https://your-deployment-url.vercel.app/api/rewrite';
  setApiEndpoint(apiUrl);
  
  console.log('API endpoint configured successfully');
  return 'API endpoint configured! Update the URL in this function with your actual deployment URL.';
}

/**
 * Test function to verify your setup is working
 * Run this after configuring your API endpoint
 */
function testConfiguration() {
  try {
    const status = getSystemStatus();
    console.log('System Status:', status);
    
    // Test with a simple example
    const testResult = REWRITE('Make this more professional', 'hello world');
    console.log('Test REWRITE result:', testResult);
    
    return {
      systemStatus: status,
      testResult: testResult,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Test failed:', error);
    return {
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}