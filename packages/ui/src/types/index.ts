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
  alternatives?: ChatMessage[]; // 历史回复列表
  regenerationCount?: number; // 重新生成次数
}

/**
 * 自定义供应商
 */
export interface CustomProvider {
  id: string;
  name: string;
  baseURL: string;
  models: string[];
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  createdAt: number;
}

/**
 * 用户配置
 */
export interface UserConfig {
  provider: 'deepseek' | 'openai' | 'gemini' | 'openrouter' | 'custom';
  apiKey: string;
  baseURL?: string;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  customProviderId?: string;
  reasoningTokens?: number; // 思维链预算token
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

