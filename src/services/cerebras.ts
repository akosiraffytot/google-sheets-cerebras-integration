import { Cerebras } from '@cerebras/cerebras_cloud_sdk';
import { ErrorCodes } from '../types/api';
import { ErrorHandler } from '../utils/errorHandler';
import { withRetry, RetryConfig } from '../utils/retryHandler';
import { queueRequest, QueueConfig } from '../utils/requestQueue';
import { OPTIMIZED_CEREBRAS_CONFIG, getEnvironmentConfig } from '../config/performance';

export interface CerebrasConfig {
  model: string;
  temperature: number;
  max_tokens: number;
  stream: boolean;
  retryConfig?: Partial<RetryConfig>;
  queueConfig?: Partial<QueueConfig>;
}

export interface CerebrasError {
  code: string;
  message: string;
}

export interface CerebrasResponse {
  success: boolean;
  rewrittenText?: string;
  error?: CerebrasError;
}

/**
 * Cerebras AI service for text rewriting
 */
export class CerebrasService {
  private client: Cerebras;
  private config: CerebrasConfig;

  constructor(apiKey?: string) {
    if (!apiKey) {
      throw new Error('Cerebras API key is required');
    }

    this.client = new Cerebras({
      apiKey: apiKey
    });

    // Optimized configuration with environment-specific settings
    this.config = {
      ...OPTIMIZED_CEREBRAS_CONFIG,
      retryConfig: {
        ...OPTIMIZED_CEREBRAS_CONFIG.retryConfig,
        ...getEnvironmentConfig()
      }
    } as CerebrasConfig;
  }

  /**
   * Updates the Cerebras configuration
   */
  public updateConfig(config: Partial<CerebrasConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Constructs the prompt for text rewriting
   */
  private constructPrompt(prompt: string, mainText: string, contextText?: string): string {
    let fullPrompt = `${prompt}\n\nText to rewrite:\n${mainText}`;
    
    if (contextText && contextText.trim()) {
      fullPrompt += `\n\nAdditional context:\n${contextText}`;
    }
    
    fullPrompt += '\n\nRewritten text:';
    
    return fullPrompt;
  }

  /**
   * Rewrites text using Cerebras AI with retry logic and request queuing
   */
  public async rewriteText(
    prompt: string,
    mainText: string,
    contextText?: string
  ): Promise<CerebrasResponse> {
    const requestId = `cerebras-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Queue the request to manage concurrency
    const queueResult = await queueRequest(
      async () => {
        // Execute with retry logic
        const retryResult = await withRetry(
          () => this.executeCerebrasRequest(prompt, mainText, contextText),
          this.config.retryConfig,
          `cerebras-rewrite-${requestId}`
        );

        if (!retryResult.success) {
          throw retryResult.error;
        }

        return retryResult.result!;
      },
      `cerebras-request-${requestId}`,
      this.config.queueConfig
    );

    return queueResult;
  }

  /**
   * Executes the actual Cerebras API request
   */
  private async executeCerebrasRequest(
    prompt: string,
    mainText: string,
    contextText?: string
  ): Promise<CerebrasResponse> {
    try {
      const fullPrompt = this.constructPrompt(prompt, mainText, contextText);

      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'user',
            content: fullPrompt
          }
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.max_tokens,
        stream: false // Always use non-streaming for simplicity
      });

      // Type guard to ensure we have a non-streaming response
      if (!response || typeof response === 'object' && 'choices' in response === false) {
        return {
          success: false,
          error: {
            code: ErrorCodes.API_UNAVAILABLE,
            message: 'Invalid response from Cerebras AI'
          }
        };
      }

      const chatResponse = response as any; // Type assertion for now
      
      if (!chatResponse.choices || chatResponse.choices.length === 0) {
        return {
          success: false,
          error: {
            code: ErrorCodes.API_UNAVAILABLE,
            message: 'No response from Cerebras AI'
          }
        };
      }

      const rewrittenText = chatResponse.choices[0].message?.content?.trim();
      
      if (!rewrittenText) {
        return {
          success: false,
          error: {
            code: ErrorCodes.API_UNAVAILABLE,
            message: 'Empty response from Cerebras AI'
          }
        };
      }

      return {
        success: true,
        rewrittenText
      };

    } catch (error: any) {
      // Use ErrorHandler to determine appropriate error code and handle logging
      const errorCode = ErrorHandler.determineErrorCode(error);
      const { apiError } = ErrorHandler.handleError(errorCode, error, {
        endpoint: 'cerebras-api',
        requestId: `cerebras-${Date.now()}`
      });

      return {
        success: false,
        error: apiError
      };
    }
  }

  /**
   * Tests the connection to Cerebras API
   */
  public async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'user',
            content: 'Hello'
          }
        ],
        max_tokens: 10,
        temperature: 0,
        stream: false
      });

      const chatResponse = response as any; // Type assertion for now
      return chatResponse.choices && chatResponse.choices.length > 0;
    } catch (error) {
      console.error('Cerebras connection test failed:', error);
      return false;
    }
  }
}

/**
 * Factory function to create Cerebras service instance
 */
export function createCerebrasService(): CerebrasService {
  const apiKey = process.env.CEREBRAS_API_KEY;
  
  if (!apiKey) {
    throw new Error('CEREBRAS_API_KEY environment variable is required');
  }

  return new CerebrasService(apiKey);
}