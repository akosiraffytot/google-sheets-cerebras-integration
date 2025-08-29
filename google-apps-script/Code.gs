/**
 * REWRITE custom function for Google Sheets
 * Processes text data through Cerebras AI for rewriting
 * 
 * @param {string} prompt - AI instruction/prompt for text rewriting
 * @param {any} mainText - Primary text to be rewritten (cell reference or direct text)
 * @param {any} contextCells - Additional context for AI (cell reference/range, optional)
 * @return {string} The rewritten text or error message
 * @customfunction
 */
function REWRITE(prompt, mainText, contextCells) {
  try {
    // Log function start for debugging
    console.log('REWRITE function called');
    
    // Validate required parameters with enhanced error messages
    const validationResult = validateParameters(prompt, mainText, contextCells);
    if (!validationResult.isValid) {
      console.log(`Parameter validation failed: ${validationResult.error}`);
      return validationResult.error;
    }
    
    // Extract and process cell values
    const processedMainText = extractCellValue(mainText);
    const processedContextText = contextCells ? extractCellValue(contextCells) : '';
    
    // Validate extracted text with clear error message and guidance
    if (!processedMainText || processedMainText.trim() === '') {
      console.log('Main text validation failed: empty or no valid content');
      
      // Provide specific guidance based on the type of main text parameter
      if (typeof mainText === 'string') {
        return '❌ Empty Text: The text you provided is empty. Enter some content to rewrite.';
      } else if (Array.isArray(mainText) || (mainText && typeof mainText === 'object')) {
        return '❌ Empty Cells: The cells you referenced are empty. Check your cell range (e.g., A1:A3).';
      } else {
        return '❌ No Content: The cell you referenced (e.g., A1) is empty. Add content to that cell first.';
      }
    }
    
    // Check if text is too short to be meaningful
    if (processedMainText.length < 3) {
      return '❌ Text Too Short: Main text should be at least a few characters long for meaningful rewriting.';
    }
    
    // Check if text is extremely long (practical limit)
    if (processedMainText.length > 5000) {
      return '⚠️ Text Very Long: Text over 5000 characters may take longer to process or hit API limits.';
    }
    
    // Log processing details for debugging
    console.log(`Processing text of length: ${processedMainText.length} characters`);
    if (processedContextText) {
      console.log(`Context text length: ${processedContextText.length} characters`);
    }
    
    // Check optimized cache first for faster response
    const cacheKey = generateOptimizedCacheKey(prompt, processedMainText, processedContextText);
    const cachedResult = getOptimizedCachedResult(cacheKey);
    
    if (cachedResult) {
      console.log('Returning cached result');
      return `${cachedResult}`;
    }
    
    // Log that we're starting API processing
    console.log('Starting API request processing...');
    
    // Make HTTP request to backend API with status handling
    const result = makeApiRequest(prompt, processedMainText, processedContextText);
    
    // Cache successful results with optimized duration
    if (result && !isErrorResult(result)) {
      console.log('Caching successful result with optimized settings');
      const optimalDuration = selectOptimalCacheDuration(prompt, processedMainText);
      setOptimizedCachedResult(cacheKey, result, optimalDuration);
    }
    
    console.log('REWRITE function completed');
    return result;
    
  } catch (error) {
    console.error(`Unexpected error in REWRITE function: ${error.message}`);
    return formatUnexpectedError(error);
  }
}

/**
 * Validates the input parameters for the REWRITE function with detailed error messages
 * @param {any} prompt - The prompt parameter to validate
 * @param {any} mainText - The main text parameter to validate
 * @param {any} contextCells - The context parameter to validate (optional)
 * @return {Object} Validation result with isValid flag and error message
 */
function validateParameters(prompt, mainText, contextCells) {
  // Validate prompt parameter
  const promptValidation = validatePromptParameter(prompt);
  if (!promptValidation.isValid) {
    return promptValidation;
  }
  
  // Validate main text parameter
  const mainTextValidation = validateMainTextParameter(mainText);
  if (!mainTextValidation.isValid) {
    return mainTextValidation;
  }
  
  // Validate context parameter (optional)
  if (contextCells !== undefined && contextCells !== null) {
    const contextValidation = validateContextParameter(contextCells);
    if (!contextValidation.isValid) {
      return contextValidation;
    }
  }
  
  return { isValid: true };
}

/**
 * Validates the prompt parameter with specific guidance
 * @param {any} prompt - The prompt parameter to validate
 * @return {Object} Validation result
 */
function validatePromptParameter(prompt) {
  // Check if prompt is provided
  if (prompt === undefined || prompt === null) {
    return {
      isValid: false,
      error: '❌ Missing Prompt: First parameter is required. Example: "Rewrite this text to be more professional"'
    };
  }
  
  // Check if prompt is a string
  if (typeof prompt !== 'string') {
    return {
      isValid: false,
      error: '❌ Invalid Prompt Type: First parameter must be text in quotes. Example: "Make this more concise"'
    };
  }
  
  // Check if prompt is not empty
  if (prompt.trim() === '') {
    return {
      isValid: false,
      error: '❌ Empty Prompt: Provide clear instructions for the AI. Example: "Summarize this text"'
    };
  }
  
  // Check if prompt is too short to be meaningful
  if (prompt.trim().length < 3) {
    return {
      isValid: false,
      error: '❌ Prompt Too Short: Provide clearer instructions. Example: "Rewrite in simple language"'
    };
  }
  
  // Check if prompt is too long (practical limit)
  if (prompt.length > 500) {
    return {
      isValid: false,
      error: '❌ Prompt Too Long: Keep instructions under 500 characters for better performance'
    };
  }
  
  // Check for common prompt mistakes
  if (prompt.toLowerCase().includes('rewrite') && prompt.toLowerCase().includes('function')) {
    return {
      isValid: false,
      error: '❌ Prompt Confusion: Don\'t include "REWRITE function" in prompt. Just provide instructions like "Make this formal"'
    };
  }
  
  return { isValid: true };
}

/**
 * Validates the main text parameter with support for different cell reference formats
 * @param {any} mainText - The main text parameter to validate
 * @return {Object} Validation result
 */
function validateMainTextParameter(mainText) {
  // Check if mainText is provided
  if (mainText === undefined || mainText === null) {
    return {
      isValid: false,
      error: '❌ Missing Main Text: Second parameter is required. Use a cell reference like A1 or direct text'
    };
  }
  
  // If it's a string, check if it's empty
  if (typeof mainText === 'string' && mainText.trim() === '') {
    return {
      isValid: false,
      error: '❌ Empty Main Text: Second parameter cannot be empty. Reference a cell with content or provide text'
    };
  }
  
  // If it's a number, that's acceptable (will be converted to string)
  if (typeof mainText === 'number') {
    return { isValid: true };
  }
  
  // If it's an array (cell range), validate it has content
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
  
  // If it's a 2D array (range of cells), validate content
  if (mainText && typeof mainText === 'object' && mainText.length !== undefined) {
    const hasContent = validateCellRangeContent(mainText);
    if (!hasContent) {
      return {
        isValid: false,
        error: '❌ Empty Cell Range: The referenced cells (like A1:B3) contain no text. Check your range'
      };
    }
    return { isValid: true };
  }
  
  // For other types, try to validate if they can be converted to meaningful text
  const stringValue = String(mainText);
  if (stringValue === 'undefined' || stringValue === 'null' || stringValue.trim() === '') {
    return {
      isValid: false,
      error: '❌ Invalid Main Text: Second parameter must be a cell reference (A1) or text content'
    };
  }
  
  return { isValid: true };
}

/**
 * Validates the context parameter with support for different formats
 * @param {any} contextCells - The context parameter to validate
 * @return {Object} Validation result
 */
function validateContextParameter(contextCells) {
  // Context is optional, so null/undefined is valid
  if (contextCells === null || contextCells === undefined) {
    return { isValid: true };
  }
  
  // If it's a string, check if it's meaningful
  if (typeof contextCells === 'string') {
    if (contextCells.trim() === '') {
      return {
        isValid: false,
        error: '⚠️ Empty Context: Third parameter is empty. Either provide context or omit this parameter'
      };
    }
    return { isValid: true };
  }
  
  // If it's a number, that's acceptable
  if (typeof contextCells === 'number') {
    return { isValid: true };
  }
  
  // If it's an array or 2D array (cell ranges), validate content
  if (Array.isArray(contextCells) || (contextCells && typeof contextCells === 'object' && contextCells.length !== undefined)) {
    // Context can be empty, so we don't require content like main text
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
    // Handle 2D arrays (ranges like A1:B3)
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
      // Handle 1D arrays (single row or column)
      for (let i = 0; i < cellRange.length; i++) {
        const cellValue = cellRange[i];
        if (cellValue !== null && cellValue !== undefined && cellValue !== '' && String(cellValue).trim() !== '') {
          return true;
        }
      }
    }
    
    return false;
    
  } catch (error) {
    // If we can't validate the content, assume it's valid to avoid blocking
    return true;
  }
}

/**
 * Extracts and processes cell values, handling both single cells and ranges with enhanced error reporting
 * @param {any} cellValue - Cell reference, range, or direct value
 * @return {string} Processed text value
 */
function extractCellValue(cellValue) {
  try {
    // If it's already a string, return it (trimmed)
    if (typeof cellValue === 'string') {
      return cellValue.trim();
    }
    
    // If it's a number, convert to string
    if (typeof cellValue === 'number') {
      return cellValue.toString();
    }
    
    // If it's a boolean, convert to string
    if (typeof cellValue === 'boolean') {
      return cellValue.toString();
    }
    
    // If it's an array (range of cells), process it
    if (Array.isArray(cellValue)) {
      return processCellRange(cellValue);
    }
    
    // If it's a 2D array (range of cells), flatten and process
    if (cellValue && typeof cellValue === 'object' && cellValue.length !== undefined) {
      return processCellRange(cellValue);
    }
    
    // Handle null or undefined
    if (cellValue === null || cellValue === undefined) {
      return '';
    }
    
    // For other types, try to convert to string
    const stringValue = String(cellValue);
    return stringValue === 'undefined' || stringValue === 'null' ? '' : stringValue.trim();
    
  } catch (error) {
    throw new Error(`Failed to extract cell value: ${error.message}. Check your cell references and ensure they contain valid data.`);
  }
}

/**
 * Processes cell ranges and concatenates values intelligently with enhanced format support
 * @param {Array} cellRange - Array of cell values (can be 1D or 2D)
 * @return {string} Concatenated text from all cells
 */
function processCellRange(cellRange) {
  try {
    const values = [];
    let cellCount = 0;
    let nonEmptyCount = 0;
    
    // Handle 2D arrays (ranges like A1:B3)
    if (Array.isArray(cellRange[0])) {
      for (let row = 0; row < cellRange.length; row++) {
        for (let col = 0; col < cellRange[row].length; col++) {
          cellCount++;
          const cellValue = cellRange[row][col];
          if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
            const stringValue = String(cellValue).trim();
            if (stringValue.length > 0) {
              values.push(stringValue);
              nonEmptyCount++;
            }
          }
        }
      }
    } else {
      // Handle 1D arrays (single row or column)
      for (let i = 0; i < cellRange.length; i++) {
        cellCount++;
        const cellValue = cellRange[i];
        if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
          const stringValue = String(cellValue).trim();
          if (stringValue.length > 0) {
            values.push(stringValue);
            nonEmptyCount++;
          }
        }
      }
    }
    
    // Log processing info for debugging
    console.log(`Processed cell range: ${cellCount} cells total, ${nonEmptyCount} with content`);
    
    // Join values intelligently based on content type
    if (values.length === 0) {
      return '';
    }
    
    // If we have multiple values, join them with appropriate separators
    if (values.length === 1) {
      return values[0];
    }
    
    // For multiple values, use intelligent joining
    // If values look like sentences (contain periods), join with spaces
    // If values look like list items, join with commas and spaces
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
    throw new Error(`Failed to process cell range: ${error.message}. Ensure your cell range contains valid data.`);
  }
}

/**
 * Helper function to generate a unique request ID for deduplication
 * @return {string} Unique request identifier
 */
function generateRequestId() {
  return Utilities.getUuid();
}
/**
 * Makes HTTP request to the backend API with optimized retry logic and status indicators
 * @param {string} prompt - AI instruction/prompt for text rewriting
 * @param {string} mainText - Primary text to be rewritten
 * @param {string} contextText - Additional context for AI (optional)
 * @return {string} The rewritten text or error message
 */
function makeApiRequest(prompt, mainText, contextText) {
  const maxRetries = 3;
  const baseDelay = 800; // Optimized base delay (reduced from 1000ms)
  const maxDelay = 20000; // Optimized max delay (reduced from 30s)
  let lastError = null;
  const startTime = Date.now();
  
  // Log processing start for debugging
  console.log('Starting optimized API request processing...');
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Log retry attempts for debugging
      if (attempt > 1) {
        console.log(`Retrying API request (attempt ${attempt}/${maxRetries})...`);
      }
      
      const response = callBackendApi(prompt, mainText, contextText);
      
      if (response.success) {
        // Success state - return the rewritten text
        const duration = Date.now() - startTime;
        console.log(`API request completed successfully in ${duration}ms`);
        return response.data.rewrittenText;
      } else {
        // Handle specific error types with optimized retry logic
        const retryInfo = getRetryInformation(response.error.code);
        
        if (retryInfo.retryable && attempt < maxRetries) {
          // Calculate optimized delay with jitter
          const exponentialDelay = Math.min(baseDelay * Math.pow(1.8, attempt - 1), maxDelay);
          const jitter = exponentialDelay * 0.15 * (Math.random() - 0.5);
          const retryDelay = Math.max(0, Math.round(exponentialDelay + jitter));
          
          console.log(`${response.error.code} error, retrying in ${retryDelay}ms...`);
          Utilities.sleep(retryDelay);
          continue;
        } else {
          console.log(`API request failed with error: ${response.error.code}`);
          logErrorStatistics(response.error.code, {
            attempt: attempt,
            duration: Date.now() - startTime,
            textLength: mainText.length
          });
          return formatOptimizedErrorMessage(response.error, {
            textLength: mainText.length,
            requestCount: attempt
          });
        }
      }
      
    } catch (error) {
      lastError = error;
      console.log(`Network error on attempt ${attempt}: ${error.message}`);
      
      // For network errors, retry with optimized backoff
      if (attempt < maxRetries) {
        const exponentialDelay = Math.min(baseDelay * Math.pow(1.8, attempt - 1), maxDelay);
        const jitter = exponentialDelay * 0.15 * (Math.random() - 0.5);
        const retryDelay = Math.max(0, Math.round(exponentialDelay + jitter));
        
        console.log(`Network error, retrying in ${retryDelay}ms...`);
        Utilities.sleep(retryDelay);
        continue;
      }
    }
  }
  
  // If all retries failed, return optimized error message
  console.log('All retry attempts failed');
  logErrorStatistics('NETWORK_ERROR', {
    attempts: maxRetries,
    duration: Date.now() - startTime,
    textLength: mainText.length
  });
  return formatOptimizedNetworkError(lastError, {
    textLength: mainText.length,
    attempts: maxRetries
  });
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
    // Construct request payload
    const payload = constructRequestPayload(prompt, mainText, contextText);
    
    // Get API endpoint URL from script properties
    const apiUrl = getApiEndpoint();
    
    // Configure HTTP request options
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true // Handle HTTP errors manually
    };
    
    // Make the HTTP request
    const response = UrlFetchApp.fetch(apiUrl, options);
    
    // Parse response
    return parseApiResponse(response);
    
  } catch (error) {
    throw new Error(`API request failed: ${error.message}`);
  }
}

/**
 * Constructs the request payload for the backend API
 * @param {string} prompt - AI instruction/prompt for text rewriting
 * @param {string} mainText - Primary text to be rewritten
 * @param {string} contextText - Additional context for AI (optional)
 * @return {Object} Request payload object
 */
function constructRequestPayload(prompt, mainText, contextText) {
  const payload = {
    prompt: prompt,
    mainText: mainText,
    requestId: generateRequestId()
  };
  
  // Add context text if provided
  if (contextText && contextText.trim() !== '') {
    payload.contextText = contextText;
  }
  
  return payload;
}

/**
 * Parses the API response and handles different response types
 * @param {HTTPResponse} response - The HTTP response object
 * @return {Object} Parsed response object
 */
function parseApiResponse(response) {
  try {
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    // Handle non-200 status codes
    if (responseCode !== 200) {
      return {
        success: false,
        error: {
          code: `HTTP_${responseCode}`,
          message: `API request failed with status ${responseCode}`
        }
      };
    }
    
    // Parse JSON response
    const parsedResponse = JSON.parse(responseText);
    
    // Validate response structure
    if (typeof parsedResponse !== 'object') {
      throw new Error('Invalid response format');
    }
    
    return parsedResponse;
    
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'PARSE_ERROR',
        message: `Failed to parse API response: ${error.message}`
      }
    };
  }
}

/**
 * Gets the API endpoint URL from script properties
 * @return {string} API endpoint URL
 */
function getApiEndpoint() {
  // Try to get from script properties first
  const properties = PropertiesService.getScriptProperties();
  let apiUrl = properties.getProperty('API_ENDPOINT');
  
  // If not set in properties, use default (this should be configured by user)
  if (!apiUrl) {
    // This is a placeholder - users need to set their actual API endpoint
    apiUrl = 'https://your-api-endpoint.vercel.app/api/rewrite';
    
    // Log a warning that the endpoint needs to be configured
    console.warn('API_ENDPOINT not configured in script properties. Using placeholder URL.');
  }
  
  return apiUrl;
}

/**
 * Formats error messages for display in cells with clear, user-friendly messages
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
    case 'HTTP_400':
      return '❌ Bad Request: Invalid request format - check your function parameters';
    case 'HTTP_401':
      return '🔐 Authentication Failed: API key is invalid or missing - contact administrator';
    case 'HTTP_403':
      return '🚫 Access Denied: You don\'t have permission to use this service';
    case 'HTTP_429':
      return '⏳ Rate Limited: Too many requests - please wait 2-3 minutes and try again';
    case 'HTTP_500':
      return '🔧 Server Error: Internal server error - please try again in a few minutes';
    case 'HTTP_502':
      return '⚠️ Bad Gateway: Server connection issue - please try again shortly';
    case 'HTTP_503':
      return '⚠️ Service Unavailable: Server is temporarily overloaded - please try again in 5 minutes';
    case 'HTTP_504':
      return '⚠️ Gateway Timeout: Server response timeout - please try again';
    case 'PARSE_ERROR':
      return '🔧 Parse Error: Invalid response from server - please try again';
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
  } else if (errorMessage.includes('dns') || errorMessage.includes('resolve')) {
    return '🌐 DNS Error: Cannot find server - check your internet connection or API endpoint';
  } else if (errorMessage.includes('ssl') || errorMessage.includes('certificate')) {
    return '🔒 Security Error: SSL certificate issue - please try again or contact administrator';
  } else if (errorMessage.includes('fetch')) {
    return '🌐 Fetch Error: Failed to reach API endpoint - verify your API URL configuration';
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
  } else if (errorMessage.includes('permission') || errorMessage.includes('authorization')) {
    return '🔐 Permission Error: Script lacks required permissions - contact administrator';
  } else if (errorMessage.includes('cache')) {
    return '💾 Cache Error: Temporary storage issue - function will work without caching';
  } else if (errorMessage.includes('properties')) {
    return '⚙️ Configuration Error: Script properties not accessible - contact administrator';
  } else {
    return `🔧 Unexpected Error: ${error.message || 'Unknown error occurred'} - please try again`;
  }
}

/**
 * Gets the current processing status for debugging and monitoring
 * This function can be called separately to check system status
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
    
    // Test cache availability
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
 * This can be called from a cell like =getSystemStatus() for troubleshooting
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
    
    if (status.apiEndpointConfigured) {
      statusParts.push('✅ API Configured');
    } else {
      statusParts.push('❌ API Not Configured');
    }
    
    if (status.cacheAvailable && status.cacheWorking) {
      statusParts.push('✅ Cache Working');
    } else {
      statusParts.push('⚠️ Cache Issues');
    }
    
    if (status.propertiesAvailable) {
      statusParts.push('✅ Properties OK');
    } else {
      statusParts.push('❌ Properties Error');
    }
    
    return `🔍 System Status: ${statusParts.join(' | ')} | Last Check: ${new Date().toLocaleTimeString()}`;
    
  } catch (error) {
    return `🔧 Status Check Failed: ${error.message}`;
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
  
  const errorIndicators = ['❌', '⚠️', '🔧', '⏳', '⏱️', '🌐', '🔐', '🚫', '📊', '💾', '⚙️', '🔒'];
  const errorPrefixes = ['Error:', 'Timeout:', 'Rate Limited:', 'Service Unavailable:', 'Network Error:', 'Connection Failed:'];
  
  // Check for error emoji indicators
  for (const indicator of errorIndicators) {
    if (result.includes(indicator)) {
      return true;
    }
  }
  
  // Check for error text prefixes
  for (const prefix of errorPrefixes) {
    if (result.includes(prefix)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Provides helpful information about function usage and status
 * This can be called from a cell like =getRewriteHelp() for guidance
 * @return {string} Help information
 * @customfunction
 */
function getRewriteHelp() {
  return `📖 REWRITE Function Help:
Usage: =REWRITE("your prompt", A1, B1:C1)
• First parameter: Prompt (required) - Instructions for AI in quotes
• Second parameter: Main text (required) - Cell reference (A1) or range (A1:A5)
• Third parameter: Context (optional) - Additional cells for context
Examples: =REWRITE("Make professional", A1) or =REWRITE("Summarize", A1:A3, B1)
Status: Use =getSystemStatus() to check configuration
Setup: Call setApiEndpoint("your-api-url") once to configure`;
}

/**
 * Provides detailed parameter guidance and examples
 * This can be called from a cell like =getParameterGuide() for detailed help
 * @return {string} Parameter guidance
 * @customfunction
 */
function getParameterGuide() {
  return `📋 Parameter Guide:
PROMPT (1st): "Rewrite to be more formal" | "Summarize in 2 sentences" | "Translate to simple English"
MAIN TEXT (2nd): A1 (single cell) | A1:A5 (range) | "direct text" | B2:C4 (2D range)
CONTEXT (3rd): B1 (optional context) | B1:B3 (context range) | Leave empty if not needed
❌ Common Mistakes: Missing quotes around prompt | Empty cells | Wrong cell references
✅ Good Examples: =REWRITE("Make concise", A1) | =REWRITE("Professional tone", A1:A3, B1)`;
}

/**
 * Validates and provides feedback on function parameters before execution
 * This can be called to test parameters: =validateRewriteParams("prompt", A1, B1)
 * @param {any} prompt - The prompt to validate
 * @param {any} mainText - The main text to validate  
 * @param {any} contextCells - The context to validate (optional)
 * @return {string} Validation feedback
 * @customfunction
 */
function validateRewriteParams(prompt, mainText, contextCells) {
  try {
    const validation = validateParameters(prompt, mainText, contextCells);
    
    if (!validation.isValid) {
      return validation.error;
    }
    
    // Additional checks for user guidance
    const feedback = [];
    
    // Check prompt quality
    if (typeof prompt === 'string') {
      if (prompt.length < 10) {
        feedback.push('💡 Tip: More detailed prompts often give better results');
      }
      if (!prompt.includes(' ')) {
        feedback.push('💡 Tip: Try using complete sentences in your prompt');
      }
    }
    
    // Check main text
    try {
      const extractedText = extractCellValue(mainText);
      if (extractedText.length === 0) {
        return '⚠️ Warning: Main text appears to be empty - check your cell reference';
      }
      if (extractedText.length > 2000) {
        feedback.push('💡 Tip: Very long text may take longer to process');
      }
      feedback.push(`📊 Main text: ${extractedText.length} characters`);
    } catch (error) {
      return `❌ Main text error: ${error.message}`;
    }
    
    // Check context if provided
    if (contextCells !== undefined && contextCells !== null) {
      try {
        const contextText = extractCellValue(contextCells);
        if (contextText.length > 0) {
          feedback.push(`📊 Context: ${contextText.length} characters`);
        } else {
          feedback.push('💡 Context is empty - consider omitting this parameter');
        }
      } catch (error) {
        return `❌ Context error: ${error.message}`;
      }
    }
    
    if (feedback.length === 0) {
      return '✅ Parameters look good! Ready to use REWRITE function';
    } else {
      return `✅ Valid parameters | ${feedback.join(' | ')}`;
    }
    
  } catch (error) {
    return `❌ Validation error: ${error.message}`;
  }
}

/**
 * Provides examples of common REWRITE function usage patterns
 * This can be called from a cell like =getRewriteExamples() for inspiration
 * @return {string} Usage examples
 * @customfunction
 */
function getRewriteExamples() {
  return `💡 REWRITE Examples:
Professional: =REWRITE("Make this sound more professional and formal", A1)
Concise: =REWRITE("Summarize this in one clear sentence", A1:A3)
Simple: =REWRITE("Rewrite in simple language for beginners", A1, B1)
Creative: =REWRITE("Rewrite this as a compelling story", A1)
Technical: =REWRITE("Explain this technical concept clearly", A1:A2)
Email: =REWRITE("Turn this into a polite email", A1, B1:B2)`;
}

/**
 * Shows recent processing statistics and performance info
 * @return {string} Processing statistics
 * @customfunction  
 */
function getProcessingStats() {
  try {
    const cache = CacheService.getScriptCache();
    
    // Try to get some basic stats (limited by Google Apps Script capabilities)
    const status = getProcessingStatus();
    
    if (status.error) {
      return `📊 Stats Error: ${status.error}`;
    }
    
    const statsInfo = [
      `⏰ Last Check: ${new Date().toLocaleTimeString()}`,
      `🔧 API: ${status.apiEndpointConfigured ? 'Configured' : 'Not Set'}`,
      `💾 Cache: ${status.cacheWorking ? 'Working' : 'Issues'}`,
      `📝 Tip: Check console logs for detailed processing info`
    ];
    
    return statsInfo.join(' | ');
    
  } catch (error) {
    return `📊 Stats Error: ${error.message}`;
  }
}

/**
 * Configuration function to set the API endpoint
 * This should be called once to configure the script
 * @param {string} apiUrl - The backend API endpoint URL
 */
function setApiEndpoint(apiUrl) {
  const properties = PropertiesService.getScriptProperties();
  properties.setProperty('API_ENDPOINT', apiUrl);
  console.log(`API endpoint set to: ${apiUrl}`);
}
// ===
== CACHING AND PERFORMANCE OPTIMIZATION =====

/**
 * Generates a cache key from function parameters
 * @param {string} prompt - AI instruction/prompt for text rewriting
 * @param {string} mainText - Primary text to be rewritten
 * @param {string} contextText - Additional context for AI (optional)
 * @return {string} Cache key
 */
function generateCacheKey(prompt, mainText, contextText) {
  // Create a hash-like key from the parameters
  const keyData = `${prompt}|${mainText}|${contextText || ''}`;
  
  // Use a simple hash function to create a shorter key
  // Google Apps Script cache keys have length limitations
  return `rewrite_${Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, keyData)
    .map(byte => (byte + 256).toString(16).slice(-2))
    .join('')
    .substring(0, 16)}`;
}

/**
 * Retrieves cached result if available and not expired
 * @param {string} cacheKey - The cache key to look up
 * @return {string|null} Cached result or null if not found/expired
 */
function getCachedResult(cacheKey) {
  try {
    const cache = CacheService.getScriptCache();
    const cachedValue = cache.get(cacheKey);
    
    if (cachedValue) {
      // Parse cached data to check expiration
      const cachedData = JSON.parse(cachedValue);
      const now = new Date().getTime();
      
      // Check if cache is still valid (1 hour = 3600000 ms)
      if (now - cachedData.timestamp < 3600000) {
        return cachedData.result;
      } else {
        // Remove expired cache entry
        cache.remove(cacheKey);
      }
    }
    
    return null;
    
  } catch (error) {
    // If cache access fails, continue without caching
    console.warn(`Cache retrieval failed: ${error.message}`);
    return null;
  }
}

/**
 * Stores result in cache with timestamp
 * @param {string} cacheKey - The cache key to store under
 * @param {string} result - The result to cache
 */
function setCachedResult(cacheKey, result) {
  try {
    const cache = CacheService.getScriptCache();
    
    // Create cache data with timestamp
    const cacheData = {
      result: result,
      timestamp: new Date().getTime()
    };
    
    // Store in cache with 1 hour expiration (3600 seconds)
    cache.put(cacheKey, JSON.stringify(cacheData), 3600);
    
  } catch (error) {
    // If cache storage fails, continue without caching
    console.warn(`Cache storage failed: ${error.message}`);
  }
}

/**
 * Clears all cached results (utility function for maintenance)
 */
function clearCache() {
  try {
    const cache = CacheService.getScriptCache();
    
    // Note: Google Apps Script doesn't have a direct way to clear only specific keys
    // This would clear the entire cache for the script
    // In practice, we rely on natural expiration
    
    console.log('Cache clearing requested - entries will expire naturally after 1 hour');
    
  } catch (error) {
    console.warn(`Cache clearing failed: ${error.message}`);
  }
}

/**
 * Enhanced request ID generation with deduplication tracking
 * @return {string} Unique request identifier
 */
function generateRequestId() {
  // Generate a UUID-based request ID
  const uuid = Utilities.getUuid();
  
  // Store in a short-term cache to prevent duplicate requests
  // This helps with deduplication when the same formula is recalculated quickly
  const dedupeCache = CacheService.getScriptCache();
  const dedupeKey = `dedupe_${uuid}`;
  
  try {
    // Store for 5 minutes to prevent immediate duplicates
    dedupeCache.put(dedupeKey, 'true', 300);
  } catch (error) {
    // Continue even if deduplication cache fails
    console.warn(`Deduplication cache failed: ${error.message}`);
  }
  
  return uuid;
}

/**
 * Checks if a request ID has been used recently (for deduplication)
 * @param {string} requestId - The request ID to check
 * @return {boolean} True if request ID was used recently
 */
function isRequestIdUsed(requestId) {
  try {
    const dedupeCache = CacheService.getScriptCache();
    const dedupeKey = `dedupe_${requestId}`;
    
    return dedupeCache.get(dedupeKey) !== null;
    
  } catch (error) {
    // If deduplication check fails, assume not used
    console.warn(`Deduplication check failed: ${error.message}`);
    return false;
  }
}

/**
 * Gets cache statistics for monitoring (utility function)
 * @return {Object} Cache statistics
 */
function getCacheStats() {
  try {
    // Note: Google Apps Script CacheService doesn't provide detailed statistics
    // This is a placeholder for potential future monitoring
    
    return {
      message: 'Cache statistics not available in Google Apps Script',
      recommendation: 'Monitor function performance through execution time'
    };
    
  } catch (error) {
    return {
      error: `Failed to get cache stats: ${error.message}`
    };
  }
}// ====
= TESTING FUNCTIONS =====

/**
 * Test function for cache key generation
 * Run this to verify cache key generation works correctly
 */
function testCacheKeyGeneration() {
  try {
    const key1 = generateCacheKey('test prompt', 'test text', 'test context');
    const key2 = generateCacheKey('test prompt', 'test text', 'test context');
    const key3 = generateCacheKey('different prompt', 'test text', 'test context');
    
    console.log('Cache key test results:');
    console.log(`Key 1: ${key1}`);
    console.log(`Key 2: ${key2}`);
    console.log(`Key 3: ${key3}`);
    console.log(`Keys 1 and 2 match: ${key1 === key2}`);
    console.log(`Keys 1 and 3 match: ${key1 === key3}`);
    
    return {
      success: true,
      sameInputsSameKey: key1 === key2,
      differentInputsDifferentKey: key1 !== key3
    };
    
  } catch (error) {
    console.error(`Cache key test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Test function for caching functionality
 * Run this to verify caching works correctly
 */
function testCaching() {
  try {
    const testKey = 'test_cache_key';
    const testValue = 'test cached result';
    
    // Test setting cache
    setCachedResult(testKey, testValue);
    
    // Test getting cache
    const retrievedValue = getCachedResult(testKey);
    
    console.log('Caching test results:');
    console.log(`Stored value: ${testValue}`);
    console.log(`Retrieved value: ${retrievedValue}`);
    console.log(`Values match: ${testValue === retrievedValue}`);
    
    return {
      success: true,
      valuesMatch: testValue === retrievedValue,
      storedValue: testValue,
      retrievedValue: retrievedValue
    };
    
  } catch (error) {
    console.error(`Caching test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Test function for enhanced parameter validation
 * Run this to verify parameter validation works correctly with new features
 */
function testParameterValidation() {
  try {
    const tests = [
      // Basic validation tests
      { prompt: 'valid prompt', mainText: 'valid text', contextCells: null, expected: true },
      { prompt: '', mainText: 'valid text', contextCells: null, expected: false },
      { prompt: null, mainText: 'valid text', contextCells: null, expected: false },
      { prompt: 'valid prompt', mainText: null, contextCells: null, expected: false },
      { prompt: 'valid prompt', mainText: undefined, contextCells: null, expected: false },
      
      // Prompt validation tests
      { prompt: 'ab', mainText: 'valid text', contextCells: null, expected: false }, // too short
      { prompt: 123, mainText: 'valid text', contextCells: null, expected: false }, // not string
      { prompt: 'a'.repeat(501), mainText: 'valid text', contextCells: null, expected: false }, // too long
      
      // Main text validation tests
      { prompt: 'valid prompt', mainText: '', contextCells: null, expected: false }, // empty string
      { prompt: 'valid prompt', mainText: 123, contextCells: null, expected: true }, // number is ok
      { prompt: 'valid prompt', mainText: ['text1', 'text2'], contextCells: null, expected: true }, // array is ok
      
      // Context validation tests
      { prompt: 'valid prompt', mainText: 'valid text', contextCells: 'context', expected: true },
      { prompt: 'valid prompt', mainText: 'valid text', contextCells: '', expected: false }, // empty context
      { prompt: 'valid prompt', mainText: 'valid text', contextCells: ['ctx1', 'ctx2'], expected: true }
    ];
    
    const results = tests.map((test, index) => {
      const result = validateParameters(test.prompt, test.mainText, test.contextCells);
      const passed = result.isValid === test.expected;
      
      if (!passed) {
        console.log(`Test ${index + 1} FAILED:`);
        console.log(`  Input: prompt="${test.prompt}", mainText="${test.mainText}", context="${test.contextCells}"`);
        console.log(`  Expected: ${test.expected}, Got: ${result.isValid}`);
        console.log(`  Error: ${result.error || 'none'}`);
      }
      
      return {
        input: test,
        result: result,
        passed: passed
      };
    });
    
    const allPassed = results.every(result => result.passed);
    const passedCount = results.filter(result => result.passed).length;
    
    console.log(`Parameter validation test results: ${passedCount}/${results.length} passed`);
    
    return {
      success: true,
      allTestsPassed: allPassed,
      passedCount: passedCount,
      totalCount: results.length,
      results: results
    };
    
  } catch (error) {
    console.error(`Parameter validation test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Test function for user guidance functions
 * Run this to verify help and guidance functions work correctly
 */
function testUserGuidanceFunctions() {
  try {
    console.log('Testing user guidance functions...');
    
    // Test help function
    const helpResult = getRewriteHelp();
    const helpWorking = helpResult.includes('REWRITE Function Help') && helpResult.includes('Usage:');
    
    // Test parameter guide
    const guideResult = getParameterGuide();
    const guideWorking = guideResult.includes('Parameter Guide') && guideResult.includes('PROMPT');
    
    // Test examples function
    const examplesResult = getRewriteExamples();
    const examplesWorking = examplesResult.includes('REWRITE Examples') && examplesResult.includes('Professional:');
    
    // Test parameter validation function
    const validationResult = validateRewriteParams('test prompt', 'test text', null);
    const validationWorking = validationResult.includes('✅') || validationResult.includes('Parameters look good');
    
    // Test validation with invalid parameters
    const invalidValidationResult = validateRewriteParams('', 'test text', null);
    const invalidValidationWorking = invalidValidationResult.includes('❌') || invalidValidationResult.includes('Error');
    
    console.log(`Help function: ${helpWorking ? 'PASSED' : 'FAILED'}`);
    console.log(`Parameter guide: ${guideWorking ? 'PASSED' : 'FAILED'}`);
    console.log(`Examples function: ${examplesWorking ? 'PASSED' : 'FAILED'}`);
    console.log(`Validation function: ${validationWorking ? 'PASSED' : 'FAILED'}`);
    console.log(`Invalid validation: ${invalidValidationWorking ? 'PASSED' : 'FAILED'}`);
    
    const allWorking = helpWorking && guideWorking && examplesWorking && validationWorking && invalidValidationWorking;
    
    return {
      success: true,
      allFunctionsWorking: allWorking,
      results: {
        help: helpWorking,
        guide: guideWorking,
        examples: examplesWorking,
        validation: validationWorking,
        invalidValidation: invalidValidationWorking
      }
    };
    
  } catch (error) {
    console.error(`User guidance functions test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Test function for cell range processing with different formats
 * Run this to verify cell range processing works with various formats
 */
function testCellRangeProcessing() {
  try {
    const tests = [
      // 1D arrays
      { input: ['text1', 'text2', 'text3'], expected: 'text1, text2, text3' },
      { input: ['sentence one.', 'sentence two.'], expected: 'sentence one. sentence two.' },
      { input: ['', 'text', '', 'more'], expected: 'text, more' },
      
      // 2D arrays
      { input: [['row1col1', 'row1col2'], ['row2col1', 'row2col2']], expected: 'row1col1, row1col2, row2col1, row2col2' },
      { input: [['This is a long sentence.', 'Another sentence.'], ['More text here.']], expected: 'This is a long sentence. Another sentence. More text here.' },
      
      // Mixed content
      { input: [123, 'text', true], expected: '123, text, true' },
      { input: ['', null, undefined, 'valid'], expected: 'valid' },
      
      // Empty arrays
      { input: [], expected: '' },
      { input: [['', ''], ['', '']], expected: '' }
    ];
    
    const results = tests.map((test, index) => {
      try {
        const result = processCellRange(test.input);
        const passed = result === test.expected;
        
        if (!passed) {
          console.log(`Cell range test ${index + 1} FAILED:`);
          console.log(`  Input: ${JSON.stringify(test.input)}`);
          console.log(`  Expected: "${test.expected}"`);
          console.log(`  Got: "${result}"`);
        }
        
        return {
          input: test.input,
          expected: test.expected,
          result: result,
          passed: passed
        };
      } catch (error) {
        console.log(`Cell range test ${index + 1} ERROR: ${error.message}`);
        return {
          input: test.input,
          expected: test.expected,
          result: `Error: ${error.message}`,
          passed: false
        };
      }
    });
    
    const allPassed = results.every(result => result.passed);
    const passedCount = results.filter(result => result.passed).length;
    
    console.log(`Cell range processing test results: ${passedCount}/${results.length} passed`);
    
    return {
      success: true,
      allTestsPassed: allPassed,
      passedCount: passedCount,
      totalCount: results.length,
      results: results
    };
    
  } catch (error) {
    console.error(`Cell range processing test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Test function for cell value extraction
 * Run this to verify cell value extraction works correctly
 */
function testCellValueExtraction() {
  try {
    const tests = [
      { input: 'simple string', expected: 'simple string' },
      { input: 123, expected: '123' },
      { input: ['array', 'values'], expected: 'array values' },
      { input: [['2d', 'array'], ['more', 'values']], expected: '2d array more values' },
      { input: ['', 'non-empty', '', 'values'], expected: 'non-empty values' }
    ];
    
    const results = tests.map(test => {
      try {
        const result = extractCellValue(test.input);
        return {
          input: test.input,
          expected: test.expected,
          result: result,
          passed: result === test.expected
        };
      } catch (error) {
        return {
          input: test.input,
          expected: test.expected,
          result: `Error: ${error.message}`,
          passed: false
        };
      }
    });
    
    console.log('Cell value extraction test results:');
    results.forEach((result, index) => {
      console.log(`Test ${index + 1}: ${result.passed ? 'PASSED' : 'FAILED'}`);
      if (!result.passed) {
        console.log(`  Expected: "${result.expected}", Got: "${result.result}"`);
      }
    });
    
    const allPassed = results.every(result => result.passed);
    
    return {
      success: true,
      allTestsPassed: allPassed,
      results: results
    };
    
  } catch (error) {
    console.error(`Cell value extraction test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Test function for error message formatting
 * Run this to verify error messages are properly formatted
 */
function testErrorFormatting() {
  try {
    const testErrors = [
      { code: 'RATE_LIMITED', message: 'Rate limit exceeded' },
      { code: 'API_UNAVAILABLE', message: 'Service unavailable' },
      { code: 'TIMEOUT', message: 'Request timeout' },
      { code: 'HTTP_429', message: 'Too many requests' },
      { code: 'UNKNOWN_ERROR', message: 'Unknown error' }
    ];
    
    console.log('Error formatting test results:');
    const results = testErrors.map(error => {
      const formatted = formatErrorMessage(error);
      console.log(`${error.code}: ${formatted}`);
      return {
        code: error.code,
        formatted: formatted,
        hasEmoji: /[\u{1F300}-\u{1F9FF}]/u.test(formatted),
        isUserFriendly: formatted.length > 10 && !formatted.includes('undefined')
      };
    });
    
    const allHaveEmoji = results.every(r => r.hasEmoji);
    const allUserFriendly = results.every(r => r.isUserFriendly);
    
    return {
      success: true,
      allHaveEmoji: allHaveEmoji,
      allUserFriendly: allUserFriendly,
      results: results
    };
    
  } catch (error) {
    console.error(`Error formatting test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Test function for status and processing feedback
 * Run this to verify status functions work correctly
 */
function testStatusFunctions() {
  try {
    console.log('Testing status functions...');
    
    // Test system status
    const systemStatus = getSystemStatus();
    console.log(`System Status: ${systemStatus}`);
    
    // Test processing stats
    const processingStats = getProcessingStats();
    console.log(`Processing Stats: ${processingStats}`);
    
    // Test help function
    const helpInfo = getRewriteHelp();
    console.log(`Help Info: ${helpInfo.substring(0, 100)}...`);
    
    // Test error result detection
    const errorTests = [
      { input: '❌ Error: Test error', expected: true },
      { input: 'This is normal text', expected: false },
      { input: '⚠️ Service Unavailable', expected: true },
      { input: 'Successfully rewritten text', expected: false }
    ];
    
    const errorDetectionResults = errorTests.map(test => {
      const result = isErrorResult(test.input);
      return {
        input: test.input,
        expected: test.expected,
        result: result,
        passed: result === test.expected
      };
    });
    
    const allErrorDetectionPassed = errorDetectionResults.every(r => r.passed);
    
    return {
      success: true,
      systemStatusWorking: systemStatus.includes('System Status'),
      processingStatsWorking: processingStats.includes('Last Check'),
      helpInfoWorking: helpInfo.includes('REWRITE Function Help'),
      errorDetectionWorking: allErrorDetectionPassed,
      errorDetectionResults: errorDetectionResults
    };
    
  } catch (error) {
    console.error(`Status functions test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Run all tests including enhanced parameter validation and user guidance tests
 * Convenience function to run all test functions
 */
function runAllTests() {
  console.log('Running all tests...');
  
  const cacheKeyTest = testCacheKeyGeneration();
  const cachingTest = testCaching();
  const validationTest = testParameterValidation();
  const extractionTest = testCellValueExtraction();
  const errorFormattingTest = testErrorFormatting();
  const statusTest = testStatusFunctions();
  const guidanceTest = testUserGuidanceFunctions();
  const cellRangeTest = testCellRangeProcessing();
  
  const allTestsResults = {
    cacheKeyGeneration: cacheKeyTest,
    caching: cachingTest,
    parameterValidation: validationTest,
    cellValueExtraction: extractionTest,
    errorFormatting: errorFormattingTest,
    statusFunctions: statusTest,
    userGuidance: guidanceTest,
    cellRangeProcessing: cellRangeTest
  };
  
  const overallSuccess = cacheKeyTest.success && cachingTest.success && 
                        validationTest.success && extractionTest.success &&
                        errorFormattingTest.success && statusTest.success &&
                        guidanceTest.success && cellRangeTest.success &&
                        cacheKeyTest.sameInputsSameKey && cacheKeyTest.differentInputsDifferentKey &&
                        cachingTest.valuesMatch && validationTest.allTestsPassed && 
                        extractionTest.allTestsPassed && errorFormattingTest.allHaveEmoji &&
                        errorFormattingTest.allUserFriendly && statusTest.systemStatusWorking &&
                        statusTest.processingStatsWorking && statusTest.helpInfoWorking &&
                        statusTest.errorDetectionWorking && guidanceTest.allFunctionsWorking &&
                        cellRangeTest.allTestsPassed;
  
  console.log(`\nOverall test result: ${overallSuccess ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  
  // Provide summary of test results
  const testSummary = [
    `Cache Key Generation: ${cacheKeyTest.success ? '✅' : '❌'}`,
    `Caching: ${cachingTest.success ? '✅' : '❌'}`,
    `Parameter Validation: ${validationTest.success && validationTest.allTestsPassed ? '✅' : '❌'} (${validationTest.passedCount || 0}/${validationTest.totalCount || 0})`,
    `Cell Value Extraction: ${extractionTest.success ? '✅' : '❌'}`,
    `Error Formatting: ${errorFormattingTest.success ? '✅' : '❌'}`,
    `Status Functions: ${statusTest.success ? '✅' : '❌'}`,
    `User Guidance: ${guidanceTest.success ? '✅' : '❌'}`,
    `Cell Range Processing: ${cellRangeTest.success && cellRangeTest.allTestsPassed ? '✅' : '❌'} (${cellRangeTest.passedCount || 0}/${cellRangeTest.totalCount || 0})`
  ];
  
  console.log('\nTest Summary:');
  testSummary.forEach(summary => console.log(summary));
  
  return {
    success: overallSuccess,
    results: allTestsResults,
    summary: testSummary
  };
}