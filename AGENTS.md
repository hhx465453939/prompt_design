# AGENTS.md — Agent 矩阵架构说明

智能提示词工程师系统基于 **X→Y→Z 三层架构设计哲学**，通过前导 Agent（Conductor）智能调度专家 Agent（X0-X4），实现提示词的全生命周期管理。

## X→Y→Z 三层架构

```
X（工程师角色） → Y（下游角色提示词） → Z（下游角色生成的信息）
     ↓                    ↓                    ↓
  X1基础工程师    →   数据分析师提示词    →   数据分析报告
  X4场景工程师    →   编程助手提示词      →   代码实现
  X0优化师       →   优化后提示词        →   改进效果
```

### 设计理念

- **X层（工程师层）**: 专业提示词工程师，负责设计和优化提示词
- **Y层（应用层）**: 工程师输出的下游角色提示词，直接面向具体应用场景
- **Z层（产出层）**: 下游角色生成的实际信息，解决用户的具体问题

## Agent 矩阵

| Agent | 角色名称 | 专业领域 | 核心功能 | 触发条件 |
|-------|----------|----------|----------|----------|
| **Conductor** | 前导Agent | 智能调度 | 意图识别、路由决策 | 自动执行 |
| **X0逆向** | 逆向工程师 | 推理分析 | 提示词逆向分析 | 输入完整提示词 |
| **X0优化** | 提示词优化师 | 融合优化 | 多维度系统性优化 | 要求优化提示词 |
| **X1基础** | 基础工程师 | 通用场景 | ATOM框架标准化设计 | 通用Agent设计 |
| **X4场景** | 场景工程师 | 应用场景 | 编程、写作、数据分析 | 场景化需求 |

## 智能路由工作流

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

## 目录结构

```
agent_matrix/
├── X0_optimizer/     # 提示词优化师
│   └── sources/      # 角色提示词文件
├── X0_reverse/       # 逆向工程师
│   └── sources/      # 角色提示词文件
├── X1_basic/         # 基础工程师
│   └── sources/      # 角色提示词文件
├── X4_scenario/      # 场景工程师
│   └── sources/      # 角色提示词文件
├── docs/             # Agent 设计文档
└── examples/         # 使用示例
```

## 核心代码位置

| 模块 | 路径 |
|------|------|
| Agent 基类 | `packages/core/src/agents/` |
| 路由服务 | `packages/core/src/services/router/service.ts` |
| LLM 服务 | `packages/core/src/services/llm/service.ts` |
| Agent 加载器 | `packages/core/src/utils/agent-loader.ts` |

## 扩展 Agent

### 创建自定义 Agent

1. 在 `agent_matrix/` 下创建新目录（如 `X2_custom/`）
2. 添加角色提示词文件到 `sources/` 目录
3. 在 `packages/core/src/agents/` 创建 Agent 类
4. 在 `RouterService.initializeAgents()` 中注册

### 注册自定义 Agent

```typescript
routerService.registerCustomAgent({
  id: 'unique-id',
  name: '自定义工程师',
  prompt: '系统提示词内容',
  expertise: '专业领域',
});
```

## 可用开发 Skills

| Skill | 用途 |
|-------|------|
| `/debug` | 上下文优先的代码调试 |
| `/debug-ui` | 前端 UI 调试 |
| `/api-first` | API-First 模块化开发 |
| `/ai-spec` | 自然语言需求转技术规范 |
| `/ralph` | PRD 驱动的自主开发循环 |

## 开发规则

1. **API-First**: 后端功能必须封装为独立 API 包
2. **层级调试**: 确定 Bug 所在层级后再修复
3. **有序执行**: backend first → API docs → frontend
