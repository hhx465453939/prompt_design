# 快速开始指南

## 前置要求

- **Node.js**: ≥18.0.0
- **pnpm**: ≥10.6.1
- **DeepSeek API Key**: 从 [DeepSeek官网](https://platform.deepseek.com/) 获取

---

## 安装步骤

### 1. 克隆项目

```bash
git clone <repository-url>
cd prompt_design
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

复制配置模板：
```bash
cp env.example .env.local
```

编辑 `.env.local`，填入你的DeepSeek API Key：
```bash
VITE_DEEPSEEK_API_KEY=sk-your-actual-key-here
VITE_DEEPSEEK_BASE_URL=https://api.deepseek.com

DEFAULT_CONDUCTOR_MODEL=deepseek-chat
DEFAULT_EXPERT_MODEL=deepseek-chat
MAX_TOKENS=4096
TEMPERATURE=0.7
DEBUG_MODE=true
```

### 4. 启动开发服务器

```bash
pnpm dev
```

服务将在 `http://localhost:5173` 启动（Web应用）

---

## 核心功能体验

### 场景1：逆向分析提示词

在对话框中输入一个完整的提示词：

```
你是一个专业的Python编程助手。

## Role
- 角色：资深Python开发工程师
- 专长：代码审查、性能优化、最佳实践

## Skills
- Python语言精通
- 代码质量评估
- 性能调优

## Goals
- 帮助用户编写高质量Python代码
- 提供专业的代码审查意见
- 给出优化建议
```

**预期结果**：系统自动识别为完整提示词，调用 **X0逆向工程师**，输出：
- 框架类型识别
- 优化建议
- 改进后的版本

---

### 场景2：生成场景化提示词

在对话框中输入简单需求：

```
帮我设计一个数据分析助手
```

**预期结果**：系统识别为场景化需求，调用 **X4场景工程师**，生成完整的数据分析Agent提示词。

---

### 场景3：优化现有提示词

在对话框中输入：

```
请优化以下提示词：

你是一个写作助手，帮助用户写文章。
```

**预期结果**：系统调用 **X0优化师**，输出优化后的提示词，包含：
- Token优化
- 安全增强
- 结构化改进

---

### 场景4：基础Agent设计

在对话框中输入：

```
设计一个通用的AI助手
```

**预期结果**：系统调用 **X1基础工程师**，基于ATOM框架生成标准化的Agent提示词。

---

## 项目结构

```
prompt_design/
├── packages/
│   ├── core/              # ✅ 核心服务层（已完成）
│   │   ├── src/
│   │   │   ├── agents/         # Agent实例
│   │   │   │   ├── conductor.ts      # 前导Agent
│   │   │   │   ├── x0-optimizer.ts   # X0优化师
│   │   │   │   ├── x0-reverse.ts     # X0逆向工程师
│   │   │   │   ├── x1-basic.ts       # X1基础工程师
│   │   │   │   └── x4-scenario.ts    # X4场景工程师
│   │   │   ├── services/       # 核心服务
│   │   │   │   ├── llm/              # LLM调用服务
│   │   │   │   ├── router/           # 智能路由服务
│   │   │   │   ├── agent/            # Agent管理
│   │   │   │   ├── prompt/           # 提示词管理
│   │   │   │   └── storage/          # 存储服务
│   │   │   ├── types/          # 类型定义
│   │   │   └── utils/          # 工具函数
│   │   └── package.json
│   │
│   ├── ui/                # ⏳ UI组件库（待开发）
│   └── web/               # ⏳ Web应用（待开发）
│
├── agent_matrix/          # Agent矩阵（现有）
│   ├── X0_optimizer/
│   ├── X0_reverse/
│   ├── X1_basic/
│   └── X4_scenario/
│
├── docs/                  # ✅ 文档（已完成）
│   ├── PRD.md                 # 产品需求文档
│   ├── ARCHITECTURE.md        # 技术架构文档
│   └── QUICK_START.md         # 本文档
│
├── env.example            # 环境变量模板
├── package.json
└── pnpm-workspace.yaml
```

---

## 核心服务使用示例

### 示例1：直接使用RouterService

```typescript
import { LLMService, RouterService } from '@prompt-matrix/core';

// 1. 初始化LLM服务
const llmService = new LLMService();
llmService.initialize({
  provider: 'deepseek',
  apiKey: 'sk-xxx',
  model: 'deepseek-chat',
  temperature: 0.7,
  maxTokens: 4096,
});

// 2. 创建路由服务
const routerService = new RouterService(llmService);

// 3. 处理用户请求
const response = await routerService.handleRequest(
  "帮我设计一个Python编程助手"
);

console.log('调用的Agent:', response.agentType);
console.log('输出内容:', response.content);
console.log('Token使用量:', response.metadata.tokensUsed);
```

### 示例2：单独使用Agent

```typescript
import { LLMService, X1BasicAgent } from '@prompt-matrix/core';

const llmService = new LLMService();
llmService.initialize(config);

const agent = new X1BasicAgent(llmService);
const result = await agent.execute({
  userInput: "设计一个AI助手",
  history: [],
  config: llmService.getConfig()!,
});

console.log(result.content);
```

---

## 调试技巧

### 查看日志

在 `.env.local` 中设置：
```bash
DEBUG_MODE=true
```

日志会在浏览器控制台输出，格式如下：
```
[INFO] 2025-10-01T10:30:00.000Z - Step 1: Analyzing user intent...
[INFO] 2025-10-01T10:30:00.100Z - Intent detected: SCENARIO_DESIGN
[INFO] 2025-10-01T10:30:00.200Z - Step 2: Making routing decision...
[INFO] 2025-10-01T10:30:00.300Z - Routing decision made {intent: 'SCENARIO_DESIGN', targetAgent: 'X4_SCENARIO'}
[INFO] 2025-10-01T10:30:00.400Z - Step 3: Routing to X4_SCENARIO...
[INFO] 2025-10-01T10:30:05.500Z - Request completed in 5500ms
```

### 检查Agent加载

```typescript
import { AgentManager } from '@prompt-matrix/core';

const manager = new AgentManager();
console.log('已加载的Agents:', manager.getAllAgents());
```

---

## 常见问题

### Q1: API调用失败，提示"API Key无效"
**A**: 检查以下几点：
1. `.env.local` 文件是否正确创建
2. `VITE_DEEPSEEK_API_KEY` 是否填写正确
3. API Key是否有足够的额度
4. 是否需要重启开发服务器

### Q2: Agent加载失败
**A**: 确保 `agent_matrix/` 目录结构完整：
```
agent_matrix/
├── X0_optimizer/sources/提示词迭代优化工程师.md
├── X0_reverse/reverse_engineer.md
├── X1_basic/sources/agent专用提示词工程师_性能强化250930.md
└── X4_scenario/sources/3.带建议优化角色_最优选_高智能模型_性能强化250930.md
```

### Q3: 如何切换到其他大模型（如OpenAI）？
**A**: 修改 `.env.local`：
```bash
VITE_OPENAI_API_KEY=sk-your-openai-key
VITE_OPENAI_BASE_URL=https://api.openai.com/v1
```

然后在代码中初始化：
```typescript
llmService.initialize({
  provider: 'openai',  // 改为openai
  apiKey: process.env.VITE_OPENAI_API_KEY,
  model: 'gpt-4',
  ...
});
```

---

## 下一步

### Phase 2：前端开发（计划中）
- [ ] 创建UI组件库（ChatWindow、PromptEditor等）
- [ ] 实现Web应用
- [ ] 集成核心服务与UI

### Phase 3：功能完善
- [ ] 流式响应支持
- [ ] 提示词库管理
- [ ] 测试运行器
- [ ] 性能指标展示

---

## 获取帮助

- **文档**：查看 `docs/` 目录下的完整文档
- **PRD**：[docs/PRD.md](./PRD.md)
- **架构文档**：[docs/ARCHITECTURE.md](./ARCHITECTURE.md)
- **Agent矩阵架构**：[README.md](../README.md)

---

## 贡献指南

欢迎贡献！请遵循以下步骤：

1. Fork本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交Pull Request

---

**祝你使用愉快！🚀**

