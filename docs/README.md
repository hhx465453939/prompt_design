# 智能提示词工程师系统

> 基于Agent矩阵架构的智能提示词生成、优化和管理平台

## 🎯 项目概述

智能提示词工程师代理系统（Intelligent Prompt Engineering Matrix）是一个基于Agent矩阵架构的智能提示词生成、优化和管理平台。系统通过前导Agent（Conductor）智能调度专家Agent（X0-X4），实现提示词的全生命周期管理。

### 核心价值
- **智能化**：自动识别用户意图，智能路由到最合适的专家Agent
- **专业化**：基于agent_matrix的专业工程师，提供高质量提示词输出
- **系统化**：提供生成、优化、测试、管理的完整工作流

### 目标用户
- AI应用开发者
- 提示词工程师
- 产品经理和技术顾问
- 需要高质量Agent提示词的团队

---

## 🚀 快速开始

### 前置要求

- **Node.js**: ≥18.0.0
- **pnpm**: ≥10.6.1
- **DeepSeek API Key**: 从 [DeepSeek官网](https://platform.deepseek.com/) 获取

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd prompt_design
```

2. **安装依赖**
```bash
pnpm install
```

3. **配置环境变量**
```bash
cp env.example .env.local
```

编辑 `.env.local` 文件，添加您的API密钥：
```env
VITE_DEEPSEEK_API_KEY=sk-your-actual-key-here
VITE_DEEPSEEK_BASE_URL=https://api.deepseek.com
DEFAULT_CONDUCTOR_MODEL=deepseek-chat
DEFAULT_EXPERT_MODEL=deepseek-chat
```

4. **启动开发服务器**
```bash
pnpm dev
```

访问 `http://localhost:5173` 开始使用！

---

## 🏗️ 技术架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                         用户界面层                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────┐│
│  │ 对话窗口    │  │Agent选择   │  │ 会话管理    │  │ 设置   ││
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
│  │  │逆向工程师 │   │ 优化师    │   │基础工程师 │       │   │
│  │  └──────────┘   └──────────┘   └──────────┘        │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ LLMService   │  │StorageService│  │AgentManager │     │
│  │   大模型调用  │    │ 数据持久化   │   │ Agent生命周期  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└───────────────────────────────────────────────────────────┘
                            │ TypeScript + Node.js
┌───────────────────────────▼─────────────────────────────────┐
│                       Agent 矩阵                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            agent_matrix/ 提示词模板库                 │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐│   │
│  │  │X0系列   │  │X1系列   │  │X4系列   │  │自定义   ││   │
│  │  │逆向分析  │  │基础设计  │  │场景设计  │  │Agent   ││   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘│   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────┘
```

### 核心组件

#### 1. 用户界面层
- **ChatWindow**: 主对话界面，支持流式响应
- **ChatSidebar**: 会话管理和批量操作
- **MessageItem**: 消息显示组件
- **InputBox**: 智能输入框
- **ConfigPanel**: 系统配置管理
- **CustomProviderManager**: 自定义提供商管理

#### 2. 核心服务层
- **RouterService**: 智能路由服务，根据意图调度Agent
- **ConductorAgent**: 前导Agent，负责意图识别和路由决策
- **专家Agent**: X0-X4系列专业Agent + 自定义Agent
- **LLMService**: 统一大模型调用接口
- **AgentManager**: Agent生命周期管理
- **PromptManager**: 提示词管理服务
- **StorageService**: 数据持久化服务

#### 3. Agent矩阵
- **X0_REVERSE**: 逆向分析工程师 - 分析现有提示词框架
- **X0_OPTIMIZER**: 提示词优化师 - 系统性优化提示词
- **X1_BASIC**: 基础工程师 - 通用Agent设计（ATOM框架）
- **X4_SCENARIO**: 场景工程师 - 场景化Agent设计
- **CUSTOM**: 自定义Agent - 用户自定义提示词工程师
- **AgentIndicator**: Agent类型指示器组件

---

## 🛠️ 开发指南

### 开发环境

- **Node.js**: ≥18.0.0
- **pnpm**: ≥10.6.1
- **编辑器**: VS Code（推荐）+ Vue/TypeScript插件
- **Git**: 最新版本

### 项目结构

```
prompt_design/
├── packages/                    # 核心代码包
│   ├── core/                   # 核心服务层
│   │   ├── src/agents/         # Agent实现
│   │   ├── src/services/       # 服务层
│   │   ├── src/types/          # 类型定义
│   │   └── dist/               # 构建输出
│   ├── ui/                     # UI组件库
│   │   ├── src/components/     # Vue组件
│   │   ├── src/composables/    # 组合式函数
│   │   ├── src/types/          # UI类型
│   │   └── dist/               # 构建输出
│   └── web/                    # Web应用
│       ├── src/                # 应用源码
│       └── dist/               # 构建输出
├── agent_matrix/               # Agent矩阵模板
│   ├── X0_optimizer/           # X0优化师模板
│   ├── X0_reverse/             # X0逆向工程师模板
│   ├── X1_basic/               # X1基础工程师模板
│   ├── X4_scenario/            # X4场景工程师模板
│   └── docs/                   # 矩阵架构文档
├── docs/                       # 项目文档
├── logs/                       # 日志文件
├── test/                       # 测试文件
├── env.example                 # 环境变量模板
├── package.json                # 项目配置
└── pnpm-workspace.yaml         # Monorepo配置
```

### 常用命令

#### 核心开发命令
```bash
# 完整开发流程（推荐）
pnpm dev                 # 并行构建core → ui → 启动web开发服务器

# 单独开发
pnpm dev:core            # 开发模式构建core（监听文件变化）
pnpm dev:ui              # 开发模式构建ui（监听文件变化）
pnpm dev:web             # 启动web开发服务器

# 单独构建
pnpm build:core          # 构建核心服务层（tsup）
pnpm build:ui            # 构建UI组件库（vue-tsc + vite）
pnpm build:web           # 构建Web应用（vue-tsc + vite）
pnpm build               # 构建所有包

# 测试
pnpm test                # 运行所有包的测试
pnpm test:core           # 单独测试core包
pnpm -F @prompt-matrix/core test:watch   # 监听模式运行测试

# 清理
pnpm clean               # 清理所有构建产物和vite缓存
```

#### 代码检查
```bash
pnpm -F @prompt-matrix/ui lint     # UI组件库代码检查和修复
```

### 调试技巧

#### 启用调试模式
```bash
echo "DEBUG_MODE=true" > .env.local
```

#### 常用调试位置
```typescript
// 在关键位置添加日志
console.log('Agent选择:', forcedAgent);
console.log('可用Agent:', Array.from(routerService.agents.keys()));
console.log('路由决策:', decision);
console.log('流式输出状态:', streamingMsg.streaming);
console.log('会话历史:', chatStore.messages.value.length);
```

---

## 🎮 核心功能

### 智能对话系统

#### 功能特性
- **自动意图识别**: 系统自动分析用户输入，识别需求类型
- **智能Agent调度**: 根据意图自动选择最合适的专家Agent
- **流式响应**: 实时显示Agent思考过程和生成内容
- **上下文管理**: 维护对话历史，支持多轮交互

#### 使用方式
1. **自动模式**: 系统自动识别意图并调度Agent
2. **手动模式**: 用户可手动选择特定的Agent
3. **自定义Agent**: 支持创建和使用自定义提示词工程师

### Agent矩阵系统

#### 前导Agent（Conductor）
- **意图识别**: 判断用户需求类型
  - REVERSE_ANALYSIS: 完整提示词分析
  - OPTIMIZE: 提示词优化请求
  - SCENARIO_DESIGN: 场景化需求
  - BASIC_DESIGN: 通用设计需求
- **路由决策**: 选择最合适的专家Agent
- **上下文管理**: 维护对话历史和状态

#### 专家Agent类型

**X0_REVERSE - 逆向分析工程师**
- **专长**: 分析现有提示词框架和结构
- **适用**: 需要理解、分析、拆解复杂提示词
- **输出**: 提示词结构分析、改进建议

**X0_OPTIMIZER - 提示词优化师**  
- **专长**: 系统性优化提示词质量
- **适用**: 提升提示词效果、修正逻辑问题
- **输出**: 优化后的提示词、改进说明

**X1_BASIC - 基础工程师**
- **专长**: 通用Agent设计（ATOM框架）
- **适用**: 创建标准化的AI助手提示词
- **输出**: 结构化的基础Agent提示词

**X4_SCENARIO - 场景工程师**
- **专长**: 场景化Agent设计
- **适用**: 特定行业、角色、用途的Agent
- **输出**: 场景化定制Agent提示词

**CUSTOM - 自定义Agent**
- **特点**: 用户自定义系统提示词
- **用途**: 满足特定需求的专用Agent
- **管理**: 支持创建、编辑、删除自定义Agent

### 会话管理系统

#### 会话功能
- **多会话支持**: 支持多个独立对话会话
- **会话列表**: 侧边栏显示所有历史会话
- **会话切换**: 快速切换不同会话
- **批量操作**: 多选删除多个会话

#### 消息管理
- **单条删除**: 删除特定消息（删除用户消息时同时删除对应回复）
- **会话重命名**: 自定义会话标题
- **消息导出**: 支持Markdown格式导出和复制
- **消息重新生成**: 支持重新生成回复
- **测试模式**: 支持自由聊天模式测试提示词
- **历史搜索**: 快速查找历史内容

---

## 🔧 配置说明

### 环境变量配置

在 `.env.local` 文件中配置以下变量：

```env
# DeepSeek API配置
VITE_DEEPSEEK_API_KEY=sk-your-actual-key-here
VITE_DEEPSEEK_BASE_URL=https://api.deepseek.com

# 模型配置
DEFAULT_CONDUCTOR_MODEL=deepseek-chat
DEFAULT_EXPERT_MODEL=deepseek-chat

# 调试模式（可选）
DEBUG_MODE=true
```

### Agent自定义配置

支持创建自定义Agent：

1. **创建步骤**:
   - 点击Agent选择区域的"+"按钮
   - 填写工程师名称
   - 设置系统提示词
   - 可选：添加专业领域描述

2. **提示词设计建议**:
   - 明确定义角色和职责
   - 指定专业领域和技能
   - 设置工作流程和输出格式
   - 添加约束条件和边界

---

## 🚀 部署指南

### 生产构建

```bash
# 构建所有包
pnpm build

# 构建输出
packages/core/dist/     # 核心服务构建
packages/ui/dist/       # UI组件构建  
packages/web/dist/      # Web应用构建
```

### 本地部署

1. **构建项目**:
```bash
pnpm build
```

2. **启动服务**:
```bash
cd packages/web
# 使用任何静态文件服务器
npx serve dist
```

### Docker部署（可选）

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install -g pnpm
RUN pnpm install
RUN pnpm build
EXPOSE 5173
CMD ["pnpm", "preview"]
```

---

## 🤝 贡献指南

### 开发流程

1. **Fork项目**
2. **创建功能分支**: `git checkout -b feature/amazing-feature`
3. **提交更改**: `git commit -m 'Add amazing feature'`
4. **推送分支**: `git push origin feature/amazing-feature`
5. **创建Pull Request**

### 代码规范

- 使用TypeScript严格模式
- 遵循Vue 3组合式API最佳实践
- 添加适当的注释和文档
- 确保所有测试通过

---

## 📝 更新日志

### v0.1.0-20251005 (2025-10-05)

#### ✅ 新增功能
- **智能Agent矩阵系统**: 完整的前导Agent+专家Agent架构
- **流式响应**: 实时显示Agent思考过程
- **自定义Agent**: 支持用户创建专用提示词工程师
- **会话管理**: 多会话支持、批量操作、消息删除
- **意图识别**: 智能分析用户需求并自动路由

#### 🔧 技术特性
- **Monorepo架构**: 使用pnpm workspace管理
- **TypeScript**: 完整的类型安全
- **Vue 3 + Naive UI**: 现代化前端技术栈
- **模块化设计**: 核心服务与UI分离
- **流式响应**: 实时显示AI思考过程
- **多模型支持**: 支持DeepSeek、OpenAI等主流模型

#### 🎯 核心Agent
- **ConductorAgent**: 意图识别与路由调度
- **X0_REVERSE**: 逆向分析工程师
- **X0_OPTIMIZER**: 提示词优化师  
- **X1_BASIC**: 基础工程师
- **X4_SCENARIO**: 场景工程师
- **CustomAgent**: 自定义Agent支持
- **AgentIndicator**: Agent类型指示器

---

## 📄 许可证

Apache License 2.0

---

## 🆘 支持与反馈

如果您在使用过程中遇到问题或有改进建议，请：

1. **查看文档**: 首先查看本README和相关技术文档
2. **搜索Issues**: 查看是否有类似问题已被讨论
3. **创建Issue**: 详细描述问题，包含复现步骤
4. **功能建议**: 欢迎提出新功能想法和改进建议

---

## 🌟 致谢

感谢所有为这个项目做出贡献的开发者和用户！

**让AI Agent的提示词设计更智能、更专业、更高效！** 🚀