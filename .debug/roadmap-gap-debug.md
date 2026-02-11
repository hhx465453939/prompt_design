# 路线图差异 Debug 记录

## 元信息
- 模块名称: roadmap-gap
- 创建时间: 2026-02-12 01:12 +08:00
- 最后更新: 2026-02-12 01:12 +08:00
- 相关文件:
  - README.md
  - docs/PRD_PROMPT_ENGINEERING_MATRIX.md
  - docs/ISSUES_20251005.md
  - packages/web/src/AppContent.vue
  - packages/ui/src/components/MessageItem.vue
  - packages/ui/src/components/ChatWindow.vue
  - packages/ui/src/components/FlowTimeline.vue
  - packages/ui/src/components/FlowStepCard.vue
  - packages/ui/src/composables/useFlowRunner.ts
  - packages/core/src/services/llm/service.ts
  - packages/core/src/services/router/service.ts
  - packages/core/src/utils/agent-loader.ts

## 运行上下文与测试规则
- 运行环境: 本机 Windows
- SSH 方式（若远程）: N/A
- 远程项目路径（若远程）: N/A
- 验证/Checkfix 执行方式: 仓库根目录执行 npm 脚本（内部委托 pnpm workspace）

## 上下文关系网络
- 文档输入源:
  - `README.md`（发布叙事 + 阶段路线图）
  - `docs/PRD_PROMPT_ENGINEERING_MATRIX.md`（MVP 目标 + ADR + UX Radar + 阶段任务）
  - `docs/ISSUES_20251005.md`（问题 1-12）
- 关键调用链:
  - UI 入口: `packages/web/src/AppContent.vue`
  - 流式能力: `RouterService.handleRequestStream` -> `X*Agent.executeStream` -> `LLMService.chatStream`
  - Flow 编排: `useFlowRunner` + `FlowTimeline` + `FlowStepCard` + `runCurrentFlow`
  - Agent 模板加载: `agent-loader`（当前单例配置）

## Debug 历史
### [2026-02-12 01:12] README + PRD + ISSUES 与现状代码对齐审计
- 问题描述:
  - 需要把三份文档中的规划/问题项，与当前代码逐条比对，输出“仍未实现”任务清单，供后续迭代。
- 根因定位:
  - 文档路线图与代码迭代存在时间差；部分问题已修复，但仍有高优先级能力未落地，且 README 阶段状态与现状不一致。
- 解决方案:
  - 建立跨文档差异清单（本文件），按优先级整理未实现与部分实现项，并附代码证据与下一步建议。
- 验证结果:
  - 通过代码静态核对完成差异归档；Checkfix 结果见下节。
- 影响评估:
  - 该清单可直接作为下一轮迭代 backlog 输入，减少重复探索成本。

## 未实现/部分实现任务清单（未来迭代上下文）
### P0（高优先级）
- [ ] 流式输出“停止生成”与真实中断机制（ISSUE#1 / PRD 6.1）
  - 证据: `packages/ui/src/components/MessageItem.vue` 未提供停止按钮；`packages/core/src/services/llm/service.ts` `chatStream` 无 `AbortController`/取消入口。
  - 下一步: 在 UI 暴露 stop 事件 + 在 LLM 层引入可取消流，并贯通到 `AppContent.vue`。

- [ ] `agent_matrix/sources` 路由启用（ISSUE#9）
  - 证据: `packages/core/src/utils/agent-loader.ts` 单例仍为 `new AgentLoader(undefined)`，文件系统加载被禁用。
  - 下一步: 增加可控开关（env/config），启用 Node 侧 sources 加载，并补热重载策略。

- [ ] 默认系统工程师角色编辑（ISSUE#10）
  - 证据: `packages/ui/src/components/ChatWindow.vue` 仅支持自定义 Agent 新建，无系统 Agent 查看/编辑/回滚入口。
  - 下一步: 先做只读查看（v1），再做编辑 + reset（v2）。

### P1（中优先级）
- [ ] Flow 单步重试（PRD 5.2-B）
  - 证据: `packages/ui/src/components/FlowStepCard.vue` 无重试控件；`packages/web/src/AppContent.vue` 仅支持整条 `runCurrentFlow`。
  - 下一步: 增加 `retry-step` 事件与“从失败步继续”执行分支。

- [ ] 助手模板库 AssistantTemplate（PRD 3.2 / 5.2-C）
  - 证据: 现有仅 Flow 运行态与结果展示，未见“保存为模板/模板列表/复制”实现。
  - 下一步: 定义模板存储模型 + UI 列表 + 本地持久化。

- [ ] 内置 Flow 模板 >= 3（PRD 5.2-C）
  - 证据: `packages/ui/src/composables/useFlowRunner.ts` 仅两条模板（编程助手、提示词优化流水线）。
  - 下一步: 增加第三条模板（自定义场景入口或 Conductor+X4 两步模板）。

- [ ] 自由聊天模式边界可视化（PRD 6.1/6.5，ISSUE#2 残留）
  - 证据: `packages/web/src/AppContent.vue` `handleFreeChat` 仍写入 `agentType: 'CONDUCTOR'`，UI 语义上仍可能混淆模式来源。
  - 下一步: 自由模式消息去除系统 Agent 标签，顶部增加模式状态与路由解释。

- [ ] 单步接口标准化返回 `{ ok, data, error }`（PRD 4.1 / 5.2-B）
  - 证据: `packages/core/src/services/router/service.ts` 目前返回 `AgentResponse` 或直接 throw。
  - 下一步: 在 core 层新增 executeStep 风格包装，统一错误码与可读错误信息。

- [ ] Agent 来源可视化与切换（PRD 6.4）
  - 证据: 当前设置页未展示“当前 Agent 源: 硬编码/sources/自定义”，也无 sources 变体选择入口。
  - 下一步: 在 Config/Agent 管理区增加 source 面板与会话级切换。

### P2（后续优化）
- [ ] 流式响应性能优化（ISSUE#4）
  - 证据: `packages/web/src/AppContent.vue` 流式更新仍通过 `messages = [...messages]` 强制触发响应。
  - 下一步: 替换为更细粒度响应式更新，必要时节流。

- [ ] AUTO MODE UI 暴露与解释（PRD 6.5）
  - 证据: 现有界面无“自动模式开关/路由解释器/决策可视化”。
  - 下一步: 增加顶部路由解释条与 settings 开关。

- [ ] 长会话性能治理（ISSUE#7）
  - 证据: `packages/ui/src/components/ChatWindow.vue` 全量 `TransitionGroup` 渲染，无虚拟滚动。
  - 下一步: 引入虚拟列表或分段渲染策略。

- [ ] 测试覆盖补齐（ISSUE#12 / PRD 4.3）
  - 证据: 当前仓库缺少 web/ui 的 Flow 单测与集成测试落地文件。
  - 下一步: 先补 `useFlowRunner` 状态迁移单测，再补 web 侧 3-step Flow 集测。

- [ ] 结构重构与职责收敛（ISSUE#11）
  - 证据: `AppContent.vue` 负担了路由、流式、Flow 编排、会话操作多职责。
  - 下一步: 拆分 flow executor / chat executor / session actions 到 composables。

## 已对齐或基本完成（用于避免重复开发）
- [x] 聊天记录删除一致性（ISSUE#3）已有修复：`useChatHistory` 与 `ChatSidebar` 删除链路已重构。
- [x] Flow MVP（PRD 阶段 A/B）已落地：`FlowTimeline` + `FlowStepCard` + `useFlowRunner` + `runCurrentFlow`。
- [~] ISSUE#8（逆向工程师生成者提示词）在提示词模板层已体现双路输出要求，仍需实测验收输出质量。

## Checkfix 结果
- `npm run lint`: 失败
  - 原因: 项目当前 lint 环境缺少 `vue-eslint-parser`（历史环境问题，非本次文档改动引入）。
- `npm run build`: 通过
  - `core/ui/web` 均可构建通过。

## 待追踪问题
- [ ] 建立“文档状态自动校验”机制（README 阶段表与真实实现保持同步）
- [ ] 将本清单拆分成可执行 issue（按 P0/P1/P2 打标签）

