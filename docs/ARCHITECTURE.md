# 智能提示词工程师系统 - 技术架构文档

## 1. 架构概览

### 1.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                         用户界面层                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────┐│
│  │ 对话窗口    │  │ 提示词编辑  │  │ 提示词库    │  │ 设置   ││
│  └────────────┘  └────────────┘  └────────────┘  └────────┘│
└───────────────────────────┬─────────────────────────────────┘
                            │ Vue 3 + Naive UI
┌───────────────────────────▼─────────────────────────────────┐
│                        核心服务层                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │             RouterService（智能路由）                  │   │
│  │  ┌─────────────────────────────────────────────┐     │   │
│  │  │       ConductorAgent（前导Agent）            │     │   │
│  │  │   - 意图识别  - 路由决策  - 上下文管理       │     │   │
│  │  └─────────────────────────────────────────────┘     │   │
│  │                        │                              │   │
│  │        ┌───────────────┼───────────────┐             │   │
│  │        │               │               │             │   │
│  │  ┌─────▼────┐   ┌─────▼────┐   ┌─────▼────┐        │   │
│  │  │X0 Reverse│   │X0 Optimi │   │X1 Basic  │  ...   │   │
│  │  └──────────┘   └──────────┘   └──────────┘        │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ LLMService   │  │AgentManager  │  │PromptManager │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└───────────────────────────┬─────────────────────────────────┘
                            │ OpenAI SDK
┌───────────────────────────▼─────────────────────────────────┐
│                      大模型API层                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ DeepSeek   │  │  OpenAI    │  │  Gemini    │  (未来)    │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      Agent矩阵层                              │
│  agent_matrix/                                               │
│  ├── X0_optimizer/   (优化师)                                │
│  ├── X0_reverse/     (逆向工程师)                            │
│  ├── X1_basic/       (基础工程师)                            │
│  └── X4_scenario/    (场景工程师)                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 核心模块设计

### 2.1 前导Agent（ConductorAgent）

#### 职责
- **意图识别**：分析用户输入，判断需求类型
- **路由决策**：选择最合适的专家Agent
- **上下文管理**：维护对话历史

#### 意图识别规则

| 意图类型          | 触发条件                                    | 路由目标      |
|-------------------|---------------------------------------------|---------------|
| REVERSE_ANALYSIS  | 输入为完整提示词（有Role/Profile等关键词）  | X0_REVERSE    |
| OPTIMIZE          | 包含"优化"、"改进"等关键词                  | X0_OPTIMIZER  |
| SCENARIO_DESIGN   | 包含"编程"、"写作"、"数据分析"等场景关键词  | X4_SCENARIO   |
| BASIC_DESIGN      | 通用Agent设计需求                           | X1_BASIC      |

#### 代码示例
```typescript
async analyzeIntent(userInput: string): Promise<IntentType> {
  if (this.isPromptContent(userInput)) {
    return 'REVERSE_ANALYSIS';
  }
  if (this.isOptimizationRequest(userInput)) {
    return 'OPTIMIZE';
  }
  if (this.isScenarioRequest(userInput)) {
    return 'SCENARIO_DESIGN';
  }
  return 'BASIC_DESIGN';
}
```

---

### 2.2 智能路由服务（RouterService）

#### 职责
- 接收用户请求
- 调用ConductorAgent进行意图分析
- 执行Agent调度
- 返回结果并更新历史

#### 执行流程
```
1. 接收用户输入
2. 构建请求上下文（Context）
3. 调用Conductor分析意图
4. 调用Conductor做路由决策
5. 获取目标Agent并执行
6. 构建响应（AgentResponse）
7. 更新对话历史
8. 返回结果
```

#### 代码示例
```typescript
async handleRequest(userInput: string): Promise<AgentResponse> {
  const intent = await this.conductor.analyzeIntent(userInput);
  const decision = await this.conductor.makeRoutingDecision(intent, context);
  const targetAgent = this.agents.get(decision.targetAgent);
  const result = await targetAgent.execute(context);
  
  return {
    agentType: decision.targetAgent,
    content: result.content,
    intent: decision.intent,
    metadata: {...},
    timestamp: Date.now(),
  };
}
```

---

### 2.3 LLM服务（LLMService）

#### 职责
- 统一的大模型调用接口
- 支持多provider（DeepSeek/OpenAI/Gemini）
- 处理流式和非流式响应

#### 支持的Provider

| Provider  | 支持状态 | Base URL                    |
|-----------|----------|-----------------------------|
| DeepSeek  | ✅ 已实现 | https://api.deepseek.com    |
| OpenAI    | ⏳ 待实现 | https://api.openai.com/v1   |
| Gemini    | ⏳ 待实现 | https://generativelanguage.googleapis.com |

#### 初始化
```typescript
llmService.initialize({
  provider: 'deepseek',
  apiKey: 'sk-xxx',
  baseURL: 'https://api.deepseek.com',
  model: 'deepseek-chat',
  temperature: 0.7,
  maxTokens: 4096,
});
```

#### 调用方式
```typescript
// 非流式
const response = await llmService.chat(messages);

// 流式
await llmService.chatStream(messages, (chunk) => {
  console.log(chunk);
});
```

---

### 2.4 Agent管理器（AgentManager）

#### 职责
- 加载agent_matrix中的提示词模板
- 管理Agent配置和元数据
- 提供Agent动态重载功能

#### Agent加载流程
```
1. 读取agent_matrix/{Agent}/sources/*.md文件
2. 解析Markdown内容提取系统提示词
3. 构建AgentConfig对象
4. 缓存到内存Map中
```

#### 代码示例
```typescript
const config = agentLoader.loadX0Optimizer();
// {
//   type: 'X0_OPTIMIZER',
//   systemPrompt: '...',
//   description: 'X0优化师...',
//   capabilities: ['优化', '增强', ...]
// }
```

---

### 2.5 提示词管理器（PromptManager）

#### 职责
- 提示词的CRUD操作
- 搜索和分类
- 版本管理

#### 数据模型
```typescript
interface PromptRecord {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  version: number;
  agentType: AgentType;
  createdAt: number;
  updatedAt: number;
  tags: string[];
  parentId?: string; // 版本链
}
```

#### 核心方法
- `savePrompt()`: 保存新提示词
- `updatePrompt()`: 更新并创建新版本
- `searchPrompts()`: 全文搜索
- `getPromptsByCategory()`: 按分类检索

---

## 3. 数据流设计

### 3.1 用户输入流

```
用户输入
  │
  ▼
[RouterService.handleRequest]
  │
  ├─► [ConductorAgent.analyzeIntent]
  │     │
  │     ▼
  │   识别意图类型
  │
  ├─► [ConductorAgent.makeRoutingDecision]
  │     │
  │     ▼
  │   选择目标Agent
  │
  ├─► [X0/X1/X4 Agent.execute]
  │     │
  │     ▼
  │   [LLMService.chat]
  │     │
  │     ▼
  │   DeepSeek API
  │     │
  │     ▼
  │   返回结果
  │
  ▼
构建AgentResponse
  │
  ▼
更新对话历史
  │
  ▼
返回给前端
```

### 3.2 配置加载流

```
启动应用
  │
  ├─► 读取env.example/env.local
  │
  ├─► 读取localStorage配置
  │
  └─► 合并配置（优先级：WebUI > .env.local > env.example）
  │
  ▼
初始化LLMService
  │
  ▼
初始化AgentManager（加载agent_matrix）
  │
  ▼
初始化RouterService
  │
  ▼
应用就绪
```

---

## 4. 技术选型

### 4.1 前端技术栈

| 技术           | 版本    | 用途                    |
|----------------|---------|-------------------------|
| Vue            | 3.5+    | UI框架                  |
| TypeScript     | 5.8+    | 类型安全                |
| Vite           | 5.x     | 构建工具                |
| Naive UI       | 2.x     | UI组件库                |
| Pinia          | 2.x     | 状态管理（可选）        |

### 4.2 核心技术栈

| 技术           | 版本    | 用途                    |
|----------------|---------|-------------------------|
| TypeScript     | 5.8+    | 核心服务层              |
| OpenAI SDK     | 4.83+   | 大模型调用              |
| Zod            | 3.22+   | 运行时类型验证          |
| Vitest         | 3.0+    | 单元测试                |

### 4.3 构建工具

| 工具           | 版本    | 用途                    |
|----------------|---------|-------------------------|
| pnpm           | 10.6+   | 包管理                  |
| tsup           | 8.0+    | TypeScript打包          |
| concurrently   | 8.2+    | 并行执行脚本            |

---

## 5. 性能优化策略

### 5.1 前端优化
- **懒加载**：按需加载组件和路由
- **虚拟滚动**：对话历史和提示词列表
- **防抖节流**：输入框、搜索框
- **缓存策略**：本地缓存Agent配置和提示词库

### 5.2 后端优化
- **流式响应**：提升用户体验，降低首字符延迟
- **请求缓存**：相同请求缓存结果
- **并发控制**：限制并发API调用数
- **重试机制**：API调用失败自动重试

### 5.3 存储优化
- **IndexedDB**：大量数据存储（后续）
- **压缩**：提示词内容压缩存储
- **分页加载**：提示词库分页展示

---

## 6. 安全设计

### 6.1 API密钥管理
- 环境变量存储
- localStorage加密存储（可选）
- 不在日志中输出密钥

### 6.2 输入验证
- 用户输入长度限制
- 特殊字符过滤
- SQL注入防护（如果后续引入数据库）

### 6.3 错误处理
- 统一的错误捕获和日志记录
- 用户友好的错误提示
- 降级策略（API失败时的备用方案）

---

## 7. 可扩展性设计

### 7.1 多Provider支持
- 插件化Provider接口
- 统一的Message格式
- Provider切换无缝衔接

### 7.2 Agent扩展
- 新增Agent只需在agent_matrix中添加模板
- AgentLoader自动发现和加载
- 动态注册Agent类型

### 7.3 存储扩展
- Storage接口抽象
- 支持localStorage、IndexedDB、云端存储
- 数据迁移工具

---

## 8. 监控与日志

### 8.1 日志系统
- 分级日志（DEBUG/INFO/WARN/ERROR）
- 结构化日志输出
- 可配置日志级别

### 8.2 性能监控
- API调用耗时统计
- Token使用量统计
- 用户操作路径分析

---

## 附录

### A. 关键数据结构

#### RequestContext
```typescript
interface RequestContext {
  userInput: string;
  history: Message[];
  config: UserConfig;
  metadata?: Record<string, any>;
}
```

#### AgentResponse
```typescript
interface AgentResponse {
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
```

### B. 配置文件示例

#### env.example
```bash
VITE_DEEPSEEK_API_KEY=sk-xxx
VITE_DEEPSEEK_BASE_URL=https://api.deepseek.com
DEFAULT_CONDUCTOR_MODEL=deepseek-chat
DEFAULT_EXPERT_MODEL=deepseek-chat
MAX_TOKENS=4096
TEMPERATURE=0.7
```

### C. API调用示例

#### 完整请求流程
```typescript
// 1. 初始化
llmService.initialize(config);

// 2. 创建RouterService
const router = new RouterService(llmService);

// 3. 处理用户请求
const response = await router.handleRequest(
  "帮我设计一个Python编程助手"
);

// 4. 获取结果
console.log(response.agentType);  // 'X4_SCENARIO'
console.log(response.content);     // 完整的Agent提示词
```

