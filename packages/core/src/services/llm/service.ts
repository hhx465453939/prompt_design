/**
 * LLM服务 - 统一的大模型调用接口
 * 开发阶段主要支持DeepSeek，后续扩展OpenAI、Gemini等
 */

import OpenAI from 'openai';
import { Message, LLMOptions, UserConfig, CustomProvider } from '../../types';
import { logger } from '../../utils/logger';
import { CustomProviderManager } from './custom-provider-manager';

export class LLMService {
  private client: OpenAI | null = null;
  private config: UserConfig | null = null;

  /**
   * 初始化LLM客户端
   */
  initialize(config: UserConfig) {
    this.config = config;
    
    // 根据provider创建对应的客户端
    switch (config.provider) {
      case 'deepseek':
        this.client = new OpenAI({
          apiKey: config.apiKey,
          baseURL: config.baseURL || 'https://api.deepseek.com/v1',
          dangerouslyAllowBrowser: true, // 允许浏览器环境
        });
        break;
      
      case 'openai':
        this.client = new OpenAI({
          apiKey: config.apiKey,
          baseURL: config.baseURL || 'https://api.openai.com/v1',
          dangerouslyAllowBrowser: true,
        });
        break;
      
      case 'gemini':
        this.client = new OpenAI({
          apiKey: config.apiKey,
          baseURL: config.baseURL || 'https://generativelanguage.googleapis.com/v1beta',
          dangerouslyAllowBrowser: true,
        });
        break;
      
      case 'openrouter':
        this.client = new OpenAI({
          apiKey: config.apiKey,
          baseURL: config.baseURL || 'https://openrouter.ai/api/v1',
          dangerouslyAllowBrowser: true,
          defaultHeaders: {
            'HTTP-Referer': window.location.origin,
            'X-Title': 'Prompt Engineer Matrix',
          },
        });
        break;
      
      case 'custom':
        if (!config.customProviderId) {
          throw new Error('Custom provider ID is required when provider is "custom"');
        }
        const customProvider = CustomProviderManager.getProvider(config.customProviderId);
        if (!customProvider) {
          throw new Error(`Custom provider not found: ${config.customProviderId}`);
        }
        
        this.client = new OpenAI({
          apiKey: config.apiKey,
          baseURL: customProvider.baseURL,
          dangerouslyAllowBrowser: true,
        });
        break;
      
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
    
    logger.info(`LLM Service initialized with provider: ${config.provider}`);
  }

  /**
   * 检查服务是否已初始化
   */
  isInitialized(): boolean {
    return this.client !== null && this.config !== null;
  }

  /**
   * 测试API连接
   */
  async testConnection(): Promise<boolean> {
    if (!this.client || !this.config) {
      throw new Error('LLM Service not initialized');
    }

    try {
      // 发送一个简单的测试请求
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [{ role: 'user', content: 'Test connection' }],
        max_tokens: 1,
      });
      
      logger.info('API connection test successful');
      return true;
    } catch (error) {
      logger.error('API connection test failed', error as Error);
      throw error;
    }
  }

  /**
   * 获取可用模型列表
   */
  async getAvailableModels(): Promise<string[]> {
    if (!this.client || !this.config) {
      throw new Error('LLM Service not initialized');
    }

    try {
      // 根据provider返回默认模型列表
      const defaultModels: Record<string, string[]> = {
        'deepseek': ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'],
        'openai': ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-4o', 'o1-preview', 'o1-mini'],
        'gemini': ['gemini-pro', 'gemini-pro-vision', 'gemini-1.5-pro', 'gemini-2.0-flash-exp'],
        'openrouter': [
          'openai/gpt-4o',
          'openai/gpt-4o-mini',
          'openai/o1-preview',
          'openai/o1-mini',
          'anthropic/claude-3.5-sonnet',
          'anthropic/claude-3.5-haiku',
          'google/gemini-pro-1.5',
          'google/gemini-2.0-flash-exp',
          'deepseek/deepseek-reasoner',
          'deepseek/deepseek-chat',
          'qwen/qwen-2.5-72b-instruct',
          'meta-llama/llama-3.1-70b-instruct',
        ],
      };

      let models = defaultModels[this.config.provider] || [];
      
      // 如果是自定义供应商，使用其预定义的模型列表
      if (this.config.provider === 'custom' && this.config.customProviderId) {
        const customProvider = CustomProviderManager.getProvider(this.config.customProviderId);
        if (customProvider) {
          models = customProvider.models;
        }
      }

      // 尝试从API获取模型列表（如果支持的话）
      try {
        // 注意：不是所有供应商都支持模型列表API
        // 这里提供一个通用的尝试，但主要依赖默认列表
        logger.info(`Using default models for ${this.config.provider}:`, models);
      } catch (error) {
        logger.warn('Failed to fetch models from API, using defaults', error);
      }

      return models;
    } catch (error) {
      logger.error('Failed to get available models', error as Error);
      throw error;
    }
  }

  /**
   * 发送消息并获取响应（非流式）
   */
  async chat(messages: Message[], options?: Partial<LLMOptions>): Promise<string> {
    if (!this.client || !this.config) {
      throw new Error('LLM Service not initialized. Call initialize() first.');
    }

    const finalOptions: LLMOptions = {
      model: options?.model || this.config.model,
      temperature: options?.temperature ?? this.config.temperature ?? 0.7,
      maxTokens: options?.maxTokens ?? this.config.maxTokens ?? 4096,
      topP: options?.topP ?? this.config.topP ?? 0.95,
    };

    try {
      logger.debug('Sending chat request', { messages, options: finalOptions });

      const response = await this.client.chat.completions.create({
        model: finalOptions.model,
        messages: messages as any,
        temperature: finalOptions.temperature,
        max_tokens: finalOptions.maxTokens,
        top_p: finalOptions.topP,
      });

      const content = response.choices[0]?.message?.content || '';
      
      logger.debug('Chat response received', {
        tokensUsed: response.usage?.total_tokens,
        contentLength: content.length,
      });

      return content;
    } catch (error) {
      logger.error('Chat request failed', error as Error);
      throw new Error(`LLM request failed: ${(error as Error).message}`);
    }
  }

  /**
   * 流式响应（待实现）
   */
  async chatStream(
    messages: Message[],
    onChunk: (chunk: string) => void,
    options?: Partial<LLMOptions>
  ): Promise<void> {
    if (!this.client || !this.config) {
      throw new Error('LLM Service not initialized.');
    }

    // 根据提供商设置合适的默认 maxTokens
    const defaultMaxTokens: Record<string, number> = {
      deepseek: 4096,    // DeepSeek 最大 8192
      openai: 4096,     // OpenAI 较高的限制
      gemini: 4096,     // Gemini 合理的限制
      openrouter: 4096, // OpenRouter 通用限制
      custom: 4096,     // 自定义供应商通用限制
    };

    const finalOptions: LLMOptions = {
      model: options?.model || this.config.model,
      temperature: options?.temperature ?? this.config.temperature ?? 0.7,
      maxTokens: options?.maxTokens ?? this.config.maxTokens ?? defaultMaxTokens[this.config.provider] ?? 4096,
      topP: options?.topP ?? this.config.topP ?? 0.95,
      stream: true,
      reasoningTokens: options?.reasoningTokens ?? this.config.reasoningTokens,
    };

    // 对于 DeepSeek，确保不超过 8192
    if (this.config.provider === 'deepseek' && finalOptions.maxTokens && finalOptions.maxTokens > 8192) {
      finalOptions.maxTokens = 8192;
    }

    try {
      const requestParams: any = {
        model: finalOptions.model,
        messages: messages as any,
        temperature: finalOptions.temperature,
        max_tokens: finalOptions.maxTokens,
        top_p: finalOptions.topP,
        stream: true,
      };

      // 如果支持思维链，添加 reasoning_tokens 参数
      if (finalOptions.reasoningTokens) {
        requestParams.max_completion_tokens = finalOptions.reasoningTokens;
        // 对于 OpenRouter，可能还需要其他参数
        if (this.config?.provider === 'openrouter') {
          requestParams.reasoning_tokens = finalOptions.reasoningTokens;
        }
      }

      const stream = await this.client.chat.completions.create(requestParams as any);

      if (stream) {
        for await (const chunk of stream as any) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            onChunk(content);
          }
        }
      }
    } catch (error) {
      logger.error('Stream request failed', error as Error);
      throw new Error(`LLM stream failed: ${(error as Error).message}`);
    }
  }

  /**
   * 获取当前配置
   */
  getConfig(): UserConfig | null {
    return this.config;
  }
}

// 导出单例
export const llmService = new LLMService();

