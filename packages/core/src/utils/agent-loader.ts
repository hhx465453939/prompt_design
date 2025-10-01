/**
 * Agent加载器 - 从agent_matrix目录加载Prompt模板
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { AgentType, AgentConfig } from '../types';
import { logger } from './logger';

export class AgentLoader {
  private agentMatrixPath: string;

  constructor(basePath: string = process.cwd()) {
    this.agentMatrixPath = join(basePath, 'agent_matrix');
  }

  /**
   * 加载X0优化师
   */
  loadX0Optimizer(): AgentConfig {
    try {
      const template = this.readAgentFile(
        'X0_optimizer/sources/提示词迭代优化工程师.md'
      );
      
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
      logger.error('Failed to load X0 Optimizer', error as Error);
      throw error;
    }
  }

  /**
   * 加载X0逆向工程师
   */
  loadX0Reverse(): AgentConfig {
    try {
      const template = this.readAgentFile(
        'X0_reverse/reverse_engineer.md'
      );
      
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
      logger.error('Failed to load X0 Reverse', error as Error);
      throw error;
    }
  }

  /**
   * 加载X1基础工程师
   */
  loadX1Basic(): AgentConfig {
    try {
      const template = this.readAgentFile(
        'X1_basic/sources/agent专用提示词工程师_性能强化250930.md'
      );
      
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
      logger.error('Failed to load X1 Basic', error as Error);
      throw error;
    }
  }

  /**
   * 加载X4场景工程师
   */
  loadX4Scenario(): AgentConfig {
    try {
      const template = this.readAgentFile(
        'X4_scenario/sources/3.带建议优化角色_最优选_高智能模型_性能强化250930.md'
      );
      
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
      logger.error('Failed to load X4 Scenario', error as Error);
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
    
    logger.info(`Loaded ${agents.size} agents successfully`);
    return agents;
  }

  /**
   * 读取Agent文件
   */
  private readAgentFile(relativePath: string): string {
    const fullPath = join(this.agentMatrixPath, relativePath);
    return readFileSync(fullPath, 'utf-8');
  }

  /**
   * 从Markdown提取系统提示词
   * 简化版：直接返回整个内容作为系统提示词
   * 后续可以根据实际格式进行更精细的解析
   */
  private extractSystemPrompt(content: string): string {
    // TODO: 实现更精细的解析逻辑
    // 可以提取特定章节，如 "## System Prompt" 或 "## Role"
    return content.trim();
  }
}

// 导出单例
export const agentLoader = new AgentLoader();

