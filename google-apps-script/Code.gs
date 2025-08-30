/**
 * REWRITE custom function for Google Sheets
 * Processes text data through AI for rewriting
 * 
 * @param {string} prompt - AI instruction/prompt for text rewriting
 * @param {any} mainText - Primary text to be rewritten (cell reference or direct text)
 * @param {any} contextCells - Additional context for AI (cell reference/range, optional)
 * @param {boolean} forceRerun - Force rerun even if result exists (optional)
 * @return {string} The rewritten text or error message
 * @customfunction
 */
function REWRITE(prompt, mainText, contextCells, forceRerun = false) {
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
    
    // Check if we have a completed result and shouldn't rerun
    if (!forceRerun) {
      // First check if this combination was completed before
      if (isResultCompleted(cacheKey)) {
        // Try to get from cache
        const cachedResult = getCachedResult(cacheKey);
        if (cachedResult && !isErrorResult(cachedResult)) {
          return cachedResult;
        }
        // If completed but not in cache, we could either:
        // 1. Return a message saying result was completed but expired
        // 2. Allow rerun (current approach)
        // For now, we'll allow rerun but won't mark as completed again
      }
    }
    
    // Check regular cache for recent results
    const cachedResult = getCachedResult(cacheKey);
    if (cachedResult && !isErrorResult(cachedResult)) {
      // Store completion flag for future prevention
      setCompletedResult(cacheKey, cachedResult);
      return cachedResult;
    }
    
    const result = makeApiRequest(prompt, processedMainText, processedContextText);
    
    if (result && !isErrorResult(result)) {
      setCachedResult(cacheKey, result);
      // Store as completed result to prevent future reruns
      setCompletedResult(cacheKey, result);
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
  const apiUrl = properties.getProperty('API_ENDPOINT');
  
  if (!apiUrl) {
    throw new Error('API_ENDPOINT not configured. Please run configureApiEndpoint() first with your deployment URL.');
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
 * Checks if a result has been completed (returns cached result if available)
 * @param {string} cacheKey - The cache key to look up
 * @return {string|null} Cached result if available, null if not completed or not cached
 */
function getCompletedResult(cacheKey) {
  try {
    // First check if this combination has been completed
    if (!isResultCompleted(cacheKey)) {
      return null;
    }
    
    // If completed, try to get from cache first (faster)
    const cachedResult = getCachedResult(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    // If not in cache but marked as completed, return a placeholder
    // This allows the function to know it was completed but result expired from cache
    return null; // Will trigger a fresh API call but won't store completion flag again
    
  } catch (error) {
    console.warn(`Completed result check failed: ${error.message}`);
    return null;
  }
}

/**
 * Checks if a specific result combination has been completed before
 * @param {string} cacheKey - The cache key to check
 * @return {boolean} True if this combination has been completed before
 */
function isResultCompleted(cacheKey) {
  try {
    const properties = PropertiesService.getDocumentProperties();
    const completedKey = `completed_${cacheKey}`;
    const completionFlag = properties.getProperty(completedKey);
    
    // Return true if any completion flag exists (handles legacy formats too)
    return completionFlag !== null;
    
  } catch (error) {
    console.warn(`Completion check failed: ${error.message}`);
    return false;
  }
}

/**
 * Marks a result combination as completed (stores only a completion flag)
 * @param {string} cacheKey - The cache key
 * @param {string} result - The completed result (stored separately in cache)
 */
function setCompletedResult(cacheKey, result) {
  try {
    const properties = PropertiesService.getDocumentProperties();
    const completedKey = `completed_${cacheKey}`;
    
    // Store only a minimal completion flag with timestamp
    const timestamp = Math.floor(new Date().getTime() / 1000); // Use seconds
    
    // Ultra-compact storage: just store timestamp (10 characters vs 1000+)
    properties.setProperty(completedKey, timestamp.toString());
    
    // The actual result is stored in cache separately (temporary but faster)
    setCachedResult(cacheKey, result);
    
  } catch (error) {
    console.warn(`Completion flag storage failed: ${error.message}`);
    // Even if persistent storage fails, we still have the cache
    // The function will work but might rerun after cache expires
  }
}

/**
 * Clears a specific completed result (for rerun functionality)
 * @param {string} cacheKey - The cache key to clear
 */
function clearCompletedResult(cacheKey) {
  try {
    const properties = PropertiesService.getDocumentProperties();
    const completedKey = `completed_${cacheKey}`;
    properties.deleteProperty(completedKey);
  } catch (error) {
    console.warn(`Failed to clear completed result: ${error.message}`);
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
 * Clears all completed results (use with caution)
 */
function clearAllCompletedResults() {
  try {
    const properties = PropertiesService.getDocumentProperties();
    const allProperties = properties.getProperties();
    
    let clearedCount = 0;
    for (const key in allProperties) {
      if (key.startsWith('completed_')) {
        properties.deleteProperty(key);
        clearedCount++;
      }
    }
    
    console.log(`Cleared ${clearedCount} completed results`);
    return `✅ Cleared ${clearedCount} completed results`;
  } catch (error) {
    console.error(`Failed to clear completed results: ${error.message}`);
    return `❌ Failed to clear completed results: ${error.message}`;
  }
}

/**
 * Clears completion flag for a specific cell by address
 * @param {string} cellAddress - The cell address (e.g., "A1", "B5")
 * @return {string} Result message
 */
function clearCellCompletionFlag(cellAddress) {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const cell = sheet.getRange(cellAddress);
    const formula = cell.getFormula();
    
    if (!formula || !formula.toUpperCase().includes('REWRITE')) {
      return `❌ Cell ${cellAddress} does not contain a REWRITE function`;
    }
    
    const clearResult = clearCompletionFlagFromFormula(formula);
    
    if (clearResult.success) {
      return `✅ Completion flag cleared for cell ${cellAddress}. Function will rerun on next recalculation.`;
    } else {
      return `❌ Failed to clear ${cellAddress}: ${clearResult.error}`;
    }
    
  } catch (error) {
    return `❌ Error clearing cell ${cellAddress}: ${error.message}`;
  }
}

/**
 * Clears completion flags for multiple cells
 * @param {Array} cellAddresses - Array of cell addresses (e.g., ["A1", "B5", "C10"])
 * @return {string} Summary of results
 */
function clearMultipleCellsCompletionFlags(cellAddresses) {
  try {
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (const cellAddress of cellAddresses) {
      const result = clearCellCompletionFlag(cellAddress);
      if (result.includes('✅')) {
        successCount++;
      } else {
        errorCount++;
        errors.push(`${cellAddress}: ${result}`);
      }
    }
    
    let summary = `📊 Clear Summary: ✅ ${successCount} cleared, ❌ ${errorCount} errors`;
    
    if (errors.length > 0 && errors.length <= 5) {
      summary += `\n\nErrors:\n${errors.join('\n')}`;
    } else if (errors.length > 5) {
      summary += `\n\nFirst 5 errors:\n${errors.slice(0, 5).join('\n')}\n... and ${errors.length - 5} more`;
    }
    
    return summary;
    
  } catch (error) {
    return `❌ Bulk clear failed: ${error.message}`;
  }
}

/**
 * Forces rerun of REWRITE function for a specific input combination
 * Call this function with the same parameters to force a rerun
 * @param {string} prompt - Same prompt used in REWRITE
 * @param {any} mainText - Same main text used in REWRITE  
 * @param {any} contextCells - Same context used in REWRITE (optional)
 * @return {string} Result of forced rerun
 */
function forceRewriteRerun(prompt, mainText, contextCells) {
  const processedMainText = extractCellValue(mainText);
  const processedContextText = contextCells ? extractCellValue(contextCells) : '';
  const cacheKey = generateCacheKey(prompt, processedMainText, processedContextText);
  
  // Clear the completed result
  clearCompletedResult(cacheKey);
  
  // Run with force flag
  return REWRITE(prompt, mainText, contextCells, true);
}

/**
 * Creates a button-triggered rerun function for a specific cell
 * This creates a custom function that can be called from a button
 * @param {string} cellAddress - The cell address (e.g., "A1")
 * @param {string} prompt - The prompt used in that cell
 * @param {any} mainText - The main text used in that cell
 * @param {any} contextCells - The context used in that cell (optional)
 */
function createRerunButton(cellAddress, prompt, mainText, contextCells) {
  try {
    // Get the active sheet
    const sheet = SpreadsheetApp.getActiveSheet();
    
    // Force rerun the function
    const result = forceRewriteRerun(prompt, mainText, contextCells);
    
    // Update the cell with new result
    sheet.getRange(cellAddress).setValue(result);
    
    return `✅ Rerun completed for cell ${cellAddress}`;
  } catch (error) {
    return `❌ Rerun failed: ${error.message}`;
  }
}

/**
 * Gets detailed storage usage statistics
 * @return {Object} Detailed storage statistics
 */
function getStorageUsageStats() {
  try {
    const properties = PropertiesService.getDocumentProperties();
    const allProperties = properties.getProperties();
    
    let completedCount = 0;
    let totalSize = 0;
    let oldestTimestamp = null;
    let newestTimestamp = null;
    let avgFlagSize = 0;
    
    for (const key in allProperties) {
      if (key.startsWith('completed_')) {
        completedCount++;
        const dataStr = allProperties[key];
        totalSize += dataStr.length;
        
        // Parse timestamp from different formats
        let timestamp = null;
        
        // Check if it's the new ultra-compact format (just timestamp)
        if (!dataStr.includes('|') && !dataStr.includes('{')) {
          try {
            timestamp = parseInt(dataStr) * 1000; // Convert to milliseconds
          } catch (parseError) {
            timestamp = new Date().getTime();
          }
        } else if (dataStr.includes('|')) {
          // Old compact format
          const parts = dataStr.split('|');
          timestamp = parseInt(parts[0]) * 1000;
        } else {
          try {
            // Legacy JSON format
            const data = JSON.parse(dataStr);
            timestamp = data.timestamp;
          } catch (parseError) {
            timestamp = new Date().getTime();
          }
        }
        
        if (timestamp) {
          if (!oldestTimestamp || timestamp < oldestTimestamp) {
            oldestTimestamp = timestamp;
          }
          if (!newestTimestamp || timestamp > newestTimestamp) {
            newestTimestamp = timestamp;
          }
        }
      }
    }
    
    avgFlagSize = completedCount > 0 ? Math.round(totalSize / completedCount) : 0;
    const usagePercentage = Math.round((totalSize / (500 * 1024)) * 100);
    
    // With new ultra-compact storage (~10 bytes per flag), estimate much higher capacity
    const estimatedCapacity = Math.floor((500 * 1024) / Math.max(avgFlagSize, 10));
    
    return {
      completedCount: completedCount,
      totalSizeBytes: totalSize,
      usagePercentage: usagePercentage,
      avgFlagSize: avgFlagSize,
      estimatedCapacity: estimatedCapacity,
      oldestResult: oldestTimestamp ? new Date(oldestTimestamp).toISOString() : null,
      newestResult: newestTimestamp ? new Date(newestTimestamp).toISOString() : null,
      quotaUsage: `${Math.round(totalSize / 1024)}KB of 500KB (${usagePercentage}%) - ~${estimatedCapacity.toLocaleString()} cells capacity`
    };
  } catch (error) {
    return {
      error: `Failed to get storage stats: ${error.message}`
    };
  }
}

/**
 * Gets statistics about completed results (legacy function for compatibility)
 * @return {Object} Statistics about stored results
 */
function getCompletedResultsStats() {
  const stats = getStorageUsageStats();
  return {
    completedCount: stats.completedCount,
    totalSizeBytes: stats.totalSizeBytes,
    oldestResult: stats.oldestResult,
    newestResult: stats.newestResult,
    estimatedQuotaUsage: stats.quotaUsage
  };
}

/**
 * Performs automatic cleanup when storage usage is high
 */
function performAutomaticCleanup() {
  try {
    console.log('Starting automatic cleanup...');
    
    // First, try cleaning up results older than 7 days
    let cleanupResult = cleanupOldCompletedResults(7);
    console.log(`7-day cleanup: ${cleanupResult}`);
    
    // Check if we still need more space
    const stats = getStorageUsageStats();
    if (stats.usagePercentage > 70) {
      // Clean up results older than 3 days
      cleanupResult = cleanupOldCompletedResults(3);
      console.log(`3-day cleanup: ${cleanupResult}`);
    }
    
    // If still high usage, clean up results older than 1 day
    const finalStats = getStorageUsageStats();
    if (finalStats.usagePercentage > 60) {
      cleanupResult = cleanupOldCompletedResults(1);
      console.log(`1-day cleanup: ${cleanupResult}`);
    }
    
    return 'Automatic cleanup completed';
  } catch (error) {
    console.error(`Automatic cleanup failed: ${error.message}`);
    return `Cleanup failed: ${error.message}`;
  }
}

/**
 * Performs emergency cleanup when storage quota is exceeded
 */
function performEmergencyCleanup() {
  try {
    console.log('Starting emergency cleanup...');
    
    const properties = PropertiesService.getDocumentProperties();
    const allProperties = properties.getProperties();
    
    // Get all completed results with timestamps
    const completedResults = [];
    for (const key in allProperties) {
      if (key.startsWith('completed_')) {
        const dataStr = allProperties[key];
        let timestamp = 0;
        
        if (dataStr.includes('|')) {
          const parts = dataStr.split('|');
          timestamp = parseInt(parts[0]) * 1000;
        } else {
          try {
            const data = JSON.parse(dataStr);
            timestamp = data.timestamp || 0;
          } catch (parseError) {
            timestamp = 0; // Mark for deletion
          }
        }
        
        completedResults.push({ key, timestamp, size: dataStr.length });
      }
    }
    
    // Sort by timestamp (oldest first) and size (largest first for same timestamp)
    completedResults.sort((a, b) => {
      if (a.timestamp !== b.timestamp) {
        return a.timestamp - b.timestamp;
      }
      return b.size - a.size;
    });
    
    // Remove oldest 50% of results
    const toRemove = Math.ceil(completedResults.length * 0.5);
    let removedCount = 0;
    
    for (let i = 0; i < toRemove && i < completedResults.length; i++) {
      properties.deleteProperty(completedResults[i].key);
      removedCount++;
    }
    
    console.log(`Emergency cleanup removed ${removedCount} results`);
    return `Emergency cleanup completed: removed ${removedCount} results`;
  } catch (error) {
    console.error(`Emergency cleanup failed: ${error.message}`);
    throw error;
  }
}

/**
 * Displays completed results statistics in a user-friendly format
 * @return {string} Formatted statistics message
 * @customfunction
 */
function getCompletedResultsStatus() {
  try {
    const stats = getCompletedResultsStats();
    
    if (stats.error) {
      return `🔧 Stats Error: ${stats.error}`;
    }
    
    const parts = [
      `📊 Completed Results: ${stats.completedCount}`,
      `💾 Storage Used: ${stats.estimatedQuotaUsage}`,
      stats.oldestResult ? `📅 Oldest: ${new Date(stats.oldestResult).toLocaleDateString()}` : null,
      stats.newestResult ? `🆕 Newest: ${new Date(stats.newestResult).toLocaleDateString()}` : null
    ].filter(Boolean);
    
    return parts.join(' | ');
    
  } catch (error) {
    return `🔧 Status Check Failed: ${error.message}`;
  }
}

/**
 * Cleans up old completed results (older than specified days)
 * @param {number} daysOld - Remove results older than this many days (default: 30)
 * @return {string} Cleanup result message
 */
function cleanupOldCompletedResults(daysOld = 30) {
  try {
    const properties = PropertiesService.getDocumentProperties();
    const allProperties = properties.getProperties();
    const cutoffTime = new Date().getTime() - (daysOld * 24 * 60 * 60 * 1000);
    
    let removedCount = 0;
    
    for (const key in allProperties) {
      if (key.startsWith('completed_')) {
        try {
          const data = JSON.parse(allProperties[key]);
          if (data.timestamp && data.timestamp < cutoffTime) {
            properties.deleteProperty(key);
            removedCount++;
          }
        } catch (parseError) {
          // Remove corrupted entries
          properties.deleteProperty(key);
          removedCount++;
        }
      }
    }
    
    return `✅ Cleaned up ${removedCount} old completed results (older than ${daysOld} days)`;
  } catch (error) {
    return `❌ Cleanup failed: ${error.message}`;
  }
}

/**
 * Creates a custom menu in Google Sheets for easy rerun access
 * This function runs automatically when the spreadsheet opens
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🔄 REWRITE Tools')
    .addItem('🔄 Rerun Selected Cell', 'rerunSelectedCell')
    .addItem('🔄 Clear Selected Cell (Allow Rerun)', 'clearSelectedCell')
    .addSeparator()
    .addItem('🧹 Rerun All Visible REWRITE Functions', 'rerunAllVisibleCells')
    .addItem('🧹 Clear All Completed Results', 'clearAllCompletedResultsMenu')
    .addItem('🧹 Cleanup Old Results (30+ days)', 'cleanupOldResultsMenu')
    .addSeparator()
    .addItem('📊 Show Completed Results Status', 'showCompletedResultsStatus')
    .addItem('ℹ️ Help & Usage Guide', 'showHelpDialog')
    .addToUi();
}

/**
 * Clears the completion flag for the selected cell, allowing it to rerun naturally
 * Accessible via custom menu: REWRITE Tools > Clear Selected Cell (Allow Rerun)
 */
function clearSelectedCell() {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const activeCell = sheet.getActiveCell();
    const formula = activeCell.getFormula();
    
    if (!formula || !formula.toUpperCase().includes('REWRITE')) {
      SpreadsheetApp.getUi().alert(
        'No REWRITE Function Found',
        'The selected cell does not contain a REWRITE function.\n\nPlease select a cell with a REWRITE formula and try again.',
        SpreadsheetApp.getUi().ButtonSet.OK
      );
      return;
    }
    
    // Extract parameters and clear the completion flag
    const clearResult = clearCompletionFlagFromFormula(formula);
    
    if (clearResult.success) {
      SpreadsheetApp.getUi().alert(
        '✅ Cell Cleared Successfully',
        `Cell ${activeCell.getA1Notation()} completion flag has been cleared.\n\nThe function will rerun the next time the cell is recalculated.\n\nTip: Press Ctrl+Shift+F9 to force recalculation, or edit the cell and press Enter.`,
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    } else {
      SpreadsheetApp.getUi().alert(
        '❌ Clear Failed',
        `Failed to clear the completion flag: ${clearResult.error}`,
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    }
    
  } catch (error) {
    SpreadsheetApp.getUi().alert(
      '❌ Error',
      `An error occurred: ${error.message}`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * Reruns REWRITE function in the currently selected cell
 * Accessible via custom menu: REWRITE Tools > Rerun Selected Cell
 */
function rerunSelectedCell() {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const activeCell = sheet.getActiveCell();
    const formula = activeCell.getFormula();
    
    if (!formula || !formula.toUpperCase().includes('REWRITE')) {
      SpreadsheetApp.getUi().alert(
        'No REWRITE Function Found',
        'The selected cell does not contain a REWRITE function.\n\nPlease select a cell with a REWRITE formula and try again.',
        SpreadsheetApp.getUi().ButtonSet.OK
      );
      return;
    }
    
    // Extract parameters from the formula and force rerun
    const result = forceRerunFromFormula(formula);
    
    if (result.success) {
      activeCell.setValue(result.newValue);
      SpreadsheetApp.getUi().alert(
        '✅ Rerun Successful',
        `Cell ${activeCell.getA1Notation()} has been updated with a fresh result.`,
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    } else {
      SpreadsheetApp.getUi().alert(
        '❌ Rerun Failed',
        `Failed to rerun the function: ${result.error}`,
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    }
    
  } catch (error) {
    SpreadsheetApp.getUi().alert(
      '❌ Error',
      `An error occurred: ${error.message}`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * Reruns all visible REWRITE functions in the current sheet
 * Accessible via custom menu: REWRITE Tools > Rerun All Visible REWRITE Functions
 */
function rerunAllVisibleCells() {
  try {
    const ui = SpreadsheetApp.getUi();
    const response = ui.alert(
      'Confirm Bulk Rerun',
      'This will rerun ALL visible REWRITE functions in the current sheet.\n\nThis may consume significant API quota. Continue?',
      ui.ButtonSet.YES_NO
    );
    
    if (response !== ui.Button.YES) {
      return;
    }
    
    const sheet = SpreadsheetApp.getActiveSheet();
    const dataRange = sheet.getDataRange();
    const formulas = dataRange.getFormulas();
    
    let rerunCount = 0;
    let errorCount = 0;
    
    for (let row = 0; row < formulas.length; row++) {
      for (let col = 0; col < formulas[row].length; col++) {
        const formula = formulas[row][col];
        
        if (formula && formula.toUpperCase().includes('REWRITE')) {
          try {
            const result = forceRerunFromFormula(formula);
            if (result.success) {
              sheet.getRange(row + 1, col + 1).setValue(result.newValue);
              rerunCount++;
            } else {
              errorCount++;
            }
          } catch (error) {
            errorCount++;
          }
        }
      }
    }
    
    ui.alert(
      '🔄 Bulk Rerun Complete',
      `Rerun Summary:\n✅ Successfully rerun: ${rerunCount} functions\n❌ Errors: ${errorCount} functions`,
      ui.ButtonSet.OK
    );
    
  } catch (error) {
    SpreadsheetApp.getUi().alert(
      '❌ Error',
      `Bulk rerun failed: ${error.message}`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * Helper function to clear completion flag from a REWRITE formula
 * @param {string} formula - The cell formula containing REWRITE function
 * @return {Object} Result object with success flag and message or error
 */
function clearCompletionFlagFromFormula(formula) {
  try {
    // Simple regex to extract REWRITE parameters
    const rewriteMatch = formula.match(/REWRITE\s*\(\s*([^)]+)\)/i);
    
    if (!rewriteMatch) {
      return { success: false, error: 'Could not parse REWRITE function' };
    }
    
    // Parse parameters (this is a simplified parser)
    const params = rewriteMatch[1].split(',').map(p => p.trim());
    
    if (params.length < 2) {
      return { success: false, error: 'REWRITE function requires at least 2 parameters' };
    }
    
    // Remove quotes from string parameters
    const prompt = params[0].replace(/^["']|["']$/g, '');
    const mainText = params[1].replace(/^["']|["']$/g, '');
    const contextCells = params.length > 2 ? params[2].replace(/^["']|["']$/g, '') : '';
    
    // Generate the same cache key that would be used
    const processedMainText = extractCellValue(mainText);
    const processedContextText = contextCells ? extractCellValue(contextCells) : '';
    const cacheKey = generateCacheKey(prompt, processedMainText, processedContextText);
    
    // Clear the completion flag
    clearCompletedResult(cacheKey);
    
    return { success: true, message: 'Completion flag cleared successfully' };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Helper function to parse and force rerun a REWRITE formula
 * @param {string} formula - The cell formula containing REWRITE function
 * @return {Object} Result object with success flag and new value or error
 */
function forceRerunFromFormula(formula) {
  try {
    // Simple regex to extract REWRITE parameters
    const rewriteMatch = formula.match(/REWRITE\s*\(\s*([^)]+)\)/i);
    
    if (!rewriteMatch) {
      return { success: false, error: 'Could not parse REWRITE function' };
    }
    
    // Parse parameters (this is a simplified parser)
    const params = rewriteMatch[1].split(',').map(p => p.trim());
    
    if (params.length < 2) {
      return { success: false, error: 'REWRITE function requires at least 2 parameters' };
    }
    
    // Remove quotes from string parameters
    const prompt = params[0].replace(/^["']|["']$/g, '');
    const mainText = params[1].replace(/^["']|["']$/g, '');
    const contextCells = params.length > 2 ? params[2].replace(/^["']|["']$/g, '') : undefined;
    
    // Force rerun
    const result = forceRewriteRerun(prompt, mainText, contextCells);
    
    return { success: true, newValue: result };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Shows completed results status via dialog
 * Accessible via custom menu: REWRITE Tools > Show Completed Results Status
 */
function showCompletedResultsStatus() {
  try {
    const status = getCompletedResultsStatus();
    SpreadsheetApp.getUi().alert(
      '📊 Completed Results Status',
      status,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } catch (error) {
    SpreadsheetApp.getUi().alert(
      '❌ Error',
      `Failed to get status: ${error.message}`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * Clears all completed results with confirmation dialog
 * Accessible via custom menu: REWRITE Tools > Clear All Completed Results
 */
function clearAllCompletedResultsMenu() {
  try {
    const ui = SpreadsheetApp.getUi();
    const response = ui.alert(
      'Confirm Clear All Results',
      'This will clear ALL completed results, allowing all REWRITE functions to run again.\n\nThis action cannot be undone. Continue?',
      ui.ButtonSet.YES_NO
    );
    
    if (response === ui.Button.YES) {
      const result = clearAllCompletedResults();
      ui.alert('Clear Results', result, ui.ButtonSet.OK);
    }
  } catch (error) {
    SpreadsheetApp.getUi().alert(
      '❌ Error',
      `Failed to clear results: ${error.message}`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * Cleans up old results with confirmation dialog
 * Accessible via custom menu: REWRITE Tools > Cleanup Old Results
 */
function cleanupOldResultsMenu() {
  try {
    const ui = SpreadsheetApp.getUi();
    const response = ui.alert(
      'Confirm Cleanup Old Results',
      'This will remove completed results older than 30 days.\n\nOlder results will be allowed to run again. Continue?',
      ui.ButtonSet.YES_NO
    );
    
    if (response === ui.Button.YES) {
      const result = cleanupOldCompletedResults(30);
      ui.alert('Cleanup Results', result, ui.ButtonSet.OK);
    }
  } catch (error) {
    SpreadsheetApp.getUi().alert(
      '❌ Error',
      `Failed to cleanup results: ${error.message}`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * Shows help dialog with usage instructions
 * Accessible via custom menu: REWRITE Tools > Help & Usage Guide
 */
function showHelpDialog() {
  const helpText = `
🔄 REWRITE Function Usage Guide

📝 Basic Usage:
=REWRITE("Make this professional", A1)
=REWRITE("Summarize this", A1:A5, B1)

🔄 Rerun Options:
1. Clear & Rerun Naturally:
   • Select cell → Menu: Clear Selected Cell
   • Then press Ctrl+Shift+F9 or edit cell
2. Force Immediate Rerun:
   • Select cell → Menu: Rerun Selected Cell
3. Manual Force: =REWRITE("prompt", A1, , TRUE)

🗑️ Clear Completion Flags:
• Single cell: Menu → Clear Selected Cell
• Multiple cells: clearMultipleCellsCompletionFlags(["A1","B2"])
• All cells: Menu → Clear All Completed Results

📊 Management:
• View storage status via menu
• Ultra-efficient storage (~50,000 cell capacity)
• Automatic cleanup when needed

💡 Tips:
• "Clear Selected Cell" is gentler than "Rerun Selected Cell"
• Functions won't rerun after first success (saves API calls)
• Clearing allows natural recalculation
• Results cached for 1 hour for speed

🔧 Troubleshooting:
• Use "Clear Selected Cell" if results seem stuck
• Check system status for API issues
• Clear all results to reset everything
  `;
  
  SpreadsheetApp.getUi().alert(
    '📖 REWRITE Function Help',
    helpText,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Creates a rerun button using Google Sheets drawing/image feature
 * This function helps create a clickable button for specific cells
 * @param {string} cellAddress - The cell address to create a button for (e.g., "A1")
 * @param {string} buttonText - Text to display on the button (optional)
 */
function createRerunButtonForCell(cellAddress, buttonText = '🔄 Rerun') {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const cell = sheet.getRange(cellAddress);
    const formula = cell.getFormula();
    
    if (!formula || !formula.toUpperCase().includes('REWRITE')) {
      throw new Error(`Cell ${cellAddress} does not contain a REWRITE function`);
    }
    
    // Create a note with rerun instructions
    const noteText = `🔄 REWRITE Rerun Button
    
To rerun this cell:
1. Select this cell
2. Go to menu: REWRITE Tools → Rerun Selected Cell
3. Or use: =REWRITE(..., , , TRUE) to force rerun

Current formula: ${formula}`;
    
    cell.setNote(noteText);
    
    // Add conditional formatting to make it look like a button
    const rule = SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied(`=INDIRECT("${cellAddress}")`)
      .setBackground('#E8F0FE')
      .setBold(true)
      .setRanges([cell])
      .build();
    
    const rules = sheet.getConditionalFormatRules();
    rules.push(rule);
    sheet.setConditionalFormatRules(rules);
    
    return `✅ Rerun helper created for cell ${cellAddress}. Hover over the cell to see rerun instructions.`;
    
  } catch (error) {
    return `❌ Failed to create rerun button: ${error.message}`;
  }
}

/**
 * Configuration function - Run this once to set up your API endpoint
 * Replace the URL with your actual deployment URL
 */
function configureApiEndpoint() {
  // REPLACE THIS URL with your actual deployment URL:
  // For Vercel: https://your-project-name.vercel.app/api/rewrite
  // For Netlify: https://your-site-name.netlify.app/api/rewrite
  const apiUrl = 'REPLACE_WITH_YOUR_ACTUAL_URL';
  
  if (apiUrl === 'REPLACE_WITH_YOUR_ACTUAL_URL') {
    console.error('Please update the apiUrl in configureApiEndpoint() function with your actual deployment URL');
    return '❌ Please update the apiUrl in configureApiEndpoint() function with your actual deployment URL';
  }
  
  setApiEndpoint(apiUrl);
  
  console.log('API endpoint configured successfully');
  return '✅ API endpoint configured successfully!';
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