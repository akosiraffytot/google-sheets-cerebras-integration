# Google Sheets Cerebras AI Integration - Templates

This directory contains ready-to-use templates for common business scenarios using the REWRITE function with Cerebras AI.

## Available Templates

### 1. Customer Service Template (`customer-service-template.csv`)

**Purpose**: Streamline customer service responses with AI-generated, professional replies.

**Features**:
- Categorized customer issues
- Context-aware response generation
- Follow-up tracking
- Professional tone optimization

**How to Use**:
1. Import the CSV into Google Sheets
2. Replace sample data with your actual customer messages
3. The AI will generate appropriate responses in column E
4. Review and customize responses before sending

**Sample Formula**:
```
=REWRITE("Create a professional and helpful customer service response", C2)
```

### 2. Marketing Content Template (`marketing-content-template.csv`)

**Purpose**: Generate optimized marketing content for different platforms and audiences.

**Features**:
- Multi-platform content optimization
- Audience-specific messaging
- Campaign tracking
- Call-to-action integration

**How to Use**:
1. Import the CSV into Google Sheets
2. Define your campaigns and target audiences
3. Input original content ideas
4. Let AI optimize for each platform and audience
5. Track performance across different content variations

**Sample Formula**:
```
=REWRITE("Create compelling email subject for small business owners", E2)
```

### 3. Content Optimization Template (`content-optimization-template.csv`)

**Purpose**: Improve existing content for better readability, engagement, and effectiveness.

**Features**:
- Readability improvement
- Audience adaptation
- Character count tracking
- Tone adjustment

**How to Use**:
1. Import the CSV into Google Sheets
2. Paste your original content
3. Specify target audience and optimization goals
4. Review AI-optimized versions
5. Track improvements in character count and readability

**Sample Formula**:
```
=REWRITE("Simplify for business users without technical background", B2)
```

### 4. Business Communication Template (`business-communication-template.csv`)

**Purpose**: Enhance professional communications for various business contexts.

**Features**:
- Context-aware tone adjustment
- Recipient-specific messaging
- Urgency level tracking
- Professional formatting

**How to Use**:
1. Import the CSV into Google Sheets
2. Input your draft communications
3. Specify recipient type and context
4. Let AI enhance professionalism and clarity
5. Review before sending

**Sample Formula**:
```
=REWRITE("Create professional meeting follow-up for team", D2)
```

## Setup Instructions

### Step 1: Import Templates
1. Download the desired CSV template
2. Open Google Sheets
3. Go to File > Import
4. Upload the CSV file
5. Choose "Replace spreadsheet" or "Insert new sheet(s)"

### Step 2: Configure API
Before using the templates, ensure your REWRITE function is properly configured:

1. Open Google Apps Script (Extensions > Apps Script)
2. Set your API endpoint:
   ```javascript
   function setApiEndpoint() {
     PropertiesService.getScriptProperties().setProperty('API_ENDPOINT', 'your-api-url');
   }
   ```
3. Run the setup function once

### Step 3: Test the Function
Test with a simple example:
```
=REWRITE("Make this professional", "hey how are you")
```

## Customization Guide

### Modifying Prompts

#### Basic Prompt Structure
```
=REWRITE("[Instruction] for [Audience]", [Content])
```

#### Advanced Prompt Examples
- `"Create a professional email response for upset customers"`
- `"Simplify technical content for non-technical users"`
- `"Make this more persuasive for sales prospects"`
- `"Adapt this message for social media with emojis"`

### Adding Context
Use the third parameter to provide additional context:
```
=REWRITE("Personalize this email", A2, B2:C2)
```

### Conditional Logic
Combine with IF statements for dynamic behavior:
```
=IF(LEN(A2)>100, REWRITE("Summarize", A2), REWRITE("Expand with details", A2))
```

## Best Practices

### 1. Prompt Engineering
- Be specific about the desired outcome
- Include target audience information
- Specify tone and style requirements
- Use action-oriented language

### 2. Content Preparation
- Keep original content clear and complete
- Provide sufficient context
- Avoid overly complex or technical jargon in prompts
- Test with sample data first

### 3. Performance Optimization
- Use consistent prompts for similar content types
- Avoid time-sensitive elements in prompts
- Process large batches during off-peak hours
- Monitor cache performance

### 4. Quality Control
- Always review AI-generated content
- Test with different content types
- Maintain brand voice consistency
- Keep human oversight in the process

## Template Customization

### Adding New Columns
You can extend templates with additional columns:

- **Approval Status**: Track which content has been approved
- **Performance Metrics**: Monitor engagement rates
- **Version History**: Keep track of content iterations
- **Brand Guidelines**: Ensure consistency with brand voice

### Creating Custom Templates

#### Template Structure
1. **Input Columns**: Original content, context, requirements
2. **Processing Columns**: AI formulas and parameters
3. **Output Columns**: Generated content and metadata
4. **Tracking Columns**: Status, performance, notes

#### Example Custom Template
```csv
Project,Original_Brief,Target_Audience,Content_Type,AI_Generated,Review_Status,Approved_Version
Website_Redesign,"Update homepage copy","Millennials","Web Copy","=REWRITE('Create engaging web copy for millennials', B2)","Pending",""
```

## Troubleshooting

### Common Issues

#### Formula Errors
- **#NAME?**: REWRITE function not recognized - check Apps Script setup
- **#ERROR!**: API connection issue - verify endpoint configuration
- **Empty Results**: Check if referenced cells contain data

#### Performance Issues
- **Slow Processing**: Reduce batch size or simplify prompts
- **Rate Limiting**: Space out requests or reduce frequency
- **Cache Issues**: Clear cache if getting stale results

#### Content Quality Issues
- **Generic Responses**: Make prompts more specific
- **Wrong Tone**: Adjust prompt language and audience specification
- **Inconsistent Results**: Use more detailed context and examples

### Getting Help

#### System Status Check
```
=getSystemStatus()
```

#### Cache Performance
```
=getCacheStatistics()
```

#### Error Analysis
```
=getErrorStatistics()
```

## Advanced Features

### Batch Processing
For large datasets, consider processing in batches:

1. Process 10-20 rows at a time
2. Wait 30 seconds between batches
3. Monitor for rate limiting messages
4. Use caching to avoid reprocessing

### Integration with Other Tools

#### Google Docs
- Copy optimized content to Google Docs
- Use Docs for final formatting and review

#### Gmail
- Generate email templates in Sheets
- Copy personalized content to Gmail

#### Google Analytics
- Track performance of optimized content
- A/B test different AI-generated versions

### Automation Ideas

#### Scheduled Processing
- Use Google Apps Script triggers
- Process new content automatically
- Send notifications when complete

#### Workflow Integration
- Connect with project management tools
- Automate approval workflows
- Track content lifecycle

## Support and Updates

### Getting Support
- Check the main documentation in `/docs/`
- Review troubleshooting guides
- Test with simple examples first

### Template Updates
Templates are regularly updated with:
- New use cases and examples
- Improved prompt engineering
- Performance optimizations
- Additional customization options

### Contributing
To suggest improvements or new templates:
1. Test your template thoroughly
2. Document the use case and benefits
3. Provide clear setup instructions
4. Include sample data and expected results

---

These templates provide a solid foundation for leveraging AI-powered text processing in your business workflows. Customize them to match your specific needs and brand requirements.