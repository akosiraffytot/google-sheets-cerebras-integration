# Complete Setup Guide

This comprehensive guide walks you through the entire setup process for the Google Sheets Cerebras AI Integration. Follow these steps to get your system up and running.

## Overview

The Google Sheets Cerebras AI Integration consists of three main components:

1. **Backend API** - Deployed on Vercel or Netlify
2. **Google Apps Script** - Custom function in Google Sheets
3. **Cerebras AI Integration** - AI processing service

## Prerequisites

Before starting, ensure you have:

- **Google Account** with access to Google Sheets and Google Apps Script
- **Cerebras AI API Key** (get one from [Cerebras Cloud](https://cloud.cerebras.ai/))
- **Node.js 18+** installed on your local machine
- **Git** for version control (optional but recommended)
- **Text editor** (VS Code, Sublime Text, etc.)

## Quick Start (5 Minutes)

If you want to get started quickly, follow these steps:

1. **Get Cerebras API Key**
   - Visit [Cerebras Cloud](https://cloud.cerebras.ai/)
   - Sign up and generate an API key

2. **Deploy Backend API**
   ```bash
   # Clone or download the project
   git clone <your-repo-url>
   cd google-sheets-cerebras-integration
   
   # Install dependencies
   npm install
   
   # Deploy to Vercel (recommended)
   npx vercel --prod
   ```

3. **Set Up Google Apps Script**
   - Copy the code from `google-apps-script/Code.gs`
   - Create a new Google Apps Script project
   - Paste the code and save
   - Configure your API endpoint

4. **Test the Integration**
   - Open Google Sheets
   - Try: `=REWRITE("Make this professional", A1)`

## Detailed Setup Instructions

### Step 1: Get Your Cerebras AI API Key

1. **Create Cerebras Account**
   - Go to [Cerebras Cloud](https://cloud.cerebras.ai/)
   - Sign up for an account or log in

2. **Generate API Key**
   - Navigate to the API Keys section
   - Click "Create New API Key"
   - Copy the key (starts with `sk-`)
   - Store it securely - you'll need it for deployment

3. **Verify API Key**
   ```bash
   # Test your API key (optional)
   curl -H "Authorization: Bearer your-api-key" \
        https://api.cerebras.ai/v1/models
   ```

### Step 2: Deploy the Backend API

Choose either Vercel (recommended) or Netlify for deployment.

#### Option A: Deploy to Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Prepare Environment**
   ```bash
   # Copy environment template
   cp .env.example .env.local
   
   # Edit with your API key
   # Replace 'your_cerebras_api_key_here' with your actual API key
   ```

3. **Deploy**
   ```bash
   # Login to Vercel (first time only)
   vercel login
   
   # Deploy to production
   vercel --prod
   ```

4. **Set Environment Variables**
   ```bash
   # Set your Cerebras API key
   vercel env add CEREBRAS_API_KEY production
   # Paste your API key when prompted
   
   # Set other required variables
   vercel env add NODE_ENV production
   # Enter: production
   ```

5. **Get Your API URL**
   - After deployment, Vercel will show your URL
   - It will look like: `https://your-project-name.vercel.app`
   - Save this URL - you'll need it for Google Apps Script

#### Option B: Deploy to Netlify (Alternative)

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Build and Deploy**
   ```bash
   # Login to Netlify
   netlify login
   
   # Build for Netlify
   npm run build:netlify
   
   # Deploy
   netlify deploy --prod
   ```

3. **Set Environment Variables**
   ```bash
   # Set your Cerebras API key
   netlify env:set CEREBRAS_API_KEY "your-api-key-here"
   
   # Set other variables
   netlify env:set NODE_ENV "production"
   ```

### Step 3: Set Up Google Apps Script

1. **Create New Apps Script Project**
   - Go to [Google Apps Script](https://script.google.com/)
   - Click "New Project"
   - Give it a name like "Cerebras AI Integration"

2. **Add the Code**
   - Delete the default `myFunction()` code
   - Copy all code from `google-apps-script/Code.gs`
   - Paste it into the Apps Script editor
   - Save the project (Ctrl+S)

3. **Configure API Endpoint**
   - In the Apps Script editor, find this line:
   ```javascript
   // This is a placeholder - users need to set their actual API endpoint
   apiUrl = 'https://your-api-endpoint.vercel.app/api/rewrite';
   ```
   - Replace with your actual API URL from Step 2
   - Or use the configuration function (recommended):
   ```javascript
   // Run this once in the Apps Script editor:
   function setupApiEndpoint() {
     PropertiesService.getScriptProperties()
       .setProperty('API_ENDPOINT', 'https://your-actual-url.vercel.app/api/rewrite');
   }
   ```

4. **Authorize Permissions**
   - Click "Run" on any function
   - Review and accept all permissions:
     - Access to Google Sheets
     - Access to external URLs
     - Access to cache service

5. **Deploy as Web App (Optional)**
   - Click "Deploy" → "New Deployment"
   - Choose "Execute as: Me"
   - Choose "Who has access: Anyone"
   - Click "Deploy"

### Step 4: Test Your Setup

1. **Test API Endpoint**
   ```bash
   # Test health endpoint
   curl https://your-deployment-url.vercel.app/api/health
   
   # Should return: {"status": "ok", "timestamp": "..."}
   ```

2. **Test in Google Sheets**
   - Open a new Google Sheets document
   - In cell A1, enter some text like "hello world"
   - In cell B1, enter: `=REWRITE("Make this more professional", A1)`
   - Press Enter and wait for the result

3. **Check System Status**
   - In any cell, try: `=getSystemStatus()`
   - This will show if everything is configured correctly

### Step 5: Advanced Configuration (Optional)

#### Customize AI Model Settings

You can adjust the AI model behavior by setting environment variables:

```bash
# Use a more powerful model
vercel env add CEREBRAS_MODEL "llama3.1-70b" production

# Adjust creativity (0.0 = deterministic, 1.0 = very creative)
vercel env add CEREBRAS_TEMPERATURE "0.3" production

# Increase response length
vercel env add CEREBRAS_MAX_TOKENS "2000" production
```

#### Enable Debug Logging

For troubleshooting, enable debug logs:

```bash
vercel env add DEBUG "cerebras:*" production
```

#### Adjust Performance Settings

For better performance with large texts:

```bash
# Increase timeout to 45 seconds
vercel env add API_TIMEOUT "45000" production

# Allow more retries
vercel env add MAX_RETRIES "5" production
```

## Usage Examples

Once set up, you can use the REWRITE function in various ways:

### Basic Usage
```
=REWRITE("Make this professional", A1)
=REWRITE("Translate to Spanish", A1)
=REWRITE("Summarize this text", A1)
```

### With Context
```
=REWRITE("Rewrite based on context", A1, B1:B3)
=REWRITE("Make consistent with style", A1, C1)
```

### Advanced Examples
```
=REWRITE("Convert to bullet points", A1:A5)
=REWRITE("Make this email more polite", A1, "Context: This is for a client")
=REWRITE("Fix grammar and spelling", A1)
```

## Troubleshooting

### Common Issues

1. **"REWRITE function not found"**
   - Make sure you saved the Apps Script code
   - Try refreshing Google Sheets

2. **"API unavailable" error**
   - Check your API endpoint URL
   - Verify your deployment is working

3. **"Invalid API key" error**
   - Check your Cerebras API key is set correctly
   - Make sure it starts with "sk-"

4. **Function takes too long**
   - Try with shorter text
   - Check your internet connection

### Getting Help

- Use `=getSystemStatus()` to check configuration
- Use `=getRewriteHelp()` for usage guidance
- Check the [Troubleshooting Guide](TROUBLESHOOTING.md) for detailed solutions

## Security Notes

- Never share your Cerebras API key
- Don't commit API keys to version control
- Use environment variables for all sensitive data
- Regularly rotate your API keys

## Next Steps

- Explore different prompts and use cases
- Set up monitoring for your API usage
- Consider creating templates for common tasks
- Share the function with your team

## Support

If you need help:
1. Check the [Troubleshooting Guide](TROUBLESHOOTING.md)
2. Review the [Environment Variables Guide](ENVIRONMENT_VARIABLES.md)
3. Check the [Deployment Guide](DEPLOYMENT.md) for platform-specific issues
4. Create an issue in the project repository
#
# Google Apps Script Detailed Setup

### Creating the Apps Script Project

1. **Access Google Apps Script**
   - Go to [script.google.com](https://script.google.com/)
   - Sign in with your Google account
   - Click "New Project"

2. **Set Up the Project**
   - Name your project: "Cerebras AI Integration" or similar
   - Delete the default `myFunction()` code
   - The editor should be empty

### Adding the REWRITE Function Code

1. **Copy the Complete Code**
   - Open the file `google-apps-script/Code.gs` from this project
   - Select all content (Ctrl+A)
   - Copy to clipboard (Ctrl+C)

2. **Paste into Apps Script**
   - In the Apps Script editor, paste the code (Ctrl+V)
   - The code should include the main `REWRITE` function and all helper functions
   - Save the project (Ctrl+S)

### Configuring the API Endpoint

You have two options to configure your API endpoint:

#### Option 1: Using Script Properties (Recommended)

1. **Run Setup Function**
   - In the Apps Script editor, add this temporary function:
   ```javascript
   function setupApiEndpoint() {
     const apiUrl = 'https://your-actual-deployment-url.vercel.app/api/rewrite';
     PropertiesService.getScriptProperties().setProperty('API_ENDPOINT', apiUrl);
     console.log('API endpoint configured:', apiUrl);
   }
   ```

2. **Execute Setup**
   - Replace `your-actual-deployment-url` with your real URL
   - Select `setupApiEndpoint` from the function dropdown
   - Click "Run"
   - Delete the setup function after running

#### Option 2: Direct Code Modification

1. **Find the API URL Line**
   - Look for this line in the `getApiEndpoint()` function:
   ```javascript
   apiUrl = 'https://your-api-endpoint.vercel.app/api/rewrite';
   ```

2. **Replace with Your URL**
   - Change it to your actual deployment URL:
   ```javascript
   apiUrl = 'https://your-project-name.vercel.app/api/rewrite';
   ```

### Authorizing Permissions

1. **Initial Authorization**
   - Select any function (like `REWRITE`) from the dropdown
   - Click "Run"
   - You'll see an authorization dialog

2. **Review Permissions**
   The script needs these permissions:
   - **Google Sheets access**: To read cell values and return results
   - **External URL access**: To call your API endpoint
   - **Cache service**: To store results for better performance
   - **Script properties**: To store configuration

3. **Grant Permissions**
   - Click "Review permissions"
   - Choose your Google account
   - Click "Advanced" → "Go to [Project Name] (unsafe)"
   - Click "Allow"

### Testing the Setup

1. **Test in Apps Script Editor**
   ```javascript
   // Add this test function temporarily:
   function testRewrite() {
     const result = REWRITE("Make this professional", "hello world");
     console.log('Test result:', result);
   }
   ```

2. **Run Test Function**
   - Select `testRewrite` from dropdown
   - Click "Run"
   - Check the console for results

3. **Test System Status**
   ```javascript
   function testStatus() {
     const status = getSystemStatus();
     console.log('System status:', status);
   }
   ```

### Using in Google Sheets

1. **Open Google Sheets**
   - Go to [sheets.google.com](https://sheets.google.com/)
   - Create a new spreadsheet or open existing one

2. **Test Basic Function**
   - In cell A1, enter: `hello world`
   - In cell B1, enter: `=REWRITE("Make this professional", A1)`
   - Press Enter and wait for result

3. **Test System Status**
   - In any cell, enter: `=getSystemStatus()`
   - This shows configuration status

### Advanced Apps Script Configuration

#### Setting Up Multiple Environments

For development and production environments:

```javascript
function setDevelopmentEndpoint() {
  PropertiesService.getScriptProperties()
    .setProperty('API_ENDPOINT', 'http://localhost:3000/api/rewrite');
}

function setProductionEndpoint() {
  PropertiesService.getScriptProperties()
    .setProperty('API_ENDPOINT', 'https://your-prod-url.vercel.app/api/rewrite');
}
```

#### Custom Configuration Options

```javascript
function configureAdvancedSettings() {
  const properties = PropertiesService.getScriptProperties();
  
  // Set custom timeout (in milliseconds)
  properties.setProperty('API_TIMEOUT', '45000');
  
  // Set custom retry count
  properties.setProperty('MAX_RETRIES', '5');
  
  // Enable/disable caching
  properties.setProperty('ENABLE_CACHING', 'true');
  
  console.log('Advanced settings configured');
}
```

#### Debugging and Logging

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

### Sharing with Team Members

#### Method 1: Share Apps Script Project

1. **Share the Script**
   - In Apps Script editor, click "Share" (top right)
   - Add team members' email addresses
   - Set permissions to "Editor" or "Viewer"

2. **Team Setup**
   - Each team member needs to configure their own API endpoint
   - Or use a shared endpoint with proper access controls

#### Method 2: Deploy as Add-on (Advanced)

1. **Prepare for Publishing**
   - Clean up code and add proper documentation
   - Test thoroughly with different scenarios
   - Create user-friendly error messages

2. **Publish as Add-on**
   - Go to "Deploy" → "New Deployment"
   - Choose "Add-on" as deployment type
   - Follow Google's add-on publishing guidelines

### Maintenance and Updates

#### Updating the Code

1. **Backup Current Version**
   - Copy current code to a backup file
   - Note current configuration settings

2. **Update Code**
   - Paste new version of the code
   - Reconfigure API endpoint if needed
   - Test functionality

#### Monitoring Usage

```javascript
function getUsageStats() {
  const cache = CacheService.getScriptCache();
  const stats = {
    cacheHits: cache.get('cache_hits') || '0',
    apiCalls: cache.get('api_calls') || '0',
    errors: cache.get('error_count') || '0'
  };
  console.log('Usage stats:', stats);
  return stats;
}
```

### Troubleshooting Apps Script Issues

#### Common Problems

1. **"Script function not found"**
   - Make sure function name is exactly `REWRITE`
   - Check that code was saved properly
   - Verify no syntax errors in the code

2. **"Authorization required"**
   - Re-run authorization process
   - Check that all permissions were granted
   - Try running a simple function first

3. **"Exceeded maximum execution time"**
   - Reduce text length
   - Check API response time
   - Consider increasing timeout settings

#### Debug Functions

Add these functions for troubleshooting:

```javascript
function debugConfiguration() {
  const properties = PropertiesService.getScriptProperties();
  const config = {
    apiEndpoint: properties.getProperty('API_ENDPOINT'),
    debugMode: properties.getProperty('DEBUG_MODE'),
    timeout: properties.getProperty('API_TIMEOUT')
  };
  console.log('Current configuration:', config);
  return config;
}

function testApiConnection() {
  try {
    const endpoint = getApiEndpoint().replace('/rewrite', '/health');
    const response = UrlFetchApp.fetch(endpoint);
    console.log('API health check:', response.getContentText());
    return response.getContentText();
  } catch (error) {
    console.error('API connection failed:', error.message);
    return `Connection failed: ${error.message}`;
  }
}
```

### Best Practices

1. **Code Organization**
   - Keep the main REWRITE function clean
   - Use helper functions for complex logic
   - Add comments for complex sections

2. **Error Handling**
   - Always provide user-friendly error messages
   - Log detailed errors for debugging
   - Handle network timeouts gracefully

3. **Performance**
   - Use caching for repeated requests
   - Validate inputs before API calls
   - Implement proper retry logic

4. **Security**
   - Never hardcode API keys in the script
   - Use script properties for configuration
   - Validate all user inputs

This completes the Google Apps Script setup section. The function should now be ready to use in Google Sheets with proper error handling and user guidance.