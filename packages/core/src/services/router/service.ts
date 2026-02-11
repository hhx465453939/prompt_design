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
import { CustomAgent, CustomAgentConfig } from '../../agents/custom-agent';
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
   * 注册自定义Agent
   */
  registerCustomAgent(config: CustomAgentConfig) {
    // 确保 ID 不会产生重复的 CUSTOM_ 前缀
    const cleanId = config.id.startsWith('CUSTOM_') ? config.id : `CUSTOM_${config.id}`;
    const agentType = cleanId as AgentType;
    const customAgent = new CustomAgent(config, this.llmService);
    this.agents.set(agentType, customAgent);

    console.log('🔧 RouterService.registerCustomAgent:');
    console.log('  - 配置ID:', config.id);
    console.log('  - 生成的AgentType:', agentType);
    console.log('  - 当前所有Agent:', Array.from(this.agents.keys()));
    console.log('  - 自定义Agent数量:', this.agents.size);

    logger.info(`Custom agent registered: ${config.name} (${agentType})`);
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

      // 步骤2: 意图分析（支持强制路由）
      logger.info('Step 1: Analyzing user intent...');
      const forcedAgent = (fullContext as any).metadata?.forcedAgent as AgentType | undefined;
      
      console.log('🎯 RouterService.handleRequest:');
      console.log('  - 用户输入:', userInput);
      console.log('  - 强制Agent:', forcedAgent);
      console.log('  - 可用Agent列表:', Array.from(this.agents.keys()));
      
      const intent = forcedAgent ? 'CHAT' : await this.conductor.analyzeIntent(userInput, fullContext);

      // 步骤3: 路由决策
      logger.info('Step 2: Making routing decision...');
      const decision = forcedAgent
        ? { targetAgent: forcedAgent, intent, reasoning: 'Forced by user selection' }
        : await this.conductor.makeRoutingDecision(intent, fullContext);

      console.log('  - 路由决策:', decision);
      console.log('  - 目标Agent:', decision.targetAgent);

      // 步骤4: 调用目标Agent
      logger.info(`Step 3: Routing to ${decision.targetAgent}...`);
      const targetAgent = this.agents.get(decision.targetAgent);
      
      console.log('  - 找到目标Agent:', !!targetAgent);
      
      if (!targetAgent) {
        console.error('❌ Agent未找到:', decision.targetAgent);
        console.error('❌ 可用Agent:', Array.from(this.agents.keys()));
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
   * 流式处理
   */
  async handleRequestStream(
    userInput: string,
    onChunk: (chunk: string) => void,
    onThinking?: (thinking: string) => void,
    context?: Partial<RequestContext>
  ): Promise<AgentResponse> {
    const startTime = Date.now();

    // 构建上下文
    const fullContext: RequestContext = {
      userInput,
      history: context?.history || this.conversationHistory,
      config: context?.config || this.llmService.getConfig()!,
      metadata: context?.metadata || {},
    };

    // 意图与路由（支持强制路由）
    onThinking?.('🔍 **意图分析**\n正在解析您的需求...');
    const forcedAgent = (fullContext as any).metadata?.forcedAgent as AgentType | undefined;
    
    console.log('🎯 RouterService.handleRequestStream:');
    console.log('  - 用户输入:', userInput);
    console.log('  - 强制Agent:', forcedAgent);
    console.log('  - 可用Agent列表:', Array.from(this.agents.keys()));
    
    const intent = forcedAgent ? 'CHAT' : await this.conductor.analyzeIntent(userInput, fullContext);
    
    onThinking?.(`🎯 **意图识别**：${intent}\n\n🤔 **路由决策**\n正在选择最合适的专家Agent...`);
    const decision = forcedAgent
      ? { targetAgent: forcedAgent, intent, reasoning: 'Forced by user selection' }
      : await this.conductor.makeRoutingDecision(intent, fullContext);

    console.log('  - 流式路由决策:', decision);
    console.log('  - 目标Agent:', decision.targetAgent);

    const targetAgent = this.agents.get(decision.targetAgent);
    console.log('  - 找到目标Agent:', !!targetAgent);
    
    if (!targetAgent) {
      console.error('❌ 流式Agent未找到:', decision.targetAgent);
      console.error('❌ 可用Agent:', Array.from(this.agents.keys()));
      throw new Error(`Agent not found: ${decision.targetAgent}`);
    }

    onThinking?.(`✅ **专家选择**：${this.getAgentName(decision.targetAgent)}\n\n**📋 决策依据**：${decision.reasoning}\n\n🚀 **开始处理**\n${this.getAgentName(decision.targetAgent)}正在为您生成专业的回答...`);

    // 如果Agent支持流式，则使用
    if (typeof targetAgent.executeStream === 'function') {
      await targetAgent.executeStream(fullContext, onChunk, onThinking);
    } else {
      // 否则退化为一次性输出
      const result = await targetAgent.execute(fullContext);
      onChunk(result.content);
    }

    // 由于内容通过回调输出，这里只返回元信息
    const response: AgentResponse = {
      agentType: decision.targetAgent,
      content: '',
      intent: decision.intent,
      metadata: {
        tokensUsed: 0,
        thinkingProcess: decision.reasoning,
        suggestions: [],
      },
      timestamp: Date.now(),
    };

    // 历史记录只追加用户输入，助手内容由调用方在完成后自行追加完整文本（或忽略）
    this.conversationHistory.push({ role: 'user', content: userInput, timestamp: Date.now() });

    const duration = Date.now() - startTime;
    logger.info(`Stream request completed in ${duration}ms`, {
      intent,
      agent: decision.targetAgent,
    });

    return response;
  }

  /**
   * 获取Agent名称
   */
  private getAgentName(agentType: AgentType): string {
    const agentNames: Record<AgentType, string> = {
      CONDUCTOR: '指挥官',
      X0_OPTIMIZER: 'X0优化师',
      X0_REVERSE: 'X0逆向工程师',
      X1_BASIC: 'X1基础工程师',
      X4_SCENARIO: 'X4场景工程师',
    };
    
    // 如果是自定义Agent，尝试从Agent实例中获取名称
    if (agentType.startsWith('CUSTOM_')) {
      const agent = this.agents.get(agentType);
      if (agent && 'config' in agent && agent.config.name) {
        return agent.config.name;
      }
      return `自定义工程师 ${agentType.replace('CUSTOM_', '')}`;
    }
    
    return agentNames[agentType] || agentType;
  }

  /**
   * 添加历史消息
   */
  addHistoryMessage(message: Message) {
    this.conversationHistory.push(message);
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
    // 在浏览器环境中使用默认值，环境变量由构建时注入
    maxLength = 50;
    
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

