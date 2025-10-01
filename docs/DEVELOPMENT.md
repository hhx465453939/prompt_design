# 开发指南

## 开发环境要求

- **Node.js**: ≥18.0.0
- **pnpm**: ≥10.6.1
- **编辑器**: VS Code（推荐）+ Vue/TypeScript插件
- **Git**: 最新版本

---

## 项目脚本

### 核心开发命令

```bash
# 完整开发流程（推荐）
pnpm dev                 # 构建core → 启动web开发服务器

# 单独构建
pnpm build:core          # 构建核心服务层
pnpm build:ui            # 构建UI组件库（待开发）
pnpm build:web           # 构建Web应用（待开发）
pnpm build               # 构建所有包

# 测试
pnpm test                # 运行所有测试
pnpm -F @prompt-matrix/core test   # 单独测试core包

# 清理
pnpm clean               # 清理所有构建产物
pnpm clean:dist          # 清理dist目录
pnpm clean:vite          # 清理Vite缓存
```

---

## 开发流程

### Phase 1：核心服务层（已完成✅）

**目标**：实现Agent矩阵的智能路由和调度系统

**已完成功能**：
- ✅ LLMService：统一大模型调用接口（DeepSeek）
- ✅ ConductorAgent：前导Agent，意图识别和路由决策
- ✅ RouterService：智能路由服务，集成所有Agent
- ✅ X0/X1/X4 Agents：专家Agent实例
- ✅ AgentManager：Agent生命周期管理
- ✅ PromptManager：提示词管理服务
- ✅ StorageService：数据持久化服务
- ✅ 类型系统：完整的TypeScript类型定义
- ✅ 日志系统：分级日志和调试工具

**核心文件**：
```
packages/core/src/
├── agents/
│   ├── conductor.ts         # 前导Agent
│   ├── x0-optimizer.ts      # X0优化师
│   ├── x0-reverse.ts        # X0逆向工程师
│   ├── x1-basic.ts          # X1基础工程师
│   └── x4-scenario.ts       # X4场景工程师
├── services/
│   ├── llm/service.ts       # LLM服务
│   ├── router/service.ts    # 路由服务
│   ├── agent/manager.ts     # Agent管理
│   ├── prompt/manager.ts    # 提示词管理
│   └── storage/service.ts   # 存储服务
├── types/index.ts           # 类型定义
└── utils/
    ├── logger.ts            # 日志工具
    └── agent-loader.ts      # Agent加载器
```

### Phase 2：前端界面（待开发⏳）

**目标**：实现用户友好的Web界面

**待开发组件**：
- [ ] `packages/ui/` - Vue组件库
  - [ ] `ChatWindow.vue` - 对话窗口
  - [ ] `PromptEditor.vue` - 提示词编辑器
  - [ ] `AgentSelector.vue` - Agent选择器
  - [ ] `ConfigPanel.vue` - 配置面板
  - [ ] `PromptLibrary.vue` - 提示词库
  - [ ] `TestRunner.vue` - 测试运行器

- [ ] `packages/web/` - Web应用
  - [ ] 路由配置
  - [ ] 状态管理（Pinia）
  - [ ] 主题系统（深色/浅色）
  - [ ] 响应式布局

**技术栈**：
- Vue 3.5+ (Composition API)
- TypeScript 5.8+
- Vite 5.x
- Naive UI 2.x
- Pinia 2.x

### Phase 3：功能完善（待开发⏳）

**目标**：完善系统功能和用户体验

**待开发功能**：
- [ ] 流式响应支持
- [ ] 提示词库完整CRUD
- [ ] 搜索和筛选功能
- [ ] 测试运行器和性能指标
- [ ] 提示词版本管理
- [ ] 导入/导出功能
- [ ] 快捷键支持

### Phase 4：测试与优化（待开发⏳）

**目标**：确保系统稳定性和性能

**待开发任务**：
- [ ] 单元测试（Vitest）
- [ ] 集成测试
- [ ] E2E测试
- [ ] 性能优化
- [ ] 错误边界处理
- [ ] 日志和监控

### Phase 5：部署与发布（待开发⏳）

**目标**：支持多种部署方式

**待开发功能**：
- [ ] Docker部署
- [ ] CI/CD配置
- [ ] 桌面应用（Electron）
- [ ] 浏览器插件
- [ ] 用户文档
- [ ] API文档

---

## 代码规范

### TypeScript规范

#### 类型定义
```typescript
// ✅ 推荐：使用interface定义对象类型
interface UserConfig {
  provider: 'deepseek' | 'openai';
  apiKey: string;
  model: string;
}

// ✅ 推荐：使用type定义联合类型
type IntentType = 'REVERSE_ANALYSIS' | 'OPTIMIZE' | 'BASIC_DESIGN';

// ❌ 避免：使用any
const data: any = {};  // Bad

// ✅ 推荐：使用具体类型或unknown
const data: unknown = {};  // Good
```

#### 函数定义
```typescript
// ✅ 推荐：显式返回类型
async function chat(messages: Message[]): Promise<string> {
  // ...
}

// ✅ 推荐：使用箭头函数和类型注解
const analyzeIntent = async (input: string): Promise<IntentType> => {
  // ...
};
```

### Vue 3规范

#### Composition API
```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

// ✅ 推荐：使用ref和computed
const count = ref(0);
const doubleCount = computed(() => count.value * 2);

// ✅ 推荐：使用TypeScript类型
interface Props {
  title: string;
  description?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  submit: [value: string];
}>();
</script>
```

### 文件命名规范

```
components/         # 组件：PascalCase
  ChatWindow.vue
  PromptEditor.vue

services/           # 服务：kebab-case
  llm/service.ts
  router/service.ts

types/              # 类型：kebab-case
  index.ts
  agent-types.ts

utils/              # 工具：kebab-case
  logger.ts
  agent-loader.ts
```

### 注释规范

```typescript
/**
 * 前导Agent（Conductor）- 智能指挥官
 * 
 * 职责：
 * 1. 理解用户意图（Intent Recognition）
 * 2. 选择合适的专家Agent（Agent Selection）
 * 3. 执行智能路由调度（Routing）
 */
export class ConductorAgent {
  /**
   * 分析用户意图
   * 
   * @param userInput - 用户输入的原始文本
   * @param context - 可选的请求上下文
   * @returns 识别的意图类型
   */
  async analyzeIntent(
    userInput: string,
    context?: RequestContext
  ): Promise<IntentType> {
    // 实现...
  }
}
```

---

## 调试技巧

### 启用调试日志

在 `.env.local` 中设置：
```bash
DEBUG_MODE=true
```

日志输出示例：
```
[DEBUG] Analyzing user intent
[INFO] Intent detected: SCENARIO_DESIGN
[DEBUG] X4 Scenario executing...
[INFO] Request completed in 5500ms
```

### VS Code调试配置

创建 `.vscode/launch.json`：
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Core",
      "program": "${workspaceFolder}/packages/core/src/index.ts",
      "preLaunchTask": "pnpm: build:core",
      "outFiles": ["${workspaceFolder}/packages/core/dist/**/*.js"]
    }
  ]
}
```

### 测试调试

```bash
# 运行单个测试文件
pnpm -F @prompt-matrix/core test src/services/router/service.test.ts

# 启用调试模式
pnpm -F @prompt-matrix/core test --inspect-brk
```

---

## 贡献指南

### 提交规范

遵循 Conventional Commits：

```bash
feat: 添加流式响应支持
fix: 修复路由决策bug
docs: 更新开发文档
refactor: 重构LLM服务
test: 添加RouterService单元测试
chore: 更新依赖版本
```

### Pull Request流程

1. Fork本仓库
2. 创建特性分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'feat: add amazing feature'`
4. 推送到分支：`git push origin feature/amazing-feature`
5. 提交Pull Request

**PR检查清单**：
- [ ] 代码通过ESLint检查
- [ ] 所有测试通过
- [ ] 添加了必要的文档
- [ ] 更新了CHANGELOG
- [ ] 没有未解决的TODO

---

## 常见问题

### Q1: pnpm install失败
**A**: 确保Node.js版本≥18.0.0，pnpm版本≥10.6.1

### Q2: 类型错误
**A**: 运行 `pnpm build:core` 重新生成类型定义

### Q3: Agent加载失败
**A**: 检查 `agent_matrix/` 目录结构是否完整

### Q4: API调用失败
**A**: 检查 `.env.local` 中的API Key是否正确

---

## 资源链接

- **TypeScript文档**: https://www.typescriptlang.org/docs/
- **Vue 3文档**: https://vuejs.org/guide/introduction.html
- **Vite文档**: https://vite.dev/guide/
- **Naive UI文档**: https://www.naiveui.com/
- **OpenAI SDK**: https://github.com/openai/openai-node
- **DeepSeek API**: https://platform.deepseek.com/api-docs/

