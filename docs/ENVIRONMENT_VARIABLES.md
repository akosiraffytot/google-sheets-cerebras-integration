# Environment Variables Configuration Guide

This guide provides comprehensive instructions for configuring environment variables for the Google Sheets Cerebras AI Integration across different deployment platforms.

## Overview

Environment variables are used to configure the API without hardcoding sensitive information like API keys. This system requires several environment variables to function properly.

## Required Environment Variables

### Core Variables (Required)

| Variable | Description | Example Value | Required |
|----------|-------------|---------------|----------|
| `CEREBRAS_API_KEY` | Your Cerebras AI API key | `sk-1234567890abcdef...` | ✅ |
| `NODE_ENV` | Environment mode | `production` | ✅ |

### Optional Configuration Variables

| Variable | Description | Default Value | Example |
|----------|-------------|---------------|---------|
| `API_TIMEOUT` | Request timeout in milliseconds | `30000` | `45000` |
| `MAX_RETRIES` | Maximum retry attempts | `3` | `5` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in milliseconds | `60000` | `300000` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` | `50` |
| `CEREBRAS_MODEL` | Cerebras AI model to use | `llama3.1-8b` | `llama3.1-70b` |
| `CEREBRAS_TEMPERATURE` | AI response creativity (0-1) | `0.7` | `0.3` |
| `CEREBRAS_MAX_TOKENS` | Maximum response tokens | `1000` | `2000` |
| `CACHE_DURATION` | Cache duration in seconds | `3600` | `7200` |
| `DEBUG` | Debug logging pattern | `""` | `cerebras:*` |

## Platform-Specific Setup

### Vercel Configuration

#### Method 1: Using Vercel CLI (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Set Environment Variables:**
   ```bash
   # Required variables
   vercel env add CEREBRAS_API_KEY production
   vercel env add NODE_ENV production
   
   # Optional variables (with recommended values)
   vercel env add API_TIMEOUT production
   vercel env add MAX_RETRIES production
   vercel env add RATE_LIMIT_WINDOW_MS production
   vercel env add RATE_LIMIT_MAX_REQUESTS production
   vercel env add CEREBRAS_MODEL production
   vercel env add CEREBRAS_TEMPERATURE production
   vercel env add CEREBRAS_MAX_TOKENS production
   ```

4. **Verify Variables:**
   ```bash
   vercel env ls
   ```

#### Method 2: Using Vercel Dashboard

1. **Access Dashboard:**
   - Go to [vercel.com](https://vercel.com)
   - Navigate to your project
   - Click "Settings" → "Environment Variables"

2. **Add Variables:**
   - Click "Add New"
   - Enter variable name and value
   - Select environment (Production, Preview, Development)
   - Click "Save"

3. **Required Settings:**
   ```
   Name: CEREBRAS_API_KEY
   Value: your-actual-api-key
   Environment: Production ✓ Preview ✓ Development ✓
   
   Name: NODE_ENV
   Value: production
   Environment: Production ✓
   ```

#### Method 3: Using Automated Script

Use the provided setup script:

```bash
# Make script executable
chmod +x scripts/setup-vercel-env.sh

# Run setup script
./scripts/setup-vercel-env.sh
```

The script will prompt you for values and set up all variables automatically.

### Netlify Configuration

#### Method 1: Using Netlify CLI (Recommended)

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify:**
   ```bash
   netlify login
   ```

3. **Set Environment Variables:**
   ```bash
   # Required variables
   netlify env:set CEREBRAS_API_KEY "your-api-key"
   netlify env:set NODE_ENV "production"
   
   # Optional variables
   netlify env:set API_TIMEOUT "30000"
   netlify env:set MAX_RETRIES "3"
   netlify env:set RATE_LIMIT_WINDOW_MS "60000"
   netlify env:set RATE_LIMIT_MAX_REQUESTS "100"
   netlify env:set CEREBRAS_MODEL "llama3.1-8b"
   netlify env:set CEREBRAS_TEMPERATURE "0.7"
   netlify env:set CEREBRAS_MAX_TOKENS "1000"
   ```

4. **Verify Variables:**
   ```bash
   netlify env:list
   ```

#### Method 2: Using Netlify Dashboard

1. **Access Dashboard:**
   - Go to [netlify.com](https://netlify.com)
   - Navigate to your site
   - Click "Site settings" → "Environment variables"

2. **Add Variables:**
   - Click "Add a variable"
   - Enter key and value
   - Select scopes (Builds, Functions, Post-processing)
   - Click "Create variable"

3. **Required Scopes:**
   - **Functions**: ✅ (Required for API functions)
   - **Builds**: ✅ (Required for build process)
   - **Post-processing**: ❌ (Not needed)

#### Method 3: Using Automated Script

Use the provided setup script:

```bash
# Make script executable
chmod +x scripts/setup-netlify-env.sh

# Run setup script
./scripts/setup-netlify-env.sh
```

## Local Development Setup

### Using .env Files

1. **Create Environment File:**
   ```bash
   # Copy template
   cp .env.example .env.local
   ```

2. **Edit Configuration:**
   ```bash
   # Open in your preferred editor
   nano .env.local
   # or
   code .env.local
   ```

3. **Add Your Values:**
   ```env
   # Required
   CEREBRAS_API_KEY=sk-your-actual-api-key-here
   NODE_ENV=development
   
   # Optional (with defaults)
   API_TIMEOUT=30000
   MAX_RETRIES=3
   RATE_LIMIT_WINDOW_MS=60000
   RATE_LIMIT_MAX_REQUESTS=100
   CEREBRAS_MODEL=llama3.1-8b
   CEREBRAS_TEMPERATURE=0.7
   CEREBRAS_MAX_TOKENS=1000
   CACHE_DURATION=3600
   DEBUG=cerebras:*
   ```

### Environment File Priority

The system loads environment variables in this order (later overrides earlier):

1. System environment variables
2. `.env.local` (local development, ignored by git)
3. `.env.production` (production builds)
4. `.env` (default values, committed to git)

## Variable Validation

### Required Variable Check

The API automatically validates required environment variables on startup:

```javascript
// Validation happens in api/rewrite.ts
const requiredVars = ['CEREBRAS_API_KEY'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}
```

### Testing Configuration

Test your environment variables:

```bash
# Test locally
npm run dev

# Test deployed API
curl https://your-api-url.com/api/health
```

## Security Best Practices

### API Key Management

1. **Never Commit API Keys:**
   ```bash
   # Ensure .env.local is in .gitignore
   echo ".env.local" >> .gitignore
   ```

2. **Use Strong API Keys:**
   - Generate keys with sufficient entropy
   - Use different keys for different environments
   - Rotate keys regularly

3. **Limit API Key Permissions:**
   - Use least-privilege principle
   - Monitor API key usage
   - Set up usage alerts

### Environment Separation

1. **Different Keys per Environment:**
   ```
   Development: sk-dev-1234...
   Staging:     sk-staging-5678...
   Production:  sk-prod-9012...
   ```

2. **Environment-Specific Configuration:**
   ```env
   # Development - more verbose logging
   DEBUG=cerebras:*
   API_TIMEOUT=60000
   
   # Production - optimized for performance
   DEBUG=""
   API_TIMEOUT=30000
   ```

### Access Control

1. **Platform Security:**
   - Use platform-specific secret management
   - Enable two-factor authentication
   - Regularly review access permissions

2. **Monitoring:**
   - Monitor environment variable access
   - Set up alerts for configuration changes
   - Log configuration-related errors

## Troubleshooting Environment Variables

### Common Issues

#### "CEREBRAS_API_KEY is required"

**Cause:** API key not set or not accessible

**Solutions:**
1. **Verify Variable is Set:**
   ```bash
   # Vercel
   vercel env ls | grep CEREBRAS_API_KEY
   
   # Netlify
   netlify env:list | grep CEREBRAS_API_KEY
   ```

2. **Check Variable Name:**
   - Ensure exact spelling: `CEREBRAS_API_KEY`
   - Check for extra spaces or characters

3. **Verify Environment:**
   - Ensure variable is set for correct environment
   - Check production vs preview vs development

#### "Invalid API key format"

**Cause:** API key format is incorrect

**Solutions:**
1. **Check Key Format:**
   ```
   Correct:   sk-1234567890abcdef...
   Incorrect: 1234567890abcdef... (missing sk- prefix)
   ```

2. **Regenerate Key:**
   - Go to Cerebras AI dashboard
   - Generate new API key
   - Update environment variable

#### Variables Not Loading

**Cause:** Environment variables not accessible to functions

**Solutions:**
1. **Redeploy After Changes:**
   ```bash
   # Vercel
   vercel --prod
   
   # Netlify
   netlify deploy --prod
   ```

2. **Check Function Configuration:**
   - Ensure functions have access to environment variables
   - Verify build process includes environment variables

3. **Clear Cache:**
   ```bash
   # Clear deployment cache
   vercel --prod --force
   # or
   netlify deploy --prod --clear-cache
   ```

### Debugging Environment Variables

#### Log Current Variables (Development Only)

```javascript
// Add to your API function for debugging
console.log('Environment check:', {
  hasApiKey: !!process.env.CEREBRAS_API_KEY,
  nodeEnv: process.env.NODE_ENV,
  timeout: process.env.API_TIMEOUT,
  // Never log actual API key values!
});
```

#### Test Variable Access

```bash
# Test locally
node -e "console.log('API Key set:', !!process.env.CEREBRAS_API_KEY)"

# Test in deployment
curl https://your-api-url.com/api/health
```

## Advanced Configuration

### Dynamic Configuration

For advanced use cases, you can implement dynamic configuration:

```javascript
// config/environment.js
const config = {
  development: {
    apiTimeout: 60000,
    maxRetries: 5,
    debug: true
  },
  production: {
    apiTimeout: 30000,
    maxRetries: 3,
    debug: false
  }
};

export const getConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return {
    ...config[env],
    // Override with environment variables
    apiTimeout: parseInt(process.env.API_TIMEOUT) || config[env].apiTimeout,
    maxRetries: parseInt(process.env.MAX_RETRIES) || config[env].maxRetries,
  };
};
```

### Configuration Validation

Implement comprehensive validation:

```javascript
// utils/validateConfig.js
export const validateConfig = () => {
  const errors = [];
  
  // Required variables
  if (!process.env.CEREBRAS_API_KEY) {
    errors.push('CEREBRAS_API_KEY is required');
  }
  
  // Format validation
  if (process.env.CEREBRAS_API_KEY && !process.env.CEREBRAS_API_KEY.startsWith('sk-')) {
    errors.push('CEREBRAS_API_KEY must start with "sk-"');
  }
  
  // Numeric validation
  const timeout = parseInt(process.env.API_TIMEOUT);
  if (timeout && (timeout < 1000 || timeout > 300000)) {
    errors.push('API_TIMEOUT must be between 1000 and 300000 milliseconds');
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration errors: ${errors.join(', ')}`);
  }
};
```

## Migration and Updates

### Updating Environment Variables

1. **Plan Changes:**
   - Document current configuration
   - Plan rollback strategy
   - Test changes in staging first

2. **Update Process:**
   ```bash
   # Update variable
   vercel env rm OLD_VARIABLE_NAME production
   vercel env add NEW_VARIABLE_NAME production
   
   # Redeploy
   vercel --prod
   ```

3. **Verify Changes:**
   - Test API functionality
   - Monitor error rates
   - Check performance metrics

### Backup Configuration

```bash
# Export current configuration
vercel env ls > vercel-env-backup.txt
netlify env:list > netlify-env-backup.txt
```

## Support and Resources

### Getting Help

1. **Check Configuration:**
   - Verify all required variables are set
   - Test API endpoints
   - Review deployment logs

2. **Platform Documentation:**
   - [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
   - [Netlify Environment Variables](https://docs.netlify.com/configure-builds/environment-variables/)

3. **Community Support:**
   - Platform-specific forums and Discord
   - Stack Overflow with relevant tags
   - GitHub issues for project-specific problems

### Best Practices Summary

1. **Security:**
   - Never commit secrets to version control
   - Use different keys for different environments
   - Rotate keys regularly

2. **Organization:**
   - Document all environment variables
   - Use consistent naming conventions
   - Group related variables

3. **Monitoring:**
   - Set up alerts for configuration changes
   - Monitor API key usage
   - Track configuration-related errors

4. **Maintenance:**
   - Regularly review and update configuration
   - Test configuration changes in staging
   - Keep backup of working configurations