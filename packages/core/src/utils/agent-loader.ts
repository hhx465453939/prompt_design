/**
 * Agent加载器 - 从agent_matrix目录加载Prompt模板
 */

import { AgentType, AgentConfig } from '../types';
import { systemLogger } from './logger';
import * as fs from 'fs';
import * as path from 'path';

// 检测运行环境
const isBrowser = typeof window !== 'undefined';

// 动态导入工具函数
const dynamicImport = async (moduleName: string) => {
  try {
    // Node.js ESM 环境
    if (typeof window === 'undefined' && typeof process !== 'undefined') {
      return await import(moduleName);
    }
    throw new Error('File system access not available in browser environment');
  } catch (error) {
    throw new Error(`Cannot import ${moduleName}: ${error}`);
  }
};

// 浏览器环境下的默认提示词
const DEFAULT_PROMPTS = {
  X0_OPTIMIZER: `你是X0提示词优化师，专注于提示词的融合式优化。

核心能力：
- 提示词结构优化
- Token利用率提升
- 安全边界增强
- 多维度系统性优化

工作流程：
1. 分析现有提示词的结构和内容
2. 识别优化空间和改进点
3. 提供具体的优化建议
4. 确保优化后的提示词更加高效、安全、易用`,

  X0_REVERSE: `你是X0逆向工程师，专注于提示词的分析和反向工程。

核心能力：
- 提示词框架识别
- 工程师类型推理
- 优化空间分析
- 改进建议生成

工作流程：
1. 分析提示词的结构和组成
2. 识别使用的框架和模式
3. 评估提示词的质量和效果
4. 提供改进建议和优化方向`,

  X1_BASIC: `你是X1基础提示词工程师，基于ATOM框架进行提示词设计。

ATOM框架：
- Action（行动）：明确任务目标
- Target（对象）：定义操作对象
- Output（输出）：规定输出格式
- Manner（方式）：指定执行方式

核心能力：
- ATOM框架标准化设计
- 通用场景提示词生成
- 结构化输出保证
- 最佳实践应用

设计原则：
- 清晰的任务定义
- 明确的输出格式
- 合理的约束条件
- 可复用的模板结构`,

  X4_SCENARIO: `你是X4场景特化工程师，专注于特定应用场景的提示词设计。

核心能力：
- 场景化提示词设计
- 编程/写作/分析等专业场景适配
- 上下文优化
- 场景最佳实践应用

支持的场景类型：
- 编程开发场景
- 内容创作场景
- 数据分析场景
- 业务咨询场景
- 教育培训场景

设计原则：
- 深入理解场景需求
- 提供专业领域知识
- 优化场景特定的交互方式
- 确保输出符合场景规范`
};

export class AgentLoader {
  private agentMatrixPath?: string;
  private useFileSystem: boolean;

  constructor(basePath?: string) {
    this.useFileSystem = !isBrowser && basePath !== undefined;
    if (this.useFileSystem && basePath) {
      // 使用默认路径，避免require语句
      this.agentMatrixPath = `${basePath}/agent_matrix`;
    }
  }

  /**
   * 加载X0优化师
   */
  loadX0Optimizer(): AgentConfig {
    try {
      const template = this.useFileSystem
        ? this.readAgentFile('X0_optimizer/sources/提示词迭代优化工程师.md')
        : DEFAULT_PROMPTS.X0_OPTIMIZER;
      
      return {
        type: 'X0_OPTIMIZER',
        systemPrompt: this.extractSystemPrompt(template),
        description: 'X0提示词优化师 - 融合式优化专家',
        capabilities: [
          '提示词结构优化',
          'Token利用率提升',
          '安全边界增强',
          '多维度系统性优化'
        ]
      };
    } catch (error) {
      systemLogger.error('Failed to load X0 Optimizer', error as Error);
      throw error;
    }
  }

  /**
   * 加载X0逆向工程师
   */
  loadX0Reverse(): AgentConfig {
    try {
      const template = this.useFileSystem
        ? this.readAgentFile('X0_reverse/reverse_engineer.md')
        : DEFAULT_PROMPTS.X0_REVERSE;
      
      return {
        type: 'X0_REVERSE',
        systemPrompt: this.extractSystemPrompt(template),
        description: 'X0逆向工程师 - 提示词分析专家',
        capabilities: [
          '提示词框架识别',
          '工程师类型推理',
          '优化空间分析',
          '改进建议生成'
        ]
      };
    } catch (error) {
      systemLogger.error('Failed to load X0 Reverse', error as Error);
      throw error;
    }
  }

  /**
   * 加载X1基础工程师
   */
  loadX1Basic(): AgentConfig {
    try {
      const template = this.useFileSystem
        ? this.readAgentFile('X1_basic/sources/agent专用提示词工程师_性能强化250930.md')
        : DEFAULT_PROMPTS.X1_BASIC;
      
      return {
        type: 'X1_BASIC',
        systemPrompt: this.extractSystemPrompt(template),
        description: 'X1基础提示词工程师 - ATOM框架设计专家',
        capabilities: [
          'ATOM框架标准化设计',
          '通用场景提示词生成',
          '结构化输出保证',
          '最佳实践应用'
        ]
      };
    } catch (error) {
      systemLogger.error('Failed to load X1 Basic', error as Error);
      throw error;
    }
  }

  /**
   * 加载X4场景工程师
   */
  loadX4Scenario(): AgentConfig {
    try {
      const template = this.useFileSystem
        ? this.readAgentFile('X4_scenario/sources/3.带建议优化角色_最优选_高智能模型_性能强化250930.md')
        : DEFAULT_PROMPTS.X4_SCENARIO;
      
      return {
        type: 'X4_SCENARIO',
        systemPrompt: this.extractSystemPrompt(template),
        description: 'X4场景特化工程师 - 应用场景专家',
        capabilities: [
          '场景化提示词设计',
          '编程/写作/分析等专业场景',
          '上下文优化',
          '场景最佳实践'
        ]
      };
    } catch (error) {
      systemLogger.error('Failed to load X4 Scenario', error as Error);
      throw error;
    }
  }

  /**
   * 批量加载所有Agent
   */
  loadAllAgents(): Map<AgentType, AgentConfig> {
    const agents = new Map<AgentType, AgentConfig>();
    
    agents.set('X0_OPTIMIZER', this.loadX0Optimizer());
    agents.set('X0_REVERSE', this.loadX0Reverse());
    agents.set('X1_BASIC', this.loadX1Basic());
    agents.set('X4_SCENARIO', this.loadX4Scenario());
    
    systemLogger.info(`Loaded ${agents.size} agents successfully`);
    return agents;
  }

  /**
   * 读取Agent文件（仅在Node.js环境中可用）
   */
  private readAgentFile(relativePath: string): string {
    if (!this.useFileSystem || !this.agentMatrixPath) {
      throw new Error('File system access not available in browser environment');
    }
    
    // 使用path.join确保跨平台兼容性
    const fullPath = path.join(this.agentMatrixPath, relativePath);
    // 简单读取实现，避免动态导入问题
    try {
      if (!fs.existsSync(fullPath)) {
        throw new Error(`Agent file not found: ${fullPath}`);
      }
      return fs.readFileSync(fullPath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read agent file: ${fullPath}`);
    }
  }

  /**
   * 从Markdown提取系统提示词
   * 直接返回整个内容作为系统提示词
   */
  private extractSystemPrompt(content: string): string {
    return content.trim();
  }
}

// 导出单例（浏览器环境下不传入basePath）
export const agentLoader = new AgentLoader(
  undefined // 禁用文件系统，始终使用默认提示词
);

