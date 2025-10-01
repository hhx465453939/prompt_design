/**
 * UI 组件类型定义
 */

import type { AgentType, IntentType, Message as CoreMessage } from '@prompt-matrix/core';

/**
 * 聊天消息（扩展核心 Message）
 */
export interface ChatMessage extends CoreMessage {
  id: string;
  agentType?: AgentType;
  intent?: IntentType;
  tokensUsed?: number;
  isError?: boolean;
  isLoading?: boolean;
  streaming?: boolean;
  thinkingProcess?: string;
}

/**
 * 用户配置
 */
export interface UserConfig {
  provider: 'deepseek' | 'openai' | 'gemini';
  apiKey: string;
  baseURL?: string;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
}

/**
 * Agent 信息
 */
export interface AgentInfo {
  type: AgentType;
  name: string;
  description: string;
  icon: string;
  color: string;
}

