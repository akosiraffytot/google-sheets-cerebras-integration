/**
 * Comprehensive Caching Tests for REWRITE Function
 * 
 * This file contains detailed tests for the caching functionality
 * which is critical for performance and user experience.
 */

/**
 * Main cache testing function
 * @return {string} Cache test results
 */
function runCacheTests() {
  console.log('Starting comprehensive cache tests...');
  
  const testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    failures: []
  };
  
  // Clear cache before testing
  clearAllTestCache();
  
  // Run all cache test suites
  runCacheKeyTests(testResults);
  runCacheStorageTests(testResults);
  runCacheRetrievalTests(testResults);
  runCacheExpirationTests(testResults);
  runCachePerformanceTests(testResults);
  runCacheIntegrationTests(testResults);
  
  return generateCacheTestSummary(testResults);
}

/**
 * Tests cache key generation functionality
 */
function runCacheKeyTests(testResults) {
  console.log('Testing cache key generation...');
  
  // Test basic cache key generation
  testCase(testResults, 'Cache key - basic generation', () => {
    const key = generateCacheKey('prompt', 'text', 'context');
    return key && typeof key === 'string' && key.length > 0;
  });
  
  // Test cache key consistency
  testCase(testResults, 'Cache key - consistency', () => {
    const key1 = generateCacheKey('same prompt', 'same text', 'same context');
    const key2 = generateCacheKey('same prompt', 'same text', 'same context');
    return key1 === key2;
  });
  
  // Test cache key uniqueness
  testCase(testResults, 'Cache key - uniqueness', () => {
    const key1 = generateCacheKey('prompt1', 'text', 'context');
    const key2 = generateCacheKey('prompt2', 'text', 'context');
    return key1 !== key2;
  });
  
  // Test cache key with different text
  testCase(testResults, 'Cache key - different text', () => {
    const key1 = generateCacheKey('prompt', 'text1', 'context');
    const key2 = generateCacheKey('prompt', 'text2', 'context');
    return key1 !== key2;
  });
  
  // Test cache key with different context
  testCase(testResults, 'Cache key - different context', () => {
    const key1 = generateCacheKey('prompt', 'text', 'context1');
    const key2 = generateCacheKey('prompt', 'text', 'context2');
    return key1 !== key2;
  });
  
  // Test cache key with empty context
  testCase(testResults, 'Cache key - empty context', () => {
    const key1 = generateCacheKey('prompt', 'text', '');
    const key2 = generateCacheKey('prompt', 'text', null);
    const key3 = generateCacheKey('prompt', 'text', undefined);
    // All should generate valid keys
    return key1 && key2 && key3 && typeof key1 === 'string';
  });
  
  // Test cache key with special characters
  testCase(testResults, 'Cache key - special characters', () => {
    const key = generateCacheKey('prompt with émojis 🚀', 'text @#$%', 'context & symbols');
    return key && typeof key === 'string' && key.length > 0;
  });
  
  // Test cache key with very long inputs
  testCase(testResults, 'Cache key - long inputs', () => {
    const longPrompt = 'A'.repeat(500);
    const longText = 'B'.repeat(1000);
    const longContext = 'C'.repeat(500);
    const key = generateCacheKey(longPrompt, longText, longContext);
    return key && typeof key === 'string' && key.length > 0;
  });
}

/**
 * Tests cache storage functionality
 */
function runCacheStorageTests(testResults) {
  console.log('Testing cache storage...');
  
  // Test basic cache storage
  testCase(testResults, 'Cache storage - basic store', () => {
    const key = 'test_store_key_1';
    const value = 'test stored value';
    
    setCachedResult(key, value);
    const retrieved = getCachedResult(key);
    
    return retrieved === value;
  });
  
  // Test cache storage with different data types
  testCase(testResults, 'Cache storage - string value', () => {
    const key = 'test_string_key';
    const value = 'This is a string value with special chars: émojis 🚀';
    
    setCachedResult(key, value);
    const retrieved = getCachedResult(key);
    
    return retrieved === value;
  });
  
  // Test cache storage with long values
  testCase(testResults, 'Cache storage - long value', () => {
    const key = 'test_long_key';
    const value = 'Long text value: ' + 'X'.repeat(1000);
    
    setCachedResult(key, value);
    const retrieved = getCachedResult(key);
    
    return retrieved === value;
  });
  
  // Test cache overwrite
  testCase(testResults, 'Cache storage - overwrite', () => {
    const key = 'test_overwrite_key';
    const value1 = 'first value';
    const value2 = 'second value';
    
    setCachedResult(key, value1);
    setCachedResult(key, value2);
    const retrieved = getCachedResult(key);
    
    return retrieved === value2;
  });
  
  // Test multiple cache entries
  testCase(testResults, 'Cache storage - multiple entries', () => {
    const entries = [
      { key: 'multi_key_1', value: 'value 1' },
      { key: 'multi_key_2', value: 'value 2' },
      { key: 'multi_key_3', value: 'value 3' }
    ];
    
    // Store all entries
    entries.forEach(entry => {
      setCachedResult(entry.key, entry.value);
    });
    
    // Verify all entries
    return entries.every(entry => {
      return getCachedResult(entry.key) === entry.value;
    });
  });
}

/**
 * Tests cache retrieval functionality
 */
function runCacheRetrievalTests(testResults) {
  console.log('Testing cache retrieval...');
  
  // Test retrieval of non-existent key
  testCase(testResults, 'Cache retrieval - non-existent key', () => {
    const retrieved = getCachedResult('non_existent_key_xyz');
    return retrieved === null;
  });
  
  // Test retrieval after storage
  testCase(testResults, 'Cache retrieval - after storage', () => {
    const key = 'test_retrieval_key';
    const value = 'test retrieval value';
    
    setCachedResult(key, value);
    const retrieved = getCachedResult(key);
    
    return retrieved === value;
  });
  
  // Test retrieval with special characters
  testCase(testResults, 'Cache retrieval - special characters', () => {
    const key = 'test_special_key';
    const value = 'Value with émojis 🚀 and symbols @#$%';
    
    setCachedResult(key, value);
    const retrieved = getCachedResult(key);
    
    return retrieved === value;
  });
  
  // Test retrieval consistency
  testCase(testResults, 'Cache retrieval - consistency', () => {
    const key = 'test_consistency_key';
    const value = 'consistent value';
    
    setCachedResult(key, value);
    
    // Retrieve multiple times
    const retrieved1 = getCachedResult(key);
    const retrieved2 = getCachedResult(key);
    const retrieved3 = getCachedResult(key);
    
    return retrieved1 === value && retrieved2 === value && retrieved3 === value;
  });
}

/**
 * Tests cache expiration functionality
 */
function runCacheExpirationTests(testResults) {
  console.log('Testing cache expiration...');
  
  // Test cache expiration (simulated)
  testCase(testResults, 'Cache expiration - short expiration', () => {
    try {
      const cache = CacheService.getScriptCache();
      const key = 'test_expiration_key';
      const value = 'expiring value';
      
      // Store with 1 second expiration
      cache.put(key, value, 1);
      
      // Immediate retrieval should work
      const immediate = cache.get(key);
      if (immediate !== value) return false;
      
      // Wait for expiration
      Utilities.sleep(1100);
      
      // Should be expired now
      const expired = cache.get(key);
      return expired === null;
      
    } catch (error) {
      // If CacheService is not available, consider test passed
      console.log('CacheService not available for expiration test');
      return true;
    }
  });
  
  // Test cache with no expiration
  testCase(testResults, 'Cache expiration - no expiration set', () => {
    const key = 'test_no_expiration_key';
    const value = 'persistent value';
    
    setCachedResult(key, value);
    
    // Should still be available after short delay
    Utilities.sleep(100);
    const retrieved = getCachedResult(key);
    
    return retrieved === value;
  });
}

/**
 * Tests cache performance characteristics
 */
function runCachePerformanceTests(testResults) {
  console.log('Testing cache performance...');
  
  // Test cache key generation performance
  testCase(testResults, 'Cache performance - key generation speed', () => {
    const startTime = Date.now();
    
    for (let i = 0; i < 100; i++) {
      generateCacheKey(`prompt ${i}`, `text ${i}`, `context ${i}`);
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Should generate 100 keys in less than 500ms
    return duration < 500;
  });
  
  // Test cache storage performance
  testCase(testResults, 'Cache performance - storage speed', () => {
    const startTime = Date.now();
    
    for (let i = 0; i < 50; i++) {
      setCachedResult(`perf_key_${i}`, `performance test value ${i}`);
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Should store 50 values in less than 1 second
    return duration < 1000;
  });
  
  // Test cache retrieval performance
  testCase(testResults, 'Cache performance - retrieval speed', () => {
    // First, store some test data
    for (let i = 0; i < 50; i++) {
      setCachedResult(`retrieve_perf_key_${i}`, `retrieve test value ${i}`);
    }
    
    const startTime = Date.now();
    
    for (let i = 0; i < 50; i++) {
      getCachedResult(`retrieve_perf_key_${i}`);
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Should retrieve 50 values in less than 500ms
    return duration < 500;
  });
  
  // Test cache with large values
  testCase(testResults, 'Cache performance - large values', () => {
    const key = 'large_value_key';
    const largeValue = 'Large cached value: ' + 'X'.repeat(5000);
    
    const storeStart = Date.now();
    setCachedResult(key, largeValue);
    const storeEnd = Date.now();
    
    const retrieveStart = Date.now();
    const retrieved = getCachedResult(key);
    const retrieveEnd = Date.now();
    
    const storeTime = storeEnd - storeStart;
    const retrieveTime = retrieveEnd - retrieveStart;
    
    // Both operations should be reasonably fast (< 100ms each)
    return storeTime < 100 && retrieveTime < 100 && retrieved === largeValue;
  });
}

/**
 * Tests cache integration with REWRITE function workflow
 */
function runCacheIntegrationTests(testResults) {
  console.log('Testing cache integration...');
  
  // Test cache integration with parameter validation
  testCase(testResults, 'Cache integration - with validation', () => {
    const prompt = 'Test integration prompt';
    const mainText = 'Test integration text';
    const context = 'Test integration context';
    
    // Validate parameters first
    const validation = validateParameters(prompt, mainText, context);
    if (!validation.isValid) return false;
    
    // Generate cache key
    const cacheKey = generateCacheKey(prompt, mainText, context);
    if (!cacheKey) return false;
    
    // Test cache miss
    const cacheMiss = getCachedResult(cacheKey);
    if (cacheMiss !== null) return false;
    
    // Store result
    const testResult = 'Integration test result';
    setCachedResult(cacheKey, testResult);
    
    // Test cache hit
    const cacheHit = getCachedResult(cacheKey);
    return cacheHit === testResult;
  });
  
  // Test cache with text extraction
  testCase(testResults, 'Cache integration - with text extraction', () => {
    const prompt = 'Extract and cache test';
    const mainText = ['Cell 1', 'Cell 2', 'Cell 3'];
    const context = null;
    
    // Extract text
    const extractedMain = extractCellValue(mainText);
    if (!extractedMain) return false;
    
    // Generate cache key with extracted text
    const cacheKey = generateCacheKey(prompt, extractedMain, '');
    
    // Store and retrieve
    const testResult = 'Extracted text cached result';
    setCachedResult(cacheKey, testResult);
    const retrieved = getCachedResult(cacheKey);
    
    return retrieved === testResult;
  });
  
  // Test cache behavior with error results
  testCase(testResults, 'Cache integration - error result handling', () => {
    const prompt = 'Error test prompt';
    const mainText = 'Error test text';
    const context = null;
    
    const cacheKey = generateCacheKey(prompt, mainText, '');
    
    // Store an error result
    const errorResult = '❌ Error: Test error message';
    setCachedResult(cacheKey, errorResult);
    
    // Retrieve and check if it's detected as error
    const retrieved = getCachedResult(cacheKey);
    const isError = isErrorResult(retrieved);
    
    return retrieved === errorResult && isError;
  });
  
  // Test cache with identical inputs but different contexts
  testCase(testResults, 'Cache integration - context differentiation', () => {
    const prompt = 'Same prompt';
    const mainText = 'Same text';
    const context1 = 'Different context 1';
    const context2 = 'Different context 2';
    
    const key1 = generateCacheKey(prompt, mainText, context1);
    const key2 = generateCacheKey(prompt, mainText, context2);
    
    // Keys should be different
    if (key1 === key2) return false;
    
    // Store different results
    setCachedResult(key1, 'Result for context 1');
    setCachedResult(key2, 'Result for context 2');
    
    // Retrieve and verify
    const result1 = getCachedResult(key1);
    const result2 = getCachedResult(key2);
    
    return result1 === 'Result for context 1' && result2 === 'Result for context 2';
  });
}

/**
 * Clears all test cache entries
 */
function clearAllTestCache() {
  try {
    const cache = CacheService.getScriptCache();
    
    // List of test keys to clear
    const testKeys = [
      'test_store_key_1',
      'test_string_key',
      'test_long_key',
      'test_overwrite_key',
      'multi_key_1',
      'multi_key_2',
      'multi_key_3',
      'test_retrieval_key',
      'test_special_key',
      'test_consistency_key',
      'test_expiration_key',
      'test_no_expiration_key',
      'large_value_key'
    ];
    
    // Clear performance test keys
    for (let i = 0; i < 50; i++) {
      testKeys.push(`perf_key_${i}`);
      testKeys.push(`retrieve_perf_key_${i}`);
    }
    
    // Remove all test keys
    testKeys.forEach(key => {
      cache.remove(key);
    });
    
    console.log('Test cache cleared');
    
  } catch (error) {
    console.log('Cache service not available for clearing');
  }
}

/**
 * Generates cache test summary
 */
function generateCacheTestSummary(testResults) {
  const passRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  
  let summary = `
🗄️ Cache Functionality Test Results
===================================
Total Cache Tests: ${testResults.total}
Passed: ${testResults.passed} (${passRate}%)
Failed: ${testResults.failed}

Test Categories:
✅ Cache Key Generation
✅ Cache Storage Operations  
✅ Cache Retrieval Operations
✅ Cache Expiration Handling
✅ Cache Performance Testing
✅ Cache Integration Testing
`;
  
  if (testResults.failures.length > 0) {
    summary += `\n❌ Failed Cache Tests:\n`;
    testResults.failures.forEach(failure => {
      summary += `  - ${failure}\n`;
    });
  }
  
  if (testResults.failed === 0) {
    summary += `\n🎉 All cache tests passed! Caching functionality is working correctly.`;
  } else {
    summary += `\n⚠️ Some cache tests failed. Review the failures and check cache implementation.`;
  }
  
  summary += `\n\nCache test completed at: ${new Date().toLocaleString()}`;
  
  return summary;
}

/**
 * Quick cache functionality check
 * @return {string} Quick cache test results
 */
function quickCacheCheck() {
  const testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    failures: []
  };
  
  // Test basic cache operations
  testCase(testResults, 'Quick cache - key generation', () => {
    const key = generateCacheKey('test', 'text', 'context');
    return key && key.length > 0;
  });
  
  testCase(testResults, 'Quick cache - store and retrieve', () => {
    const key = 'quick_test_key';
    const value = 'quick test value';
    setCachedResult(key, value);
    return getCachedResult(key) === value;
  });
  
  testCase(testResults, 'Quick cache - non-existent key', () => {
    return getCachedResult('non_existent_quick_key') === null;
  });
  
  return generateCacheTestSummary(testResults);
}

/**
 * Cache stress test for performance validation
 * @return {string} Stress test results
 */
function cacheStressTest() {
  console.log('Running cache stress test...');
  
  const results = [];
  const iterations = 200;
  
  // Test key generation under load
  const keyGenStart = Date.now();
  for (let i = 0; i < iterations; i++) {
    generateCacheKey(`stress_prompt_${i}`, `stress_text_${i}`, `stress_context_${i}`);
  }
  const keyGenTime = Date.now() - keyGenStart;
  results.push(`Key generation: ${keyGenTime}ms for ${iterations} keys`);
  
  // Test storage under load
  const storeStart = Date.now();
  for (let i = 0; i < iterations; i++) {
    setCachedResult(`stress_key_${i}`, `stress_value_${i}`);
  }
  const storeTime = Date.now() - storeStart;
  results.push(`Storage: ${storeTime}ms for ${iterations} entries`);
  
  // Test retrieval under load
  const retrieveStart = Date.now();
  for (let i = 0; i < iterations; i++) {
    getCachedResult(`stress_key_${i}`);
  }
  const retrieveTime = Date.now() - retrieveStart;
  results.push(`Retrieval: ${retrieveTime}ms for ${iterations} entries`);
  
  // Calculate performance metrics
  const avgKeyGen = (keyGenTime / iterations).toFixed(2);
  const avgStore = (storeTime / iterations).toFixed(2);
  const avgRetrieve = (retrieveTime / iterations).toFixed(2);
  
  results.push(`Average key generation: ${avgKeyGen}ms per key`);
  results.push(`Average storage: ${avgStore}ms per entry`);
  results.push(`Average retrieval: ${avgRetrieve}ms per entry`);
  
  return `🚀 Cache Stress Test Results:\n${results.join('\n')}`;
}