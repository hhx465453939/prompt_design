/**
 * Agent管理服务
 * 负责Agent的生命周期管理
 */

import { AgentType, AgentConfig } from '../../types';
import { agentLoader } from '../../utils/agent-loader';
import { logger } from '../../utils/logger';

export class AgentManager {
  private agents: Map<AgentType, AgentConfig>;

  constructor() {
    this.agents = new Map();
    this.loadAllAgents();
  }

  /**
   * 加载所有Agent配置
   */
  private loadAllAgents() {
    try {
      this.agents = agentLoader.loadAllAgents();
      logger.info(`AgentManager loaded ${this.agents.size} agents`);
    } catch (error) {
      logger.error('Failed to load agents', error as Error);
      throw error;
    }
  }

  /**
   * 获取Agent配置
   */
  getAgent(type: AgentType): AgentConfig | undefined {
    return this.agents.get(type);
  }

  /**
   * 获取所有Agent
   */
  getAllAgents(): AgentConfig[] {
    return Array.from(this.agents.values());
  }

  /**
   * 检查Agent是否存在
   */
  hasAgent(type: AgentType): boolean {
    return this.agents.has(type);
  }

  /**
   * 重新加载Agent
   */
  reloadAgent(type: AgentType) {
    try {
      let config: AgentConfig;
      
      switch (type) {
        case 'X0_OPTIMIZER':
          config = agentLoader.loadX0Optimizer();
          break;
        case 'X0_REVERSE':
          config = agentLoader.loadX0Reverse();
          break;
        case 'X1_BASIC':
          config = agentLoader.loadX1Basic();
          break;
        case 'X4_SCENARIO':
          config = agentLoader.loadX4Scenario();
          break;
        default:
          throw new Error(`Unknown agent type: ${type}`);
      }
      
      this.agents.set(type, config);
      logger.info(`Agent ${type} reloaded successfully`);
    } catch (error) {
      logger.error(`Failed to reload agent ${type}`, error as Error);
      throw error;
    }
  }
}

// 导出单例
export const agentManager = new AgentManager();

