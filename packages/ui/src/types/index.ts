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

/**
 * Flow 步骤（前端编排用的轻量模型）
 *
 * - 对应 PRD 中的多 Agent 线性流程（Step1 → Step2 → Step3）
 * - 仅在前端使用，不直接影响 core 层实现
 */
export interface FlowStep {
  id: string;
  title: string;
  agentType: AgentType | 'CONDUCTOR' | `CUSTOM_${string}`;
  /**
   * 输入来源：
   * - user: 来自用户输入
   * - previousStep: 上一步输出
   * - custom: 自定义静态补充说明
   */
  inputSource: 'user' | 'previousStep' | 'custom';
  customInput?: string;
  systemPromptHints?: string;

  // 运行时状态（MVP 仅在前端使用）
  status?: 'idle' | 'running' | 'success' | 'error';
  outputSummary?: string;
  outputFull?: string;
  errorMessage?: string;
}

/**
 * Flow 模板定义（不包含运行时状态）
 */
export interface FlowTemplate {
  id: string;
  name: string;
  description?: string;
  steps: Array<Omit<FlowStep, 'status' | 'outputSummary' | 'outputFull' | 'errorMessage'>>;
}

