/**
 * 前导Agent（Conductor）- 智能指挥官
 * 
 * 职责：
 * 1. 理解用户意图（Intent Recognition）
 * 2. 选择合适的专家Agent（Agent Selection）
 * 3. 执行智能路由调度（Routing）
 */

import { IntentType, AgentType, RequestContext, RoutingDecision } from '../types';
import { logger } from '../utils/logger';

export class ConductorAgent {
  
  /**
   * 分析用户意图
   */
  async analyzeIntent(userInput: string, context?: RequestContext): Promise<IntentType> {
    logger.debug('Analyzing user intent', { input: userInput.substring(0, 100) });

    // 规则1：检测是否为完整提示词（逆向分析）
    if (this.isPromptContent(userInput)) {
      logger.info('Intent detected: REVERSE_ANALYSIS');
      return 'REVERSE_ANALYSIS';
    }

    // 规则2：检测优化请求
    if (this.isOptimizationRequest(userInput)) {
      logger.info('Intent detected: OPTIMIZE');
      return 'OPTIMIZE';
    }

    // 规则3：检测场景化需求
    if (this.isScenarioRequest(userInput)) {
      logger.info('Intent detected: SCENARIO_DESIGN');
      return 'SCENARIO_DESIGN';
    }

    // 规则4：默认基础设计
    logger.info('Intent detected: BASIC_DESIGN');
    return 'BASIC_DESIGN';
  }

  /**
   * 路由决策：根据意图选择目标Agent
   */
  async makeRoutingDecision(
    intent: IntentType,
    context: RequestContext
  ): Promise<RoutingDecision> {
    const agentMap: Record<IntentType, AgentType> = {
      'REVERSE_ANALYSIS': 'X0_REVERSE',
      'OPTIMIZE': 'X0_OPTIMIZER',
      'SCENARIO_DESIGN': 'X4_SCENARIO',
      'BASIC_DESIGN': 'X1_BASIC',
      'CHAT': 'CONDUCTOR', // 普通对话由Conductor自己处理
    };

    const targetAgent = agentMap[intent];
    
    const decision: RoutingDecision = {
      intent,
      targetAgent,
      confidence: this.calculateConfidence(intent, context),
      reasoning: this.explainReasoning(intent, targetAgent),
    };

    logger.info('Routing decision made', decision);
    return decision;
  }

  // ===== 私有方法：意图识别规则 =====

  /**
   * 判断是否为完整提示词内容
   * 启发式规则：
   * - 包含"Role"、"Background"、"Profile"等关键词
   * - 结构化明显（多行、多段落）
   * - 长度超过阈值
   */
  private isPromptContent(input: string): boolean {
    const promptKeywords = [
      'Role', 'Background', 'Profile', 'Skills', 'Goals',
      'Constrains', 'Workflow', 'OutputFormat',
      '你是', '作为', '角色', '技能', '目标'
    ];

    const hasKeywords = promptKeywords.some(kw =>
      input.includes(kw) || input.includes(kw.toLowerCase())
    );

    const isStructured = input.split('\n').length > 5;
    const isLongEnough = input.length > 200;

    return hasKeywords && isStructured && isLongEnough;
  }

  /**
   * 判断是否为优化请求
   */
  private isOptimizationRequest(input: string): boolean {
    const optimizeKeywords = [
      '优化', '改进', '提升', '增强', '完善',
      'optimize', 'improve', 'enhance', 'refine'
    ];

    return optimizeKeywords.some(kw =>
      input.toLowerCase().includes(kw.toLowerCase())
    );
  }

  /**
   * 判断是否为场景化需求
   */
  private isScenarioRequest(input: string): boolean {
    const scenarioKeywords = [
      // 编程相关
      '编程', '代码', '开发', 'programming', 'coding', 'developer',
      // 写作相关
      '写作', '文章', '内容', 'writing', 'content', 'article',
      // 数据分析
      '数据分析', '分析', 'analysis', 'data',
      // 其他场景
      '客服', '助手', '顾问', 'assistant', 'consultant'
    ];

    return scenarioKeywords.some(kw =>
      input.toLowerCase().includes(kw.toLowerCase())
    );
  }

  /**
   * 计算置信度（简化版）
   */
  private calculateConfidence(intent: IntentType, context: RequestContext): number {
    // TODO: 实现更复杂的置信度计算逻辑
    // 可以基于关键词匹配度、上下文连贯性等
    return 0.85;
  }

  /**
   * 解释推理过程
   */
  private explainReasoning(intent: IntentType, agent: AgentType): string {
    const reasoningMap: Record<IntentType, string> = {
      'REVERSE_ANALYSIS': '检测到完整提示词结构，调用X0逆向工程师进行分析',
      'OPTIMIZE': '检测到优化需求关键词，调用X0优化师进行提升',
      'SCENARIO_DESIGN': '检测到场景化需求，调用X4场景工程师进行设计',
      'BASIC_DESIGN': '通用Agent设计需求，调用X1基础工程师',
      'CHAT': '普通对话，由Conductor处理',
    };

    return reasoningMap[intent] || '默认路由策略';
  }
}

// 导出单例
export const conductorAgent = new ConductorAgent();

