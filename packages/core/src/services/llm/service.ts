/**
 * LLM服务 - 统一的大模型调用接口
 * 开发阶段主要支持DeepSeek，后续扩展OpenAI、Gemini等
 */

import OpenAI from 'openai';
import { Message, LLMOptions, UserConfig } from '../../types';
import { logger } from '../../utils/logger';

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
      
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
    
    logger.info(`LLM Service initialized with provider: ${config.provider}`);
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

    const finalOptions: LLMOptions = {
      model: options?.model || this.config.model,
      temperature: options?.temperature ?? this.config.temperature ?? 0.7,
      maxTokens: options?.maxTokens ?? this.config.maxTokens ?? 4096,
      topP: options?.topP ?? this.config.topP ?? 0.95,
      stream: true,
    };

    try {
      const stream = await this.client.chat.completions.create({
        model: finalOptions.model,
        messages: messages as any,
        temperature: finalOptions.temperature,
        max_tokens: finalOptions.maxTokens,
        top_p: finalOptions.topP,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          onChunk(content);
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

