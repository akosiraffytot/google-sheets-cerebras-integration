/**
 * Test Helper Functions for Google Apps Script REWRITE Function Testing
 * 
 * This file contains utility functions and mock data generators to support
 * comprehensive testing of the REWRITE function functionality.
 */

/**
 * Mock API response generator for testing without actual API calls
 * @param {string} prompt - The prompt used
 * @param {string} mainText - The main text
 * @param {string} contextText - The context text
 * @return {Object} Mock API response
 */
function generateMockApiResponse(prompt, mainText, contextText) {
  // Simulate different response scenarios
  const scenarios = [
    {
      condition: () => mainText.length > 1000,
      response: {
        success: false,
        error: { code: 'TEXT_TOO_LONG', message: 'Text exceeds maximum length' }
      }
    },
    {
      condition: () => prompt.toLowerCase().includes('error'),
      response: {
        success: false,
        error: { code: 'API_UNAVAILABLE', message: 'Service temporarily unavailable' }
      }
    },
    {
      condition: () => prompt.toLowerCase().includes('rate'),
      response: {
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' }
      }
    },
    {
      condition: () => true, // Default success case
      response: {
        success: true,
        data: {
          rewrittenText: generateMockRewrittenText(prompt, mainText, contextText)
        }
      }
    }
  ];
  
  // Find first matching scenario
  const scenario = scenarios.find(s => s.condition());
  return scenario.response;
}

/**
 * Generates mock rewritten text based on the prompt
 * @param {string} prompt - The rewrite prompt
 * @param {string} mainText - The original text
 * @param {string} contextText - Additional context
 * @return {string} Mock rewritten text
 */
function generateMockRewrittenText(prompt, mainText, contextText) {
  const promptLower = prompt.toLowerCase();
  
  if (promptLower.includes('professional')) {
    return `Dear colleague, ${mainText.replace(/hey|hi/gi, 'greetings')}. Best regards.`;
  } else if (promptLower.includes('summarize')) {
    return `Summary: ${mainText.substring(0, 50)}...`;
  } else if (promptLower.includes('formal')) {
    return `Formal version: ${mainText.replace(/can't/g, 'cannot').replace(/won't/g, 'will not')}`;
  } else if (promptLower.includes('simple')) {
    return `Simple version: ${mainText.replace(/sophisticated/g, 'advanced').replace(/comprehensive/g, 'complete')}`;
  } else {
    return `Rewritten: ${mainText} (processed with context: ${contextText || 'none'})`;
  }
}

/**
 * Creates test data for different cell reference scenarios
 * @return {Object} Test data object with various cell reference types
 */
function createCellReferenceTestData() {
  return {
    singleCell: 'This is content from a single cell A1',
    
    singleRow: ['Cell A1', 'Cell B1', 'Cell C1'],
    
    singleColumn: ['Row 1', 'Row 2', 'Row 3'],
    
    rectangularRange: [
      ['A1', 'B1', 'C1'],
      ['A2', 'B2', 'C2'],
      ['A3', 'B3', 'C3']
    ],
    
    mixedDataTypes: [
      ['Text', 123, true],
      ['More text', 456.78, false],
      ['Final text', null, '']
    ],
    
    emptyRange: [
      ['', '', ''],
      [null, undefined, ''],
      ['', '', '']
    ],
    
    sparseRange: [
      ['Content', '', 'More content'],
      ['', 'Middle content', ''],
      ['End content', '', '']
    ],
    
    largeRange: generateLargeRange(10, 5), // 10 rows, 5 columns
    
    specialCharacters: [
      ['Text with émojis 🚀', 'Special chars @#$%'],
      ['Unicode: αβγδε', 'Symbols: ©®™'],
      ['Quotes: "Hello"', 'Apostrophes: don\'t']
    ]
  };
}

/**
 * Generates a large range of test data
 * @param {number} rows - Number of rows
 * @param {number} cols - Number of columns
 * @return {Array} 2D array of test data
 */
function generateLargeRange(rows, cols) {
  const range = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push(`Cell R${r+1}C${c+1} content`);
    }
    range.push(row);
  }
  return range;
}

/**
 * Creates test prompts for different rewriting scenarios
 * @return {Object} Object containing various test prompts
 */
function createTestPrompts() {
  return {
    basic: [
      'Rewrite this text',
      'Make this better',
      'Improve the writing'
    ],
    
    professional: [
      'Make this more professional',
      'Rewrite for business communication',
      'Convert to formal language'
    ],
    
    summarization: [
      'Summarize in 2 sentences',
      'Create a brief summary',
      'Condense this content'
    ],
    
    style: [
      'Make this more casual',
      'Write in simple English',
      'Use academic tone'
    ],
    
    specific: [
      'Fix grammar and spelling',
      'Remove redundant words',
      'Add more detail'
    ],
    
    invalid: [
      '', // Empty prompt
      null, // Null prompt
      'A', // Too short
      'X'.repeat(600) // Too long
    ],
    
    edge_cases: [
      'Rewrite this REWRITE function', // Contains function name
      'Make this professional and formal and business-like and appropriate', // Very long
      '123', // Numeric string
      'Prompt with émojis 🚀 and special chars @#$%' // Special characters
    ]
  };
}

/**
 * Creates test scenarios for error conditions
 * @return {Array} Array of error test scenarios
 */
function createErrorTestScenarios() {
  return [
    {
      name: 'Missing prompt parameter',
      prompt: null,
      mainText: 'Valid text',
      context: null,
      expectedError: 'Missing Prompt'
    },
    {
      name: 'Empty prompt string',
      prompt: '',
      mainText: 'Valid text',
      context: null,
      expectedError: 'Empty Prompt'
    },
    {
      name: 'Missing main text',
      prompt: 'Valid prompt',
      mainText: null,
      context: null,
      expectedError: 'Missing Main Text'
    },
    {
      name: 'Empty main text',
      prompt: 'Valid prompt',
      mainText: '',
      context: null,
      expectedError: 'Empty Main Text'
    },
    {
      name: 'Invalid prompt type',
      prompt: 123,
      mainText: 'Valid text',
      context: null,
      expectedError: 'Invalid Prompt Type'
    },
    {
      name: 'Prompt too short',
      prompt: 'Hi',
      mainText: 'Valid text',
      context: null,
      expectedError: 'Prompt Too Short'
    },
    {
      name: 'Prompt too long',
      prompt: 'X'.repeat(600),
      mainText: 'Valid text',
      context: null,
      expectedError: 'Prompt Too Long'
    },
    {
      name: 'Empty context string',
      prompt: 'Valid prompt',
      mainText: 'Valid text',
      context: '',
      expectedError: 'Empty Context'
    }
  ];
}

/**
 * Mock cache service for testing when CacheService is not available
 */
class MockCacheService {
  constructor() {
    this.cache = new Map();
    this.expirations = new Map();
  }
  
  put(key, value, expirationInSeconds) {
    this.cache.set(key, value);
    if (expirationInSeconds) {
      const expireTime = Date.now() + (expirationInSeconds * 1000);
      this.expirations.set(key, expireTime);
    }
  }
  
  get(key) {
    // Check if expired
    if (this.expirations.has(key)) {
      if (Date.now() > this.expirations.get(key)) {
        this.cache.delete(key);
        this.expirations.delete(key);
        return null;
      }
    }
    
    return this.cache.get(key) || null;
  }
  
  remove(key) {
    this.cache.delete(key);
    this.expirations.delete(key);
  }
  
  removeAll() {
    this.cache.clear();
    this.expirations.clear();
  }
}

/**
 * Test utility to measure function execution time
 * @param {Function} func - Function to measure
 * @param {Array} args - Arguments to pass to function
 * @return {Object} Result object with execution time and return value
 */
function measureExecutionTime(func, args = []) {
  const startTime = Date.now();
  let result;
  let error = null;
  
  try {
    result = func.apply(null, args);
  } catch (e) {
    error = e;
  }
  
  const endTime = Date.now();
  
  return {
    executionTime: endTime - startTime,
    result: result,
    error: error,
    success: error === null
  };
}

/**
 * Validates test environment and dependencies
 * @return {Object} Environment validation results
 */
function validateTestEnvironment() {
  const results = {
    valid: true,
    issues: [],
    warnings: []
  };
  
  // Check if required functions exist
  const requiredFunctions = [
    'validateParameters',
    'extractCellValue',
    'generateCacheKey',
    'getCachedResult',
    'setCachedResult',
    'formatErrorMessage',
    'formatNetworkError',
    'isErrorResult'
  ];
  
  requiredFunctions.forEach(funcName => {
    if (typeof eval(funcName) !== 'function') {
      results.valid = false;
      results.issues.push(`Required function '${funcName}' is not available`);
    }
  });
  
  // Check if CacheService is available
  try {
    CacheService.getScriptCache();
  } catch (error) {
    results.warnings.push('CacheService is not available - cache tests will use mock service');
  }
  
  // Check if PropertiesService is available
  try {
    PropertiesService.getScriptProperties();
  } catch (error) {
    results.warnings.push('PropertiesService is not available - some tests may be limited');
  }
  
  // Check if UrlFetchApp is available
  try {
    // Just check if the service exists, don't make actual requests
    if (typeof UrlFetchApp === 'undefined') {
      results.warnings.push('UrlFetchApp is not available - network tests will be simulated');
    }
  } catch (error) {
    results.warnings.push('UrlFetchApp access limited - network tests will be simulated');
  }
  
  return results;
}

/**
 * Generates a comprehensive test report
 * @param {Object} testResults - Results from test execution
 * @return {string} Formatted HTML report
 */
function generateTestReport(testResults) {
  const timestamp = new Date().toLocaleString();
  const passRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  
  let report = `
<!DOCTYPE html>
<html>
<head>
    <title>REWRITE Function Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 15px; border-radius: 5px; }
        .summary { background: #e8f5e8; padding: 10px; margin: 10px 0; border-radius: 5px; }
        .failure { background: #ffe8e8; padding: 10px; margin: 10px 0; border-radius: 5px; }
        .pass { color: green; }
        .fail { color: red; }
        .warning { color: orange; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 REWRITE Function Test Report</h1>
        <p>Generated: ${timestamp}</p>
    </div>
    
    <div class="summary">
        <h2>📊 Test Summary</h2>
        <p><strong>Total Tests:</strong> ${testResults.total}</p>
        <p><strong>Passed:</strong> <span class="pass">${testResults.passed}</span></p>
        <p><strong>Failed:</strong> <span class="fail">${testResults.failed}</span></p>
        <p><strong>Pass Rate:</strong> ${passRate}%</p>
    </div>
`;
  
  if (testResults.failures && testResults.failures.length > 0) {
    report += `
    <div class="failure">
        <h2>❌ Failed Tests</h2>
        <ul>
`;
    testResults.failures.forEach(failure => {
      report += `            <li>${failure}</li>\n`;
    });
    report += `
        </ul>
    </div>
`;
  }
  
  report += `
    <div class="summary">
        <h2>✅ Test Categories Covered</h2>
        <ul>
            <li>Parameter Validation (Requirements 1.1, 1.2, 1.3)</li>
            <li>Caching Functionality</li>
            <li>Parameter Combinations (Requirements 6.1, 6.2)</li>
            <li>Mock Data Scenarios</li>
            <li>Error Handling</li>
            <li>Performance Testing</li>
        </ul>
    </div>
    
</body>
</html>
`;
  
  return report;
}

/**
 * Utility function to create test data files for manual testing
 * @return {string} Instructions for creating test data
 */
function createTestDataInstructions() {
  return `
📋 Manual Test Data Setup Instructions

To manually test the REWRITE function in Google Sheets:

1. Create a new Google Sheet
2. Set up the following test data:

Column A (Main Text):
A1: "Hey there, how are you doing today?"
A2: "This is a test sentence with some errors."
A3: "The quick brown fox jumps over the lazy dog."
A4: "I need help with this complex technical documentation."
A5: [Leave empty for testing empty cell handling]

Column B (Context):
B1: "Casual conversation"
B2: "Grammar correction needed"
B3: "Classic example text"
B4: "Technical writing"
B5: "No context"

Column C (Test Formulas):
C1: =REWRITE("Make this more professional", A1, B1)
C2: =REWRITE("Fix grammar and spelling", A2, B2)
C3: =REWRITE("Summarize in 5 words", A3)
C4: =REWRITE("Simplify for beginners", A4, B4)
C5: =REWRITE("Test empty cell", A5)

Column D (Error Tests):
D1: =REWRITE("", A1) // Empty prompt
D2: =REWRITE("Test", "") // Empty text
D3: =REWRITE(123, A1) // Invalid prompt type
D4: =REWRITE("Test very long prompt that exceeds the maximum allowed length for prompts and should trigger a validation error", A1)

3. Test with ranges:
E1: =REWRITE("Combine these items", A1:A3)
E2: =REWRITE("Process this table", A1:B3)

4. Performance tests:
F1: =REWRITE("Test caching", A1) // Run twice to test cache
F2: =REWRITE("Test caching", A1) // Should return cached result

Remember to configure your API endpoint first:
Run this once: setApiEndpoint("https://your-api-endpoint.vercel.app/api/rewrite")
`;
}

/**
 * Creates comprehensive mock data scenarios for testing
 * Enhanced for task 7.2 requirements
 * @return {Array} Array of mock test scenarios
 */
function createMockDataScenarios() {
  return [
    {
      name: 'Professional email rewrite',
      prompt: 'Make this email more professional and formal',
      mainText: 'Hey, can you send me the report ASAP? Thanks!',
      context: 'This is for a client communication',
      expectError: false,
      category: 'business'
    },
    {
      name: 'Summarization task',
      prompt: 'Summarize this in 2 sentences',
      mainText: 'Long article content here with multiple paragraphs discussing various topics and providing detailed information about the subject matter.',
      context: null,
      expectError: false,
      category: 'summarization'
    },
    {
      name: 'Grammar correction',
      prompt: 'Fix grammar and spelling errors',
      mainText: 'This sentance has some erors that need fixing.',
      context: null,
      expectError: false,
      category: 'editing'
    },
    {
      name: 'Translation style',
      prompt: 'Rewrite in simple English for non-native speakers',
      mainText: 'The implementation of this sophisticated algorithm requires comprehensive understanding of complex data structures.',
      context: 'Technical documentation',
      expectError: false,
      category: 'simplification'
    },
    {
      name: 'Cell range data',
      prompt: 'Combine and rewrite these items',
      mainText: ['Item 1: First point', 'Item 2: Second point', 'Item 3: Third point'],
      context: ['Context A', 'Context B'],
      expectError: false,
      category: 'data_processing'
    },
    {
      name: '2D cell range',
      prompt: 'Process this table data',
      mainText: [['Name', 'John'], ['Age', '30'], ['City', 'New York']],
      context: null,
      expectError: false,
      category: 'table_data'
    },
    {
      name: 'Empty prompt (should fail)',
      prompt: '',
      mainText: 'Some text to rewrite',
      context: null,
      expectError: true,
      category: 'error_case'
    },
    {
      name: 'Missing main text (should fail)',
      prompt: 'Rewrite this',
      mainText: null,
      context: null,
      expectError: true,
      category: 'error_case'
    },
    {
      name: 'Very long text',
      prompt: 'Summarize this long content',
      mainText: 'A'.repeat(2000) + ' This is a very long text that tests the system\'s ability to handle large inputs.',
      context: null,
      expectError: false,
      category: 'performance'
    },
    {
      name: 'Special characters and emojis',
      prompt: 'Clean up this text',
      mainText: 'Text with émojis 🚀 and spëcial chars @#$% & symbols!',
      context: 'Social media post',
      expectError: false,
      category: 'special_chars'
    },
    // Additional scenarios for comprehensive testing
    {
      name: 'Academic writing style',
      prompt: 'Convert to academic writing style',
      mainText: 'This stuff is really important and everyone should know about it.',
      context: 'Research paper',
      expectError: false,
      category: 'academic'
    },
    {
      name: 'Marketing copy optimization',
      prompt: 'Make this more compelling for marketing',
      mainText: 'Our product is good and has features.',
      context: 'Product launch campaign',
      expectError: false,
      category: 'marketing'
    },
    {
      name: 'Technical documentation simplification',
      prompt: 'Explain this in simple terms',
      mainText: 'The API endpoint utilizes RESTful architecture with JSON payloads for data transmission.',
      context: 'User manual',
      expectError: false,
      category: 'technical'
    },
    {
      name: 'Social media adaptation',
      prompt: 'Adapt for Twitter (280 characters)',
      mainText: 'We are excited to announce the launch of our new product which has been in development for over two years and includes many innovative features.',
      context: 'Social media campaign',
      expectError: false,
      category: 'social_media'
    },
    {
      name: 'Legal document simplification',
      prompt: 'Simplify this legal language',
      mainText: 'The party of the first part hereby agrees to indemnify and hold harmless the party of the second part.',
      context: 'Contract explanation',
      expectError: false,
      category: 'legal'
    },
    {
      name: 'Mixed data types in spreadsheet',
      prompt: 'Create narrative from this data',
      mainText: [
        ['Quarter', 'Revenue', 'Growth'],
        ['Q1', 100000, '10%'],
        ['Q2', 110000, '15%'],
        ['Q3', 125000, '20%']
      ],
      context: 'Financial report',
      expectError: false,
      category: 'data_analysis'
    },
    {
      name: 'Multilingual content handling',
      prompt: 'Standardize to English',
      mainText: 'Hello, Bonjour, Hola, こんにちは - Welcome to our international platform!',
      context: 'International website',
      expectError: false,
      category: 'multilingual'
    },
    {
      name: 'Code documentation',
      prompt: 'Explain this code in plain English',
      mainText: 'function calculateTax(income, rate) { return income * (rate / 100); }',
      context: 'Developer documentation',
      expectError: false,
      category: 'code_documentation'
    },
    {
      name: 'Customer service response',
      prompt: 'Make this more empathetic and helpful',
      mainText: 'Your request has been processed. Check your account.',
      context: 'Customer support',
      expectError: false,
      category: 'customer_service'
    },
    {
      name: 'News article summary',
      prompt: 'Create executive summary',
      mainText: 'The quarterly earnings report shows significant growth across all sectors with technology leading at 25% increase, followed by healthcare at 18%, and manufacturing at 12%. Market analysts predict continued growth.',
      context: 'Business newsletter',
      expectError: false,
      category: 'news_summary'
    }
  ];
}

/**
 * Creates specialized test scenarios for different parameter combinations
 * Tests Requirements 6.1 and 6.2 specifically
 * @return {Array} Array of parameter combination test scenarios
 */
function createParameterCombinationTestScenarios() {
  return [
    // Requirement 6.1: Custom prompt instructions
    {
      name: 'Custom prompt - professional tone',
      prompt: 'Rewrite this in a professional, business-appropriate tone',
      mainText: 'Hey buddy, this is totally awesome!',
      context: null,
      expectedValidation: true
    },
    {
      name: 'Custom prompt - summarization with word limit',
      prompt: 'Summarize this content in exactly 25 words',
      mainText: 'Long detailed explanation about various topics and subjects that need to be condensed into a much shorter format.',
      context: null,
      expectedValidation: true
    },
    {
      name: 'Custom prompt - style transformation',
      prompt: 'Convert this technical jargon into simple, everyday language',
      mainText: 'The algorithm optimizes computational efficiency through recursive data structure manipulation.',
      context: 'Technical manual',
      expectedValidation: true
    },
    
    // Requirement 6.2: Different parameter formats
    {
      name: 'Parameter format - direct text input',
      prompt: 'Improve this text',
      mainText: 'This is direct text input without cell references',
      context: 'Direct context input',
      expectedValidation: true
    },
    {
      name: 'Parameter format - single cell simulation',
      prompt: 'Process this cell',
      mainText: 'Content from cell A1',
      context: null,
      expectedValidation: true
    },
    {
      name: 'Parameter format - 1D array (row/column)',
      prompt: 'Combine these cells',
      mainText: ['Cell A1', 'Cell B1', 'Cell C1'],
      context: ['Context A1', 'Context B1'],
      expectedValidation: true
    },
    {
      name: 'Parameter format - 2D array (range)',
      prompt: 'Process this range',
      mainText: [
        ['Header 1', 'Header 2'],
        ['Data 1', 'Data 2'],
        ['Data 3', 'Data 4']
      ],
      context: [['Context 1', 'Context 2']],
      expectedValidation: true
    },
    {
      name: 'Parameter format - mixed data types',
      prompt: 'Handle mixed types',
      mainText: ['Text', 123, true, null, 'More text'],
      context: [456, false, 'Context text'],
      expectedValidation: true
    },
    {
      name: 'Parameter format - numeric main text',
      prompt: 'Convert number to text description',
      mainText: 12345.67,
      context: 'Financial data',
      expectedValidation: true
    },
    {
      name: 'Parameter format - boolean context',
      prompt: 'Process with boolean context',
      mainText: 'Main text content',
      context: true,
      expectedValidation: true
    },
    
    // Edge cases for parameter combinations
    {
      name: 'Edge case - empty cells in range',
      prompt: 'Handle empty cells',
      mainText: ['Content', '', null, undefined, 'More content'],
      context: ['', 'Context', null],
      expectedValidation: true
    },
    {
      name: 'Edge case - very long prompt',
      prompt: 'This is a very detailed prompt that provides extensive instructions about how to rewrite the text including specific formatting requirements, tone adjustments, and content modifications that should be applied to achieve the desired outcome',
      mainText: 'Short text',
      context: null,
      expectedValidation: true
    },
    {
      name: 'Edge case - special characters in all parameters',
      prompt: 'Process émojis 🚀 and symbols @#$%',
      mainText: 'Text with spëcial chars & symbols!',
      context: 'Context with ñ and ü characters',
      expectedValidation: true
    }
  ];
}

/**
 * Creates caching-specific test scenarios
 * Tests caching functionality and performance features
 * @return {Array} Array of caching test scenarios
 */
function createCachingTestScenarios() {
  return [
    {
      name: 'Cache consistency - identical inputs',
      prompt: 'Test caching',
      mainText: 'Identical text for caching',
      context: 'Identical context',
      expectedCacheKey: 'should_be_same',
      testType: 'consistency'
    },
    {
      name: 'Cache uniqueness - different prompts',
      scenarios: [
        { prompt: 'Prompt A', mainText: 'Same text', context: 'Same context' },
        { prompt: 'Prompt B', mainText: 'Same text', context: 'Same context' }
      ],
      testType: 'uniqueness'
    },
    {
      name: 'Cache uniqueness - different main text',
      scenarios: [
        { prompt: 'Same prompt', mainText: 'Text A', context: 'Same context' },
        { prompt: 'Same prompt', mainText: 'Text B', context: 'Same context' }
      ],
      testType: 'uniqueness'
    },
    {
      name: 'Cache uniqueness - different context',
      scenarios: [
        { prompt: 'Same prompt', mainText: 'Same text', context: 'Context A' },
        { prompt: 'Same prompt', mainText: 'Same text', context: 'Context B' }
      ],
      testType: 'uniqueness'
    },
    {
      name: 'Cache performance - large data',
      prompt: 'Process large content',
      mainText: 'Large content: ' + 'X'.repeat(1000),
      context: 'Large context: ' + 'Y'.repeat(500),
      testType: 'performance'
    },
    {
      name: 'Cache storage - special characters',
      prompt: 'Cache émojis 🚀',
      mainText: 'Text with spëcial chars @#$%',
      context: 'Context with symbols & more',
      testType: 'storage'
    }
  ];
}

/**
 * Quick diagnostic function to check system status
 * @return {string} System diagnostic results
 */
function runSystemDiagnostic() {
  const diagnostic = {
    timestamp: new Date().toISOString(),
    environment: 'Google Apps Script',
    tests: []
  };
  
  // Test basic JavaScript functionality
  diagnostic.tests.push({
    name: 'JavaScript basics',
    status: typeof Array === 'function' && typeof Object === 'object' ? 'PASS' : 'FAIL'
  });
  
  // Test Google Apps Script services
  try {
    Utilities.getUuid();
    diagnostic.tests.push({ name: 'Utilities service', status: 'PASS' });
  } catch (error) {
    diagnostic.tests.push({ name: 'Utilities service', status: 'FAIL', error: error.message });
  }
  
  try {
    CacheService.getScriptCache();
    diagnostic.tests.push({ name: 'Cache service', status: 'PASS' });
  } catch (error) {
    diagnostic.tests.push({ name: 'Cache service', status: 'FAIL', error: error.message });
  }
  
  try {
    PropertiesService.getScriptProperties();
    diagnostic.tests.push({ name: 'Properties service', status: 'PASS' });
  } catch (error) {
    diagnostic.tests.push({ name: 'Properties service', status: 'FAIL', error: error.message });
  }
  
  // Test REWRITE function dependencies
  const dependencies = ['validateParameters', 'extractCellValue', 'generateCacheKey'];
  dependencies.forEach(dep => {
    try {
      const func = eval(dep);
      diagnostic.tests.push({
        name: `Function: ${dep}`,
        status: typeof func === 'function' ? 'PASS' : 'FAIL'
      });
    } catch (error) {
      diagnostic.tests.push({
        name: `Function: ${dep}`,
        status: 'FAIL',
        error: error.message
      });
    }
  });
  
  // Generate report
  let report = `🔍 System Diagnostic Report\n`;
  report += `Timestamp: ${diagnostic.timestamp}\n`;
  report += `Environment: ${diagnostic.environment}\n\n`;
  
  diagnostic.tests.forEach(test => {
    const status = test.status === 'PASS' ? '✅' : '❌';
    report += `${status} ${test.name}: ${test.status}`;
    if (test.error) {
      report += ` (${test.error})`;
    }
    report += '\n';
  });
  
  const passCount = diagnostic.tests.filter(t => t.status === 'PASS').length;
  const totalCount = diagnostic.tests.length;
  report += `\nOverall: ${passCount}/${totalCount} checks passed`;
  
  return report;
}