/**
 * X0逆向工程师Agent
 * 负责提示词的逆向分析和推理
 */

import { RequestContext } from '../types';
import { LLMService } from '../services/llm/service';
import { agentLoader } from '../utils/agent-loader';
import { logger } from '../utils/logger';

export class X0ReverseAgent {
  private systemPrompt: string;

  constructor(private llmService: LLMService) {
    const config = agentLoader.loadX0Reverse();
    this.systemPrompt = config.systemPrompt;
    logger.info('X0 Reverse Agent initialized');
  }

  /**
   * 执行逆向分析任务
   */
  async execute(context: RequestContext) {
    logger.debug('X0 Reverse executing...', {
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
      suggestions: this.extractAnalysisPoints(response),
    };
  }

  /**
   * 流式执行逆向分析任务
   */
  async executeStream(
    context: RequestContext,
    onChunk: (chunk: string) => void
  ) {
    logger.debug('X0 Reverse streaming...', {
      inputLength: context.userInput.length,
    });

    const messages = [
      { role: 'system' as const, content: this.systemPrompt },
      { role: 'user' as const, content: this.buildUserPrompt(context) },
    ];

    await this.llmService.chatStream(messages, onChunk);

    return {
      tokensUsed: 0,
      suggestions: ['分析完成', '框架已识别'],
    } as any;
  }

  /**
   * 构建用户提示词
   */
  private buildUserPrompt(context: RequestContext): string {
    return `请对以下提示词进行逆向分析：

${context.userInput}

分析要求：
1. 识别提示词框架类型（ATOM/Role-Profile/混合/自由）
2. 推理可能使用的工程师类型（X1/X2/X3/X4）
3. 识别优化空间和改进点
4. 提供具体的优化建议`;
  }

  /**
   * 估算Token数
   */
  private estimateTokens(text: string): number {
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = text.split(/\s+/).length;
    return Math.ceil(chineseChars * 1.5 + englishWords);
  }

  /**
   * 提取分析要点
   */
  private extractAnalysisPoints(response: string): string[] {
    return [
      '框架识别完成',
      '工程师类型推理完成',
      '优化空间分析完成',
    ];
  }
}

