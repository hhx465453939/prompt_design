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

详细问题列表请查看 [ISSUES_20251005.md](ISSUES_20251005.md)

### 高优先级问题（v0.2.0修复）

#### 问题1：聊天输出缺少终止按钮
- **影响**：用户无法主动停止AI输出
- **相关文件**：`packages/ui/src/components/MessageItem.vue`、`packages/web/src/AppContent.vue`
- **修复方向**：添加停止按钮，实现流式请求取消机制，在LLMService中添加abortController支持

#### 问题2：测试模式功能失效
- **影响**：自由聊天模式仍然触发Agent路由
- **相关文件**：`packages/ui/src/components/ChatWindow.vue`、`packages/web/src/AppContent.vue`
- **修复方向**：修改handleFreeChat方法，确保直接调用LLM而不经过路由系统

#### 问题3：聊天记录删除功能不完整
- **影响**：无法单独删除，刷新后已删除记录重新出现
- **相关文件**：`packages/ui/src/components/ChatSidebar.vue`、`packages/ui/src/composables/useChatHistory.ts`
- **修复方向**：修复删除逻辑，确保删除后不会自动创建新会话，改进本地存储同步机制

### 中优先级问题（v0.2.0修复）

#### 问题4：流式输出响应式更新问题
- **影响**：内容更新不及时或卡顿
- **相关文件**：`packages/web/src/AppContent.vue`
- **修复方向**：使用Vue响应式系统，优化流式更新性能，添加防抖机制

#### 问题5：自定义Agent注册问题
- **影响**：自定义Agent注册和路由存在时序问题
- **相关文件**：`packages/core/src/services/router/service.ts`、`packages/web/src/AppContent.vue`
- **修复方向**：确保Agent注册时序正确，添加注册状态验证，改进错误处理

#### 问题8：逆向工程师功能不完整
- **影响**：无法输出生成者工程师的完整提示词
- **相关文件**：`agent_matrix/X0_reverse/reverse_engineer.md`
- **修复方向**：增加"生成者工程师提示词"输出，基于分析结果重构完整工程师提示词

#### 问题9：agent_matrix sources文件未被路由使用
- **影响**：系统使用硬编码默认提示词，忽略sources文件
- **相关文件**：`packages/core/src/utils/agent-loader.ts`
- **修复方向**：启用文件系统访问，实现热重载机制，添加用户自由选择source工程师角色的功能

#### 问题10：默认工程师角色编辑功能缺失
- **影响**：无法通过WebUI编辑系统内置角色
- **相关文件**：`packages/ui/src/components/AgentSelector.vue`、`packages/web/src/AppContent.vue`
- **修复方向**：实现默认角色编辑功能，添加编辑对话框，支持保存和重置

### 低优先级问题（v0.3.0+修复）

#### 问题6：错误处理不够完善
- **修复方向**：统一错误处理机制，添加详细错误信息，提供错误恢复建议

#### 问题7：性能优化空间
- **影响**：大量消息时存在性能问题
- **修复方向**：实现虚拟滚动，优化消息渲染，添加分页加载

### 技术债务（v1.0.0+修复）

#### 问题11：代码结构优化
- **修复方向**：重构组件结构，提取公共逻辑，改进类型定义

#### 问题12：测试覆盖不足
- **修复方向**：添加组件测试、服务层测试、E2E测试

### 调试技巧
- 在`.env.local`中设置`DEBUG_MODE=true`启用详细日志
- 使用VS Code调试配置可以调试核心服务
- 查看控制台输出了解Agent执行流程
- 参考 [ISSUES_20251005.md](ISSUES_20251005.md) 了解详细的问题分析和修复建议

### 常见错误
- Agent加载失败：检查`agent_matrix/`目录结构
- API调用失败：验证`.env.local`中的API密钥
- 类型错误：运行`pnpm build:core`重新生成类型定义
- 构建失败：确保所有依赖已安装（`pnpm install`）
- 测试失败：检查test目录下的测试报告文件
- sources文件未生效：当前系统禁用了文件系统访问，使用硬编码默认提示词（问题9）