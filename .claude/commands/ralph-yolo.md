---
description: YOLO模式 - 直接使用Claude Code子Agent实现PRD，无需Amp CLI
---

# Ralph YOLO - 自主 Agent 循环（无 Amp 依赖）

Ralph YOLO 是 Ralph 的轻量版本，直接使用 Claude Code 的 Task tool 管理子 agent 完成任务，无需 Amp CLI。

---

## 使用方法

```
/ralph-yolo [path-to-prd.md]
```

**示例：**
```bash
/ralph-yolo tasks/prd-my-feature.md  # 从 PRD 转换并执行
/ralph-yolo prd.json                  # 使用现有 prd.json 执行
/ralph-yolo                           # 自动查找 prd.json
```

---

## Phase 1: PRD 转换（如果提供 markdown PRD）

### Step 1: 检查输入

检查用户是否提供了 PRD 文件路径。如果没有，查找项目根目录的 `prd.json`。

**用户输入格式：**
- `/ralph-yolo tasks/prd-my-feature.md` - 转换 PRD 并运行 Ralph YOLO
- `/ralph-yolo prd.json` - 使用现有 prd.json 运行
- `/ralph-yolo` - 运行（查找 prd.json）

### Step 2: 归档旧运行（如需要）

检查是否存在 `prd.json` 且 `branchName` 不同。如果是：
1. 读取当前 `prd.json` 提取 `branchName`
2. 比较新功能的分支名
3. 如果不同且 `prd-progress.txt` 有内容：
   - 创建归档文件夹：`.claude/archive/YYYY-MM-DD-[feature-name]/`
   - 复制当前 `prd.json` 和 `prd-progress.txt` 到归档
   - 重置 `prd-progress.txt` 为新的头部信息

### Step 3: 转换为 prd.json

解析 PRD 并生成项目根目录的 `prd.json`：

```json
{
  "project": "[从 PRD 提取或自动检测的项目名]",
  "branchName": "ralph/[feature-name-kebab-case]",
  "description": "[从 PRD 提取的功能描述]",
  "userStories": [
    {
      "id": "US-001",
      "title": "[故事标题]",
      "description": "As a [用户], I want [功能] so that [收益]",
      "acceptanceCriteria": [
        "标准 1",
        "标准 2",
        "Typecheck passes"
      ],
      "priority": 1,
      "passes": false,
      "notes": ""
    }
  ]
}
```

### 转换规则

1. **每个用户故事成为一个 JSON 条目**
2. **ID**：顺序编号（US-001, US-002 等）
3. **Priority**：基于依赖顺序（schema → backend → UI）
4. **所有故事**：初始 `passes: false`，`notes` 为空
5. **branchName**：从功能名派生，kebab-case，前缀 `ralph/`
6. **始终添加**："Typecheck passes" 到每个故事
7. **UI 故事**：添加 "Verify in browser"

### 故事大小关键原则

每个故事必须在一个上下文窗口内完成。

**合适大小：**
- 添加数据库列和迁移
- 向现有页面添加 UI 组件
- 更新服务器操作
- 添加过滤下拉菜单

**太大（需拆分）：**
- "构建整个仪表板" → 拆分为：schema, queries, UI 组件, filters
- "添加认证" → 拆分为：schema, middleware, 登录 UI, session handling

**经验法则：** 如果不能用 2-3 句话描述变更，就太大了。

### 故事排序

故事按 `priority` 顺序执行。前面的故事不能依赖后面的。

**正确顺序：**
1. Schema/数据库变更（migrations）
2. Server actions / 后端逻辑
3. 使用后端的 UI 组件
4. 汇总数据的 Dashboard/summary 视图

### 执行前验证

运行 Ralph YOLO 前，验证：
- [ ] 旧运行已归档（如适用）
- [ ] 每个故事可在一个迭代内完成
- [ ] 故事按依赖关系排序
- [ ] 每个故事有 "Typecheck passes"
- [ ] UI 故事有 "Verify in browser"
- [ ] 验收标准可验证（不模糊）

---

## Phase 2: Ralph YOLO 执行

### Step 1: 预检

验证以下条件：

**1. Git 工作区干净**
```bash
git status --porcelain
```
如果不干净，要求用户提交或暂存更改

**2. prd.json 存在且有效**
```bash
cat prd.json | jq .
```
如果无效，显示错误并退出

### Step 2: 创建或检出功能分支

读取 `prd.json` 中的 `branchName`：
```bash
jq -r '.branchName' prd.json
```

如果分支不存在，从 main 创建：
```bash
git checkout -b $(jq -r '.branchName' prd.json)
```

如果分支存在，检出它：
```bash
git checkout $(jq -r '.branchName' prd.json)
```

### Step 3: 初始化进度文件

如果 `prd-progress.txt` 不存在，创建它：
```bash
echo "# Ralph YOLO Progress Log" > prd-progress.txt
echo "Started: $(date)" >> prd-progress.txt
echo "---" >> prd-progress.txt
```

### Step 4: 顺序执行用户故事

**核心工作流程：**

对于每个未完成的用户故事（`passes: false`），按 `priority` 升序：

1. **选择故事**：找到最低 `priority` 且 `passes: false` 的故事
2. **创建子 Agent**：使用 `Task` tool 创建合适的子 agent
3. **等待完成**：同步等待子 agent 完成（不使用 `run_in_background`）
4. **验证完成**：检查 git 提交、工作区状态、质量检查
5. **更新状态**：设置 `prd.json` 中该故事 `passes: true`
6. **记录进度**：追加到 `prd-progress.txt`
7. **继续下一个**：重复直到所有故事完成

### 子 Agent 提示词模板

```
你是一个独立的开发 agent，正在完成一个用户故事。

## 用户故事

**ID**: {story.id}
**标题**: {story.title}
**描述**: {story.description}

## 验收标准

{逐条列出 acceptanceCriteria}

## 上下文信息

- 项目: {prd.project}
- 功能分支: {prd.branchName}
- 功能描述: {prd.description}

## 你需要做的事情

1. 阅读并理解该用户故事
2. 阅读项目的现有代码，了解代码结构
3. 实现该用户故事
4. 运行质量检查（typecheck, lint, test 等）
5. 如果检查通过，提交代码：
   - 提交信息格式: `feat: {story.id} - {story.title}`
   - 使用 Co-Authored-By: Claude <noreply@anthropic.com>
6. 如果检查失败，修复问题直到通过
7. 确保所有验收标准都满足

## 重要约束

- 只工作于这一个用户故事
- 不要修改其他无关代码
- 遵循项目现有的代码模式和约定
- 提交前确保所有检查通过

完成后，请明确报告：
- 实现了什么
- 修改了哪些文件
- 是否成功提交
- 遇到的任何问题或学习点
```

### Agent 类型选择

| 任务类型 | Agent 类型 | 说明 |
|---------|-----------|------|
| UI 设计需求 | `ui-ux-designer` | 设计界面和用户体验 |
| 一般开发 | `Full-stack-developer` | 日常全栈开发任务 |
| 复杂任务 | `general-purpose` | 多步骤复杂任务 |

### 进度报告

每个子 agent 完成后，向用户报告：

```
✓ 完成 US-001: Add priority field to database
  - Agent: Full-stack-developer
  - 提交: abc1234
  - 文件: src/db/schema.sql, migrations/001_add_priority.sql

进度: 1/4 (25%)
剩余故事:
  - US-002: Display priority indicator (priority: 2)
  - US-003: Add priority selector (priority: 3)
  - US-004: Filter by priority (priority: 4)

正在启动下一个 agent...
```

### Step 5: 完成检测

当所有用户故事的 `passes` 都为 `true` 时：

1. 输出完成信号：
   ```
   <promise>COMPLETE</promise>
   ```

2. 显示完成摘要：
   ```
   ═══════════════════════════════════════════════════════
     Ralph YOLO 完成所有任务！
   ═══════════════════════════════════════════════════════
   总计完成: X 个用户故事
   进度文件: prd-progress.txt
   Git 提交: git log --oneline
   ```

3. 退出循环

---

## 示例会话

```
User: /ralph-yolo tasks/prd-task-priority.md

AI:
✓ 正在转换 PRD 到 prd.json...
✓ 已创建包含 4 个用户故事的 prd.json
✓ 检查前置条件...
✓ Git 工作区干净
✓ 创建分支 ralph/task-priority...

══════════════════════════════════════════════════════
  Ralph YOLO - 自主 Agent 循环
══════════════════════════════════════════════════════
找到 4 个用户故事
开始执行...

────────────────────────────────────────────────────────────
[Agent 1/4] Full-stack-developer
任务: US-001 - Add priority field to database
────────────────────────────────────────────────────────────

[子 agent 执行中...]

✓ 完成 US-001: Add priority field to database
  - Agent: Full-stack-developer
  - 提交: abc1234
  - 文件: src/db/schema.sql, migrations/001_add_priority.sql

进度: 1/4 (25%)
正在启动下一个 agent...

[继续执行...]

══════════════════════════════════════════════════════
  Ralph YOLO 完成所有任务！══════════════════════════════════════════════════════
总计完成: 4 个用户故事
分支: ralph/task-priority

查看详情:
  cat prd-progress.txt
  git log --oneline

<promise>COMPLETE</promise>
```

---

## 关键文件

| 文件 | 用途 |
|------|------|
| `prd.json` | 用户故事及其 `passes` 状态 |
| `prd-progress.txt` | 追踪学习进度的追加日志 |
| `.claude/archive/` | 旧运行的存档 |

---

## 提示

1. **保持故事小** - 每个必须在一个上下文窗口内完成
2. **按依赖排序** - schema 在前，然后是后端，然后是 UI
3. **可验证的标准** - "Typecheck passes" 而不是 "工作正常"
4. **干净的 git 状态** - 从干净的工作区开始
5. **监控进度** - 定期检查 `prd-progress.txt` 和 git log

---

**准备好运行 Ralph YOLO。提供 PRD 路径进行转换，或者浮浮酱会使用现有的 prd.json** φ(≧ω≦*)♪
