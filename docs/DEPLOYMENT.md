# Deployment Guide

This comprehensive guide covers deploying the Google Sheets Cerebras AI Integration to both Vercel and Netlify platforms, with step-by-step instructions for complete setup.

## Prerequisites

Before starting the deployment process, ensure you have:

- **Node.js 18+** installed on your local machine
- **Cerebras AI API key** (get one from [Cerebras Cloud](https://cloud.cerebras.ai/))
- **Git repository** for your project (for automatic deployments)
- **Command line access** (Terminal on Mac/Linux, Command Prompt/PowerShell on Windows)
- **Text editor** for configuration files

### Getting Your Cerebras API Key

1. Visit [Cerebras Cloud](https://cloud.cerebras.ai/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Generate a new API key
5. Copy and securely store the key (you'll need it for environment variables)

## Vercel Deployment (Recommended)

Vercel provides excellent TypeScript support and seamless serverless function deployment.

### Quick Deployment

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy with Script**
   ```bash
   # Production deployment
   ./scripts/deploy-vercel.sh production
   
   # Preview deployment
   ./scripts/deploy-vercel.sh
   ```

### Manual Deployment

1. **Prepare Environment**
   ```bash
   # Copy environment template
   cp .env.example .env.local
   
   # Edit with your values
   nano .env.local
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run Tests**
   ```bash
   npm test
   npm run type-check
   ```

4. **Deploy**
   ```bash
   # Login to Vercel (first time only)
   vercel login
   
   # Deploy to production
   vercel --prod
   ```

5. **Set Environment Variables**
   ```bash
   # Automated setup
   ./scripts/setup-vercel-env.sh
   
   # Or manually in Vercel dashboard
   vercel env add CEREBRAS_API_KEY production
   ```

### Vercel Configuration

The `vercel.json` file configures:
- Function timeouts (30s for rewrite, 5s for health)
- Memory allocation (1024MB for rewrite, 128MB for health)
- CORS headers for Google Apps Script
- Environment variables
- Route mappings

### Vercel Environment Variables

Set these in the Vercel dashboard or using the CLI:

```bash
vercel env add CEREBRAS_API_KEY production
vercel env add NODE_ENV production
vercel env add API_TIMEOUT production
vercel env add MAX_RETRIES production
vercel env add RATE_LIMIT_WINDOW_MS production
vercel env add RATE_LIMIT_MAX_REQUESTS production
vercel env add CEREBRAS_MODEL production
vercel env add CEREBRAS_TEMPERATURE production
vercel env add CEREBRAS_MAX_TOKENS production
```

## Netlify Deployment (Alternative)

Netlify provides robust serverless functions with excellent build optimization.

### Quick Deployment

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Deploy with Script**
   ```bash
   # Production deployment
   ./scripts/deploy-netlify.sh production
   
   # Preview deployment
   ./scripts/deploy-netlify.sh
   ```

### Manual Deployment

1. **Prepare Environment**
   ```bash
   # Copy environment template
   cp .env.example .env.local
   
   # Edit with your values
   nano .env.local
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build for Netlify**
   ```bash
   npm run build:netlify
   ```

4. **Deploy**
   ```bash
   # Login to Netlify (first time only)
   netlify login
   
   # Deploy to production
   netlify deploy --prod
   ```

5. **Set Environment Variables**
   ```bash
   # Automated setup
   ./scripts/setup-netlify-env.sh
   
   # Or manually in Netlify dashboard
   netlify env:set CEREBRAS_API_KEY "your-api-key"
   ```

### Netlify Configuration

The `netlify.toml` file configures:
- Function directory and build commands
- Node.js version and environment
- CORS headers and redirects
- Function-specific timeouts
- External node modules handling

### Netlify Environment Variables

Set these in the Netlify dashboard or using the CLI:

```bash
netlify env:set CEREBRAS_API_KEY "your-api-key"
netlify env:set NODE_ENV "production"
netlify env:set API_TIMEOUT "30000"
netlify env:set MAX_RETRIES "3"
netlify env:set RATE_LIMIT_WINDOW_MS "60000"
netlify env:set RATE_LIMIT_MAX_REQUESTS "100"
netlify env:set CEREBRAS_MODEL "llama3.1-8b"
netlify env:set CEREBRAS_TEMPERATURE "0.7"
netlify env:set CEREBRAS_MAX_TOKENS "1000"
```

## Post-Deployment Steps

### 1. Test Endpoints

Test your deployed API:

```bash
# Health check
curl https://your-deployment-url.vercel.app/api/health

# Rewrite test
curl -X POST https://your-deployment-url.vercel.app/api/rewrite \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Make this more professional",
    "mainText": "hey there",
    "requestId": "test-123"
  }'
```

### 2. Update Google Apps Script

1. Open your Google Apps Script project
2. Update the `API_BASE_URL` constant:
   ```javascript
   const API_BASE_URL = 'https://your-deployment-url.vercel.app';
   ```
3. Save and test the REWRITE function

### 3. Monitor Performance

- **Vercel**: Use Vercel Analytics and Functions dashboard
- **Netlify**: Use Netlify Analytics and Functions logs
- Set up alerts for function errors and timeouts

## Continuous Deployment

### GitHub Integration

Both platforms support automatic deployments from Git:

1. **Connect Repository**
   - Vercel: Import project from GitHub
   - Netlify: Connect to Git provider

2. **Configure Build Settings**
   - Build command: `npm run build` (Vercel) or `npm run build:netlify` (Netlify)
   - Output directory: `dist`
   - Node.js version: 18+

3. **Set Environment Variables**
   - Add all required environment variables in the platform dashboard
   - Use different values for production and preview environments

### Branch Deployments

- **Production**: Deploy from `main` branch
- **Preview**: Deploy from feature branches for testing
- **Development**: Use local development servers

## Performance Optimization

### Function Configuration

**Vercel:**
- Memory: 1024MB for rewrite function (handles AI processing)
- Memory: 128MB for health function (minimal requirements)
- Timeout: 30s for rewrite, 5s for health

**Netlify:**
- Timeout: 30s for rewrite function
- Timeout: 5s for health function
- Bundle optimization with esbuild

### Caching Strategy

- API responses are not cached (dynamic content)
- Static assets cached at CDN level
- Google Apps Script implements client-side caching

### Monitoring

Set up monitoring for:
- Function execution time
- Error rates
- Memory usage
- API response times
- Rate limit hits

## Troubleshooting

### Common Issues

1. **Environment Variables Not Set**
   ```
   Error: CEREBRAS_API_KEY is required
   ```
   Solution: Set environment variables in platform dashboard

2. **Function Timeout**
   ```
   Error: Function execution timed out
   ```
   Solution: Increase timeout in configuration files

3. **CORS Issues**
   ```
   Error: Access to fetch blocked by CORS policy
   ```
   Solution: Verify CORS headers in configuration

4. **Build Failures**
   ```
   Error: TypeScript compilation failed
   ```
   Solution: Run `npm run type-check` locally and fix errors

### Debug Mode

Enable debug logging:

```bash
# Vercel
vercel env add DEBUG "cerebras:*" production

# Netlify
netlify env:set DEBUG "cerebras:*"
```

### Log Analysis

**Vercel:**
- View logs in Vercel dashboard
- Use `vercel logs` CLI command

**Netlify:**
- View logs in Netlify dashboard
- Use `netlify logs` CLI command

## Security Considerations

### API Key Management

- Never commit API keys to version control
- Use platform-specific secret management
- Rotate API keys regularly
- Monitor API key usage

### CORS Configuration

- Restrict origins to `https://script.google.com`
- Use specific headers instead of wildcards in production
- Monitor for unauthorized access attempts

### Rate Limiting

- Implement per-IP rate limiting
- Monitor for abuse patterns
- Set up alerts for unusual traffic

## Cost Optimization

### Vercel

- Functions: Pay per execution and duration
- Bandwidth: Generous free tier, pay for overages
- Optimize function memory allocation

### Netlify

- Functions: 125K requests/month free, then pay per request
- Bandwidth: 100GB/month free, then pay for overages
- Build minutes: 300 minutes/month free

### Tips

- Use appropriate memory allocation for functions
- Implement efficient caching strategies
- Monitor usage and set up billing alerts
- Consider function cold start optimization

## Scaling Considerations

### Traffic Patterns

- Google Sheets usage typically has burst patterns
- Plan for concurrent user scenarios
- Consider regional deployment for global users

### Performance Monitoring

- Set up alerts for high error rates
- Monitor function execution times
- Track API rate limit usage
- Monitor memory and timeout issues

### Capacity Planning

- Cerebras API rate limits vary by plan
- Plan function concurrency limits
- Consider caching strategies for repeated requests
- Monitor and optimize for cost efficiency