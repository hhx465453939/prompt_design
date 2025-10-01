/**
 * 智能路由服务 - Router Service
 * 
 * 核心职责：
 * 1. 接收用户请求
 * 2. 使用Conductor分析意图并做路由决策
 * 3. 调用相应的专家Agent
 * 4. 返回结果并记录元数据
 */

import { RequestContext, AgentResponse, AgentType, Message } from '../../types';
import { ConductorAgent } from '../../agents/conductor';
import { X0OptimizerAgent } from '../../agents/x0-optimizer';
import { X0ReverseAgent } from '../../agents/x0-reverse';
import { X1BasicAgent } from '../../agents/x1-basic';
import { X4ScenarioAgent } from '../../agents/x4-scenario';
import { LLMService } from '../llm/service';
import { logger } from '../../utils/logger';

export class RouterService {
  private conductor: ConductorAgent;
  private agents: Map<AgentType, any>;
  private conversationHistory: Message[] = [];

  constructor(
    private llmService: LLMService,
    conductor?: ConductorAgent
  ) {
    this.conductor = conductor || new ConductorAgent();
    this.agents = new Map();
    this.initializeAgents();
  }

  /**
   * 初始化所有专家Agent
   */
  private initializeAgents() {
    this.agents.set('X0_OPTIMIZER', new X0OptimizerAgent(this.llmService));
    this.agents.set('X0_REVERSE', new X0ReverseAgent(this.llmService));
    this.agents.set('X1_BASIC', new X1BasicAgent(this.llmService));
    this.agents.set('X4_SCENARIO', new X4ScenarioAgent(this.llmService));
    
    logger.info('All expert agents initialized');
  }

  /**
   * 核心路由处理方法
   */
  async handleRequest(userInput: string, context?: Partial<RequestContext>): Promise<AgentResponse> {
    const startTime = Date.now();

    try {
      // 步骤1: 构建完整上下文
      const fullContext: RequestContext = {
        userInput,
        history: context?.history || this.conversationHistory,
        config: context?.config || this.llmService.getConfig()!,
        metadata: context?.metadata || {},
      };

      // 步骤2: 意图分析
      logger.info('Step 1: Analyzing user intent...');
      const intent = await this.conductor.analyzeIntent(userInput, fullContext);

      // 步骤3: 路由决策
      logger.info('Step 2: Making routing decision...');
      const decision = await this.conductor.makeRoutingDecision(intent, fullContext);

      // 步骤4: 调用目标Agent
      logger.info(`Step 3: Routing to ${decision.targetAgent}...`);
      const targetAgent = this.agents.get(decision.targetAgent);
      
      if (!targetAgent) {
        throw new Error(`Agent not found: ${decision.targetAgent}`);
      }

      const result = await targetAgent.execute(fullContext);

      // 步骤5: 构建响应
      const response: AgentResponse = {
        agentType: decision.targetAgent,
        content: result.content,
        intent: decision.intent,
        metadata: {
          tokensUsed: result.tokensUsed,
          thinkingProcess: decision.reasoning,
          suggestions: result.suggestions,
        },
        timestamp: Date.now(),
      };

      // 步骤6: 更新对话历史
      this.updateHistory(userInput, response.content);

      // 记录性能指标
      const duration = Date.now() - startTime;
      logger.info(`Request completed in ${duration}ms`, {
        intent: intent,
        agent: decision.targetAgent,
        tokensUsed: response.metadata.tokensUsed,
      });

      return response;

    } catch (error) {
      logger.error('Request handling failed', error as Error);
      throw error;
    }
  }

  /**
   * 流式处理（待实现）
   */
  async handleRequestStream(
    userInput: string,
    onChunk: (chunk: string) => void,
    context?: Partial<RequestContext>
  ): Promise<AgentResponse> {
    // TODO: 实现流式响应
    throw new Error('Stream mode not implemented yet');
  }

  /**
   * 更新对话历史
   */
  private updateHistory(userInput: string, assistantResponse: string) {
    this.conversationHistory.push({
      role: 'user',
      content: userInput,
      timestamp: Date.now(),
    });

    this.conversationHistory.push({
      role: 'assistant',
      content: assistantResponse,
      timestamp: Date.now(),
    });

    // 限制历史长度
    let maxLength = 50;
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      maxLength = parseInt(import.meta.env.VITE_MAX_HISTORY_LENGTH || '50');
    } else if (typeof process !== 'undefined' && process.env) {
      maxLength = parseInt(process.env.VITE_MAX_HISTORY_LENGTH || process.env.MAX_HISTORY_LENGTH || '50');
    }
    
    if (this.conversationHistory.length > maxLength) {
      this.conversationHistory = this.conversationHistory.slice(-maxLength);
    }
  }

  /**
   * 清空对话历史
   */
  clearHistory() {
    this.conversationHistory = [];
    logger.info('Conversation history cleared');
  }

  /**
   * 获取对话历史
   */
  getHistory(): Message[] {
    return [...this.conversationHistory];
  }
}

// 导出工厂函数
export function createRouterService(llmService: LLMService): RouterService {
  return new RouterService(llmService);
}

