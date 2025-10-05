/**
 * 核心类型定义
 */

// ===== 消息类型 =====
export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

// ===== 意图类型 =====
export type IntentType =
  | 'REVERSE_ANALYSIS'   // 逆向分析提示词
  | 'OPTIMIZE'           // 优化提示词
  | 'SCENARIO_DESIGN'    // 场景化设计
  | 'BASIC_DESIGN'       // 基础设计
  | 'CHAT';              // 普通对话

// ===== Agent类型 =====
export type AgentType =
  | 'CONDUCTOR'      // 前导Agent（指挥官）
  | 'X0_OPTIMIZER'   // X0优化师
  | 'X0_REVERSE'     // X0逆向工程师
  | 'X1_BASIC'       // X1基础工程师
  | 'X4_SCENARIO'    // X4场景工程师
  | `CUSTOM_${string}`; // 自定义Agent

// ===== 请求上下文 =====
export interface RequestContext {
  userInput: string;
  history: Message[];
  config: UserConfig;
  metadata?: Record<string, any>;
}

// ===== 自定义供应商 =====
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

// ===== 用户配置 =====
export interface UserConfig {
  provider: 'deepseek' | 'openai' | 'gemini' | 'openrouter' | 'custom';
  apiKey: string;
  baseURL?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  customProviderId?: string; // 当provider为custom时使用
  reasoningTokens?: number; // 思维链预算token
}

// ===== Agent响应 =====
export interface AgentResponse {
  agentType: AgentType;
  content: string;
  intent: IntentType;
  metadata: {
    tokensUsed?: number;
    thinkingProcess?: string;
    suggestions?: string[];
  };
  timestamp: number;
}

// ===== LLM调用选项 =====
export interface LLMOptions {
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
  reasoningTokens?: number; // 思维链预算token
}

// ===== Agent配置 =====
export interface AgentConfig {
  type: AgentType;
  systemPrompt: string;
  description: string;
  capabilities: string[];
}

// ===== 提示词元数据 =====
export interface PromptMetadata {
  id: string;
  name: string;
  description: string;
  category: string;
  createdAt: number;
  updatedAt: number;
  tags: string[];
  agentType: AgentType;
}

// ===== 提示词记录 =====
export interface PromptRecord extends PromptMetadata {
  content: string;
  version: number;
  parentId?: string;
}

// ===== 测试结果 =====
export interface TestResult {
  id: string;
  promptId: string;
  input: string;
  output: string;
  model: string;
  timestamp: number;
  metrics: {
    tokensUsed: number;
    responseTime: number;
    quality?: number;
  };
}

// ===== 路由决策 =====
export interface RoutingDecision {
  intent: IntentType;
  targetAgent: AgentType;
  confidence: number;
  reasoning: string;
}

// ===== 存储键 =====
export const StorageKeys = {
  USER_CONFIG: 'user_config',
  CONVERSATION_HISTORY: 'conversation_history',
  PROMPT_LIBRARY: 'prompt_library',
  TEST_RECORDS: 'test_records',
} as const;

