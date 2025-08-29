# Google Sheets Cerebras AI Integration

A complete integration system that allows users to process data from Google Sheets through Cerebras AI and return the results back to the sheet. The system consists of a Google Apps Script interface, a serverless backend API, and integration with the Cerebras AI Node.js SDK.

## Features

- **Custom Google Sheets Function**: Use `=REWRITE("prompt", main_cell, context_cells)` directly in spreadsheet cells
- **Dual Deployment Support**: Deploy on Vercel or Netlify for scalable, cost-effective processing
- **Cerebras AI Integration**: Leverage powerful AI models for text rewriting and processing
- **Comprehensive Error Handling**: User-friendly error messages with actionable guidance
- **Smart Retry Logic**: Built-in retry logic with exponential backoff for reliable operation
- **Intelligent Caching**: Optimized caching system to avoid redundant API calls and improve performance
- **TypeScript**: Full type safety throughout the codebase
- **Production Ready**: Optimized for real-world usage with performance monitoring

## Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd google-sheets-cerebras-integration
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Cerebras API key:
```env
CEREBRAS_API_KEY=your-cerebras-api-key-here
```

### 3. Deploy Backend

**🚨 Important**: We recommend **Netlify** over Vercel due to deployment protection compatibility issues with Google Apps Script.

#### Option A: Netlify (Recommended)
```bash
npm run deploy:netlify
```

#### Option B: Vercel (Advanced Users)
```bash
npm run deploy
```
**Note**: If using Vercel, you may need to disable deployment protection in your project settings for Google Apps Script compatibility.

### 4. Configure Environment Variables

After deployment, add your Cerebras API key to your hosting platform:

#### For Netlify:
1. Go to your Netlify dashboard → Site settings → Environment variables
2. Add `CEREBRAS_API_KEY` with your API key value

#### For Vercel:
1. Go to your Vercel dashboard → Project settings → Environment variables
2. Add `CEREBRAS_API_KEY` with your API key value
3. **Important**: Disable "Deployment Protection" in Settings → Security (if available) for Google Apps Script compatibility

### 5. Set up Google Apps Script

1. **Open Google Apps Script**: Go to [script.google.com](https://script.google.com)
2. **Create New Project**: Click "New Project"
3. **Copy the Code**: Copy all content from `google-apps-script/Code.gs` and paste it into the script editor
4. **Configure API Endpoint**: 
   - Find the `configureApiEndpoint()` function
   - Replace `'https://your-deployment-url.vercel.app/api/rewrite'` with your actual deployment URL:
     - **Netlify**: `https://your-site-name.netlify.app/api/rewrite`
     - **Vercel**: `https://your-project-name.vercel.app/api/rewrite`
5. **Run Setup**: Execute the `configureApiEndpoint()` function once
6. **Test Setup**: Run `testConfiguration()` to verify everything is working
7. **Save and Authorize**: Save the script and authorize when prompted

### 6. Use in Google Sheets

Once configured, you can use the custom function in any Google Sheet:

```javascript
// Basic usage
=REWRITE("Make this more professional", A1)

// With context
=REWRITE("Summarize this email", A1, B1:C1)

// Complex instructions (up to 2000 characters)
=REWRITE("Rewrite this text to be more formal and business-appropriate. Use professional language, proper grammar, and maintain the original meaning while improving clarity.", A1)
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CEREBRAS_API_KEY` | Your Cerebras AI API key | Required |
| `NODE_ENV` | Environment (development/production) | development |
| `API_TIMEOUT` | Request timeout in milliseconds | 30000 |
| `MAX_RETRIES` | Maximum retry attempts | 3 |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | 60000 |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |
| `CEREBRAS_MODEL` | Cerebras model to use | llama3.1-8b |
| `CEREBRAS_TEMPERATURE` | AI temperature setting | 0.7 |
| `CEREBRAS_MAX_TOKENS` | Maximum tokens per request | 1000 |

## API Endpoints

### POST `/api/rewrite`
Processes text rewriting requests.

**Request Body:**
```json
{
  "prompt": "Make this more professional",
  "mainText": "hey there how are you",
  "contextText": "email to client",
  "requestId": "unique-id-123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "rewrittenText": "Hello, I hope you are doing well."
  }
}
```

### GET `/api/health`
Health check endpoint for monitoring.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

## Development

```bash
# Install dependencies
npm install

# Run type checking
npm run type-check

# Run tests
npm test

# Start development server (Vercel)
npm run dev

# Start development server (Netlify)
npm run netlify:dev
```

## Detailed Deployment Guide

### Netlify Deployment (Recommended)

Netlify is recommended due to better compatibility with Google Apps Script and no deployment protection issues.

1. **Install Netlify CLI** (if not already installed):
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**:
   ```bash
   netlify login
   ```

3. **Deploy**:
   ```bash
   npm run deploy:netlify
   ```

4. **Configure Environment Variables**:
   - Go to your Netlify dashboard
   - Navigate to Site settings → Environment variables
   - Add `CEREBRAS_API_KEY` with your API key value
   - Redeploy if necessary

### Vercel Deployment (Advanced)

⚠️ **Important Considerations for Vercel**:
- Vercel's deployment protection can interfere with Google Apps Script
- You may need to disable deployment protection or configure bypass tokens
- Netlify is recommended for easier setup

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   npm run deploy
   ```

3. **Configure Environment Variables**:
   - Go to your Vercel dashboard
   - Navigate to Project settings → Environment variables
   - Add `CEREBRAS_API_KEY` with your API key value

4. **Handle Deployment Protection** (if enabled):
   - Go to Settings → Security (if available)
   - Disable "Deployment Protection" for Google Apps Script compatibility
   - Or configure bypass tokens as needed

## Google Apps Script Setup Guide

### Step-by-Step Setup

1. **Access Google Apps Script**:
   - Go to [script.google.com](https://script.google.com)
   - Sign in with your Google account

2. **Create New Project**:
   - Click "New Project"
   - Give it a meaningful name like "Cerebras AI Integration"

3. **Copy the Code**:
   - Open `google-apps-script/Code.gs` from this repository
   - Select all content and copy it
   - Paste it into the Google Apps Script editor (replace the default code)

4. **Configure Your API Endpoint**:
   ```javascript
   // Find this function in the code and update the URL
   function configureApiEndpoint() {
     // Replace with your actual deployment URL
     const apiUrl = 'https://your-actual-deployment.netlify.app/api/rewrite';
     setApiEndpoint(apiUrl);
     // ...
   }
   ```

5. **Run Initial Setup**:
   - Click the function dropdown and select `configureApiEndpoint`
   - Click the "Run" button (▶️)
   - Authorize the script when prompted (this is normal and safe)

6. **Test Your Setup**:
   - Select `testConfiguration` from the function dropdown
   - Click "Run" and check the execution log
   - You should see successful API connection messages

7. **Save Your Project**:
   - Press Ctrl+S (or Cmd+S on Mac) to save
   - Your script is now ready to use!

### Troubleshooting Google Apps Script

If you encounter issues:

1. **Check System Status**:
   ```javascript
   // Run this function to check your setup
   =getSystemStatus()
   ```

2. **Common Issues**:
   - **"API Not Configured"**: Run `configureApiEndpoint()` with your correct URL
   - **"Authentication Failed"**: Check that your Cerebras API key is set in your deployment
   - **"Connection Failed"**: Verify your deployment URL is correct and accessible

3. **Debug Functions Available**:
   - `getSystemStatus()` - Check overall system health
   - `testConfiguration()` - Test API connectivity
   - `getProcessingStatus()` - Detailed status information

## Usage Examples

### Basic Usage
```javascript
// Simple text rewriting
=REWRITE("Make this more professional", A1)

// With additional context
=REWRITE("Summarize this email", A1, B1:C1)

// Translation
=REWRITE("Translate to Spanish", A1)

// Tone adjustment
=REWRITE("Make this sound more friendly", A1)
```

### Advanced Usage
```javascript
// Complex instructions (up to 2000 characters supported)
=REWRITE("Rewrite this text to be more formal and business-appropriate. Use professional language, remove casual expressions, ensure proper grammar and punctuation, maintain the original meaning while improving clarity and conciseness. The tone should be respectful and authoritative.", A1)

// Content optimization
=REWRITE("Optimize this for SEO while maintaining readability. Include relevant keywords naturally and improve the structure for better engagement.", A1, B1:B5)

// Email enhancement
=REWRITE("Transform this into a professional email. Add appropriate greeting, clear subject matter, and professional closing. Maintain the core message but improve the tone and structure.", A1)

// Multiple cell processing
=REWRITE("Combine these points into a coherent paragraph", A1:A5)
```

### Real-World Scenarios
```javascript
// Customer service responses
=REWRITE("Make this customer service response more empathetic and helpful", A1)

// Marketing copy
=REWRITE("Transform this product description into compelling marketing copy that highlights benefits and creates urgency", A1)

// Technical documentation
=REWRITE("Simplify this technical explanation for a general audience while maintaining accuracy", A1)

// Social media content
=REWRITE("Adapt this content for LinkedIn, making it professional and engaging for a business audience", A1)
```

## 📚 Documentation and Examples

- **[Complete Usage Guide](docs/USAGE_GUIDE.md)** - Comprehensive guide with practical examples
- **[Examples and Use Cases](docs/EXAMPLES.md)** - Real-world scenarios and best practices
- **[Ready-to-Use Templates](templates/README.md)** - Pre-built templates for common business needs
  - [Customer Service Template](templates/customer-service-template.csv)
  - [Marketing Content Template](templates/marketing-content-template.csv)
  - [Content Optimization Template](templates/content-optimization-template.csv)
  - [Business Communication Template](templates/business-communication-template.csv)

## Error Handling and Troubleshooting

The system provides clear, actionable error messages for common issues:

### Common Error Messages

| Error Message | Meaning | Solution |
|---------------|---------|----------|
| `❌ Missing Prompt` | First parameter is required | Provide a prompt: `=REWRITE("your instruction", A1)` |
| `❌ Empty Text` | The cell you referenced is empty | Add content to the referenced cell |
| `❌ Prompt Too Long` | Prompt exceeds 2000 characters | Shorten your instructions |
| `🔐 Authentication Failed` | API key is invalid or missing | Check your Cerebras API key in deployment settings |
| `⚠️ Service Unavailable` | Cerebras API is temporarily down | Wait a few minutes and try again |
| `⏳ Rate Limited` | Too many requests sent | Wait 1-2 minutes before trying again |
| `🌐 Network Error` | Connection issues | Check your internet connection |
| `⏱️ Timeout` | Request took too long | Try with shorter text or check connection |

### System Status Functions

Use these functions in Google Apps Script to diagnose issues:

```javascript
// Check overall system health
=getSystemStatus()

// Get detailed status information
function checkStatus() {
  return getProcessingStatus();
}

// Test your configuration
function runTest() {
  return testConfiguration();
}
```

### Troubleshooting Steps

1. **Check System Status**: Run `=getSystemStatus()` in a cell
2. **Verify API Endpoint**: Ensure your deployment URL is correct
3. **Test Simple Request**: Try `=REWRITE("test", "hello world")`
4. **Check Deployment**: Verify your API is deployed and accessible
5. **Verify API Key**: Ensure Cerebras API key is set in your deployment environment

### Performance Optimization

- **Caching**: Results are automatically cached for 1 hour to improve performance
- **Retry Logic**: Failed requests are automatically retried up to 3 times
- **Rate Limiting**: Built-in protection against API rate limits
- **Smart Processing**: Optimized for different content types and lengths

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- validation.test.ts
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run tests and type checking
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Important Notes and Best Practices

### Deployment Platform Recommendations

- **✅ Netlify (Recommended)**: Better compatibility with Google Apps Script, no deployment protection issues
- **⚠️ Vercel**: May require disabling deployment protection for Google Apps Script compatibility

### Security Considerations

- **API Key Protection**: Your Cerebras API key is stored securely in your deployment environment
- **Google Apps Script**: The API endpoint is stored in Google's PropertiesService, not visible to sheet users
- **Rate Limiting**: Built-in protection against excessive API usage

### Performance Tips

- **Use Caching**: Results are cached automatically - identical requests return instantly
- **Batch Processing**: Process multiple cells efficiently using cell ranges
- **Prompt Optimization**: Clear, specific prompts yield better results
- **Content Length**: Very long texts (>5000 characters) may take longer to process

## Support and Troubleshooting

### Getting Help

1. **Check System Status**: Use `=getSystemStatus()` in your Google Sheet
2. **Review Error Messages**: All errors include actionable guidance
3. **Test Configuration**: Run `testConfiguration()` in Google Apps Script
4. **Check Documentation**: Review the setup steps above
5. **Open an Issue**: Create a GitHub issue with error details

### Common Setup Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "API Not Configured" | API endpoint not set | Run `configureApiEndpoint()` with correct URL |
| "Authentication Failed" | Missing API key | Add `CEREBRAS_API_KEY` to deployment environment |
| "Connection Failed" | Wrong URL or deployment down | Verify deployment URL and status |
| Function not found | Code not copied correctly | Re-copy entire `Code.gs` content |

## Changelog

### v1.1.0 (Latest)
- **Enhanced Error Handling**: More detailed, actionable error messages
- **Improved Caching**: Optimized caching system with intelligent duration selection
- **Increased Prompt Limit**: Extended prompt length from 500 to 2000 characters
- **Better Deployment Support**: Improved compatibility with both Vercel and Netlify
- **Production Optimizations**: Enhanced retry logic, performance monitoring, and reliability
- **Comprehensive Documentation**: Updated setup guides and troubleshooting information

### v1.0.0
- Initial release
- Google Sheets integration
- Cerebras AI integration
- Vercel and Netlify deployment support
- Basic error handling and retry logic

## License

MIT License - see LICENSE file for details.