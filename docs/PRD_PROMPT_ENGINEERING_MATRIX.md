# 智能提示词工程师矩阵：技术规范与 PRD（MVP）

> 基于 Agent 矩阵架构（X0/X1/X4 + Conductor）的智能提示词生成、优化与管理平台  
> 本文兼作产品需求文档（PRD）与高层技术规范，面向产品/架构/一线开发与 AI 编程助手。

---

## 1. 需求审计总结

### 1.1 背景

- 大模型时代，提示词质量直接决定输出质量，但目前：
  - 多数用户依赖个人经验“手写提示词”，难以复用和迁移；
  - 多 Agent 协作（分析 → 重构 → 优化）往往停留在“脑中流程”，缺少工程化表达；
  - 工具普遍停留在“单轮聊天 UI”，缺少对提示词生命周期的系统支持。
- 本项目已有：
  - **Agent 矩阵**：Conductor + X0/X1/X4 专家工程师；
  - **后端服务层**：`packages/core` 中的 LLMService / RouterService / Agents；
  - **前端 UI 能力基础**：`packages/ui` + `packages/web`。
- 现阶段缺口：需要一套**轻量、优雅、前端主导编排的产品形态**，让普通用户也能以「配置 + 可视 Flow」的方式使用这套系统。

### 1.2 目标用户

- **U1 开发者 / 独立制作者**
  - 频繁用 ChatGPT / Claude / Cursor 写代码，希望有稳定、专业的「编程助手提示词」「代码评审提示词」等。
- **U2 Prompt 工程师 / AI 能力 Owner**
  - 负责团队 Agent 提示词设计与维护，需要标准化、可追踪、可复用。
- **U3 产品/运营等非工程角色**
  - 希望快速搭好“写作助手、分析助手、客服助手”等角色，而无需深入理解提示词工程细节。

### 1.3 目标与约束

- **业务目标（MVP）**
  - G1：3 步内完成“设计一个专业助手提示词”（如编程助手、数据分析师）。
  - G2：在前端以**线性的流程视图**呈现多 Agent 联动（逆向 → 标准化 → 优化）。
  - G3：支持将优秀提示词沉淀为「助手模板」，可搜索、复用与导出。
- **非功能目标**
  - 轻量：前端仅使用 Vue 3 + TypeScript + 组合式 API + 现有 UI 组件；
  - 优雅：多 Agent 联动逻辑以**清晰的前端数据模型与状态机**表达，后端保持“单步执行接口”。
- **约束与外部依赖**
  - 使用 DeepSeek（或兼容）API，保证与现有 `.env.local` / `ENV_CONFIGURATION.md` 一致；
  - 复用现有 Monorepo 结构与构建命令（`pnpm dev / build / test`）。

---

## 2. 架构决策记录（ADR）

### 2.1 技术栈选择

- **前端**
  - Vue 3 + TypeScript + Vite（已在 `packages/web`/`packages/ui` 中落地）；
  - 通过组合式 API + 状态管理（Pinia/自定义 store）实现 Flow 状态机与会话管理；
  - 使用已有组件（ChatWindow / Sidebar / ConfigPanel 等）扩展出 Flow 视图与编排面板。
- **后端 / 核心服务**
  - 继续使用 `packages/core` 中的：
    - `RouterService`：负责单次调用的 Agent 路由决策；
    - `ConductorAgent` + 各 X0/X1/X4 Agent 实现；
    - LLMService（对接 DeepSeek / OpenAI 等）。
  - 新需求中，多 Agent 联动**由前端驱动**，后端仅暴露“执行一步”的接口。

### 2.2 联动策略（关键决策）

- **决策 D1：Agent 联动主导权归前端**
  - 方案 A：在后端实现完整 Workflow 引擎（DSL + 状态机），前端只负责展示。
  - 方案 B：在前端用 TypeScript 数据结构和状态机描述 Flow，后端只做单步推理。
  - **采纳方案 B**：
    - 原因：
      - 更贴合当前 Web 工程形态，迭代快、可视化更自然；
      - 有利于“流程模板”直接在前端导出和管理；
      - 减少对 core 层的侵入，控制风险；
    - 影响：
      - 前端需要承担简单但明确的状态机职责；
      - 后端只需保证对单步调用的幂等性和参数兼容性。

- **决策 D2：Flow 模型保持线性（MVP）**
  - 不引入复杂的条件分支/循环，MVP 仅支持线性步骤序列（Step1 → Step2 → Step3）。
  - 为后续扩展预留字段（如 `condition`），但暂不在 UI 中暴露。

---

## 3. 系统设计（目录结构、数据模型、流程）

### 3.1 目录与模块边界（基于现有结构增量）

- `packages/core`
  - `src/agents/`：已存在的 Conductor/X0/X1/X4 实现，必要时增加对新的 `agentType` 支持；
  - `src/services/router/`：
    - 保持“单步调用”视角，例如 `execute(agentType, payload, options)`；
    - 允许前端传入 Flow 中的“上一步输出摘要/全文”作为上下文；
  - （MVP 不新增复杂模块，仅小幅扩展类型/选项。）

- `packages/ui`
  - `src/components/`
    - 新增：`FlowTimeline`（多步骤执行视图组件）；
    - 新增：`FlowStepCard`（单步执行卡片，含状态与内容展示）；
  - `src/composables/`
    - 新增：`useFlowRunner`（前端 Flow 状态机与执行逻辑）。

- `packages/web`
  - `src/views/PromptMatrixView.vue`（或在现有主视图中增加 Flow 区域）；
  - `src/stores/flowStore.ts`（或在现有 `chatStore` 中扩展 Flow 相关字段）。

### 3.2 核心数据模型（前端）

> 以下为逻辑模型，具体字段可以在实现阶段适度调整。

- `AgentType`
  - `'CONDUCTOR' | 'X0_REVERSE' | 'X0_OPTIMIZER' | 'X1_BASIC' | 'X4_SCENARIO' | 'CUSTOM'`

- `FlowStep`
  - `id: string` – 步骤唯一标识；
  - `title: string` – 显示标题，如「X0 逆向分析」；
  - `agentType: AgentType` – 执行的 Agent 类型；
  - `inputSource: 'user' | 'previousStep' | 'custom'` – 输入来源；
  - `customInput?: string` – 当 `inputSource` 为 `'custom'` 时的附加说明；
  - `systemPromptHints?: string` – 对本步系统提示词的补充要求（例如“产出 ATOM 结构”）；
  - `status: 'idle' | 'running' | 'success' | 'error'`；
  - `outputSummary?: string` – 本步输出摘要（用于折叠视图）；
  - `outputFull?: string` – 本步完整输出（用于展开查看/复制）；
  - `errorMessage?: string` – 错误信息。

- `FlowTemplate`
  - `id: string`；
  - `name: string`；
  - `description?: string`；
  - `steps: FlowStep[]`（去掉运行时状态字段，只存结构和默认配置）。

- `AssistantTemplate`（Y 层提示词资产）
  - `id: string`；
  - `name: string`；
  - `tags: string[]`（如 `['code', 'python', 'review']`）；
  - `prompt: string`（完整系统提示词）；
  - `usageNotes?: string`（推荐使用方式、适用模型等）。

### 3.3 关键用户流程

#### 3.3.1 US1：设计一个编程助手提示词

1. 用户在主界面选择“创建新助手 → 编程助手”；
2. 系统选择默认 Flow 模板，例如单步 `X4_SCENARIO` 或两步「Conductor → X4_SCENARIO」；
3. 用户在右侧配置：
   - 编程语言/框架（Python / TypeScript / 全栈等）；
   - 风格（严谨 / 教学向 / 代码优先等）；
   - 约束（安全边界、不得编造 API、必须给出逐步解释等）；
4. 点击“运行流程”：
   - 前端调用 backend 单步接口；
   - 在中间 Flow 视图中展示执行状态和结果；
5. 用户对生成的系统提示词满意后：
   - 点击“保存为助手模板”，输入名称与标签；
   - 提示该助手已加入「我的助手库」。

#### 3.3.2 US2：优化现有提示词（多 Agent 联动）

1. 用户选择“优化现有提示词”入口；
2. 粘贴已有提示词内容；
3. 选择内置流程模板：
   - Step1: X0_REVERSE – 逆向分析现有提示词结构；
   - Step2: X1_BASIC – 基于分析结果输出标准化 ATOM 提示词；
   - Step3: X0_OPTIMIZER – 对 ATOM 提示词做系统性优化，产出对比说明；
4. 点击运行：
   - Flow 线性执行，每步完成后更新视图与状态；
   - 错误时停在对应步骤，允许单步重试；
5. 用户在 Step3 结果中：
   - 展开查看“前后对比”与“改进说明”；
   - 选择将优化后的版本保存为助手模板。

#### 3.3.3 US3：自定义 Flow 模板

1. 用户在右侧的 Flow 配置面板中，手动添加/删除/排序步骤；
2. 每步可选：
   - Agent 类型；
   - 输入来源（用户输入 / 上一步输出 / 自定义文本）；
   - 对输出的约束说明；
3. 保存为自定义 Flow 模板，后续在创建任务时可直接复用。

---

## 4. 详细实现要求（错误处理、测试、安全、性能）

### 4.1 错误处理与健壮性

- 前端：
  - Flow 任一步出错时：
    - 将该步标记为 `error` 并显示错误原因（网络问题 / API 错误 / 超时等）；
    - 不自动跳过到下一步，要求用户显式点击“重试本步”；
  - 禁止在前端静默吞掉后端错误，至少在控制台与 UI 中各留一处可见信息。
- 后端（core）：
  - 单步执行接口应统一包装错误：
    - 标准结构：`{ ok: boolean; data?: T; error?: { code: string; message: string; raw?: any } }`；
  - 要求对外隐藏敏感堆栈信息，仅保留必要字段，防止泄露内部实现细节。

### 4.2 安全与边界

- Agent 默认提示词中应包含：
  - 避免输出敏感个人信息与隐私数据的约束；
  - 不提供违法、有害内容的约束；
  - 对“猜测不存在的 API/文件”的行为保持保守，鼓励明确说明不确定性。
- UI 层面：
  - 对“导出模板”场景，提示用户检查是否包含内部机密信息后再分享。

### 4.3 测试策略

- **单元测试**
  - 对 `useFlowRunner` 的状态转移（idle → running → success/error）进行测试；
  - 对 Flow 模型的 CRUD 操作进行测试（添加/删除/排序步骤）。
- **集成测试**
  - 在 `packages/web` 中增加针对典型 Flow 的集成测试：
    - 模拟执行 3 步流程，验证 UI 状态与数据流。
- **端到端（可选）**
  - 使用 Playwright/Cypress 等在后续版本增加 E2E 测试，用 mock LLM 响应替代真实调用。

### 4.4 性能要求

- 常规网络环境下：
  - 首屏加载时间 ≤ 3s（本地 dev 模式参考）；
  - 单步 Agent 调用首 token 回显 ≤ 1s（流式）或首包响应 ≤ 5s（非流式）。
- 前端应避免：
  - 将完整历史 Flow 输出一次性渲染在 DOM 中，可使用折叠与懒加载策略；
  - 反复重建大对象（如会话列表）导致不必要的 diff。

---

## 5. 给 AI 编程工具的执行指令（MVP 版）

> 供 Claude Code / Cursor / 其他 AI 编程助手直接执行的任务清单。  
> 所有阶段必须遵循「实现 → Checkfix → 文档更新」闭环。

### 5.1 总体要求

1. 技术栈：严格复用本仓库已选用的 Node.js / pnpm / Vue 3 / TypeScript 架构；
2. 所有改动需与 `README.md` 与本 PRD 一致；
3. 每次功能开发后必须执行：
   - `pnpm lint`（或至少 `pnpm -F @prompt-matrix/ui lint` 与相关包的 lint）；
   - 相关包的 `pnpm test`；必要时 `pnpm build` 做编译检查；
4. 如有前端交互变更，需在 `docs/` 下新增或更新对应说明文档，面向零基础用户可操作。

### 5.2 分阶段任务清单

#### 阶段 A：前端 Flow 模型与状态机

1. 在 `packages/web` 中引入 Flow 数据模型：
   - 新建或扩展 store（如 `flowStore.ts`），定义 `FlowStep`、`FlowTemplate` 等类型；
   - 支持：
     - 从预置模板创建 Flow；
     - 在内存中添加/删除/排序步骤；
     - 记录运行时状态与输出内容。
2. 在 `packages/ui` 中实现：
   - `FlowTimeline` 组件：按步骤顺序展示每一步状态（idle / running / success / error）；
   - `FlowStepCard` 组件：展示单步标题、Agent 类型、执行状态与输出内容（支持折叠）。
3. 在 `packages/web` 主视图中集成 Flow 组件：
   - 在现有 Chat UI 上方或侧边增加 Flow 区域；
   - Flow 与当前会话关联：一个会话在某一时刻只能有一个活动 Flow。
4. **Checkfix（必须执行）**：
   - 运行 `pnpm -F @prompt-matrix/ui lint` 与 `pnpm -F @prompt-matrix/web lint`；
   - 若新增单元测试，运行相关 `pnpm test` 命令；
   - 修复所有 lint / 类型错误后再提交。

#### 阶段 B：前端驱动的单步执行逻辑

1. 在 `packages/core` 中确认/补充用于单步执行的接口（若已存在则复用）：
   - 接口形态类似：`routerService.executeStep({ agentType, messages, options })`；
   - 返回采用 `{ ok, data, error }` 标准结构。
2. 在 `useFlowRunner`（或等效逻辑）中实现：
   - 读取当前 Flow 配置，根据 `inputSource` 拼装每步的输入；
   - 串行执行每个步骤，并将结果写回对应 `FlowStep` 状态；
   - 支持单步重试（仅重跑选中步骤）。
3. 在 UI 中增加：
   - “运行 Flow” 按钮；
   - 单步重试按钮；
   - 执行过程中的 Loading/禁用逻辑。
4. **Checkfix**：
   - 执行与阶段 A 相同的 lint + test；
   - 确保构建通过：`pnpm build`.

#### 阶段 C：内置 Flow 模板与助手模板库

1. 在前端定义至少 3 条内置 Flow 模板：
   - 编程助手设计（单步 X4_SCENARIO）；
   - 提示词优化流水线（X0_REVERSE → X1_BASIC → X0_OPTIMIZER）；
   - 自定义场景入口示例（可选）。
2. 实现助手模板库：
   - 允许将某个步骤输出或最终结果保存为 `AssistantTemplate`；
   - 提供模板列表视图（左侧栏），支持预览与一键复制；
   - 模板暂可保存在本地存储或简单持久层中（MVP 阶段）。
3. **Checkfix**：
   - 继续执行 lint + test + build；
   - 在 `docs/CHAT_HISTORY.md` 或新文档中更新关于 Flow 与模板功能的使用说明。

#### 阶段 D：文档更新

1. 在 `docs/PRD_PROMPT_ENGINEERING_MATRIX.md`（本文）基础上：
   - 如实现过程中有偏离，须补充“实现差异小结”小节；
2. 在 `docs/README.md` 或主 `README.md` 中增加一小节：
   - 用 3–5 行概括“Flow + 多 Agent 联动 + 助手模板”的核心价值；
   - 引导用户阅读本 PRD 与相关使用说明文档。
3. 确保所有文档对零基础用户友好：
   - 关键操作需写清楚：前置条件、操作步骤、预期结果、常见问题与回滚方式（可在后续版本细化）。

---

本 PRD/技术规范文件应作为后续迭代的锚点：  
- 当引入新的 Agent 类型（X2/X3 或自定义），需在此文档补充数据模型和 Flow 模板说明；  
- 当将线性 Flow 升级为带条件/循环的复杂 Workflow 时，需新增 ADR 记录并明确对 UI/核心服务的影响。

---

## 6. 用户体验现状与不足扫描（UX Radar）

> 本节站在“用户体验最大化”的视角，对现有系统的关键短板做集中归纳，用于指导后续版本规划。详细技术拆解可参考 `docs/ISSUES_20251005.md` 与 `docs/AUTO_MODE_PROPOSAL.md`。

### 6.1 交互流畅度与可控性

- **缺少流式输出终止能力**（对应问题 1）  
  - 现状：长回答或“跑偏”时，用户只能被动等待流式输出结束。  
  - 体验影响：强烈的“失控感”，不符合专业工具预期。  
  - 优化方向：  
    - 在流式消息组件旁提供明显的「停止生成」按钮（以及可选快捷键）；  
    - 在 LLMService 中统一接入 `AbortController`，保证“停”是真正中断请求而非仅隐藏 UI。

- **自由聊天模式与 Agent 模式界限模糊**（对应问题 2）  
  - 现状：切到“自由聊天模式”后，部分请求仍会经过 Conductor 路由，行为与 UI 命名不一致。  
  - 体验影响：用户难以理解“此刻到底是谁在回答”，削弱对系统的信任感。  
  - 优化方向：  
    - 在顶栏或对话框头部用明显的标签区分 `Agent 模式 / 自由聊天模式`；  
    - 自由聊天模式直连底层 LLM，不附加额外系统提示与路由逻辑；  
    - 在模式切换时给出一条简短说明，确保心智模型一致。

### 6.2 可见性（Observability）与可配置性

- **环境与 Provider 配置“看不见、摸不准”**（见 `ENV_CONFIGURATION.md` 与 `.debug/ui-config-debug.md`）  
  - 现状：用户难以从 UI 直观判断当前请求到底走的是哪个 Base URL、哪个模型、来自哪里（本地 env / WebUI 覆盖 / 内部默认）。  
  - 体验影响：遇到 401 或请求失败时，排障成本高，容易将“配置问题”误认为“产品坏了”。  
  - 优化方向：  
    - 在设置面板中新增“当前生效配置”区块：以只读表格展示 Provider、Base URL、模型名与配置来源（`localStorage / .env / default`）；  
    - 一键自检按钮（如“发送测试请求”），并在结果中直接展示实际请求 URL 与 HTTP 状态；  
    - 将常见错误（401、404、超时）直接映射到人类可读的排错提示，并链接到 `ENV_CONFIGURATION.md`。

### 6.3 会话与历史管理体验

- **删除行为与结果不稳定**（对应问题 3，配合 `CHAT_HISTORY.md`）  
  - 现状：单条/批量删除后，有时刷新会话又“复活”，或者删除所有会话后出现意外空会话。  
  - 体验影响：用户难以信任历史管理功能，担心“删除不干净”或“误删不可恢复”。  
  - 优化方向：  
    - 明确并稳定删除语义：  
      - 删除当前会话后，若仍有其它会话则自动切到最近一次使用会话；  
      - 删除最后一个会话时，不自动创建新会话，而是展示“空态引导”；  
    - 在 UI 中增加一次性确认文案，提示“此操作只影响本地浏览器，不会上传到服务器”，缓解安全顾虑；  
    - 确保 `prompt-matrix-chat-sessions` / `prompt-matrix-chat-history` 的读写逻辑与 UI 行为完全一致。

### 6.4 Agent 可见性与可操控性

- **系统内置工程师角色“可见不可改”**（对应问题 10）  
  - 现状：X0/X1/X4 等系统工程师在 UI 中有“编辑”按钮，但只是占位，点击只提示“功能开发中”。  
  - 体验影响：用户产生“被吊胃口”的感觉，认知成本高且难以自定义系统行为。  
  - 优化方向：  
    - 引入只读 → 可编辑的渐进模式：  
      - v1：提供只读弹窗，至少让用户看见当前系统提示词；  
      - v2：开放编辑并支持“重置为默认版本”的回滚能力；  
    - 在 PRD 中显式声明“系统 Agent 编辑”的权限与风险模型（个人本地 / 团队共享）。

- **Agent 来源与真实提示词不透明**（对应问题 8、9）  
  - 现状：`agent_matrix/sources` 下的大量工程师提示词目前未被加载，系统使用的是硬编码默认提示词，用户也看不到真实运行的 X 层提示词内容。  
  - 体验影响：  
    - 用户难以将“文档中的工程师模板”映射到“UI 里实际跑的工程师”；  
    - 无法复用或微调这些高质量 sources。  
  - 优化方向：  
    - 在设置或 Agent 管理面板中增加“当前 Agent 源”展示（硬编码 / sources 文件 / 自定义）；  
    - 提供“从 sources 选择工程师变体参与本次会话”的入口，形成真正的 Prompt Matrix 体验；  
    - 为 X0 逆向工程师补齐“重构生成者工程师提示词”的输出，使用户能从分析直接跳到可复用工程师角色。

### 6.5 智能路由与自动模式的体验落差

- **AUTO MODE 设计已存在，但在 UI 中缺乏显式入口与反馈**（见 `AUTO_MODE_PROPOSAL.md`）  
  - 现状：文档中已有 Conductor v2.0 与自动模式的完整设计，但在产品 UI 中，用户看不到“当前是否由自动模式接管路由”、也缺少对决策过程的可视反馈。  
  - 体验影响：用户无法理解“为什么这次是 X4 回答、上次是 X1 回答”，对系统“智能程度”的感知打折。  
  - 优化方向：  
    - 在对话区顶部增加一个简单的“路由解释器”视图，例如：  
      - `本轮由 [Conductor] 选择 [X4_SCENARIO]，理由：检测到‘场景化’关键词`；  
    - 在设置中允许显式启用/关闭“自动模式”，并以简单的文案说明自动模式的优缺点；  
    - 后续可集成 AUTO MODE 的性能指标（意图识别准确率等）到一个简易的“调试面板”，便于高级用户调优。

### 6.6 文档与“零基础路径”

- **从 README 到真实使用路径略显跳跃**  
  - 现状：`README.md` + `docs/` 提供了较完整的开发与部署视角，但对“一个完全不了解项目的人如何在 5 分钟内完成首个有效对话”的路径，叙事仍偏工程化而非体验化。  
  - 优化方向：  
    - 在 `docs/README.md` 或新增 `docs/QUICKSTART_USER.md` 中，增加一条聚焦“零基础终端用户”的流程：  
      - 安装 → 配好 Key → 选择一个场景模板 → 运行一次 Flow → 保存第一个助手模板；  
    - 对常见坑位（如 env 配置、聊天记录删除异常、自由模式预期）给出“先看这里”的显眼索引。

---

## 7. 实现进度与 PRD 对齐快照（当前仓库状态）

> 本节用于回答“PRD 中哪些已经落地、哪些仍在路上”，便于后续规划迭代顺序。仅是当前代码仓库的一次快照，后续版本可按需更新。

### 7.1 已基本满足的能力

- **核心 Agent 与路由层（对应 2.2 / 3.1 `packages/core`）**
  - `LLMService` / `RouterService` / `ConductorAgent` / X0/X1/X4 / `CustomAgent` 等已在 `packages/core` 中按 README 的 Phase 1 状态落地，并作为 Web 应用的唯一大模型接入层。
  - `RouterService.handleRequestStream(...)` 已支持通过 `metadata.forcedAgent` 强制路由到指定 Agent，为前端 Flow 串行执行奠定了“单步执行接口”的基础。

- **聊天 UI、配置与历史管理（对应 1.3 / 3.1 中前端基础）**
  - ChatWindow / ChatSidebar / ConfigPanel / CustomProviderManager / 流式输出 / 多会话管理 / 自定义 Agent 等能力已完备，可支撑日常“单轮/多轮 + 多 Agent 路由”的使用。
  - `docs/ENV_CONFIGURATION.md` 与 `docs/CHAT_HISTORY.md` 已就环境配置与会话持久化给出专项说明；对应的 `.debug/ui-config-debug.md` 与 `.debug/ui-chat-history-debug.md` 记录了关键设计与 Checkfix 结果。

- **阶段 A/B 的核心：前端 Flow 模型 + 多 Agent 串行编排（对应 3.2 / 5.2 阶段 A、B）**
  - **数据模型与状态机（UI 层）**
    - 在 `@prompt-matrix/ui` 中新增：
      - `FlowStep` / `FlowTemplate` 类型（`packages/ui/src/types/index.ts`）；
      - `useFlowRunner` 组合式函数（`packages/ui/src/composables/useFlowRunner.ts`），维护：
        - 预置 Flow 模板列表；
        - 当前激活模板 ID；
        - 运行时步骤列表（含 `status` / `outputSummary` / `outputFull` / `errorMessage` 等）。
    - 预置模板已包含：
      - 「编程助手设计（单步 X4_SCENARIO）」；
      - 「提示词优化流水线（X0_REVERSE → X1_BASIC → X0_OPTIMIZER）」。
  - **Flow 视图组件（UI 层）**
    - 在 `packages/ui/src/components/` 中新增：
      - `FlowStepCard`：展示单步标题、Agent 类型、当前状态与输出预览；
      - `FlowTimeline`：展示完整 Flow、模板选择下拉框以及“运行当前 Flow”按钮。
    - 通过 `@prompt-matrix/ui` 的入口导出 `FlowTimeline` 与 `useFlowRunner`，供 Web 应用消费。
  - **Web 主视图集成与串行执行（Web 层）**
    - 在 `packages/web/src/AppContent.vue` 中：
      - 在 ChatWindow 上方集成 `FlowTimeline` 区域（`app-main` + `app-flow-wrapper`），实现“可视化流水线 + 聊天面板”一屏集成；
      - 使用 `useFlowRunner()` 持有当前 Flow 的模板与步骤状态；
      - 新增 `runCurrentFlow()`：
        - 按步骤顺序串行调用 `RouterService.handleRequestStream(...)`；
        - 对每步执行前后更新 `FlowStep.status` / `outputSummary` / `outputFull` / `errorMessage`；
        - 利用 `FlowStep.inputSource` 区分“直接使用最近一条用户输入”、“承接上一步输出”与“纯系统说明文本”。
      - 调用时为每步传入 `metadata.forcedAgent = step.agentType`，实现真正意义上的“由前端 Flow 决定本轮 Agent，而非仅由 Conductor 自主路由”。

### 7.2 已实现但与原始 PRD 有轻微偏差的点

- **Flow 状态的落点位置**
  - PRD 中建议在 `packages/web` 下新建专门的 `flowStore.ts`；当前实现选择将 Flow 模型与状态机放在 `@prompt-matrix/ui` 的 `useFlowRunner` 中，并直接在 Web 层消费。
  - 影响：不影响功能，只是“存放位置”略有不同；后续如需将 Flow 与会话更紧耦合，可以再抽出专门的 store。

- **单步执行逻辑所在层次**
  - PRD 设想：在 `useFlowRunner` 中同时负责“状态管理 + 串行执行”；当前实现将执行部分放在 `AppContent.vue` 的 `runCurrentFlow()` 中，`useFlowRunner` 专注于模板与状态。
  - 影响：前端 API 形态略有不同，但“由前端根据 `inputSource` 组装每一步输入、串行调用 RouterService 并写回状态”的目标已经达成。

- **Flow 与会话的绑定粒度**
  - PRD 设想：“一个会话在某一时刻只能有一个活动 Flow”，意味着 Flow 状态与 Chat Session 一一对应；
  - 当前版本中，Flow 状态是全局的（与当前路由无关），尚未按会话 ID 拆分。
  - 影响：暂不影响 MVP 使用，但当你在多个会话间频繁切换时，Flow 状态不会随会话切换而切换——此点在后续可作为“会话感知 Flow”的增强项。

### 7.3 尚未实现或仅规划中的能力（仍需开发）

- **助手模板库（AssistantTemplate Library）**
  - PRD 中要求将 Flow 某步或最终结果沉淀为 `AssistantTemplate`，并提供模板列表视图 / 搜索 / 一键复制；
  - 当前仅有 Flow 执行与结果展示，尚未加入“保存为助手模板”与对应的持久化/管理 UI。

- **Flow 单步重试能力**
  - 当前实现仅支持整体 Flow 串行运行，不支持对某一步失败后“从该步起向后重试”的快捷操作；
  - PRD 建议在 UI 中为每一步提供“重试本步”按钮，后续需要在 Flow 状态机与 UI 上补充。

- **更多内置 Flow 模板与零基础使用引导**
  - 目前内置模板为两条（编程助手 / 提示词优化流水线），PRD 预期至少 3 条并配合 QUICKSTART 文档；
  - `docs/QUICKSTART_USER.md` 尚未创建，对“安装 → 配好 Key → 选择模板 → 运行一次 Flow → 保存助手模板”的完整路径也尚未写成一步一步的用户文档。

- **UX Radar 中列出的高优先级问题**
  - 如“流式输出终止按钮”、“自由聊天模式与 Agent 模式边界可视化”、“Agent 源模板可视展示与切换”、“AUTO MODE 的 UI 暴露”等，目前仍保持在问题列表与 PRD 的规划层，尚未在代码里落地。

### 7.4 Checkfix 与环境说明（本轮 Flow 实现相关）

- 为本轮新增的 Flow 相关改动尝试执行了前端 Checkfix：
  - `pnpm -C packages/ui lint`；
  - `pnpm -C packages/web lint`。
- 两条命令均因项目现有 ESLint 配置缺失依赖而失败：
  - 错误为：找不到 `vue-eslint-parser`（`Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'vue-eslint-parser' imported from .../eslint.config.js`）；
  - 该问题源自全局 lint 环境配置，**并非本轮改动引入的逻辑错误**。
- 编译与运行层面：
  - `pnpm build` 仍可通过，`core/ui/web` 三个包的构建均成功（保留原有体积/外部化警告）；  
  - 如需恢复完整 lint 闭环，建议在本地按需安装 `vue-eslint-parser` 并将其纳入各包的 devDependencies。

