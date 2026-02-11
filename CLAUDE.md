# CLAUDE.md — Prompt Engineer Matrix 开发指南

智能提示词工程师系统 - 基于 Agent 矩阵架构的智能提示词生成、优化和管理平台。

## 项目概述

- **架构**: Monorepo (pnpm workspace)
- **技术栈**: TypeScript 5.8 + Vue 3.5 + Naive UI + Vite 6
- **包结构**:
  - `@prompt-matrix/core` - 核心业务逻辑（Agent、LLM服务、路由）
  - `@prompt-matrix/ui` - Vue 组件库
  - `@prompt-matrix/web` - Web 应用

## 可用 Skill 命令

| 命令 | 用途 |
|------|------|
| `/ai-spec` | 自然语言需求 → 精确技术规范转换 |
| `/api-first` | API-First 模块化开发框架 |
| `/debug` | 上下文优先的代码调试（维护 `.debug/` 记录） |
| `/debug-ui` | 前端 UI 调试专家 |
| `/prd` | 生成结构化 PRD 文档 |
| `/ralph` | PRD 驱动的自主开发循环 |
| `/ralph-yolo` | Ralph 完全自主模式 |
| `/zcf:feat` | 新功能开发流程 |
| `/zcf:git-commit` | Git 分析 + Conventional Commit |
| `/zcf:init-project` | 初始化项目 AI 上下文 |

## 核心开发规则

### 1. API-First 开发模式
所有前后端工作遵循三层分离（Frontend / BFF / Backend API packages）。后端功能必须完成五步循环：
`Implement → Checkfix → Encapsulate → Expose API → Document API`

### 2. 层级调试原则
修复 Bug 前，必须先确定 Bug 所在层级（backend / frontend / BFF / contract mismatch）。禁止跨层绕过。

### 3. 跨层任务分解
跨越多层的需求必须按 API 边界拆分为有序子任务：
`backend first → API docs → frontend consumption → integration verification`

### 4. Git 提交规范
- 用户未主动要求时，不自动执行 git 操作
- 提交信息遵循 Conventional Commits 规范
- 使用 `/zcf:git-commit` 自动生成提交信息

## 开发命令

```bash
# 开发
pnpm dev           # 构建所有包并启动 web 开发服务器

# 构建
pnpm build         # 构建所有包
pnpm build:core    # 仅构建 core 包
pnpm build:ui      # 仅构建 ui 包
pnpm build:web     # 仅构建 web 包

# 代码检查
pnpm lint          # 运行 ESLint 检查
pnpm lint:fix      # ESLint 自动修复

# 测试
pnpm test          # 运行测试
pnpm test:core     # 测试 core 包
```

## 环境配置

复制 `env.example` 为 `.env.local` 并填入真实的 API 密钥：

```bash
cp env.example .env.local
```

关键配置项：
- `VITE_DEEPSEEK_API_KEY` - API 密钥
- `VITE_DEEPSEEK_BASE_URL` - API 端点（如硅基流动: `https://api.siliconflow.cn`）
- `DEFAULT_CONDUCTOR_MODEL` - 前导 Agent 模型
- `DEFAULT_EXPERT_MODEL` - 专家 Agent 模型

## 已知问题追踪

详细问题列表见 `docs/ISSUES_20251005.md`。

### 高优先级（需立即修复）
1. 聊天输出缺少终止按钮
2. 测试模式功能失效
3. 聊天记录删除功能不完整

### 中优先级（近期修复）
4. 流式输出响应式更新问题
5. 自定义 Agent 注册问题
6. 逆向工程师功能不完整
7. agent_matrix sources 文件未被路由使用
8. 默认工程师角色编辑功能缺失

## 配置文件

- Claude 设置: `.claude/settings.local.json`
- Ralph 循环配置: `.claude/ralph-config.json`
- PRD 模板: `.claude/templates/prd.json.example`
