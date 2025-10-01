/**
 * X4场景工程师Agent
 * 负责场景化提示词设计（编程、写作、数据分析等）
 */

import { RequestContext } from '../types';
import { LLMService } from '../services/llm/service';
import { agentLoader } from '../utils/agent-loader';
import { logger } from '../utils/logger';

export class X4ScenarioAgent {
  private systemPrompt: string;

  constructor(private llmService: LLMService) {
    const config = agentLoader.loadX4Scenario();
    this.systemPrompt = config.systemPrompt;
    logger.info('X4 Scenario Agent initialized');
  }

  /**
   * 执行场景化设计任务
   */
  async execute(context: RequestContext) {
    logger.debug('X4 Scenario executing...', {
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
      suggestions: ['场景化设计完成', '已优化场景上下文'],
    };
  }

  /**
   * 流式执行场景化设计任务
   */
  async executeStream(
    context: RequestContext,
    onChunk: (chunk: string) => void
  ) {
    logger.debug('X4 Scenario streaming...', {
      inputLength: context.userInput.length,
    });

    const messages = [
      { role: 'system' as const, content: this.systemPrompt },
      { role: 'user' as const, content: this.buildUserPrompt(context) },
    ];

    await this.llmService.chatStream(messages, onChunk);

    return {
      tokensUsed: 0,
      suggestions: ['场景化设计完成', '上下文优化'],
    } as any;
  }

  /**
   * 构建用户提示词
   */
  private buildUserPrompt(context: RequestContext): string {
    // 检测场景类型
    const scenario = this.detectScenario(context.userInput);

    return `请设计一个${scenario}场景的专业Agent提示词：

用户需求：${context.userInput}

设计要求：
1. 针对${scenario}场景优化
2. 包含场景特定的Skills和Workflow
3. 提供场景最佳实践
4. 确保专业性和实用性`;
  }

  /**
   * 检测场景类型
   */
  private detectScenario(input: string): string {
    const scenarioMap: Record<string, string[]> = {
      '编程': ['编程', '代码', '开发', 'programming', 'coding'],
      '写作': ['写作', '文章', '内容', 'writing', 'content'],
      '数据分析': ['数据', '分析', 'data', 'analysis'],
      '客服': ['客服', '助手', 'customer service'],
    };

    for (const [scenario, keywords] of Object.entries(scenarioMap)) {
      if (keywords.some(kw => input.toLowerCase().includes(kw.toLowerCase()))) {
        return scenario;
      }
    }

    return '通用';
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

