# Troubleshooting Guide

This guide helps you diagnose and fix common issues with the Google Sheets Cerebras AI Integration system.

## Quick Diagnosis

### Is the Problem with Google Sheets or the API?

1. **Test the API directly first:**
   ```bash
   curl -X GET https://your-deployment-url.vercel.app/api/health
   ```
   - If this fails, the problem is with your API deployment
   - If this works, the problem is likely with Google Apps Script

2. **Test Google Apps Script:**
   - Open Google Apps Script editor
   - Run the `REWRITE` function manually
   - Check the execution log for errors

## Common Issues and Solutions

### 1. Google Apps Script Issues

#### "REWRITE function not found"

**Symptoms:**
- `#NAME?` error in Google Sheets
- Function not recognized

**Causes:**
- Apps Script not properly saved
- Function not deployed
- Typo in function name

**Solutions:**
1. **Check Apps Script Project:**
   ```javascript
   // Ensure this function exists in Code.gs
   function REWRITE(prompt, mainText, contextText) {
     // Function implementation
   }
   ```

2. **Save and Deploy:**
   - Press `Ctrl+S` to save
   - Click "Deploy" → "New Deployment"
   - Choose "Execute as me"
   - Choose "Anyone can access"

3. **Refresh Google Sheets:**
   - Close and reopen the spreadsheet
   - Try the function again

#### "Script function not found: REWRITE"

**Symptoms:**
- Error message in Google Sheets
- Function exists but not accessible

**Solutions:**
1. **Check Function Visibility:**
   ```javascript
   // Ensure function is not inside another function
   function REWRITE(prompt, mainText, contextText) {
     // This should be at the top level
   }
   ```

2. **Verify Project Permissions:**
   - Go to Apps Script editor
   - Click "Run" to authorize permissions
   - Accept all required permissions

#### "Authorization required"

**Symptoms:**
- Function returns authorization error
- Permission dialog appears repeatedly

**Solutions:**
1. **Complete Authorization:**
   - Click "Review permissions"
   - Choose your Google account
   - Click "Advanced" → "Go to [Project Name] (unsafe)"
   - Click "Allow"

2. **Required Permissions:**
   - Google Sheets access
   - External HTTP requests
   - Cache service access

3. **Clear and Re-authorize:**
   ```javascript
   // In Apps Script editor, go to:
   // Resources → Advanced Google Services
   // Enable required services
   ```

### 2. API Connection Issues

#### "Error: API unavailable"

**Symptoms:**
- Function returns "API unavailable" error
- Consistent connection failures

**Causes:**
- Wrong API URL
- API deployment failed
- Network connectivity issues

**Solutions:**
1. **Verify API URL:**
   ```javascript
   // In Code.gs, check this line:
   const API_BASE_URL = 'https://your-deployment-url.vercel.app';
   ```

2. **Test API Endpoint:**
   ```bash
   # Test health endpoint
   curl https://your-deployment-url.vercel.app/api/health
   
   # Should return: {"status": "ok", "timestamp": "..."}
   ```

3. **Check Deployment Status:**
   - **Vercel:** Visit Vercel dashboard, check deployment status
   - **Netlify:** Visit Netlify dashboard, check build logs

#### "Connection timeout"

**Symptoms:**
- Function hangs on "Processing..."
- Eventually returns timeout error

**Solutions:**
1. **Increase Timeout:**
   ```javascript
   // In Code.gs, adjust timeout:
   const API_TIMEOUT = 45000; // Increase to 45 seconds
   ```

2. **Check API Performance:**
   - Monitor function execution time in deployment dashboard
   - Check Cerebras API response times

3. **Optimize Request Size:**
   - Reduce text length
   - Minimize context text
   - Split large requests

#### "CORS policy error"

**Symptoms:**
- Browser console shows CORS error
- Requests blocked by browser

**Solutions:**
1. **Verify CORS Configuration:**
   
   **Vercel (vercel.json):**
   ```json
   {
     "headers": [
       {
         "source": "/api/(.*)",
         "headers": [
           {
             "key": "Access-Control-Allow-Origin",
             "value": "https://script.google.com"
           }
         ]
       }
     ]
   }
   ```

   **Netlify (netlify.toml):**
   ```toml
   [[headers]]
     for = "/api/*"
     [headers.values]
       Access-Control-Allow-Origin = "https://script.google.com"
   ```

2. **Redeploy After Changes:**
   - Commit CORS configuration changes
   - Redeploy the application
   - Test the API endpoint

### 3. Cerebras AI API Issues

#### "Error: Invalid API key"

**Symptoms:**
- API returns authentication error
- "Invalid API key" message

**Solutions:**
1. **Verify API Key:**
   ```bash
   # Test API key directly
   curl -H "Authorization: Bearer your-api-key" \
        https://api.cerebras.ai/v1/models
   ```

2. **Check Environment Variables:**
   
   **Vercel:**
   ```bash
   vercel env ls
   # Ensure CEREBRAS_API_KEY is set
   ```

   **Netlify:**
   ```bash
   netlify env:list
   # Ensure CEREBRAS_API_KEY is set
   ```

3. **Update API Key:**
   ```bash
   # Vercel
   vercel env rm CEREBRAS_API_KEY production
   vercel env add CEREBRAS_API_KEY production
   
   # Netlify
   netlify env:unset CEREBRAS_API_KEY
   netlify env:set CEREBRAS_API_KEY "new-api-key"
   ```

#### "Rate limit exceeded"

**Symptoms:**
- "Rate limited - Retrying..." message
- Requests failing after retries

**Solutions:**
1. **Check Rate Limits:**
   - Review your Cerebras AI plan limits
   - Monitor current usage in Cerebras dashboard

2. **Implement Backoff:**
   ```javascript
   // In Code.gs, adjust retry settings:
   const MAX_RETRIES = 5;
   const RETRY_DELAY = 2000; // 2 seconds
   ```

3. **Optimize Usage:**
   - Enable caching to reduce API calls
   - Batch similar requests
   - Avoid processing large datasets simultaneously

#### "Model not available"

**Symptoms:**
- API returns model error
- Specific model not found

**Solutions:**
1. **Check Available Models:**
   ```bash
   curl -H "Authorization: Bearer your-api-key" \
        https://api.cerebras.ai/v1/models
   ```

2. **Update Model Configuration:**
   ```bash
   # Set correct model name
   vercel env add CEREBRAS_MODEL "llama3.1-8b" production
   # or
   netlify env:set CEREBRAS_MODEL "llama3.1-8b"
   ```

### 4. Deployment Issues

#### Vercel Deployment Failures

**Build Errors:**
```bash
# Check build logs
vercel logs

# Common fixes:
npm install          # Install dependencies
npm run type-check   # Fix TypeScript errors
npm test            # Fix failing tests
```

**Environment Variable Issues:**
```bash
# List current variables
vercel env ls

# Add missing variables
vercel env add CEREBRAS_API_KEY production
vercel env add NODE_ENV production
```

**Function Timeout:**
```json
// In vercel.json, increase timeout:
{
  "functions": {
    "api/rewrite.ts": {
      "maxDuration": 60
    }
  }
}
```

#### Netlify Deployment Failures

**Build Errors:**
```bash
# Check build logs
netlify logs

# Common fixes:
npm install              # Install dependencies
npm run build:netlify   # Build for Netlify
```

**Function Issues:**
```toml
# In netlify.toml, adjust function settings:
[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"

[build.environment]
  NODE_VERSION = "18"
```

### 5. Performance Issues

#### Slow Response Times

**Symptoms:**
- Function takes longer than 30 seconds
- Frequent timeout errors

**Solutions:**
1. **Optimize Text Length:**
   ```javascript
   // Limit input size
   const MAX_TEXT_LENGTH = 5000;
   const MAX_CONTEXT_LENGTH = 2000;
   ```

2. **Enable Caching:**
   ```javascript
   // Ensure caching is enabled
   const ENABLE_CACHING = true;
   const CACHE_DURATION = 3600; // 1 hour
   ```

3. **Monitor Performance:**
   - Check function execution times in deployment dashboard
   - Monitor memory usage
   - Review API response times

#### Memory Issues

**Symptoms:**
- Out of memory errors
- Function crashes

**Solutions:**
1. **Increase Memory Allocation:**
   
   **Vercel:**
   ```json
   {
     "functions": {
       "api/rewrite.ts": {
         "memory": 1024
       }
     }
   }
   ```

2. **Optimize Code:**
   - Reduce memory usage in functions
   - Clear variables after use
   - Avoid large object creation

### 6. Data and Input Issues

#### "Invalid prompt" Error

**Symptoms:**
- Function returns "Invalid prompt"
- Empty or malformed prompts

**Solutions:**
1. **Check Prompt Format:**
   ```javascript
   // Valid prompts:
   =REWRITE("Make this more professional", A1)
   =REWRITE("Translate to Spanish", A1)
   
   // Invalid prompts:
   =REWRITE("", A1)        // Empty prompt
   =REWRITE(A1, A1)        // Cell reference as prompt
   ```

2. **Validate Input:**
   ```javascript
   // Add validation in your sheet:
   =IF(A1<>"", REWRITE("Fix grammar", A1), "No text to process")
   ```

#### "Text too long" Error

**Symptoms:**
- Function returns text length error
- Large text inputs fail

**Solutions:**
1. **Split Large Text:**
   ```javascript
   // Process in chunks:
   =REWRITE("Summarize part 1", A1:A10)
   =REWRITE("Summarize part 2", A11:A20)
   ```

2. **Adjust Limits:**
   ```javascript
   // In Code.gs, modify limits:
   const MAX_TEXT_LENGTH = 10000;  // Increase if needed
   ```

## Debugging Tools

### 1. Enable Debug Logging

**Apps Script:**
```javascript
// Add to Code.gs for debugging:
function debugREWRITE(prompt, mainText, contextText) {
  console.log('Prompt:', prompt);
  console.log('Main text:', mainText);
  console.log('Context:', contextText);
  
  // Call actual function
  return REWRITE(prompt, mainText, contextText);
}
```

**API (Environment Variables):**
```bash
# Enable debug logging
vercel env add DEBUG "cerebras:*" production
# or
netlify env:set DEBUG "cerebras:*"
```

### 2. Test API Manually

**Health Check:**
```bash
curl -X GET https://your-api-url.com/api/health
```

**Rewrite Test:**
```bash
curl -X POST https://your-api-url.com/api/rewrite \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Make this professional",
    "mainText": "hey there",
    "requestId": "test-123"
  }'
```

### 3. Monitor Logs

**Vercel:**
```bash
# View real-time logs
vercel logs --follow

# View specific function logs
vercel logs --follow --scope=api/rewrite
```

**Netlify:**
```bash
# View function logs
netlify logs --live

# View build logs
netlify logs --build
```

**Google Apps Script:**
```javascript
// View execution logs in Apps Script editor:
// View → Logs
// Or use console.log() statements
```

## Getting Help

### 1. Collect Information

Before seeking help, gather:
- Error messages (exact text)
- Steps to reproduce the issue
- Your deployment URL
- Google Apps Script project ID
- Browser and version (for client-side issues)

### 2. Check Status Pages

- [Vercel Status](https://www.vercel-status.com/)
- [Netlify Status](https://www.netlifystatus.com/)
- [Google Workspace Status](https://www.google.com/appsstatus/)
- [Cerebras AI Status](https://status.cerebras.ai/) (if available)

### 3. Community Resources

- **GitHub Issues:** Report bugs and feature requests
- **Stack Overflow:** Tag questions with relevant technologies
- **Google Apps Script Community:** For Apps Script specific issues
- **Platform Communities:** Vercel/Netlify Discord/forums

### 4. Professional Support

- **Cerebras AI Support:** For API-related issues
- **Google Workspace Support:** For enterprise Google Apps Script issues
- **Platform Support:** Vercel/Netlify support for deployment issues

## Prevention Tips

### 1. Regular Maintenance

- **Monitor API Usage:** Track requests and costs
- **Update Dependencies:** Keep packages current
- **Test Regularly:** Verify functionality after changes
- **Backup Configurations:** Save working configurations

### 2. Best Practices

- **Use Version Control:** Track all configuration changes
- **Environment Separation:** Use different environments for testing
- **Monitor Performance:** Set up alerts for issues
- **Document Changes:** Keep track of modifications

### 3. Security

- **Rotate API Keys:** Change keys regularly
- **Monitor Access:** Watch for unauthorized usage
- **Secure Configurations:** Don't commit secrets to version control
- **Review Permissions:** Regularly audit access permissions
## S
etup-Specific Troubleshooting

### Initial Setup Issues

#### "Cannot find deployment URL"

**Symptoms:**
- Completed deployment but don't know the URL
- Need to find the API endpoint

**Solutions:**

**Vercel:**
```bash
# List your deployments
vercel ls

# Get deployment URL
vercel inspect your-deployment-url
```

**Netlify:**
```bash
# Check site info
netlify status

# List sites
netlify sites:list
```

#### "Apps Script authorization keeps failing"

**Symptoms:**
- Authorization dialog appears repeatedly
- Permissions not sticking

**Solutions:**
1. **Clear Browser Cache:**
   - Clear cookies for script.google.com
   - Try incognito/private browsing mode

2. **Check Account Permissions:**
   - Ensure you have Google Apps Script access
   - Try with a different Google account

3. **Simplify Permissions:**
   ```javascript
   // Test with minimal function first
   function simpleTest() {
     return "Hello World";
   }
   ```

#### "API endpoint not configured" in Apps Script

**Symptoms:**
- getSystemStatus() shows "API Not Configured"
- REWRITE function returns configuration errors

**Solutions:**
1. **Verify Script Properties:**
   ```javascript
   function checkProperties() {
     const properties = PropertiesService.getScriptProperties();
     const apiEndpoint = properties.getProperty('API_ENDPOINT');
     console.log('Current API endpoint:', apiEndpoint);
   }
   ```

2. **Set Properties Correctly:**
   ```javascript
   function fixApiEndpoint() {
     PropertiesService.getScriptProperties()
       .setProperty('API_ENDPOINT', 'https://your-actual-url.vercel.app/api/rewrite');
   }
   ```

### First-Time Usage Issues

#### "Function works in Apps Script but not in Sheets"

**Symptoms:**
- Function runs in Apps Script editor
- Returns #NAME? error in Google Sheets

**Solutions:**
1. **Check Function Deployment:**
   - Ensure the script is saved
   - Try refreshing Google Sheets

2. **Verify Function Signature:**
   ```javascript
   // Make sure function has @customfunction tag
   /**
    * @customfunction
    */
   function REWRITE(prompt, mainText, contextCells) {
     // Function code
   }
   ```

#### "First API call takes very long"

**Symptoms:**
- Initial function call times out
- Subsequent calls work fine

**Causes:**
- Cold start on serverless platform
- Initial authorization delays

**Solutions:**
1. **Warm Up API:**
   ```bash
   # Call health endpoint to warm up
   curl https://your-api-url.com/api/health
   ```

2. **Increase Initial Timeout:**
   ```javascript
   // In Apps Script, increase timeout for first call
   const INITIAL_TIMEOUT = 60000; // 60 seconds
   ```

### Configuration Validation Issues

#### "Environment variables not taking effect"

**Symptoms:**
- Set environment variables but API behavior unchanged
- Default values still being used

**Solutions:**
1. **Redeploy After Changes:**
   ```bash
   # Vercel
   vercel --prod --force
   
   # Netlify
   netlify deploy --prod --clear-cache
   ```

2. **Verify Variable Names:**
   ```bash
   # Check exact variable names
   vercel env ls | grep CEREBRAS
   netlify env:list | grep CEREBRAS
   ```

3. **Test Variable Access:**
   ```javascript
   // Add to your API function temporarily
   console.log('Environment check:', {
     hasApiKey: !!process.env.CEREBRAS_API_KEY,
     nodeEnv: process.env.NODE_ENV
   });
   ```

### Setup Validation Checklist

Use this checklist to verify your setup:

#### Backend API Checklist
- [ ] Cerebras API key obtained and valid
- [ ] Environment variables set correctly
- [ ] API deployed successfully
- [ ] Health endpoint returns 200 OK
- [ ] Rewrite endpoint accepts POST requests
- [ ] CORS headers configured for Google Apps Script

#### Google Apps Script Checklist
- [ ] Code copied and saved correctly
- [ ] API endpoint configured in script properties
- [ ] All permissions authorized
- [ ] Test function runs without errors
- [ ] System status shows all green

#### Integration Checklist
- [ ] REWRITE function works in Google Sheets
- [ ] Error messages are user-friendly
- [ ] Caching is working (repeated calls are faster)
- [ ] Different prompt types work correctly
- [ ] Cell references and ranges work properly

### Quick Diagnostic Commands

**Test API Health:**
```bash
curl -X GET https://your-api-url.com/api/health
```

**Test API Functionality:**
```bash
curl -X POST https://your-api-url.com/api/rewrite \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test","mainText":"hello","requestId":"test-123"}'
```

**Check Apps Script Status:**
```javascript
// In Google Sheets cell:
=getSystemStatus()
```

**Test Basic Function:**
```javascript
// In Google Sheets:
=REWRITE("test", "hello world")
```