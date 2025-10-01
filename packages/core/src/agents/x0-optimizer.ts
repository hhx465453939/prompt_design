/**
 * X0优化师Agent
 * 负责提示词的融合式优化
 */

import { RequestContext } from '../types';
import { LLMService } from '../services/llm/service';
import { agentLoader } from '../utils/agent-loader';
import { logger } from '../utils/logger';

export class X0OptimizerAgent {
  private systemPrompt: string;

  constructor(private llmService: LLMService) {
    // 加载X0优化师的提示词模板
    const config = agentLoader.loadX0Optimizer();
    this.systemPrompt = config.systemPrompt;
    logger.info('X0 Optimizer Agent initialized');
  }

  /**
   * 执行优化任务
   */
  async execute(context: RequestContext) {
    logger.debug('X0 Optimizer executing...', {
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
      suggestions: this.extractSuggestions(response),
    };
  }

  /**
   * 构建用户提示词
   */
  private buildUserPrompt(context: RequestContext): string {
    return `请优化以下提示词：

${context.userInput}

优化要求：
1. 提升Token利用率15-20%
2. 增强安全防护机制
3. 保持原有框架结构100%
4. 提供详细的优化对比报告`;
  }

  /**
   * 估算Token数（简化版）
   */
  private estimateTokens(text: string): number {
    // 简化估算：中文1字约1.5 token，英文1词约1 token
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = text.split(/\s+/).length;
    return Math.ceil(chineseChars * 1.5 + englishWords);
  }

  /**
   * 提取优化建议
   */
  private extractSuggestions(response: string): string[] {
    // TODO: 实现更智能的建议提取
    return [
      '已优化Token利用率',
      '已增强安全边界',
      '已保持框架兼容性',
    ];
  }
}

