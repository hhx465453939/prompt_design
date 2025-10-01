/**
 * X1基础工程师Agent
 * 负责基础提示词的标准化设计（ATOM框架）
 */

import { RequestContext } from '../types';
import { LLMService } from '../services/llm/service';
import { agentLoader } from '../utils/agent-loader';
import { logger } from '../utils/logger';

export class X1BasicAgent {
  private systemPrompt: string;

  constructor(private llmService: LLMService) {
    const config = agentLoader.loadX1Basic();
    this.systemPrompt = config.systemPrompt;
    logger.info('X1 Basic Agent initialized');
  }

  /**
   * 执行基础设计任务
   */
  async execute(context: RequestContext) {
    logger.debug('X1 Basic executing...', {
      inputLength: context.userInput.length,
    });

    const messages = [
      {
        role: 'system' as const,
        content: this.systemPrompt,
      },
      {
        role: 'user' as const,
        content: this.buildUserPrompt(context),
      },
    ];

    const response = await this.llmService.chat(messages);

    return {
      content: response,
      tokensUsed: this.estimateTokens(response),
      suggestions: ['已应用ATOM框架', '结构化设计完成'],
    };
  }

  /**
   * 构建用户提示词
   */
  private buildUserPrompt(context: RequestContext): string {
    return `请基于ATOM框架设计一个Agent提示词：

用户需求：${context.userInput}

设计要求：
1. 使用标准ATOM框架（Role, Background, Profile, Skills, Goals, Constrains, Workflow, OutputFormat）
2. 确保结构化输出
3. 提供清晰的执行指南
4. 适用于通用场景`;
  }

  /**
   * 估算Token数
   */
  private estimateTokens(text: string): number {
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = text.split(/\s+/).length;
    return Math.ceil(chineseChars * 1.5 + englishWords);
  }
}

