/**
 * 自定义Agent - Custom Agent
 * 
 * 支持用户自定义系统提示词的Agent
 */

import { Message, AgentType, RequestContext, AgentResponse } from '../types';
import { logger } from '../utils/logger';
import { LLMService } from '../services/llm/service';

export interface CustomAgentConfig {
  id: string;
  name: string;
  prompt: string;
  expertise?: string;
}

export class CustomAgent {
  private agentType: AgentType;
  
  constructor(
    private config: CustomAgentConfig,
    private llmService: LLMService
  ) {
    this.agentType = `CUSTOM_${config.id}` as AgentType;
    logger.info(`Custom agent initialized: ${config.name}`);
  }

  /**
   * 执行Agent任务
   */
  async execute(context: RequestContext): Promise<AgentResponse> {
    logger.info(`Custom agent ${this.config.name} executing task...`);
    
    try {
      // 构建系统消息
      const systemMessage: Message = {
        role: 'system',
        content: this.config.prompt,
      };

      // 添加专业领域信息（如果有）
      if (this.config.expertise) {
        systemMessage.content += `\n\n专业领域：${this.config.expertise}`;
      }

      // 构建消息历史
      const messages: Message[] = [
        systemMessage,
        ...context.history,
        { role: 'user', content: context.userInput }
      ];

      // 调用LLM服务
      const result = await this.executeWithStandardProvider(messages, context);

      return {
        agentType: this.agentType,
        content: result,
        intent: 'CHAT',
        metadata: {
          tokensUsed: 0,
          thinkingProcess: `自定义工程师 ${this.config.name} 处理完成`,
          suggestions: [],
        },
        timestamp: Date.now(),
      };
    } catch (error) {
      logger.error(`Custom agent ${this.config.name} execution failed:`, error as Error);
      throw new Error(`自定义工程师 ${this.config.name} 执行失败: ${(error as Error).message}`);
    }
  }

  /**
   * 流式执行Agent任务
   */
  async executeStream(
    context: RequestContext,
    onChunk: (chunk: string) => void,
    onThinking?: (thinking: string) => void
  ): Promise<void> {
    logger.info(`Custom agent ${this.config.name} executing stream task...`);
    
    try {
      // 发送思考过程
      onThinking?.(`🎯 **${this.config.name}**
${this.config.expertise ? `专业领域：${this.config.expertise}` : ''}

💡 **系统提示**
${this.config.prompt.slice(0, 200)}${this.config.prompt.length > 200 ? '...' : ''}`);

      // 构建系统消息
      const systemMessage: Message = {
        role: 'system',
        content: this.config.prompt,
      };

      // 添加专业领域信息（如果有）
      if (this.config.expertise) {
        systemMessage.content += `\n\n专业领域：${this.config.expertise}`;
      }

      // 构建消息历史
      const messages: Message[] = [
        systemMessage,
        ...context.history,
        { role: 'user', content: context.userInput }
      ];

      // 流式调用LLM服务
      await this.executeStreamWithStandardProvider(messages, context, onChunk, onThinking);

    } catch (error) {
      logger.error(`Custom agent ${this.config.name} stream execution failed:`, error as Error);
      throw new Error(`自定义工程师 ${this.config.name} 流式执行失败: ${(error as Error).message}`);
    }
  }

  /**
   * 使用标准提供商执行（支持流式）
   */
  private async executeStreamWithStandardProvider(
    messages: Message[],
    context: RequestContext,
    onChunk: (chunk: string) => void,
    onThinking?: (thinking: string) => void
  ): Promise<void> {
    // 使用 LLMService 的流式接口
    await this.llmService.chatStream(messages, onChunk, {
      model: context.config.model,
      temperature: context.config.temperature,
      maxTokens: context.config.maxTokens,
      topP: context.config.topP,
      reasoningTokens: context.config.reasoningTokens,
    });
  }

  /**
   * 使用自定义提供商执行
   */
  private async executeWithCustomProvider(
    messages: Message[],
    context: RequestContext
  ): Promise<string> {
    // 这里需要集成自定义提供商逻辑
    // 暂时使用标准提供商逻辑
    return this.executeWithStandardProvider(messages, context);
  }

  /**
   * 使用标准提供商执行
   */
  private async executeWithStandardProvider(
    messages: Message[],
    context: RequestContext
  ): Promise<string> {
    const response = await this.llmService.chat(messages, {
      model: context.config.model,
      temperature: context.config.temperature,
      maxTokens: context.config.maxTokens,
      topP: context.config.topP,
      reasoningTokens: context.config.reasoningTokens,
    });

    return response;
  }
}