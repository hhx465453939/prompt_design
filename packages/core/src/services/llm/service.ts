/**
 * LLM服务 - 统一的大模型调用接口
 * 开发阶段主要支持DeepSeek，后续扩展OpenAI、Gemini等
 */

import OpenAI from 'openai';
import { Message, LLMOptions, UserConfig } from '../../types';
import { logger } from '../../utils/logger';
import { CustomProviderManager } from './custom-provider-manager';

const DEFAULT_BASE_URLS: Record<Exclude<UserConfig['provider'], 'custom'>, string> = {
  deepseek: 'https://api.deepseek.com/v1',
  openai: 'https://api.openai.com/v1',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/openai',
  openrouter: 'https://openrouter.ai/api/v1',
};

const DEFAULT_MODELS: Record<UserConfig['provider'], string[]> = {
  deepseek: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'],
  openai: ['gpt-4o', 'gpt-4.1', 'gpt-4o-mini', 'o1', 'o3-mini'],
  gemini: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'],
  openrouter: [
    'openai/gpt-4o',
    'openai/gpt-4o-mini',
    'openai/o1',
    'anthropic/claude-3.5-sonnet',
    'google/gemini-2.5-pro',
    'google/gemini-2.0-flash',
    'deepseek/deepseek-chat',
  ],
  custom: [],
};

export class LLMService {
  private client: OpenAI | null = null;
  private config: UserConfig | null = null;

  private normalizeBaseURL(provider: UserConfig['provider'], baseURL?: string): string {
    const raw = (baseURL || '').trim();
    const trimmed = raw.replace(/\/+$/, '');

    if (provider === 'gemini') {
      if (!trimmed) return DEFAULT_BASE_URLS.gemini;
      if (/\/openai$/i.test(trimmed)) return trimmed;
      if (/generativelanguage\.googleapis\.com/i.test(trimmed)) {
        if (/\/v\d+(\w+)?$/i.test(trimmed)) return `${trimmed}/openai`;
        return `${trimmed}/v1beta/openai`;
      }
      if (/\/v\d+(\w+)?$/i.test(trimmed)) return `${trimmed}/openai`;
      return trimmed;
    }

    if (provider === 'custom') {
      return trimmed;
    }

    if (!trimmed) return DEFAULT_BASE_URLS[provider];
    if (/\/v\d+($|\/)/i.test(trimmed)) return trimmed;
    return `${trimmed}/v1`;
  }

  private getGeminiNativeBaseURL(baseURL?: string): string {
    const openaiBaseURL = this.normalizeBaseURL('gemini', baseURL);
    return openaiBaseURL.replace(/\/openai$/i, '');
  }

  private ensureInitialized(): { client: OpenAI; config: UserConfig } {
    if (!this.client || !this.config) {
      throw new Error('LLM Service not initialized. Call initialize() first.');
    }
    return { client: this.client, config: this.config };
  }

  private mergeModels(primary: string[], fallback: string[]): string[] {
    const merged = new Set<string>();
    primary.forEach((model) => {
      const value = String(model || '').trim();
      if (value) merged.add(value);
    });
    fallback.forEach((model) => {
      const value = String(model || '').trim();
      if (value) merged.add(value);
    });
    return Array.from(merged);
  }

  private getRequestParams(messages: Message[], options: LLMOptions, stream: boolean): any {
    const requestParams: any = {
      model: options.model,
      messages: messages as any,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      top_p: options.topP,
      stream,
    };

    if (options.reasoningTokens) {
      requestParams.max_completion_tokens = options.reasoningTokens;
      if (this.config?.provider === 'openrouter') {
        requestParams.reasoning_tokens = options.reasoningTokens;
      }
    }

    return requestParams;
  }

  private extractErrorMessage(error: unknown): string {
    const errorObj = error as any;
    const direct = errorObj?.error?.message || errorObj?.message;
    if (direct) return String(direct);
    try {
      return JSON.stringify(errorObj);
    } catch {
      return 'Unknown error';
    }
  }

  private enrichErrorMessage(baseMessage: string): string {
    if (!this.config) return baseMessage;

    const provider = this.config.provider;
    const apiKey = this.config.apiKey || '';
    const baseURL = this.config.baseURL || this.normalizeBaseURL(provider, undefined);

    if (provider === 'deepseek' && /^AIza/i.test(apiKey)) {
      return `${baseMessage}（当前是 DeepSeek 供应商，但 API Key 看起来是 Gemini Key）`;
    }

    if (provider === 'gemini' && /^sk-/i.test(apiKey)) {
      return `${baseMessage}（当前是 Gemini 供应商，但 API Key 看起来是 OpenAI/DeepSeek 风格）`;
    }

    return `${baseMessage} [provider=${provider}, baseURL=${baseURL}]`;
  }

  private async parseErrorResponse(response: Response): Promise<string> {
    try {
      const json = await response.json();
      const message = json?.error?.message || json?.message;
      if (message) return String(message);
      return JSON.stringify(json);
    } catch {
      return `${response.status} ${response.statusText}`.trim();
    }
  }

  private async fetchProviderModels(config: UserConfig, client: OpenAI): Promise<string[]> {
    if (config.provider === 'gemini') {
      const nativeBaseURL = this.getGeminiNativeBaseURL(config.baseURL);
      const url = `${nativeBaseURL}/models?key=${encodeURIComponent(config.apiKey)}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const details = await this.parseErrorResponse(response);
        throw new Error(`Gemini models API failed: ${details}`);
      }

      const data = await response.json() as any;
      const models = Array.isArray(data?.models) ? data.models : [];

      return models
        .map((model: any) => ({
          name: String(model?.name || '').replace(/^models\//, ''),
          methods: Array.isArray(model?.supportedGenerationMethods) ? model.supportedGenerationMethods : [],
        }))
        .filter((model: { name: string; methods: string[] }) => {
          if (!model.name || !model.name.startsWith('gemini')) return false;
          return model.methods.includes('generateContent') || model.methods.includes('streamGenerateContent');
        })
        .map((model: { name: string }) => model.name)
        .sort((a: string, b: string) => a.localeCompare(b));
    }

    const response = await client.models.list();
    return response.data
      .map((model: any) => model?.id)
      .filter((modelId: any) => typeof modelId === 'string' && modelId.length > 0);
  }

  private async chatWithGemini(messages: Message[], options: LLMOptions): Promise<string> {
    const { config } = this.ensureInitialized();
    const endpoint = `${this.normalizeBaseURL('gemini', config.baseURL)}/chat/completions`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(this.getRequestParams(messages, options, false)),
    });

    if (!response.ok) {
      const details = await this.parseErrorResponse(response);
      throw new Error(this.enrichErrorMessage(details));
    }

    const data = await response.json() as any;
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      return content.map((part) => part?.text || '').join('');
    }
    return '';
  }

  private async chatStreamWithGemini(
    messages: Message[],
    onChunk: (chunk: string) => void,
    options: LLMOptions
  ): Promise<void> {
    const { config } = this.ensureInitialized();
    const endpoint = `${this.normalizeBaseURL('gemini', config.baseURL)}/chat/completions`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(this.getRequestParams(messages, options, true)),
    });

    if (!response.ok) {
      const details = await this.parseErrorResponse(response);
      throw new Error(this.enrichErrorMessage(details));
    }

    if (!response.body) {
      throw new Error('Gemini stream returned empty response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line.startsWith('data:')) continue;

        const payload = line.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;

        try {
          const data = JSON.parse(payload);
          const content = data?.choices?.[0]?.delta?.content;
          if (typeof content === 'string' && content.length > 0) {
            onChunk(content);
          }
        } catch (parseError) {
          logger.warn('Failed to parse Gemini stream chunk', parseError as Error);
        }
      }
    }
  }

  /**
   * 初始化LLM客户端
   */
  initialize(config: UserConfig) {
    this.config = {
      ...config,
      baseURL: this.normalizeBaseURL(config.provider, config.baseURL),
    };

    // 根据provider创建对应的客户端
    switch (this.config.provider) {
      case 'deepseek':
        this.client = new OpenAI({
          apiKey: this.config.apiKey,
          baseURL: this.config.baseURL || DEFAULT_BASE_URLS.deepseek,
          dangerouslyAllowBrowser: true,
        });
        break;

      case 'openai':
        this.client = new OpenAI({
          apiKey: this.config.apiKey,
          baseURL: this.config.baseURL || DEFAULT_BASE_URLS.openai,
          dangerouslyAllowBrowser: true,
        });
        break;

      case 'gemini':
        this.client = new OpenAI({
          apiKey: this.config.apiKey,
          baseURL: this.config.baseURL || DEFAULT_BASE_URLS.gemini,
          dangerouslyAllowBrowser: true,
        });
        break;

      case 'openrouter': {
        const browserOrigin =
          typeof window !== 'undefined' && window.location?.origin
            ? window.location.origin
            : 'http://localhost';
        this.client = new OpenAI({
          apiKey: this.config.apiKey,
          baseURL: this.config.baseURL || DEFAULT_BASE_URLS.openrouter,
          dangerouslyAllowBrowser: true,
          defaultHeaders: {
            'HTTP-Referer': browserOrigin,
            'X-Title': 'Prompt Engineer Matrix',
          },
        });
        break;
      }

      case 'custom':
        if (!this.config.customProviderId) {
          throw new Error('Custom provider ID is required when provider is "custom"');
        }
        const customProvider = CustomProviderManager.getProvider(this.config.customProviderId);
        if (!customProvider) {
          throw new Error(`Custom provider not found: ${this.config.customProviderId}`);
        }

        this.config = {
          ...this.config,
          baseURL: customProvider.baseURL,
        };

        this.client = new OpenAI({
          apiKey: this.config.apiKey,
          baseURL: customProvider.baseURL,
          dangerouslyAllowBrowser: true,
        });
        break;

      default:
        throw new Error(`Unsupported provider: ${this.config.provider}`);
    }

    logger.info(`LLM Service initialized with provider: ${this.config.provider}`);
  }

  /**
   * 检查服务是否已初始化
   */
  isInitialized(): boolean {
    return this.config !== null && this.client !== null;
  }

  /**
   * 测试API连接
   */
  async testConnection(): Promise<boolean> {
    const { client, config } = this.ensureInitialized();

    try {
      if (config.provider === 'gemini') {
        await this.chatWithGemini(
          [{ role: 'user', content: 'ping' }],
          {
            model: config.model,
            temperature: config.temperature ?? 0.7,
            maxTokens: 1,
            topP: config.topP ?? 0.95,
          }
        );
      } else {
        await client.chat.completions.create({
          model: config.model,
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 1,
        });
      }

      logger.info('API connection test successful');
      return true;
    } catch (error) {
      logger.error('API connection test failed', error as Error);
      throw new Error(this.enrichErrorMessage(this.extractErrorMessage(error)));
    }
  }

  /**
   * 获取可用模型列表
   */
  async getAvailableModels(): Promise<string[]> {
    const { client, config } = this.ensureInitialized();

    try {
      let models = [...(DEFAULT_MODELS[config.provider] || [])];

      if (config.provider === 'custom' && config.customProviderId) {
        const customProvider = CustomProviderManager.getProvider(config.customProviderId);
        if (customProvider) {
          models = [...customProvider.models];
        }
        logger.info(`Using custom provider models: ${models.length}`);
        return models;
      }

      try {
        const liveModels = await this.fetchProviderModels(config, client);
        if (liveModels.length > 0) {
          models = this.mergeModels(liveModels, models);
          logger.info(`Loaded ${liveModels.length} live models for ${config.provider}`);
        } else {
          logger.info(`No live models returned, using defaults for ${config.provider}`);
        }
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
    const { client, config } = this.ensureInitialized();

    const finalOptions: LLMOptions = {
      model: options?.model || config.model,
      temperature: options?.temperature ?? config.temperature ?? 0.7,
      maxTokens: options?.maxTokens ?? config.maxTokens ?? 4096,
      topP: options?.topP ?? config.topP ?? 0.95,
      reasoningTokens: options?.reasoningTokens ?? config.reasoningTokens,
    };

    try {
      logger.debug('Sending chat request', { messages, options: finalOptions });

      if (config.provider === 'gemini') {
        return await this.chatWithGemini(messages, finalOptions);
      }

      const response = await client.chat.completions.create(
        this.getRequestParams(messages, finalOptions, false)
      );

      const content = response.choices[0]?.message?.content || '';

      logger.debug('Chat response received', {
        tokensUsed: response.usage?.total_tokens,
        contentLength: content.length,
      });

      return content;
    } catch (error) {
      logger.error('Chat request failed', error as Error);
      throw new Error(`LLM request failed: ${this.enrichErrorMessage(this.extractErrorMessage(error))}`);
    }
  }

  /**
   * 流式响应
   */
  async chatStream(
    messages: Message[],
    onChunk: (chunk: string) => void,
    options?: Partial<LLMOptions>
  ): Promise<void> {
    const { client, config } = this.ensureInitialized();

    const defaultMaxTokens: Record<string, number> = {
      deepseek: 4096,
      openai: 4096,
      gemini: 4096,
      openrouter: 4096,
      custom: 4096,
    };

    const finalOptions: LLMOptions = {
      model: options?.model || config.model,
      temperature: options?.temperature ?? config.temperature ?? 0.7,
      maxTokens: options?.maxTokens ?? config.maxTokens ?? defaultMaxTokens[config.provider] ?? 4096,
      topP: options?.topP ?? config.topP ?? 0.95,
      stream: true,
      reasoningTokens: options?.reasoningTokens ?? config.reasoningTokens,
    };

    if (config.provider === 'deepseek' && finalOptions.maxTokens && finalOptions.maxTokens > 8192) {
      finalOptions.maxTokens = 8192;
    }

    try {
      if (config.provider === 'gemini') {
        await this.chatStreamWithGemini(messages, onChunk, finalOptions);
        return;
      }

      const requestParams = this.getRequestParams(messages, finalOptions, true);
      const stream = await client.chat.completions.create(requestParams as any);

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
      throw new Error(`LLM stream failed: ${this.enrichErrorMessage(this.extractErrorMessage(error))}`);
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
