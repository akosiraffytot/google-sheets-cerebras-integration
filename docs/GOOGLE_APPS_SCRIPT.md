# Google Apps Script Setup Guide

This guide provides detailed instructions for setting up the Google Apps Script component of the Cerebras AI integration.

## Overview

The Google Apps Script component provides the `REWRITE()` custom function that users can use directly in Google Sheets cells. This function handles:

- Parameter validation and user-friendly error messages
- HTTP requests to your deployed API
- Caching for improved performance
- Retry logic for reliability
- Status indicators during processing

## Prerequisites

Before starting, ensure you have:

- **Google Account** with access to Google Apps Script
- **Deployed Backend API** (see [Deployment Guide](DEPLOYMENT.md))
- **API Endpoint URL** from your Vercel or Netlify deployment

## Step-by-Step Setup

### 1. Create Google Apps Script Project

1. **Access Google Apps Script**
   - Go to [script.google.com](https://script.google.com/)
   - Sign in with your Google account
   - Click "New Project"

2. **Configure Project**
   - Name your project: "Cerebras AI Integration"
   - Delete the default `myFunction()` code
   - The editor should be empty and ready for your code

### 2. Add the REWRITE Function Code

1. **Get the Code**
   - Open the file `google-apps-script/Code.gs` from this project
   - Select all content (Ctrl+A) and copy (Ctrl+C)

2. **Paste into Apps Script**
   - In the Apps Script editor, paste the code (Ctrl+V)
   - Save the project (Ctrl+S or File → Save)

3. **Verify Code Structure**
   The code should include these main functions:
   - `REWRITE()` - Main custom function
   - `validateParameters()` - Input validation
   - `makeApiRequest()` - HTTP request handling
   - `formatErrorMessage()` - User-friendly error formatting
   - Helper functions for caching and utilities

### 3. Configure API Endpoint

You have two options to configure your API endpoint:

#### Option A: Using Script Properties (Recommended)

1. **Create Setup Function**
   Add this temporary function to your script:
   ```javascript
   function setupApiEndpoint() {
     const apiUrl = 'https://your-actual-deployment-url.vercel.app/api/rewrite';
     PropertiesService.getScriptProperties().setProperty('API_ENDPOINT', apiUrl);
     console.log('API endpoint configured:', apiUrl);
   }
   ```

2. **Execute Setup**
   - Replace `your-actual-deployment-url` with your real deployment URL
   - Select `setupApiEndpoint` from the function dropdown
   - Click "Run"
   - Check the console for confirmation
   - Delete the setup function after running

#### Option B: Direct Code Modification

1. **Find the Default URL**
   Look for this line in the `getApiEndpoint()` function:
   ```javascript
   apiUrl = 'https://your-api-endpoint.vercel.app/api/rewrite';
   ```

2. **Replace with Your URL**
   Change it to your actual deployment URL:
   ```javascript
   apiUrl = 'https://your-project-name.vercel.app/api/rewrite';
   ```

### 4. Authorize Permissions

1. **Initial Authorization**
   - Select any function (like `REWRITE`) from the dropdown
   - Click "Run"
   - An authorization dialog will appear

2. **Review Required Permissions**
   The script needs these permissions:
   - **Google Sheets**: To read cell values and return results
   - **External URLs**: To call your API endpoint
   - **Cache Service**: To store results for better performance
   - **Script Properties**: To store configuration settings

3. **Grant Permissions**
   - Click "Review permissions"
   - Choose your Google account
   - Click "Advanced" → "Go to [Project Name] (unsafe)"
   - Click "Allow"

### 5. Test the Setup

#### Test in Apps Script Editor

1. **Add Test Function**
   ```javascript
   function testRewrite() {
     const result = REWRITE("Make this professional", "hello world");
     console.log('Test result:', result);
     return result;
   }
   ```

2. **Run Test**
   - Select `testRewrite` from the function dropdown
   - Click "Run"
   - Check the console for results

#### Test System Status

1. **Check Configuration**
   ```javascript
   function testSystemStatus() {
     const status = getSystemStatus();
     console.log('System status:', status);
     return status;
   }
   ```

2. **Verify All Components**
   The status should show:
   - ✅ API Configured
   - ✅ Cache Working
   - ✅ Properties OK

### 6. Use in Google Sheets

1. **Open Google Sheets**
   - Go to [sheets.google.com](https://sheets.google.com/)
   - Create a new spreadsheet or open an existing one

2. **Test Basic Function**
   - In cell A1, enter: `hello world`
   - In cell B1, enter: `=REWRITE("Make this professional", A1)`
   - Press Enter and wait for the result

3. **Test System Status**
   - In any cell, enter: `=getSystemStatus()`
   - This shows the current configuration status

## Function Usage

### Basic Syntax

```javascript
=REWRITE(prompt, mainText, contextCells)
```

**Parameters:**
- `prompt` (required): Instructions for the AI in quotes
- `mainText` (required): Cell reference or direct text to rewrite
- `contextCells` (optional): Additional cells for context

### Usage Examples

#### Simple Text Rewriting
```javascript
=REWRITE("Make this more professional", A1)
=REWRITE("Translate to Spanish", A1)
=REWRITE("Fix grammar and spelling", A1)
```

#### With Context
```javascript
=REWRITE("Rewrite based on the context", A1, B1:B3)
=REWRITE("Make consistent with the style", A1, C1)
```

#### Processing Ranges
```javascript
=REWRITE("Convert to bullet points", A1:A5)
=REWRITE("Summarize these points", A1:A10)
```

#### Advanced Examples
```javascript
=REWRITE("Make this email more polite", A1, "Context: This is for a client")
=REWRITE("Rewrite for social media", A1, "Platform: Twitter, Tone: Casual")
```

## Advanced Configuration

### Custom Settings

You can customize the behavior by setting script properties:

```javascript
function configureAdvancedSettings() {
  const properties = PropertiesService.getScriptProperties();
  
  // Set custom timeout (in milliseconds)
  properties.setProperty('API_TIMEOUT', '45000');
  
  // Set custom retry count
  properties.setProperty('MAX_RETRIES', '5');
  
  // Enable/disable caching
  properties.setProperty('ENABLE_CACHING', 'true');
  
  // Set cache duration (in seconds)
  properties.setProperty('CACHE_DURATION', '7200');
  
  console.log('Advanced settings configured');
}
```

### Debug Mode

Enable detailed logging for troubleshooting:

```javascript
function enableDebugMode() {
  PropertiesService.getScriptProperties()
    .setProperty('DEBUG_MODE', 'true');
  console.log('Debug mode enabled');
}

function disableDebugMode() {
  PropertiesService.getScriptProperties()
    .setProperty('DEBUG_MODE', 'false');
  console.log('Debug mode disabled');
}
```

### Multiple Environments

Set up different endpoints for development and production:

```javascript
function setDevelopmentEndpoint() {
  PropertiesService.getScriptProperties()
    .setProperty('API_ENDPOINT', 'http://localhost:3000/api/rewrite');
  console.log('Development endpoint set');
}

function setProductionEndpoint() {
  PropertiesService.getScriptProperties()
    .setProperty('API_ENDPOINT', 'https://your-prod-url.vercel.app/api/rewrite');
  console.log('Production endpoint set');
}
```

## Sharing and Collaboration

### Share with Team Members

1. **Share the Script**
   - In Apps Script editor, click "Share" (top right)
   - Add team members' email addresses
   - Set permissions to "Editor" or "Viewer"

2. **Team Configuration**
   - Each team member can use the same API endpoint
   - Or configure individual endpoints for different environments

### Deploy as Add-on (Advanced)

For organization-wide deployment:

1. **Prepare for Publishing**
   - Clean up code and add comprehensive documentation
   - Test thoroughly with various scenarios
   - Ensure user-friendly error messages

2. **Create Add-on Deployment**
   - Go to "Deploy" → "New Deployment"
   - Choose "Add-on" as deployment type
   - Follow Google's add-on publishing guidelines

## Monitoring and Maintenance

### Usage Statistics

Track function usage with this monitoring function:

```javascript
function getUsageStats() {
  const cache = CacheService.getScriptCache();
  const stats = {
    cacheHits: cache.get('cache_hits') || '0',
    apiCalls: cache.get('api_calls') || '0',
    errors: cache.get('error_count') || '0',
    lastUsed: cache.get('last_used') || 'Never'
  };
  console.log('Usage statistics:', stats);
  return stats;
}
```

### Health Monitoring

Regular health checks:

```javascript
function performHealthCheck() {
  try {
    // Test API connection
    const endpoint = getApiEndpoint().replace('/rewrite', '/health');
    const response = UrlFetchApp.fetch(endpoint);
    
    // Test caching
    const cache = CacheService.getScriptCache();
    cache.put('health_test', 'ok', 60);
    const cacheTest = cache.get('health_test');
    
    const health = {
      timestamp: new Date().toISOString(),
      apiStatus: response.getResponseCode() === 200 ? 'OK' : 'ERROR',
      cacheStatus: cacheTest === 'ok' ? 'OK' : 'ERROR',
      apiResponse: response.getContentText()
    };
    
    console.log('Health check results:', health);
    return health;
    
  } catch (error) {
    console.error('Health check failed:', error.message);
    return { status: 'ERROR', error: error.message };
  }
}
```

### Code Updates

When updating the code:

1. **Backup Current Version**
   - Copy current code to a backup file
   - Note current configuration settings

2. **Update Process**
   - Paste new version of the code
   - Reconfigure API endpoint if needed
   - Test all functionality

3. **Rollback Plan**
   - Keep backup of working version
   - Document any configuration changes

## Troubleshooting

### Common Issues

#### "Script function not found: REWRITE"

**Solutions:**
- Ensure the function name is exactly `REWRITE`
- Check that the code was saved properly
- Verify no syntax errors in the code
- Try refreshing Google Sheets

#### "Authorization required" repeatedly

**Solutions:**
- Clear browser cache for script.google.com
- Try incognito/private browsing mode
- Re-run the authorization process
- Check Google account permissions

#### "Exceeded maximum execution time"

**Solutions:**
- Reduce text length in the request
- Check API response time
- Increase timeout in script properties
- Split large requests into smaller ones

### Debug Functions

Add these functions for troubleshooting:

```javascript
function debugConfiguration() {
  const properties = PropertiesService.getScriptProperties();
  const config = {
    apiEndpoint: properties.getProperty('API_ENDPOINT'),
    debugMode: properties.getProperty('DEBUG_MODE'),
    timeout: properties.getProperty('API_TIMEOUT'),
    cacheEnabled: properties.getProperty('ENABLE_CACHING')
  };
  console.log('Current configuration:', config);
  return config;
}

function testApiConnection() {
  try {
    const endpoint = getApiEndpoint().replace('/rewrite', '/health');
    const response = UrlFetchApp.fetch(endpoint, { muteHttpExceptions: true });
    
    const result = {
      status: response.getResponseCode(),
      response: response.getContentText(),
      success: response.getResponseCode() === 200
    };
    
    console.log('API connection test:', result);
    return result;
    
  } catch (error) {
    console.error('API connection failed:', error.message);
    return { success: false, error: error.message };
  }
}
```

## Best Practices

### Code Organization

1. **Keep Functions Focused**
   - Main REWRITE function handles user interface
   - Helper functions handle specific tasks
   - Separate validation, API calls, and formatting

2. **Error Handling**
   - Always provide user-friendly error messages
   - Log detailed errors for debugging
   - Handle network timeouts gracefully

3. **Performance Optimization**
   - Use caching for repeated requests
   - Validate inputs before making API calls
   - Implement proper retry logic with backoff

### Security Considerations

1. **Input Validation**
   - Validate all user inputs
   - Sanitize data before API calls
   - Prevent injection attacks

2. **Configuration Security**
   - Never hardcode API keys in the script
   - Use script properties for sensitive configuration
   - Regularly review and rotate credentials

3. **Access Control**
   - Limit script sharing to necessary team members
   - Use appropriate permission levels
   - Monitor script usage and access

### User Experience

1. **Clear Error Messages**
   - Use emoji indicators for quick recognition
   - Provide specific guidance for fixing issues
   - Include examples in error messages

2. **Performance Feedback**
   - Show processing status during API calls
   - Implement caching for faster repeated requests
   - Provide system status information

3. **Documentation**
   - Include help functions in the script
   - Provide usage examples
   - Document configuration options

This completes the Google Apps Script setup guide. The function should now be ready for production use with proper error handling, caching, and user guidance.