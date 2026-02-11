# UI Flow & PRD Alignment Debug Log

## 元信息
- 模块名称: ui-flow
- 创建时间: 2026-02-11
- 最后更新: 2026-02-11
- 相关文件:
  - docs/PRD_PROMPT_ENGINEERING_MATRIX.md
  - README.md
  - packages/ui/src/types/index.ts
  - packages/ui/src/composables/useFlowRunner.ts
  - packages/ui/src/components/FlowTimeline.vue
  - packages/ui/src/components/FlowStepCard.vue
  - packages/web/src/AppContent.vue
  - packages/core/src/services/router/service.ts

## 运行上下文与测试规则
- 运行环境: 本机 Windows
- SSH 方式: N/A
- 远程项目路径: N/A
- 验证/Checkfix 执行方式:
  - 从仓库根目录运行前端脚本（pnpm workspace）
  - 主要命令：
    - pnpm -C packages/ui lint
    - pnpm -C packages/web lint
    - pnpm build

## 上下文关系网络（概要）
- 前端 Flow 模型与状态机:
  - `FlowStep` / `FlowTemplate` 类型定义于 `@prompt-matrix/ui`；
  - `useFlowRunner` 在 UI 层维护模板列表与步骤运行状态。
- Flow 视图:
  - `FlowTimeline` 展示模板选择 + 步骤列表 + “运行 Flow” 按钮；
  - `FlowStepCard` 展示每一步的标题、Agent、状态与输出预览。
- Web 应用集成:
  - `AppContent.vue` 在 ChatWindow 上方集成 Flow 面板；
  - `runCurrentFlow()` 使用 `RouterService.handleRequestStream` 串行执行各步，并通过 `metadata.forcedAgent` 强制路由到对应 Agent。
- Core 路由:
  - `RouterService` 已支持流式接口与强制 Agent 路由，是前端 Flow 的单步执行后端能力。

## Debug 历史

### [2026-02-11] PRD 对齐与 Flow MVP 落地
- 问题描述  
  - PRD 中规划了“由前端 Flow 轻量编排多 Agent 联动”的能力，但仓库中此前仅有聊天 UI 与路由服务，缺少可视化 Flow 模型与执行路径；
  - 需要对照 `docs/PRD_PROMPT_ENGINEERING_MATRIX.md`，梳理“已实现 vs 未实现”，并补上最小可用的 Flow 实现。

- 根因定位  
  - Flow 相关内容在 PRD 与 README 中属于“未来规划”，尚未有对应的 UI 组件与状态机实现；
  - Core 层已经具备 `handleRequestStream` 和 `forcedAgent` 能力，但前端没有编排层去消费。

- 解决方案（本轮改动要点）  
  1. 在 `@prompt-matrix/ui` 中补齐 Flow 数据模型与状态机：
     - 新增 `FlowStep` / `FlowTemplate` 类型；
     - 新增 `useFlowRunner` 管理模板与运行时状态，并内置两条典型 Flow 模板（编程助手 / 提示词优化流水线）。
  2. 在 UI 层实现 Flow 视图组件：
     - 新增 `FlowStepCard` 与 `FlowTimeline`，用于展示步骤状态和绑定“运行 Flow”操作；
     - 将上述能力从 `@prompt-matrix/ui` 导出供 Web 应用使用。
  3. 在 Web 主视图中集成 Flow：
     - 在 `AppContent.vue` 中加入 FlowTimeline 区域（位于 ChatWindow 上方）；
     - 使用 `useFlowRunner()` 作为前端 Flow 状态机；
     - 实现 `runCurrentFlow()`：按步骤顺序调用 `RouterService.handleRequestStream`，基于 `inputSource` 组装输入，并用 `forcedAgent` 精确控制每一步的 Agent。
  4. 在 PRD 中新增「7. 实现进度与 PRD 对齐快照」：
     - 标记哪些能力已经基本满足（Core Agent / 路由 / Flow 数据模型与视图 / 串行执行）；
     - 哪些存在轻微偏差（Flow store 落点、执行逻辑所在层次、Flow 与会话的绑定粒度）；
     - 哪些尚未实现（助手模板库、单步重试按钮、Quickstart 文档等）。

- Checkfix 检查结果  
  - `pnpm -C packages/ui lint` 失败：
    - 原因：缺少 `vue-eslint-parser`，为现有 ESLint 配置的环境依赖问题，而非本轮改动引入的语法错误。
  - `pnpm -C packages/web lint` 失败：
    - 原因同上（缺少 `vue-eslint-parser`）。
  - `pnpm build` 通过：
    - `core/ui/web` 三个包均成功构建；
    - 仅保留原有体积/外部化类警告。

- 影响评估  
  - 正向影响：
    - 多 Agent 联动从“概念与文档”升级为“前端可视 Flow + 实际串行执行”；
    - 与 PRD 中“前端主导编排、后端只提供单步执行接口”的架构决策基本一致。
  - 风险与待办：
    - Flow 状态当前是全局的，尚未按 Session 维度隔离；
    - 未实现单步重试 / 助手模板库 / Quickstart 文档等扩展能力；
    - ESLint 环境依赖需要后续补齐 `vue-eslint-parser` 才能恢复完整 lint 闭环。

## 待追踪问题
- [ ] Flow 状态与会话绑定（每个 Session 有独立的 Flow 视图与运行历史）
- [ ] 为每个步骤提供“重试本步”能力，并在 UI 中暴露
- [ ] 助手模板库（AssistantTemplate）的创建、持久化与管理 UI
- [ ] 为 Prompt Flow 编写零基础 QUICKSTART 文档，并在 README/Docs 中挂接入口
- [ ] 修复 ESLint 环境依赖问题（补齐 `vue-eslint-parser`）以恢复完整 Checkfix

