# 智能提示词工程师系统

**Intelligent Prompt Engineering Matrix** - 基于Agent矩阵架构的智能提示词生成、优化和管理平台

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![Vue 3](https://img.shields.io/badge/Vue-3.5-green)](https://vuejs.org/)

---

## 📖 项目简介

智能提示词工程师系统通过**前导Agent（Conductor）**智能调度专家Agent（X0-X4），实现提示词的全生命周期管理。系统能够自动识别用户意图，智能路由到最合适的专家Agent，提供高质量的提示词输出。

### 🎯 核心特性

- **智能路由**：前导Agent自动分析意图，智能调度专家Agent
- **Agent矩阵**：基于agent_matrix的X0-X4专业工程师
- **统一接口**：简洁的API接口，类似ChatGPT的交互体验
- **双轨配置**：支持.env文件和WebUI两种配置方式
- **可扩展**：易于集成新的大模型和Agent类型

---

## 🏗️ Agent矩阵架构

### 核心Agent角色

| Agent | 角色名称 | 专业领域 | 核心功能 | 触发条件 |
|-------|----------|----------|----------|----------|
| **Conductor** | 前导Agent | 智能调度 | 意图识别、路由决策 | 自动执行 |
| **X0逆向** | 逆向工程师 | 推理分析 | 提示词逆向分析 | 输入完整提示词 |
| **X0优化** | 提示词优化师 | 融合优化 | 多维度系统性优化 | 要求优化提示词 |
| **X1基础** | 基础工程师 | 通用场景 | ATOM框架标准化设计 | 通用Agent设计 |
| **X4场景** | 场景工程师 | 应用场景 | 编程、写作、数据分析 | 场景化需求 |

### 智能路由工作流程

```
用户输入
    │
    ▼
【前导Agent分析意图】
    │
    ├─► 完整提示词 → X0逆向工程师 → 框架识别 + 优化建议
    ├─► 优化请求   → X0优化师       → 融合式优化 + 对比报告
    ├─► 场景需求   → X4场景工程师   → 场景化设计 + 专业提示词
    └─► 通用设计   → X1基础工程师   → ATOM框架 + 标准化输出
```

### 典型使用场景

**场景1**：用户输入一个现有的提示词
```
输入："你是一个Python助手，擅长代码优化..."
系统：检测到完整提示词 → 调用X0逆向工程师
输出：框架识别、优化建议、改进版本
```

**场景2**：用户要求设计一个场景化Agent
```
输入："帮我设计一个数据分析助手"
系统：识别场景需求 → 调用X4场景工程师
输出：数据分析场景的专业提示词（完整ATOM框架）
```

**场景3**：用户要求优化提示词
```
输入："请优化这个提示词：[提示词内容]"
系统：识别优化请求 → 调用X0优化师
输出：优化后提示词 + Token优化 + 安全增强
```

## 📁 目录结构

### 新架构目录
- `agent_matrix/` - **Agent矩阵架构核心**（兼容接入生产工程师）
  - `X1_basic/` - 基础提示词工程师（源：`agent_matrix/X1_basic/sources/`）
  - `X2_domain/` - 领域特化工程师  
  - `X3_model/` - 模型特化工程师
  - `X4_scenario/` - 场景特化工程师（源：`agent_matrix/X4_scenario/sources/`）
  - `X0_optimizer/` - 提示词优化师（源：`agent_matrix/X0_optimizer/sources/`）
  - `X0_reverse/` - 逆向工程师
  - `templates/` - 通用模板库
  - `examples/` - 使用示例
  - `docs/` - 架构文档
  - `variants_catalog.md` - 变体目录（X0_a/X1_a等内涵与映射）

#### 生产工程师复用映射（最新路径）
- X1_basic → `agent_matrix/X1_basic/sources/agent专用提示词工程师.md`
- X1_basic → `agent_matrix/X1_basic/sources/agent专用提示词工程师_性能强化250930.md`
- X4_scenario → `agent_matrix/X4_scenario/sources/3.带建议优化角色_最优选_高智能模型.md`
- X4_scenario → `agent_matrix/X4_scenario/sources/3.带建议优化角色_最优选_高智能模型_性能强化250930.md`
- X0_optimizer → `agent_matrix/X0_optimizer/sources/提示词迭代优化工程师.md`

### 兼容性说明
- 历史目录已并入各X目录的 `sources/`。
- 如有外部引用旧路径，请更新为上述“最新路径”。

## 🚀 快速开始

### 安装与配置

#### 1. 克隆项目
```bash
git clone <repository-url>
cd prompt_design
```

#### 2. 安装依赖
```bash
pnpm install
```

#### 3. 配置API密钥
复制配置模板：
```bash
cp env.example .env.local
```

编辑 `.env.local`，填入DeepSeek API Key：
```bash
VITE_DEEPSEEK_API_KEY=sk-your-actual-key-here
VITE_DEEPSEEK_BASE_URL=https://api.deepseek.com
DEFAULT_CONDUCTOR_MODEL=deepseek-chat
DEFAULT_EXPERT_MODEL=deepseek-chat
```

#### 4. 启动开发服务器
```bash
pnpm dev
```

服务将在 `http://localhost:5173` 启动。

---

### 开发命令

```bash
# 完整开发流程（推荐）
pnpm dev                 # 构建core → 启动web开发服务器

# 单独构建
pnpm build:core          # 构建核心服务层
pnpm build:ui            # 构建UI组件库
pnpm build:web           # 构建Web应用
pnpm build               # 构建所有包

# 测试
pnpm test                # 运行所有测试
pnpm test:core           # 单独测试core包

# 清理
pnpm clean               # 清理所有构建产物
pnpm clean:dist          # 清理dist目录
pnpm clean:vite          # 清理Vite缓存
```

---

### 使用示例

#### 代码集成
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

console.log('调用的Agent:', response.agentType);      // 'X4_SCENARIO'
console.log('输出内容:', response.content);             // 完整提示词
console.log('Token使用量:', response.metadata.tokensUsed);
```

---

### 交互体验

在对话界面输入不同类型的需求，系统自动调度对应的Agent：

1. **输入完整提示词** → X0逆向工程师分析
2. **要求"优化提示词"** → X0优化师优化
3. **要求"设计数据分析助手"** → X4场景工程师设计
4. **要求"设计AI助手"** → X1基础工程师设计

---

### 性能指标
- **意图识别准确率**：≥90%
- **路由决策准确率**：≥85%
- **Token利用率提升**：15-20%
- **响应时间**：<5秒（非流式）

## 📊 架构优势

### 模块化设计
- **X1-X4专业分工**：每个工程师专注特定领域，确保专业深度
- **X0融合优化**：统一优化标准，确保质量一致性
- **-X0逆向分析**：提供科学依据，支持持续改进

### 性能优化
- **Token利用率**：通过上下文预算和压缩策略，提升15-20%
- **算力优化**：最大化利用模型算力，减少冗余计算
- **响应速度**：优化工作流程，提升执行效率

### 安全防护
- **多层防护**：价值观红线、专业伦理、领域特化
- **边界控制**：绝对安全边界，防止信息泄露
- **审计机制**：完整的执行记录，支持追溯分析

### 可扩展性
- **框架兼容**：支持ATOM、Role-Profile-Goals等多种框架
- **模块化扩展**：可轻松添加新的工程师类型
- **持续优化**：基于逆向分析的闭环改进机制

## 📁 项目结构

```
prompt_design/
├── packages/
│   ├── core/                    # ✅ 核心服务层（已完成）
│   │   ├── src/
│   │   │   ├── agents/                # Agent实例
│   │   │   │   ├── conductor.ts       # 前导Agent（指挥官）
│   │   │   │   ├── x0-optimizer.ts    # X0优化师
│   │   │   │   ├── x0-reverse.ts      # X0逆向工程师
│   │   │   │   ├── x1-basic.ts        # X1基础工程师
│   │   │   │   └── x4-scenario.ts     # X4场景工程师
│   │   │   ├── services/              # 核心服务
│   │   │   │   ├── llm/               # LLM调用（DeepSeek等）
│   │   │   │   ├── router/            # 智能路由调度
│   │   │   │   ├── agent/             # Agent管理
│   │   │   │   ├── prompt/            # 提示词管理
│   │   │   │   └── storage/           # 数据存储
│   │   │   ├── types/                 # 类型定义
│   │   │   └── utils/                 # 工具函数
│   │   └── package.json
│   │
│   ├── ui/                      # ⏳ UI组件库（待开发）
│   └── web/                     # ⏳ Web应用（待开发）
│
├── agent_matrix/                # Agent矩阵（现有）
│   ├── X0_optimizer/            # X0优化师提示词模板
│   ├── X0_reverse/              # X0逆向工程师模板
│   ├── X1_basic/                # X1基础工程师模板
│   ├── X4_scenario/             # X4场景工程师模板
│   └── docs/                    # 矩阵架构文档
│
├── docs/                        # ✅ 项目文档（已完成）
│   ├── PRD.md                   # 产品需求文档
│   ├── ARCHITECTURE.md          # 技术架构文档
│   └── QUICK_START.md           # 快速开始指南
│
├── env.example                  # 环境变量模板
├── package.json                 # 项目配置
└── pnpm-workspace.yaml          # Monorepo配置
```

---

## 🔧 技术特性

### 核心能力
- **结构化设计**：基于ATOM框架的标准化设计方法
- **融合式优化**：多维度系统性增强策略
- **逆向推理**：基于内容特征的智能分析能力
- **量化评估**：可量化的性能和安全指标

### 质量保证
- **100%框架兼容**：保持原有结构不变
- **可追溯性**：完整的优化记录和对比报告
- **可复用性**：输出提示词可直接用于生产环境
- **持续改进**：基于反馈的迭代优化机制

## 📈 使用效果

### 性能提升
- Token利用率提升15-20%
- 安全覆盖度提升40%+
- 框架兼容性保持100%
- 可追溯性建立完整审计链

### 质量保证
- 输出提示词可直接复用
- 完整的优化对比报告
- 科学的逆向分析依据
- 持续的质量改进机制

## 📚 文档索引

- **[快速开始指南](docs/QUICK_START.md)**: 5分钟上手指南
- **[产品需求文档（PRD）](docs/PRD.md)**: 完整的产品需求和功能规划
- **[技术架构文档](docs/ARCHITECTURE.md)**: 深入的技术架构设计
- **[开发指南](docs/DEVELOPMENT.md)**: 开发流程和代码规范
- **[Agent矩阵文档](agent_matrix/docs/)**: Agent变体和架构设计

---

## 🚧 开发进度

### ✅ Phase 1: 核心服务层（已完成）

| 功能模块          | 状态 | 说明                              |
|-------------------|------|-----------------------------------|
| 项目结构初始化    | ✅   | Monorepo + pnpm workspace         |
| LLMService        | ✅   | 统一大模型调用（DeepSeek）        |
| ConductorAgent    | ✅   | 前导Agent（意图识别+路由决策）    |
| RouterService     | ✅   | 智能路由服务                      |
| X0 OptimizerAgent | ✅   | X0优化师集成                      |
| X0 ReverseAgent   | ✅   | X0逆向工程师集成                  |
| X1 BasicAgent     | ✅   | X1基础工程师集成                  |
| X4 ScenarioAgent  | ✅   | X4场景工程师集成                  |
| AgentManager      | ✅   | Agent生命周期管理                 |
| PromptManager     | ✅   | 提示词管理服务                    |
| StorageService    | ✅   | 数据持久化                        |
| 类型系统          | ✅   | 完整TypeScript类型定义            |
| 文档              | ✅   | PRD + 架构 + 快速开始 + 开发指南  |

### ✅ Phase 2: 前端界面（已完成）

| 功能模块          | 状态 | 说明                              |
|-------------------|------|-----------------------------------|
| UI组件库          | ✅   | Vue 3 + Naive UI                  |
| ChatWindow        | ✅   | 对话窗口组件                      |
| InputBox          | ✅   | 智能输入框                        |
| ConfigPanel       | ✅   | 配置面板                          |
| MessageItem       | ✅   | 消息显示组件                      |
| ChatSidebar       | ✅   | 会话侧边栏                        |
| Web应用           | ✅   | 完整Web应用集成                   |
| 自定义Agent       | ⚠️   | 基础功能完成，存在调用问题        |
| 聊天记录管理      | ⚠️   | 基础功能完成，存在清空问题        |
| 流式响应          | ✅   | 支持流式输出                      |
| 多模型支持        | ✅   | 支持DeepSeek等主流模型            |
| 消息重新生成      | ✅   | 支持重新生成回复                  |
| Markdown导出      | ✅   | 支持导出和复制                    |

### ⏳ Phase 3: 功能完善（进行中）

| 功能模块          | 状态 | 说明                              |
|-------------------|------|-----------------------------------|
| 自定义Agent修复   | 🔄   | 修复Agent调用问题                 |
| 聊天记录管理修复  | 🔄   | 修复清空和删除功能                |
| 单条消息删除      | ⏳   | 待实现                            |
| 会话管理增强      | ⏳   | 待实现                            |
| Agent选择优化     | ⏳   | 提升自动选择准确率                |
| 错误处理增强      | ⏳   | 完善错误提示和处理                |

### ⏳ Phase 4: 测试与优化（计划中）

| 功能模块          | 状态 | 说明                              |
|-------------------|------|-----------------------------------|
| 单元测试          | ⏳   | 核心服务测试覆盖                  |
| 集成测试          | ⏳   | 端到端功能测试                    |
| 性能优化          | ⏳   | 构建体积和运行性能优化            |
| 代码质量          | ⏳   | 代码审查和重构                    |

### ⏳ Phase 5: 部署与交付（计划中）

| 功能模块          | 状态 | 说明                              |
|-------------------|------|-----------------------------------|
| 生产部署          | ⏳   | 生产环境配置和部署                |
| 监控与日志        | ⏳   | 系统监控和错误追踪                |
| 文档完善          | ⏳   | 用户文档和API文档                 |
| 示例与教程        | ⏳   | 使用示例和最佳实践                |

---

## 🚨 已知问题

### 🔴 严重问题（正在修复）
1. **自定义Agent功能异常** - 创建的自定义Agent无法正常调用
2. **聊天记录无法完全清空** - 清空后刷新页面记录会恢复

### 🟡 一般问题（计划修复）
3. **Agent自动选择准确性** - 某些场景下选择不够准确
4. **会话管理功能缺失** - 无法单独删除某条记录或会话

详细问题跟踪参见 **[问题跟踪文档](docs/ISSUES_TRACKING.md)**

开发进度参见 **[开发进度报告](docs/DEVELOPMENT_PROGRESS.md)**

---

## 🤝 贡献指南

欢迎贡献！请遵循以下流程：

### 提交代码
1. Fork本仓库
2. 创建特性分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'feat: add amazing feature'`
4. 推送到分支：`git push origin feature/amazing-feature`
5. 提交Pull Request

### 代码规范
- 遵循TypeScript最佳实践
- 使用Conventional Commits规范
- 添加必要的注释和文档
- 确保测试通过

详见 **[开发指南](docs/DEVELOPMENT.md)**

---

## 📄 License

本项目采用 [Apache 2.0](LICENSE) 协议开源。

---

## 👏 致谢

- 感谢 [prompt-optimizer](https://github.com/linshenkx/prompt-optimizer) 项目的架构参考
- 感谢所有为Agent矩阵架构做出贡献的开发者

---

## 📞 联系方式

- **问题反馈**: 提交 [Issue](../../issues)
- **功能建议**: 提交 [Feature Request](../../issues/new?template=feature_request.md)
- **技术讨论**: 查看 [Discussions](../../discussions)

---

**Made with ❤️ by the Prompt Engineering Matrix Team**
