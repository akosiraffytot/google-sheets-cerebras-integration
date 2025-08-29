# Google Sheets Cerebras AI Integration

A complete integration system that allows users to process data from Google Sheets through Cerebras AI and return the results back to the sheet. The system consists of a Google Apps Script interface, a serverless backend API, and integration with the Cerebras AI Node.js SDK.

## Features

- **Custom Google Sheets Function**: Use `=REWRITE("prompt", main_cell, context_cells)` directly in spreadsheet cells
- **Serverless Backend**: Deploy on Vercel or Netlify for scalable, cost-effective processing
- **Cerebras AI Integration**: Leverage powerful AI models for text rewriting and processing
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Rate Limiting**: Built-in rate limiting and retry logic for reliable operation
- **Caching**: Smart caching to avoid redundant API calls
- **TypeScript**: Full type safety throughout the codebase

## Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd google-sheets-cerebras-integration
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Cerebras API key
   ```

3. **Deploy Backend** (choose one)
   ```bash
   # Vercel (recommended)
   npm run deploy

   # Or Netlify
   npm run deploy:netlify
   ```

4. **Set up Google Apps Script**
   - Copy the code from `google-apps-script/Code.gs`
   - Update the `API_BASE_URL` with your deployed endpoint
   - Save and authorize the script

5. **Use in Google Sheets**
   ```
   =REWRITE("Make this more professional", A1, B1:C1)
   ```

## Project Structure

```
├── api/                          # Vercel serverless functions
│   ├── rewrite.ts               # Main rewrite endpoint
│   └── health.ts                # Health check endpoint
├── netlify/                     # Netlify Functions (alternative)
│   └── functions/
│       ├── rewrite.ts           # Netlify rewrite function
│       └── health.ts            # Netlify health function
├── src/                         # Source code
│   ├── types/                   # TypeScript type definitions
│   │   └── api.ts              # API interfaces
│   ├── utils/                   # Utility functions
│   │   ├── validation.ts       # Request validation
│   │   ├── errorHandler.ts     # Error handling
│   │   ├── retryHandler.ts     # Retry logic
│   │   └── requestQueue.ts     # Request queuing
│   └── services/                # Service integrations
│       └── cerebras.ts         # Cerebras AI service
├── google-apps-script/          # Google Apps Script files
│   └── Code.gs                 # Custom REWRITE function
├── scripts/                     # Deployment scripts
│   ├── deploy-vercel.sh        # Vercel deployment
│   ├── deploy-netlify.sh       # Netlify deployment
│   └── setup-*-env.sh          # Environment setup
├── docs/                        # Documentation
│   ├── DEPLOYMENT.md           # Deployment guides
│   ├── GOOGLE_APPS_SCRIPT.md   # Apps Script setup
│   └── TROUBLESHOOTING.md      # Common issues
├── package.json                 # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── vercel.json                 # Vercel deployment config
├── netlify.toml                # Netlify deployment config
└── .env.example                # Environment variables template
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

## Deployment

### Vercel (Recommended)

1. **Quick Deploy**
   ```bash
   npm run deploy
   ```

2. **Manual Setup**
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Deploy
   vercel --prod
   
   # Set up environment variables
   ./scripts/setup-vercel-env.sh
   ```

### Netlify (Alternative)

1. **Quick Deploy**
   ```bash
   npm run deploy:netlify
   ```

2. **Manual Setup**
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli
   
   # Deploy
   netlify deploy --prod
   
   # Set up environment variables
   ./scripts/setup-netlify-env.sh
   ```

## Google Apps Script Setup

1. Open [Google Apps Script](https://script.google.com)
2. Create a new project
3. Copy the code from `google-apps-script/Code.gs`
4. Update the `API_BASE_URL` constant with your deployed API URL
5. Save and authorize the script
6. Use the `REWRITE` function in your Google Sheets

For detailed instructions, see [docs/GOOGLE_APPS_SCRIPT.md](docs/GOOGLE_APPS_SCRIPT.md).

## Usage Examples

```javascript
// Basic usage
=REWRITE("Make this more professional", A1)

// With context
=REWRITE("Summarize this", A1, B1:C1)

// Custom prompts
=REWRITE("Translate to Spanish", A1)
=REWRITE("Make this sound more friendly", A1, "email to customer")
```

## 📚 Documentation and Examples

- **[Complete Usage Guide](docs/USAGE_GUIDE.md)** - Comprehensive guide with practical examples
- **[Examples and Use Cases](docs/EXAMPLES.md)** - Real-world scenarios and best practices
- **[Ready-to-Use Templates](templates/README.md)** - Pre-built templates for common business needs
  - [Customer Service Template](templates/customer-service-template.csv)
  - [Marketing Content Template](templates/marketing-content-template.csv)
  - [Content Optimization Template](templates/content-optimization-template.csv)
  - [Business Communication Template](templates/business-communication-template.csv)

## Error Handling

The system provides clear error messages for common issues:

- **"Processing..."** - Request is being processed
- **"Retrying..."** - Rate limit hit, retrying automatically
- **"Error: Invalid prompt"** - Prompt parameter is missing or invalid
- **"Error: API unavailable"** - Cerebras API is temporarily unavailable
- **"Error: Connection failed"** - Network connectivity issues

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

## Support

For issues and questions:
1. Check [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
2. Review the [deployment guides](docs/DEPLOYMENT.md)
3. Open an issue on GitHub

## Changelog

### v1.0.0
- Initial release
- Google Sheets integration
- Cerebras AI integration
- Vercel and Netlify deployment support
- Comprehensive error handling and retry logic