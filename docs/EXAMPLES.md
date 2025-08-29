# Google Sheets Cerebras AI Integration - Examples and Use Cases

This document provides comprehensive examples and templates for using the REWRITE function in Google Sheets with Cerebras AI.

## Table of Contents

1. [Basic Usage Examples](#basic-usage-examples)
2. [Advanced Use Cases](#advanced-use-cases)
3. [Template Configurations](#template-configurations)
4. [Best Practices](#best-practices)
5. [Troubleshooting Examples](#troubleshooting-examples)

## Basic Usage Examples

### 1. Simple Text Rewriting

**Scenario**: Rewrite text to be more professional

```
A1: "hey can u send me the report asap"
B1: =REWRITE("Make this professional", A1)
Result: "Could you please send me the report at your earliest convenience?"
```

### 2. Text Summarization

**Scenario**: Summarize long text content

```
A1: "The quarterly sales report shows significant growth across all regions. North America increased by 15%, Europe by 12%, and Asia-Pacific by 18%. The main drivers were new product launches and improved customer satisfaction scores."
B1: =REWRITE("Summarize in one sentence", A1)
Result: "Quarterly sales grew 15-18% across all regions due to new products and better customer satisfaction."
```

### 3. Tone Adjustment

**Scenario**: Change the tone of customer communications

```
A1: "Your payment is overdue and needs to be paid immediately"
B1: =REWRITE("Make this friendly and helpful", A1)
Result: "We noticed your payment is past due and would appreciate your prompt attention to resolve this matter."
```

### 4. Language Simplification

**Scenario**: Simplify technical language for general audience

```
A1: "The API endpoint utilizes RESTful architecture with JSON payloads for data transmission"
B1: =REWRITE("Explain in simple terms", A1)
Result: "The system uses a standard web method to send and receive information in an organized format."
```

## Advanced Use Cases

### 1. Bulk Email Personalization

**Setup**: Create personalized email content for multiple recipients

| A | B | C | D |
|---|---|---|---|
| Name | Company | Template | Personalized Email |
| John | TechCorp | "Write a professional follow-up email" | =REWRITE(C2&" for "&A2&" at "&B2, "Thank you for your time yesterday") |
| Sarah | DataInc | "Write a professional follow-up email" | =REWRITE(C3&" for "&A3&" at "&B3, "Thank you for your time yesterday") |

### 2. Content Translation and Localization

**Setup**: Adapt content for different markets

| A | B | C | D |
|---|---|---|---|
| Original | Target Market | Localized Content | |
| "Great deals this weekend!" | UK | =REWRITE("Adapt for British English", A2) | "Brilliant offers this weekend!" |
| "Great deals this weekend!" | Australia | =REWRITE("Adapt for Australian English", A3) | "Fantastic deals this weekend, mate!" |

### 3. Social Media Content Optimization

**Setup**: Optimize content for different platforms

| A | B | C | D |
|---|---|---|---|
| Original Content | Platform | Optimized | |
| "Check out our new product launch with amazing features" | Twitter | =REWRITE("Make this Twitter-friendly with hashtags", A2) | "🚀 New product launch! Amazing features await. #ProductLaunch #Innovation #NewTech" |
| "Check out our new product launch with amazing features" | LinkedIn | =REWRITE("Make this professional for LinkedIn", A3) | "We're excited to announce our latest product launch, featuring innovative capabilities designed to enhance your workflow." |

### 4. Data Analysis Narrative

**Setup**: Convert data insights into readable narratives

| A | B | C | D |
|---|---|---|---|
| Metric | Value | Change | Narrative |
| Sales | $125,000 | +15% | =REWRITE("Create a business narrative", "Sales reached "&B2&" with a "&C2&" increase") |
| Customers | 1,250 | +8% | =REWRITE("Create a business narrative", "Customer base grew to "&B3&" representing "&C3&" growth") |

## Template Configurations

### 1. Customer Service Templates

#### Template Setup
```
A1: Customer Issue
B1: Response Template
C1: Personalized Response

A2: "Product doesn't work"
B2: "Create a helpful customer service response"
C2: =REWRITE(B2, A2)
```

#### Common Customer Service Prompts
- "Create a helpful and empathetic customer service response"
- "Write a professional apology and solution"
- "Make this response more understanding and supportive"
- "Create a follow-up message to ensure satisfaction"

### 2. Marketing Content Templates

#### Email Marketing
```
A1: Product/Service
B1: Target Audience
C1: Email Subject
D1: Email Body

A2: "Project Management Software"
B2: "Small Business Owners"
C2: =REWRITE("Create an engaging email subject for "&B2&" about "&A2, "New software available")
D2: =REWRITE("Write a compelling email for "&B2&" about "&A2, "Introducing our latest solution")
```

#### Social Media Templates
```
A1: Announcement
B1: Platform
C1: Optimized Post

A2: "New office opening"
B2: "Instagram"
C2: =REWRITE("Create an engaging "&B2&" post with emojis", A2)
```

### 3. Content Creation Templates

#### Blog Post Optimization
```
A1: Draft Title
B1: Target Audience
C1: Optimized Title
D1: Meta Description

A2: "How to Use Our Software"
B2: "Beginners"
C2: =REWRITE("Create an SEO-friendly title for "&B2, A2)
D2: =REWRITE("Write a compelling meta description", C2)
```

#### Product Descriptions
```
A1: Product Features
B1: Target Market
C1: Product Description

A2: "Waterproof, lightweight, 10-hour battery"
B2: "Outdoor enthusiasts"
C2: =REWRITE("Create compelling product copy for "&B2, A2)
```

### 4. Business Communication Templates

#### Meeting Follow-ups
```
A1: Meeting Notes
B1: Audience
C1: Follow-up Email

A2: "Discussed Q4 budget, need approval by Friday"
B2: "Executive team"
C2: =REWRITE("Create a professional follow-up email for "&B2, A2)
```

#### Report Summaries
```
A1: Detailed Report
B1: Summary Type
C1: Executive Summary

A2: [Long report content]
B2: "Executive summary"
C2: =REWRITE("Create an "&B2&" highlighting key points", A2)
```

## Best Practices

### 1. Prompt Engineering Tips

#### Effective Prompts
- ✅ "Make this more professional and concise"
- ✅ "Rewrite for a 5th-grade reading level"
- ✅ "Convert to active voice and remove jargon"
- ✅ "Create a friendly customer service response"

#### Avoid These Prompts
- ❌ "Make it better" (too vague)
- ❌ "Fix this" (unclear what to fix)
- ❌ "Rewrite" (no specific instruction)

### 2. Cell Reference Best Practices

#### Single Cell References
```
=REWRITE("Make professional", A1)  ✅ Clear and simple
=REWRITE("Make professional", A1:A1)  ❌ Unnecessary range
```

#### Range References
```
=REWRITE("Summarize these points", A1:A5)  ✅ Good for multiple items
=REWRITE("Combine into paragraph", A1:A10)  ✅ Good for consolidation
```

#### Context Usage
```
=REWRITE("Personalize this email", A1, B1:C1)  ✅ Main content + context
=REWRITE("Write response considering background", A1, B1:D1)  ✅ Rich context
```

### 3. Performance Optimization

#### Cache-Friendly Patterns
- Use consistent prompts for similar content
- Avoid time-sensitive prompts that change frequently
- Group similar operations together

#### Efficient Formulas
```
✅ =REWRITE("Make professional", A2)
✅ =REWRITE("Summarize", A2:A5)
❌ =REWRITE("Make professional on "&TEXT(NOW(),"mm/dd/yyyy"), A2)  // Breaks caching
```

## Troubleshooting Examples

### 1. Common Error Scenarios

#### Empty Cell Reference
```
Problem: =REWRITE("Make professional", A1) returns "❌ Empty Cells"
Solution: Ensure A1 contains text content
```

#### Invalid Prompt
```
Problem: =REWRITE("", A1) returns "❌ Missing Prompt"
Solution: Provide clear instructions: =REWRITE("Make this professional", A1)
```

#### Rate Limiting
```
Problem: "⏳ Too Many Requests" error
Solution: Wait 1-2 minutes between large batches of requests
```

### 2. Formula Debugging

#### Check Function Status
```
=getSystemStatus()  // Shows API configuration and system health
=getCacheStatistics()  // Shows cache performance
=getErrorStatistics()  // Shows recent error patterns
```

#### Test API Connection
```
=REWRITE("Test", "Hello world")  // Simple test to verify API connectivity
```

### 3. Performance Issues

#### Slow Responses
- Check text length (keep under 2000 characters for best performance)
- Use simpler prompts for faster processing
- Consider breaking large texts into smaller chunks

#### Memory Issues
- Clear cache periodically: `clearAllCache()`
- Avoid processing extremely large ranges at once
- Use batch processing for large datasets

## Sample Spreadsheet Templates

### Template 1: Customer Feedback Analysis
| A | B | C | D | E |
|---|---|---|---|---|
| Customer | Raw Feedback | Sentiment | Professional Response | Follow-up Action |
| John D. | "Product is okay but shipping was slow" | =REWRITE("Analyze sentiment", B2) | =REWRITE("Create professional response", B2) | =REWRITE("Suggest follow-up action", B2&" "&C2) |

### Template 2: Content Marketing Pipeline
| A | B | C | D | E | F |
|---|---|---|---|---|---|---|
| Topic | Target Audience | Blog Title | Meta Description | Social Post | Email Subject |
| SEO Tips | Small Business | =REWRITE("Create SEO blog title for "&B2, A2) | =REWRITE("Write meta description", C2) | =REWRITE("Create LinkedIn post", C2) | =REWRITE("Create email subject", C2) |

### Template 3: Product Description Generator
| A | B | C | D | E |
|---|---|---|---|---|
| Product | Features | Target Market | Short Description | Long Description |
| Wireless Headphones | "Noise canceling, 20hr battery, waterproof" | "Commuters" | =REWRITE("Create short product description for "&C2, A2&": "&B2) | =REWRITE("Create detailed product description for "&C2, A2&": "&B2) |

## Integration with Other Google Workspace Tools

### 1. Google Docs Integration
- Copy optimized content from Sheets to Docs
- Use Sheets for bulk content generation, then format in Docs

### 2. Gmail Integration
- Generate email templates in Sheets
- Copy personalized content to Gmail drafts

### 3. Google Slides Integration
- Create presentation content in Sheets
- Copy optimized text to slide presentations

## Advanced Automation Ideas

### 1. Conditional Rewriting
```
=IF(LEN(A2)>100, REWRITE("Summarize", A2), REWRITE("Expand with details", A2))
```

### 2. Multi-language Support
```
=REWRITE("Translate to Spanish and make it formal", A2)
=REWRITE("Adapt for German business culture", A2)
```

### 3. A/B Testing Content
```
A2: Original content
B2: =REWRITE("Make more casual", A2)
C2: =REWRITE("Make more formal", A2)
D2: =REWRITE("Make more persuasive", A2)
```

This comprehensive guide should help users maximize the potential of the Google Sheets Cerebras AI integration across various business scenarios and use cases.