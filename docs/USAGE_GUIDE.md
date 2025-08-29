# Google Sheets Cerebras AI Integration - Complete Usage Guide

This comprehensive guide covers everything you need to know to effectively use the REWRITE function with Cerebras AI in Google Sheets.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Function Syntax](#function-syntax)
3. [Practical Examples](#practical-examples)
4. [Advanced Techniques](#advanced-techniques)
5. [Performance Tips](#performance-tips)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)

## Quick Start

### Basic Setup Verification

Before using the REWRITE function, verify your setup:

```javascript
// Test system status
=getSystemStatus()

// Test basic functionality
=REWRITE("Make this professional", "hey there")
```

### Your First REWRITE Formula

```
=REWRITE("Make this more professional", A1)
```

Where:
- `"Make this more professional"` is your instruction to the AI
- `A1` is the cell containing the text to rewrite

## Function Syntax

### Complete Syntax
```
=REWRITE(prompt, mainText, [contextText])
```

### Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `prompt` | String | Yes | Instructions for the AI | `"Make this professional"` |
| `mainText` | Cell/Range/String | Yes | Text to be rewritten | `A1` or `"Hello world"` |
| `contextText` | Cell/Range/String | No | Additional context | `B1:C1` |

### Parameter Details

#### Prompt Parameter
The prompt tells the AI what to do with your text. Be specific and clear:

**Good Prompts:**
- `"Rewrite this email to be more professional"`
- `"Summarize this text in one sentence"`
- `"Make this customer service response more empathetic"`
- `"Convert this to simple language for beginners"`

**Avoid Vague Prompts:**
- `"Make it better"` ❌
- `"Fix this"` ❌
- `"Improve"` ❌

#### Main Text Parameter
This can be:
- **Single cell**: `A1`
- **Cell range**: `A1:A5` (combines all text)
- **Direct text**: `"Your text here"`
- **Formula result**: `CONCATENATE(A1, " ", B1)`

#### Context Text Parameter (Optional)
Provides additional information to help the AI understand the situation:
- **Single cell**: `B1`
- **Cell range**: `B1:D1`
- **Multiple ranges**: Not directly supported, use CONCATENATE

## Practical Examples

### 1. Email Communication

#### Professional Email Rewriting
```
A1: "hey can u send me the report by tomorrow thx"
B1: =REWRITE("Make this a professional business email", A1)
Result: "Could you please send me the report by tomorrow? Thank you."
```

#### Customer Service Responses
```
A1: "Your order is delayed"
B1: =REWRITE("Create an empathetic customer service response", A1)
Result: "We sincerely apologize for the delay with your order and are working to resolve this as quickly as possible."
```

### 2. Content Marketing

#### Social Media Optimization
```
A1: "New product launch next week"
B1: =REWRITE("Create an exciting social media post with emojis", A1)
Result: "🚀 Exciting news! Our new product launches next week! Stay tuned for something amazing! ✨ #ProductLaunch #Innovation"
```

#### Blog Content Enhancement
```
A1: "This guide explains how to use our software"
B1: =REWRITE("Create an engaging blog introduction", A1)
Result: "Ready to unlock the full potential of our software? This comprehensive guide will walk you through everything you need to know to get started and succeed."
```

### 3. Business Documentation

#### Meeting Notes Summarization
```
A1: "We discussed the budget for Q4, need to reduce expenses by 10%, John will handle vendor negotiations, Sarah will review contracts, deadline is end of month"
B1: =REWRITE("Create a clear action item summary", A1)
Result: "Q4 Budget Action Items: Reduce expenses by 10% (deadline: end of month). John: Handle vendor negotiations. Sarah: Review contracts."
```

#### Report Executive Summaries
```
A1: [Long detailed report content]
B1: =REWRITE("Create an executive summary highlighting key findings", A1)
```

### 4. Customer Support

#### Complaint Resolution
```
A1: "I'm very unhappy with the service"
B1: Customer context: "Premium customer, 3 years, usually satisfied"
C1: =REWRITE("Create a personalized response for a valued customer", A1, B1)
```

#### Technical Support
```
A1: "The software won't start"
B1: =REWRITE("Create step-by-step troubleshooting response", A1)
```

### 5. Sales and Marketing

#### Proposal Writing
```
A1: "We can provide consulting services"
B1: Client info: "Small business, budget conscious, needs quick results"
C1: =REWRITE("Create compelling proposal for small business", A1, B1)
```

#### Product Descriptions
```
A1: "Wireless headphones with noise canceling"
B1: Target: "Commuters and travelers"
C1: =REWRITE("Create compelling product description for commuters", A1, B1)
```

## Advanced Techniques

### 1. Using Context Effectively

#### Single Context Cell
```
A1: "Thank you for your inquiry"
B1: "Customer is interested in enterprise pricing"
C1: =REWRITE("Personalize this response", A1, B1)
```

#### Multiple Context Cells
```
A1: "Product demo scheduled"
B1: "Customer: TechCorp"
C1: "Industry: Software"
D1: "Size: 500 employees"
E1: =REWRITE("Create personalized demo confirmation", A1, B1:D1)
```

### 2. Conditional Processing

#### Length-Based Processing
```
=IF(LEN(A1)>200, REWRITE("Summarize this long text", A1), REWRITE("Expand with more details", A1))
```

#### Audience-Based Processing
```
=IF(B1="Technical", REWRITE("Use technical language", A1), REWRITE("Use simple language", A1))
```

### 3. Batch Processing Patterns

#### Sequential Processing
```
A1: Original text 1
A2: Original text 2
A3: Original text 3

B1: =REWRITE("Make professional", A1)
B2: =REWRITE("Make professional", A2)
B3: =REWRITE("Make professional", A3)
```

#### Template-Based Processing
```
A1: Template: "Create professional email for"
B1: Customer name: "John Smith"
C1: Issue: "Billing question"
D1: =REWRITE(A1&" "&B1&" about "&C1, "Thank you for contacting us")
```

### 4. Multi-Language Support

#### Translation and Localization
```
A1: "Welcome to our service"
B1: =REWRITE("Translate to Spanish and make it formal", A1)
C1: =REWRITE("Translate to French and make it casual", A1)
```

#### Cultural Adaptation
```
A1: "Great deals this weekend"
B1: =REWRITE("Adapt for British English and culture", A1)
C1: =REWRITE("Adapt for Australian English and culture", A1)
```

## Performance Tips

### 1. Optimize for Speed

#### Use Consistent Prompts
```
✅ Good: Same prompt for similar content
=REWRITE("Make professional", A1)
=REWRITE("Make professional", A2)

❌ Avoid: Varying prompts for same task
=REWRITE("Make this professional", A1)
=REWRITE("Professionalize this text", A2)
```

#### Avoid Time-Sensitive Prompts
```
❌ Avoid: =REWRITE("Make professional for today's meeting", A1)
✅ Better: =REWRITE("Make professional for business meeting", A1)
```

### 2. Manage Rate Limits

#### Batch Processing Strategy
1. Process 10-15 formulas at once
2. Wait 30-60 seconds between batches
3. Monitor for rate limit messages
4. Use caching to avoid reprocessing

#### Stagger Large Operations
```javascript
// For very large datasets, consider Apps Script automation
function processInBatches() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const batchSize = 10;
  const delay = 30000; // 30 seconds
  
  // Process in batches with delays
}
```

### 3. Cache Optimization

#### Cache-Friendly Patterns
- Use identical prompts for similar content
- Avoid dynamic elements in prompts
- Group similar operations together

#### Monitor Cache Performance
```
=getCacheStatistics()
```

## Troubleshooting

### Common Error Messages

#### "❌ Missing Prompt"
**Cause**: First parameter is empty or missing
**Solution**: Provide a clear prompt in quotes
```
❌ =REWRITE(, A1)
✅ =REWRITE("Make professional", A1)
```

#### "❌ Empty Cells"
**Cause**: Referenced cell contains no text
**Solution**: Ensure the cell has content
```
Check: A1 contains text before using =REWRITE("prompt", A1)
```

#### "⏳ Too Many Requests"
**Cause**: Rate limit exceeded
**Solution**: Wait 1-2 minutes before trying again

#### "🌐 Connection Problem"
**Cause**: Network or API connectivity issue
**Solution**: Check internet connection and API configuration

### Performance Issues

#### Slow Responses
**Causes and Solutions**:
- Large text (>2000 chars): Break into smaller chunks
- Complex prompts: Simplify instructions
- Network issues: Check connection stability

#### Formula Not Working
**Check These Items**:
1. REWRITE function is properly installed
2. API endpoint is configured
3. Cell references are correct
4. Prompt is in quotes

### Debugging Tools

#### System Status Check
```
=getSystemStatus()
```
Shows:
- API configuration status
- Cache availability
- System health

#### Error Statistics
```
=getErrorStatistics()
```
Shows:
- Recent error patterns
- Most common issues
- Error frequency

#### Cache Performance
```
=getCacheStatistics()
```
Shows:
- Cache hit rate
- Storage efficiency
- Performance metrics

## Best Practices

### 1. Prompt Engineering

#### Be Specific
```
❌ Vague: "Make it better"
✅ Specific: "Make this email more professional and concise"
```

#### Include Context
```
❌ Generic: "Write a response"
✅ Contextual: "Write a customer service response for a billing inquiry"
```

#### Specify Audience
```
❌ No audience: "Explain this feature"
✅ Audience-specific: "Explain this feature to non-technical users"
```

### 2. Content Organization

#### Structure Your Data
```
Column A: Original Content
Column B: Target Audience
Column C: Content Type
Column D: =REWRITE("Create "&C1&" for "&B1, A1)
```

#### Use Consistent Formatting
- Keep prompts consistent for similar tasks
- Use clear column headers
- Document your formulas

### 3. Quality Control

#### Review Process
1. Generate AI content
2. Review for accuracy and tone
3. Edit as needed
4. Test with target audience

#### A/B Testing
```
A1: Original content
B1: =REWRITE("Make more formal", A1)
C1: =REWRITE("Make more casual", A1)
D1: =REWRITE("Make more persuasive", A1)
```

### 4. Workflow Integration

#### Document Templates
Create reusable templates for:
- Customer service responses
- Marketing content
- Business communications
- Product descriptions

#### Automation Opportunities
- Scheduled content processing
- Workflow triggers
- Integration with other tools

## Advanced Use Cases

### 1. Content Personalization at Scale

#### Email Personalization
```
A: Customer Name | B: Company | C: Industry | D: Template | E: Personalized Email
John Smith | TechCorp | Software | "Follow-up email" | =REWRITE("Create "&D2&" for "&A2&" at "&B2&" in "&C2&" industry", "Thank you for your time")
```

### 2. Multi-Platform Content Adaptation

#### Social Media Optimization
```
A: Original | B: Platform | C: Optimized
"New product launch" | "Twitter" | =REWRITE("Create Twitter post with hashtags", A2)
"New product launch" | "LinkedIn" | =REWRITE("Create professional LinkedIn post", A3)
"New product launch" | "Instagram" | =REWRITE("Create Instagram post with emojis", A4)
```

### 3. Sentiment Analysis and Response

#### Customer Feedback Processing
```
A: Feedback | B: Sentiment | C: Response
"Product is okay but shipping slow" | =REWRITE("Analyze sentiment", A2) | =REWRITE("Create appropriate response based on sentiment", A2&" - "&B2)
```

This comprehensive guide should help you master the REWRITE function and integrate AI-powered text processing effectively into your Google Sheets workflows.