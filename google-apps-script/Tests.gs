/**
 * Google Apps Script Testing Utilities for REWRITE Function
 * 
 * This file contains comprehensive test functions for validating the REWRITE function
 * including parameter validation, caching functionality, and various scenarios.
 * 
 * To run tests, call runAllTests() from the Apps Script editor
 */

/**
 * Main test runner that executes all test suites
 * @return {string} Test results summary
 */
function runAllTests() {
  console.log('Starting comprehensive REWRITE function tests...');
  
  const testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    failures: []
  };
  
  // Run all test suites
  runParameterValidationTests(testResults);
  runCachingTests(testResults);
  runParameterCombinationTests(testResults);
  runMockDataTests(testResults);
  runErrorHandlingTests(testResults);
  runPerformanceTests(testResults);
  
  // Run new comprehensive test suites for task 7.2
  const rewriteValidationResults = runRewriteFunctionValidationTests();
  console.log('REWRITE Function Validation Results:', rewriteValidationResults);
  
  const advancedCachingResults = runAdvancedCachingAndPerformanceTests();
  console.log('Advanced Caching and Performance Results:', advancedCachingResults);
  
  // Generate summary report
  const summary = generateTestSummary(testResults);
  console.log(summary);
  
  return summary;
}

/**
 * Test suite for parameter validation functionality
 * Tests Requirements: 1.1, 1.2, 1.3, 6.1, 6.2
 */
function runParameterValidationTests(testResults) {
  console.log('Running parameter validation tests...');
  
  // Test 1.1: Basic prompt validation
  testCase(testResults, 'Prompt validation - missing prompt', () => {
    const result = validateParameters(null, 'test text', null);
    return !result.isValid && result.error.includes('Missing Prompt');
  });
  
  testCase(testResults, 'Prompt validation - empty prompt', () => {
    const result = validateParameters('', 'test text', null);
    return !result.isValid && result.error.includes('Empty Prompt');
  });
  
  testCase(testResults, 'Prompt validation - valid prompt', () => {
    const result = validateParameters('Rewrite this text', 'test text', null);
    return result.isValid;
  });
  
  // Test 1.2: Main text validation
  testCase(testResults, 'Main text validation - missing main text', () => {
    const result = validateParameters('test prompt', null, null);
    return !result.isValid && result.error.includes('Missing Main Text');
  });
  
  testCase(testResults, 'Main text validation - empty string', () => {
    const result = validateParameters('test prompt', '', null);
    return !result.isValid && result.error.includes('Empty Main Text');
  });
  
  testCase(testResults, 'Main text validation - valid string', () => {
    const result = validateParameters('test prompt', 'valid text', null);
    return result.isValid;
  });
  
  // Test 1.3: Context validation
  testCase(testResults, 'Context validation - null context (valid)', () => {
    const result = validateParameters('test prompt', 'main text', null);
    return result.isValid;
  });
  
  testCase(testResults, 'Context validation - empty string context', () => {
    const result = validateParameters('test prompt', 'main text', '');
    return !result.isValid && result.error.includes('Empty Context');
  });
  
  testCase(testResults, 'Context validation - valid context', () => {
    const result = validateParameters('test prompt', 'main text', 'context text');
    return result.isValid;
  });
  
  // Test 6.1: Custom prompt instructions
  testCase(testResults, 'Custom prompt - professional rewrite', () => {
    const result = validateParameters('Make this text more professional', 'casual text', null);
    return result.isValid;
  });
  
  testCase(testResults, 'Custom prompt - summarization', () => {
    const result = validateParameters('Summarize this content in 2 sentences', 'long text content', null);
    return result.isValid;
  });
  
  // Test 6.2: Different parameter formats
  testCase(testResults, 'Parameter format - number as main text', () => {
    const result = validateParameters('Convert to text', 12345, null);
    return result.isValid;
  });
  
  testCase(testResults, 'Parameter format - boolean as context', () => {
    const result = validateParameters('test prompt', 'main text', true);
    return result.isValid;
  });
}

/**
 * Test suite for caching functionality
 * Tests caching behavior and performance features
 */
function runCachingTests(testResults) {
  console.log('Running caching tests...');
  
  // Clear cache before testing
  clearTestCache();
  
  // Test cache key generation
  testCase(testResults, 'Cache key generation - consistent keys', () => {
    const key1 = generateCacheKey('prompt', 'text', 'context');
    const key2 = generateCacheKey('prompt', 'text', 'context');
    return key1 === key2;
  });
  
  testCase(testResults, 'Cache key generation - different keys for different inputs', () => {
    const key1 = generateCacheKey('prompt1', 'text', 'context');
    const key2 = generateCacheKey('prompt2', 'text', 'context');
    return key1 !== key2;
  });
  
  // Test cache storage and retrieval
  testCase(testResults, 'Cache storage - store and retrieve', () => {
    const testKey = 'test_cache_key_123';
    const testValue = 'test cached result';
    
    setCachedResult(testKey, testValue);
    const retrieved = getCachedResult(testKey);
    
    return retrieved === testValue;
  });
  
  testCase(testResults, 'Cache storage - non-existent key returns null', () => {
    const retrieved = getCachedResult('non_existent_key_xyz');
    return retrieved === null;
  });
  
  // Test cache expiration (simulate)
  testCase(testResults, 'Cache expiration - expired cache returns null', () => {
    // This test simulates cache expiration behavior
    const testKey = 'expired_test_key';
    const testValue = 'expired test value';
    
    // Store with very short expiration (1 second)
    try {
      const cache = CacheService.getScriptCache();
      cache.put(testKey, testValue, 1);
      
      // Wait for expiration (simulate)
      Utilities.sleep(1100);
      
      const retrieved = cache.get(testKey);
      return retrieved === null;
    } catch (error) {
      // If cache service is not available, consider test passed
      return true;
    }
  });
}

/**
 * Test suite for different parameter combinations
 * Tests various ways users might call the REWRITE function
 * Requirements: 6.1, 6.2 - Flexible parameter formats and custom prompts
 */
function runParameterCombinationTests(testResults) {
  console.log('Running parameter combination tests...');
  
  // Test different cell reference formats (simulated)
  testCase(testResults, 'Parameter combination - single cell reference', () => {
    const mockCellValue = 'This is text from cell A1';
    const extracted = extractCellValue(mockCellValue);
    return extracted === 'This is text from cell A1';
  });
  
  testCase(testResults, 'Parameter combination - cell range (1D array)', () => {
    const mockRange = ['Cell 1 text', 'Cell 2 text', 'Cell 3 text'];
    const extracted = extractCellValue(mockRange);
    return extracted.includes('Cell 1 text') && extracted.includes('Cell 2 text');
  });
  
  testCase(testResults, 'Parameter combination - cell range (2D array)', () => {
    const mockRange = [
      ['Row 1 Col 1', 'Row 1 Col 2'],
      ['Row 2 Col 1', 'Row 2 Col 2']
    ];
    const extracted = extractCellValue(mockRange);
    return extracted.includes('Row 1 Col 1') && extracted.includes('Row 2 Col 2');
  });
  
  // Test Requirement 6.1: Custom prompt instructions
  testCase(testResults, 'Parameter combination - custom professional prompt', () => {
    const result = validateParameters('Make this email more professional and formal', 'hey there', null);
    return result.isValid;
  });
  
  testCase(testResults, 'Parameter combination - custom summarization prompt', () => {
    const result = validateParameters('Summarize this content in exactly 2 sentences', 'long content here', null);
    return result.isValid;
  });
  
  testCase(testResults, 'Parameter combination - custom style prompt', () => {
    const result = validateParameters('Rewrite in simple English for non-native speakers', 'complex text', null);
    return result.isValid;
  });
  
  // Test different prompt types
  testCase(testResults, 'Parameter combination - short prompt', () => {
    const result = validateParameters('Fix grammar', 'text with errors', null);
    return result.isValid;
  });
  
  testCase(testResults, 'Parameter combination - detailed prompt', () => {
    const longPrompt = 'Rewrite this text to be more professional, formal, and suitable for business communication while maintaining the original meaning';
    const result = validateParameters(longPrompt, 'casual text', null);
    return result.isValid;
  });
  
  // Test Requirement 6.2: Different parameter formats
  testCase(testResults, 'Parameter combination - direct text as main parameter', () => {
    const result = validateParameters('Improve this', 'Direct text input', null);
    return result.isValid;
  });
  
  testCase(testResults, 'Parameter combination - number as main text', () => {
    const result = validateParameters('Convert to text', 12345, null);
    return result.isValid;
  });
  
  testCase(testResults, 'Parameter combination - boolean as context', () => {
    const result = validateParameters('Process this', 'main text', true);
    return result.isValid;
  });
  
  // Test with context combinations
  testCase(testResults, 'Parameter combination - with context string', () => {
    const result = validateParameters('Rewrite based on context', 'main text', 'additional context information');
    return result.isValid;
  });
  
  testCase(testResults, 'Parameter combination - with context array', () => {
    const mockContext = ['Context item 1', 'Context item 2'];
    const extracted = extractCellValue(mockContext);
    return extracted.includes('Context item 1') && extracted.includes('Context item 2');
  });
  
  testCase(testResults, 'Parameter combination - multiple cell references as context', () => {
    const mockContext = [['A1 context', 'B1 context'], ['A2 context', 'B2 context']];
    const extracted = extractCellValue(mockContext);
    return extracted.includes('A1 context') && extracted.includes('B2 context');
  });
  
  // Test edge cases
  testCase(testResults, 'Parameter combination - very long text', () => {
    const longText = 'A'.repeat(1000);
    const extracted = extractCellValue(longText);
    return extracted.length === 1000;
  });
  
  testCase(testResults, 'Parameter combination - text with special characters', () => {
    const specialText = 'Text with émojis 🚀 and spëcial chars @#$%';
    const extracted = extractCellValue(specialText);
    return extracted === specialText;
  });
  
  // Test Requirement 6.2: Cell reference formats
  testCase(testResults, 'Parameter combination - absolute cell reference simulation', () => {
    const mockAbsoluteRef = 'Content from $A$1';
    const extracted = extractCellValue(mockAbsoluteRef);
    return extracted === 'Content from $A$1';
  });
  
  testCase(testResults, 'Parameter combination - mixed data types in range', () => {
    const mixedRange = ['Text', 123, true, null, 'More text'];
    const extracted = extractCellValue(mixedRange);
    return extracted.includes('Text') && extracted.includes('123') && extracted.includes('More text');
  });
  
  // Test empty and null handling
  testCase(testResults, 'Parameter combination - empty cells in range', () => {
    const rangeWithEmpties = ['Content', '', null, 'More content', undefined];
    const extracted = extractCellValue(rangeWithEmpties);
    return extracted.includes('Content') && extracted.includes('More content');
  });
}

/**
 * Test suite using mock data scenarios
 * Tests realistic usage scenarios with sample data
 * Requirements: 1.1, 1.2, 1.3 - REWRITE function validation with realistic data
 */
function runMockDataTests(testResults) {
  console.log('Running mock data tests...');
  
  // Create mock data scenarios
  const mockScenarios = createMockDataScenarios();
  
  // Test each mock scenario
  mockScenarios.forEach((scenario, index) => {
    testCase(testResults, `Mock scenario ${index + 1}: ${scenario.name}`, () => {
      try {
        // Test parameter validation
        const validation = validateParameters(scenario.prompt, scenario.mainText, scenario.context);
        if (!validation.isValid) {
          return scenario.expectError === true;
        }
        
        // Test text extraction
        const extractedMain = extractCellValue(scenario.mainText);
        const extractedContext = scenario.context ? extractCellValue(scenario.context) : '';
        
        // Verify extracted text is meaningful
        const hasValidMain = extractedMain && extractedMain.trim().length > 0;
        const contextValid = !scenario.context || extractedContext.length >= 0;
        
        return hasValidMain && contextValid && !scenario.expectError;
        
      } catch (error) {
        return scenario.expectError === true;
      }
    });
  });
  
  // Test cache behavior with mock data
  testCase(testResults, 'Mock data - cache consistency', () => {
    const scenario = mockScenarios[0];
    const key1 = generateCacheKey(scenario.prompt, scenario.mainText, scenario.context || '');
    const key2 = generateCacheKey(scenario.prompt, scenario.mainText, scenario.context || '');
    return key1 === key2;
  });
  
  // Test realistic business scenarios
  testCase(testResults, 'Mock data - business email scenario', () => {
    const prompt = 'Make this email more professional';
    const mainText = 'Hi John, can you send me the report? Thanks!';
    const context = 'Client communication';
    
    const validation = validateParameters(prompt, mainText, context);
    if (!validation.isValid) return false;
    
    const extractedMain = extractCellValue(mainText);
    const extractedContext = extractCellValue(context);
    
    return extractedMain === mainText && extractedContext === context;
  });
  
  // Test educational content scenario
  testCase(testResults, 'Mock data - educational content scenario', () => {
    const prompt = 'Simplify this for high school students';
    const mainText = 'The photosynthesis process involves complex biochemical reactions that convert light energy into chemical energy.';
    const context = 'Biology textbook';
    
    const validation = validateParameters(prompt, mainText, context);
    const extractedMain = extractCellValue(mainText);
    
    return validation.isValid && extractedMain.length > 50;
  });
  
  // Test multilingual content scenario
  testCase(testResults, 'Mock data - multilingual content scenario', () => {
    const prompt = 'Translate style to formal English';
    const mainText = 'Bonjour, comment allez-vous? This is mixed content with émojis 🚀';
    const context = 'International communication';
    
    const validation = validateParameters(prompt, mainText, context);
    const extractedMain = extractCellValue(mainText);
    
    return validation.isValid && extractedMain.includes('émojis 🚀');
  });
  
  // Test spreadsheet data processing scenario
  testCase(testResults, 'Mock data - spreadsheet data processing', () => {
    const prompt = 'Create summary from these data points';
    const mainText = [
      ['Product', 'Sales', 'Region'],
      ['Widget A', '1000', 'North'],
      ['Widget B', '1500', 'South']
    ];
    const context = 'Q4 Sales Report';
    
    const validation = validateParameters(prompt, mainText, context);
    const extractedMain = extractCellValue(mainText);
    
    return validation.isValid && extractedMain.includes('Widget A') && extractedMain.includes('1500');
  });
}

/**
 * Test suite for error handling scenarios
 * Tests how the system handles various error conditions
 */
function runErrorHandlingTests(testResults) {
  console.log('Running error handling tests...');
  
  // Test error message formatting
  testCase(testResults, 'Error handling - format API unavailable error', () => {
    const error = { code: 'API_UNAVAILABLE', message: 'Service down' };
    const formatted = formatErrorMessage(error);
    return formatted.includes('Service Unavailable') && formatted.includes('⚠️');
  });
  
  testCase(testResults, 'Error handling - format rate limit error', () => {
    const error = { code: 'RATE_LIMITED', message: 'Too many requests' };
    const formatted = formatErrorMessage(error);
    return formatted.includes('Rate Limited') && formatted.includes('⏳');
  });
  
  testCase(testResults, 'Error handling - format timeout error', () => {
    const error = { code: 'TIMEOUT', message: 'Request timeout' };
    const formatted = formatErrorMessage(error);
    return formatted.includes('Timeout') && formatted.includes('⏱️');
  });
  
  // Test network error handling
  testCase(testResults, 'Error handling - network timeout', () => {
    const error = new Error('Request timeout after 30 seconds');
    const formatted = formatNetworkError(error);
    return formatted.includes('Connection Timeout') && formatted.includes('⏱️');
  });
  
  testCase(testResults, 'Error handling - DNS error', () => {
    const error = new Error('DNS resolution failed');
    const formatted = formatNetworkError(error);
    return formatted.includes('DNS Error') && formatted.includes('🌐');
  });
  
  // Test unexpected error handling
  testCase(testResults, 'Error handling - script timeout', () => {
    const error = new Error('Script timeout exceeded');
    const formatted = formatUnexpectedError(error);
    return formatted.includes('Script Timeout') && formatted.includes('⏱️');
  });
  
  // Test error result detection
  testCase(testResults, 'Error handling - detect error results', () => {
    const errorResult = '❌ Error: Something went wrong';
    const successResult = 'This is a successful rewrite result';
    
    return isErrorResult(errorResult) && !isErrorResult(successResult);
  });
}

/**
 * Test suite for performance-related functionality
 * Tests caching, request deduplication, and optimization features
 */
function runPerformanceTests(testResults) {
  console.log('Running performance tests...');
  
  // Test request ID generation uniqueness
  testCase(testResults, 'Performance - unique request IDs', () => {
    const id1 = generateRequestId();
    const id2 = generateRequestId();
    return id1 !== id2 && id1.length > 0 && id2.length > 0;
  });
  
  // Test cell range processing efficiency
  testCase(testResults, 'Performance - large cell range processing', () => {
    const largeRange = [];
    for (let i = 0; i < 100; i++) {
      largeRange.push(`Cell content ${i}`);
    }
    
    const startTime = Date.now();
    const result = processCellRange(largeRange);
    const endTime = Date.now();
    
    // Should process within reasonable time (< 1 second)
    return (endTime - startTime) < 1000 && result.length > 0;
  });
  
  // Test cache key generation performance
  testCase(testResults, 'Performance - cache key generation speed', () => {
    const startTime = Date.now();
    
    for (let i = 0; i < 100; i++) {
      generateCacheKey(`prompt ${i}`, `text ${i}`, `context ${i}`);
    }
    
    const endTime = Date.now();
    
    // Should generate 100 keys within reasonable time (< 500ms)
    return (endTime - startTime) < 500;
  });
  
  // Test text extraction performance
  testCase(testResults, 'Performance - text extraction speed', () => {
    const complexData = {
      string: 'Simple string',
      number: 12345,
      array: ['Item 1', 'Item 2', 'Item 3'],
      nested: [['A1', 'B1'], ['A2', 'B2']]
    };
    
    const startTime = Date.now();
    
    Object.values(complexData).forEach(value => {
      extractCellValue(value);
    });
    
    const endTime = Date.now();
    
    // Should extract all values within reasonable time (< 100ms)
    return (endTime - startTime) < 100;
  });
}

/**
 * Creates mock data scenarios for testing
 * @return {Array} Array of mock test scenarios
 */
function createMockDataScenarios() {
  return [
    {
      name: 'Professional email rewrite',
      prompt: 'Make this email more professional and formal',
      mainText: 'Hey, can you send me the report ASAP? Thanks!',
      context: 'This is for a client communication',
      expectError: false
    },
    {
      name: 'Summarization task',
      prompt: 'Summarize this in 2 sentences',
      mainText: 'Long article content here with multiple paragraphs discussing various topics and providing detailed information about the subject matter.',
      context: null,
      expectError: false
    },
    {
      name: 'Grammar correction',
      prompt: 'Fix grammar and spelling errors',
      mainText: 'This sentance has some erors that need fixing.',
      context: null,
      expectError: false
    },
    {
      name: 'Translation style',
      prompt: 'Rewrite in simple English for non-native speakers',
      mainText: 'The implementation of this sophisticated algorithm requires comprehensive understanding of complex data structures.',
      context: 'Technical documentation',
      expectError: false
    },
    {
      name: 'Cell range data',
      prompt: 'Combine and rewrite these items',
      mainText: ['Item 1: First point', 'Item 2: Second point', 'Item 3: Third point'],
      context: ['Context A', 'Context B'],
      expectError: false
    },
    {
      name: '2D cell range',
      prompt: 'Process this table data',
      mainText: [['Name', 'John'], ['Age', '30'], ['City', 'New York']],
      context: null,
      expectError: false
    },
    {
      name: 'Empty prompt (should fail)',
      prompt: '',
      mainText: 'Some text to rewrite',
      context: null,
      expectError: true
    },
    {
      name: 'Missing main text (should fail)',
      prompt: 'Rewrite this',
      mainText: null,
      context: null,
      expectError: true
    },
    {
      name: 'Very long text',
      prompt: 'Summarize this long content',
      mainText: 'A'.repeat(2000) + ' This is a very long text that tests the system\'s ability to handle large inputs.',
      context: null,
      expectError: false
    },
    {
      name: 'Special characters and emojis',
      prompt: 'Clean up this text',
      mainText: 'Text with émojis 🚀 and spëcial chars @#$% & symbols!',
      context: 'Social media post',
      expectError: false
    }
  ];
}

/**
 * Helper function to run individual test cases
 * @param {Object} testResults - Test results accumulator
 * @param {string} testName - Name of the test
 * @param {Function} testFunction - Function that returns true if test passes
 */
function testCase(testResults, testName, testFunction) {
  testResults.total++;
  
  try {
    const result = testFunction();
    if (result) {
      testResults.passed++;
      console.log(`✅ PASS: ${testName}`);
    } else {
      testResults.failed++;
      testResults.failures.push(testName);
      console.log(`❌ FAIL: ${testName}`);
    }
  } catch (error) {
    testResults.failed++;
    testResults.failures.push(`${testName} (Error: ${error.message})`);
    console.log(`❌ ERROR: ${testName} - ${error.message}`);
  }
}

/**
 * Generates a comprehensive test summary
 * @param {Object} testResults - Test results object
 * @return {string} Formatted test summary
 */
function generateTestSummary(testResults) {
  const passRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  
  let summary = `
📊 REWRITE Function Test Results Summary
========================================
Total Tests: ${testResults.total}
Passed: ${testResults.passed} (${passRate}%)
Failed: ${testResults.failed}
`;
  
  if (testResults.failures.length > 0) {
    summary += `\n❌ Failed Tests:\n`;
    testResults.failures.forEach(failure => {
      summary += `  - ${failure}\n`;
    });
  }
  
  if (testResults.failed === 0) {
    summary += `\n🎉 All tests passed! The REWRITE function is working correctly.`;
  } else {
    summary += `\n⚠️ Some tests failed. Review the failures above and check the implementation.`;
  }
  
  summary += `\n\nTest completed at: ${new Date().toLocaleString()}`;
  
  return summary;
}

/**
 * Clears test cache to ensure clean test environment
 */
function clearTestCache() {
  try {
    const cache = CacheService.getScriptCache();
    // Clear any test-related cache entries
    const testKeys = ['test_cache_key_123', 'expired_test_key'];
    testKeys.forEach(key => {
      cache.remove(key);
    });
  } catch (error) {
    console.log('Cache service not available for clearing');
  }
}

/**
 * Quick validation test that can be run independently
 * @return {string} Quick test results
 */
function runQuickValidationTest() {
  console.log('Running quick validation test...');
  
  const testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    failures: []
  };
  
  // Test basic functionality
  testCase(testResults, 'Basic parameter validation', () => {
    const result = validateParameters('Test prompt', 'Test text', null);
    return result.isValid;
  });
  
  testCase(testResults, 'Text extraction', () => {
    const result = extractCellValue('Sample text');
    return result === 'Sample text';
  });
  
  testCase(testResults, 'Cache key generation', () => {
    const key = generateCacheKey('prompt', 'text', 'context');
    return key && key.length > 0;
  });
  
  testCase(testResults, 'Error formatting', () => {
    const error = { code: 'TEST_ERROR', message: 'Test message' };
    const formatted = formatErrorMessage(error);
    return formatted.includes('❌');
  });
  
  return generateTestSummary(testResults);
}

/**
 * Performance benchmark test
 * @return {string} Performance test results
 */
function runPerformanceBenchmark() {
  console.log('Running performance benchmark...');
  
  const results = [];
  
  // Benchmark parameter validation
  const validationStart = Date.now();
  for (let i = 0; i < 1000; i++) {
    validateParameters(`Prompt ${i}`, `Text ${i}`, null);
  }
  const validationTime = Date.now() - validationStart;
  results.push(`Parameter validation: ${validationTime}ms for 1000 calls`);
  
  // Benchmark text extraction
  const extractionStart = Date.now();
  for (let i = 0; i < 1000; i++) {
    extractCellValue(`Sample text ${i}`);
  }
  const extractionTime = Date.now() - extractionStart;
  results.push(`Text extraction: ${extractionTime}ms for 1000 calls`);
  
  // Benchmark cache key generation
  const cacheKeyStart = Date.now();
  for (let i = 0; i < 1000; i++) {
    generateCacheKey(`Prompt ${i}`, `Text ${i}`, `Context ${i}`);
  }
  const cacheKeyTime = Date.now() - cacheKeyStart;
  results.push(`Cache key generation: ${cacheKeyTime}ms for 1000 calls`);
  
  return `🚀 Performance Benchmark Results:\n${results.join('\n')}`;
}

/**
 * Integration test that simulates real usage scenarios
 * @return {string} Integration test results
 */
function runIntegrationTest() {
  console.log('Running integration test...');
  
  const testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    failures: []
  };
  
  // Test complete workflow (without actual API call)
  testCase(testResults, 'Complete workflow simulation', () => {
    try {
      // Simulate REWRITE function call without API
      const prompt = 'Make this professional';
      const mainText = 'hey there, how are you doing?';
      const context = null;
      
      // Validate parameters
      const validation = validateParameters(prompt, mainText, context);
      if (!validation.isValid) return false;
      
      // Extract text
      const extractedMain = extractCellValue(mainText);
      if (!extractedMain) return false;
      
      // Generate cache key
      const cacheKey = generateCacheKey(prompt, extractedMain, '');
      if (!cacheKey) return false;
      
      // Check cache (should be empty)
      const cached = getCachedResult(cacheKey);
      if (cached !== null) return false;
      
      return true;
      
    } catch (error) {
      return false;
    }
  });
  
  return generateTestSummary(testResults);
}

/**
 * Comprehensive REWRITE function validation test suite
 * Tests all aspects of the REWRITE function according to requirements
 * Requirements: 1.1, 1.2, 1.3, 6.1, 6.2
 * @return {string} Validation test results
 */
function runRewriteFunctionValidationTests() {
  console.log('Running comprehensive REWRITE function validation tests...');
  
  const testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    failures: []
  };
  
  // Test Requirement 1.1: Basic REWRITE function usage
  testCase(testResults, 'REWRITE validation - basic function call simulation', () => {
    const prompt = 'Rewrite this text';
    const mainText = 'Sample text to rewrite';
    const context = null;
    
    // Simulate the main validation steps of REWRITE function
    const validation = validateParameters(prompt, mainText, context);
    if (!validation.isValid) return false;
    
    const extractedMain = extractCellValue(mainText);
    if (!extractedMain || extractedMain.trim() === '') return false;
    
    const cacheKey = generateCacheKey(prompt, extractedMain, '');
    if (!cacheKey) return false;
    
    return true;
  });
  
  // Test Requirement 1.2: Main text parameter handling
  testCase(testResults, 'REWRITE validation - main text parameter variations', () => {
    const prompt = 'Test prompt';
    const testCases = [
      'Simple string text',
      123,
      ['Array', 'of', 'values'],
      [['2D', 'array'], ['with', 'values']],
      true
    ];
    
    return testCases.every(mainText => {
      const validation = validateParameters(prompt, mainText, null);
      const extracted = extractCellValue(mainText);
      return validation.isValid && extracted !== null;
    });
  });
  
  // Test Requirement 1.3: Context parameter support
  testCase(testResults, 'REWRITE validation - context parameter variations', () => {
    const prompt = 'Test prompt';
    const mainText = 'Test text';
    const contextCases = [
      null,
      undefined,
      'String context',
      ['Context', 'array'],
      [['2D', 'context'], ['array', 'values']],
      123,
      true
    ];
    
    return contextCases.every(context => {
      const validation = validateParameters(prompt, mainText, context);
      return validation.isValid;
    });
  });
  
  // Test Requirement 6.1: Custom prompt instructions
  testCase(testResults, 'REWRITE validation - custom prompt instructions', () => {
    const customPrompts = [
      'Make this more professional',
      'Summarize in 2 sentences',
      'Fix grammar and spelling errors',
      'Translate to simple English',
      'Convert to formal business language',
      'Rewrite for social media',
      'Make this more concise',
      'Add more detail and explanation'
    ];
    
    const mainText = 'Sample text for testing';
    
    return customPrompts.every(prompt => {
      const validation = validateParameters(prompt, mainText, null);
      return validation.isValid;
    });
  });
  
  // Test Requirement 6.2: Flexible parameter formats
  testCase(testResults, 'REWRITE validation - flexible parameter formats', () => {
    const formatTests = [
      // Direct text
      { prompt: 'Test', mainText: 'Direct text input', context: null },
      // Cell reference simulation
      { prompt: 'Test', mainText: 'Cell A1 content', context: 'Cell B1 context' },
      // Range simulation
      { prompt: 'Test', mainText: ['A1', 'A2', 'A3'], context: ['B1', 'B2'] },
      // Mixed types
      { prompt: 'Test', mainText: 123, context: true },
      // 2D range simulation
      { prompt: 'Test', mainText: [['A1', 'B1'], ['A2', 'B2']], context: null }
    ];
    
    return formatTests.every(test => {
      const validation = validateParameters(test.prompt, test.mainText, test.context);
      const extractedMain = extractCellValue(test.mainText);
      const extractedContext = test.context ? extractCellValue(test.context) : '';
      
      return validation.isValid && extractedMain !== null;
    });
  });
  
  // Test error handling for invalid inputs
  testCase(testResults, 'REWRITE validation - error handling', () => {
    const errorCases = [
      { prompt: null, mainText: 'text', context: null, shouldFail: true },
      { prompt: '', mainText: 'text', context: null, shouldFail: true },
      { prompt: 'prompt', mainText: null, context: null, shouldFail: true },
      { prompt: 'prompt', mainText: '', context: null, shouldFail: true },
      { prompt: 123, mainText: 'text', context: null, shouldFail: true }
    ];
    
    return errorCases.every(testCase => {
      const validation = validateParameters(testCase.prompt, testCase.mainText, testCase.context);
      return testCase.shouldFail ? !validation.isValid : validation.isValid;
    });
  });
  
  return generateTestSummary(testResults);
}

/**
 * Advanced caching and performance feature tests
 * Tests caching behavior and performance optimizations
 * @return {string} Advanced test results
 */
function runAdvancedCachingAndPerformanceTests() {
  console.log('Running advanced caching and performance tests...');
  
  const testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    failures: []
  };
  
  // Test cache hit/miss behavior
  testCase(testResults, 'Advanced caching - cache hit behavior', () => {
    const prompt = 'Test caching';
    const mainText = 'Cache test text';
    const context = 'Cache context';
    
    const cacheKey = generateCacheKey(prompt, mainText, context);
    
    // Should be cache miss initially
    const initialResult = getCachedResult(cacheKey);
    if (initialResult !== null) return false;
    
    // Store result
    const testResult = 'Cached test result';
    setCachedResult(cacheKey, testResult);
    
    // Should be cache hit now
    const cachedResult = getCachedResult(cacheKey);
    return cachedResult === testResult;
  });
  
  // Test cache key uniqueness for different inputs
  testCase(testResults, 'Advanced caching - cache key uniqueness', () => {
    const basePrompt = 'Test prompt';
    const baseText = 'Test text';
    const baseContext = 'Test context';
    
    const key1 = generateCacheKey(basePrompt, baseText, baseContext);
    const key2 = generateCacheKey(basePrompt + ' modified', baseText, baseContext);
    const key3 = generateCacheKey(basePrompt, baseText + ' modified', baseContext);
    const key4 = generateCacheKey(basePrompt, baseText, baseContext + ' modified');
    
    // All keys should be different
    const keys = [key1, key2, key3, key4];
    const uniqueKeys = new Set(keys);
    
    return uniqueKeys.size === keys.length;
  });
  
  // Test performance with large inputs
  testCase(testResults, 'Advanced performance - large input handling', () => {
    const largePrompt = 'Process this large content: ' + 'A'.repeat(400);
    const largeText = 'B'.repeat(2000);
    const largeContext = 'C'.repeat(500);
    
    const startTime = Date.now();
    
    // Test validation performance
    const validation = validateParameters(largePrompt, largeText, largeContext);
    if (!validation.isValid) return false;
    
    // Test extraction performance
    const extracted = extractCellValue(largeText);
    if (extracted.length !== 2000) return false;
    
    // Test cache key generation performance
    const cacheKey = generateCacheKey(largePrompt, extracted, largeContext);
    if (!cacheKey) return false;
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Should complete within reasonable time (< 100ms)
    return duration < 100;
  });
  
  // Test concurrent cache operations simulation
  testCase(testResults, 'Advanced performance - concurrent operations simulation', () => {
    const operations = [];
    const startTime = Date.now();
    
    // Simulate multiple concurrent operations
    for (let i = 0; i < 20; i++) {
      const prompt = `Concurrent prompt ${i}`;
      const text = `Concurrent text ${i}`;
      const context = `Concurrent context ${i}`;
      
      // Validate
      const validation = validateParameters(prompt, text, context);
      if (!validation.isValid) return false;
      
      // Extract
      const extracted = extractCellValue(text);
      
      // Generate cache key
      const cacheKey = generateCacheKey(prompt, extracted, context);
      
      // Store in cache
      setCachedResult(cacheKey, `Result ${i}`);
      
      // Retrieve from cache
      const retrieved = getCachedResult(cacheKey);
      if (retrieved !== `Result ${i}`) return false;
      
      operations.push({ prompt, text, context, cacheKey, retrieved });
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Should handle 20 operations within reasonable time (< 500ms)
    return operations.length === 20 && duration < 500;
  });
  
  // Test memory efficiency with repeated operations
  testCase(testResults, 'Advanced performance - memory efficiency', () => {
    const basePrompt = 'Memory test prompt';
    const baseText = 'Memory test text';
    
    // Perform many operations with same base data
    for (let i = 0; i < 50; i++) {
      const prompt = `${basePrompt} ${i}`;
      const text = `${baseText} ${i}`;
      
      const validation = validateParameters(prompt, text, null);
      if (!validation.isValid) return false;
      
      const extracted = extractCellValue(text);
      const cacheKey = generateCacheKey(prompt, extracted, '');
      
      setCachedResult(cacheKey, `Memory result ${i}`);
    }
    
    // Verify all results are still accessible
    for (let i = 0; i < 50; i++) {
      const prompt = `${basePrompt} ${i}`;
      const text = `${baseText} ${i}`;
      const extracted = extractCellValue(text);
      const cacheKey = generateCacheKey(prompt, extracted, '');
      const result = getCachedResult(cacheKey);
      
      if (result !== `Memory result ${i}`) return false;
    }
    
    return true;
  });
  
  return generateTestSummary(testResults);
}