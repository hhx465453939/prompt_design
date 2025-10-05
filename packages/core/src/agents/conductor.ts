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

    // console.log('🎯 ConductorAgent.analyzeIntent:');
    // console.log('  - 用户输入:', userInput);
    // console.log('  - 历史消息数量:', context?.history?.length || 0);

    // 计算各种意图的得分
    const scores: Record<IntentType, number> = {
      REVERSE_ANALYSIS: this.isPromptContent(userInput),
      OPTIMIZE: this.isOptimizationRequest(userInput),
      SCENARIO_DESIGN: this.isScenarioRequest(userInput),
      BASIC_DESIGN: 0.3, // 基础分数
      CHAT: 0.1, // 聊天意图的基础分数
    };

    // console.log('  - 意图得分:', scores);

    // 找到得分最高的意图
    const maxIntent = Object.entries(scores).reduce((a, b) => 
      scores[a[0] as IntentType] > scores[b[0] as IntentType] ? a : b
    )[0] as IntentType;

    const maxScore = scores[maxIntent];
    // console.log('  - 最高得分意图:', maxIntent, '得分:', maxScore);

    // 如果最高得分太低，返回基础设计
    if (maxScore < 0.6) {
      // console.log('  - 得分过低，使用默认基础设计');
      logger.info('Intent detected: BASIC_DESIGN (low confidence)');
      return 'BASIC_DESIGN';
    }

    // console.log('  - 最终意图:', maxIntent);
    logger.info(`Intent detected: ${maxIntent} (score: ${maxScore.toFixed(2)})`);
    return maxIntent;
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
  private isPromptContent(input: string): number {
    const promptKeywords = [
      'Role', 'Background', 'Profile', 'Skills', 'Goals',
      'Constrains', 'Workflow', 'OutputFormat',
      '你是', '作为', '角色', '技能', '目标'
    ];

    let score = 0;
    
    // 关键词匹配 (0-0.4分)
    const matchedKeywords = promptKeywords.filter(kw =>
      input.includes(kw) || input.includes(kw.toLowerCase())
    );
    score += Math.min(matchedKeywords.length * 0.1, 0.4);
    
    // 结构化程度 (0-0.3分)
    const lineCount = input.split('\n').length;
    if (lineCount > 5) score += 0.2;
    if (lineCount > 10) score += 0.1;
    
    // 长度 (0-0.3分)
    if (input.length > 200) score += 0.2;
    if (input.length > 500) score += 0.1;
    
    // console.log('    - 提示词分析: 关键词', matchedKeywords.length, '结构', lineCount, '行, 长度', input.length);
    
    return Math.min(score, 1.0);
  }

  /**
   * 判断是否为优化请求
   */
  private isOptimizationRequest(input: string): number {
    const optimizeKeywords = [
      { word: '优化', weight: 1.0 },
      { word: '改进', weight: 0.8 },
      { word: '提升', weight: 0.8 },
      { word: '增强', weight: 0.7 },
      { word: '完善', weight: 0.6 },
      { word: 'optimize', weight: 1.0 },
      { word: 'improve', weight: 0.8 },
      { word: 'enhance', weight: 0.7 },
      { word: 'refine', weight: 0.6 },
      { word: '修改', weight: 0.5 },
      { word: '调整', weight: 0.4 },
    ];

    let score = 0;
    const matchedWords: string[] = [];
    
    for (const { word, weight } of optimizeKeywords) {
      if (input.toLowerCase().includes(word.toLowerCase())) {
        score += weight * 0.3;
        matchedWords.push(word);
      }
    }
    
    // 如果输入很短，可能是模糊请求，降低分数
    if (input.length < 10 && score > 0) {
      score *= 0.5;
    }
    
    // console.log('    - 优化分析: 匹配词', matchedWords, '得分', score);
    
    return Math.min(score, 1.0);
  }

  /**
   * 判断是否为场景化需求
   */
  private isScenarioRequest(input: string): number {
    const scenarioCategories = [
      {
        name: '编程',
        keywords: ['编程', '代码', '开发', 'programming', 'coding', 'developer', '程序', '软件'],
        weight: 1.0
      },
      {
        name: '写作',
        keywords: ['写作', '文章', '内容', 'writing', 'content', 'article', '文案', '创作'],
        weight: 1.0
      },
      {
        name: '数据分析',
        keywords: ['数据分析', '分析', 'analysis', 'data', '数据', '统计', '报表'],
        weight: 1.0
      },
      {
        name: '客服助手',
        keywords: ['客服', '助手', '顾问', 'assistant', 'consultant', '服务', '支持'],
        weight: 0.8
      },
      {
        name: '教育',
        keywords: ['教育', '教学', '老师', '学习', '培训', '课程', 'education'],
        weight: 0.8
      },
      {
        name: '设计',
        keywords: ['设计', '设计', '设计', 'design', 'ui', 'ux', '界面', '创意'],
        weight: 0.8
      }
    ];

    let maxScore = 0;
    let matchedCategory = '';
    
    for (const category of scenarioCategories) {
      let categoryScore = 0;
      const matchedKeywords: string[] = [];
      
      for (const keyword of category.keywords) {
        if (input.toLowerCase().includes(keyword.toLowerCase())) {
          categoryScore += 0.2;
          matchedKeywords.push(keyword);
        }
      }
      
      // 应用类别权重
      categoryScore *= category.weight;
      
      if (categoryScore > maxScore) {
        maxScore = categoryScore;
        matchedCategory = category.name;
      }
      
      if (categoryScore > 0) {
        // console.log(`    - ${category.name}分析: 匹配词`, matchedKeywords, '得分', categoryScore);
      }
    }
    
    // console.log('    - 场景分析: 最佳类别', matchedCategory, '得分', maxScore);
    
    return Math.min(maxScore, 1.0);
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(intent: IntentType, context: RequestContext): number {
    // 根据意图类型返回不同的基础置信度
    const baseConfidence: Record<IntentType, number> = {
      'REVERSE_ANALYSIS': 0.9,
      'OPTIMIZE': 0.8,
      'SCENARIO_DESIGN': 0.75,
      'BASIC_DESIGN': 0.6,
      'CHAT': 0.5,
    };

    let confidence = baseConfidence[intent];
    
    // 根据历史对话调整置信度
    if (context?.history && context.history.length > 0) {
      // 如果有对话历史，稍微提高置信度
      confidence += 0.05;
    }
    
    // 根据输入长度调整置信度
    if (context?.userInput) {
      const inputLength = context.userInput.length;
      if (inputLength > 50) {
        confidence += 0.02; // 输入越长，意图越明确
      }
    }
    
    return Math.min(confidence, 1.0);
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

