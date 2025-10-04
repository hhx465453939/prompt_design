# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于Agent矩阵架构的智能提示词生成、优化和管理平台。项目通过前导Agent（Conductor）智能调度专家Agent（X0-X4），实现提示词的全生命周期管理。

## 常用命令

### 开发命令
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
pnpm test:core           # 单独测试core包 (node test-core.mjs)
pnpm -F @prompt-matrix/core test   # 使用vitest运行core包测试
pnpm -F @prompt-matrix/core test:watch   # 监听模式运行测试
pnpm -F @prompt-matrix/core test:coverage # 测试覆盖率报告

# 清理
pnpm clean               # 清理所有构建产物和vite缓存
pnpm clean:dist          # 清理packages/*/dist目录
pnpm clean:vite          # 清理packages/*/node_modules/.vite目录

# 代码检查
pnpm -F @prompt-matrix/ui lint     # UI组件库代码检查和修复
```

### 调试
```bash
# 启用调试模式
echo "DEBUG_MODE=true" > .env.local

# 运行单个测试文件
pnpm -F @prompt-matrix/core test src/services/router/service.test.ts

# 测试特定功能
node test-core.mjs       # 直接运行core包集成测试
```

## 项目架构

### Monorepo结构
- `packages/core/` - 核心服务层，包含Agent矩阵和路由服务
- `packages/ui/` - Vue组件库
- `packages/web/` - Web应用界面
- `agent_matrix/` - Agent提示词模板和配置

### 核心组件

#### 前导Agent（ConductorAgent）
- 意图识别和路由决策
- 智能调度专家Agent（X0-X4）
- 位置：`packages/core/src/agents/conductor.ts`

#### 专家Agent类型
- **X0逆向**：分析现有提示词框架
- **X0优化**：系统性优化提示词
- **X1基础**：通用Agent设计（ATOM框架）
- **X4场景**：场景化Agent设计

#### 核心服务
- `LLMService`：统一大模型调用接口（DeepSeek）
- `RouterService`：智能路由服务
- `AgentManager`：Agent生命周期管理
- `PromptManager`：提示词CRUD管理
- `StorageService`：数据存储服务
- `CustomProviderManager`：自定义LLM提供商管理

### Agent矩阵配置
Agent模板存储在`agent_matrix/`目录：
- `agent_matrix/X0_reverse/` - 逆向分析工程师
- `agent_matrix/X0_optimizer/sources/` - 优化师提示词
- `agent_matrix/X1_basic/sources/` - 基础工程师提示词
- `agent_matrix/X4_scenario/sources/` - 场景工程师提示词
- `agent_matrix/docs/` - 架构设计和变体目录
- `agent_matrix/examples/` - 使用示例

## 开发流程

### 1. 环境配置
```bash
# 复制配置模板
cp env.example .env.local

# 编辑配置，添加DeepSeek API Key
VITE_DEEPSEEK_API_KEY=sk-your-actual-key-here
VITE_DEEPSEEK_BASE_URL=https://api.deepseek.com
DEFAULT_CONDUCTOR_MODEL=deepseek-chat
DEFAULT_EXPERT_MODEL=deepseek-chat
```

### 2. 开发新功能
1. 在相应的包中开发功能
2. 运行测试确保功能正常
3. 更新相关文档

### 3. 添加新Agent
1. 在`agent_matrix/`下创建新目录
2. 添加`sources/`和`experts.md`
3. 更新`packages/core/src/utils/agent-loader.ts`

## 技术栈

### 核心技术
- **TypeScript 5.8+**：类型安全
- **Node.js 18+**：运行环境
- **pnpm 10.6+**：包管理（workspace）
- **OpenAI SDK 4.83+**：大模型调用
- **Vitest 3.0+**：单元测试框架
- **tsup 8.0+**：TypeScript构建工具

### 前端技术
- **Vue 3.5+**：UI框架
- **Vite 6.x**：构建工具
- **Naive UI 2.40+**：组件库
- **TypeScript 5.8+**：类型支持
- **vue-tsc 2.2+**：Vue类型检查
- **@vicons/ionicons5**：图标库
- **highlight.js**：代码高亮
- **marked**：Markdown解析

## 重要提醒

### 安全规范
- API密钥存储在环境变量中，不提交到代码库
- 严格遵循安全边界和价值观红线
- 不在日志中输出敏感信息

### 代码规范
- 使用TypeScript严格模式
- 遵循Conventional Commits规范
- 函数需要显式返回类型注解
- 使用interface定义对象类型，type定义联合类型

### 测试
- 核心服务需要单元测试覆盖
- 使用Vitest进行测试
- 确保所有测试通过再提交代码

### 构建部署
- 使用`pnpm build`构建所有包
- 确保TypeScript编译无错误
- 前端构建需要运行`vue-tsc`类型检查

## 已知问题

### 调试技巧
- 在`.env.local`中设置`DEBUG_MODE=true`启用详细日志
- 使用VS Code调试配置可以调试核心服务
- 查看控制台输出了解Agent执行流程

### 常见错误
- Agent加载失败：检查`agent_matrix/`目录结构
- API调用失败：验证`.env.local`中的API密钥
- 类型错误：运行`pnpm build:core`重新生成类型定义
- 构建失败：确保所有依赖已安装（`pnpm install`）
- 测试失败：检查test目录下的测试报告文件