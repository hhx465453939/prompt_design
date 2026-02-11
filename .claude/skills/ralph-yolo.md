---
name: ralph-yolo
description: "YOLO模式 - 直接使用Claude Code子Agent实现PRD，不依赖Amp CLI。顺序执行每个用户故事，前台跟踪进度。"
---

# Ralph YOLO - Autonomous Agent Loop (No Amp Required)

Ralph YOLO 是 Ralph 的轻量版本，直接使用 Claude Code 的 Task tool 管理子 agent 完成任务，无需依赖 Amp CLI。

---

## 与原 Ralph 的区别

| 特性 | 原 Ralph | Ralph YOLO |
|------|----------|------------|
| 依赖 | Amp CLI | Claude Code Task Tool |
| 执行方式 | bash 脚本循环 | 前台子 agent 管理 |
| Agent 实例 | 外部 Amp 进程 | Claude Code Task 子 agent |
| 状态跟踪 | 文件读写 | 前台实时更新 |
| 上下文 | 每次全新 | 主会话保持完整上下文 |

---

## 使用方法

```
/ralph-yolo [path-to-prd.md]
```

如果未提供 PRD 路径，会查找项目根目录的 `prd.json` 并直接执行。

**示例：**
```bash
/ralph-yolo tasks/prd-my-feature.md  # 从 PRD 转换并执行
/ralph-yolo prd.json                  # 使用现有 prd.json 执行
/ralph-yolo                           # 自动查找 prd.json
```

---

## 工作流程

### Phase 1: PRD 转换（如果提供了 markdown PRD）

#### Step 1: 读取 PRD 文件

读取用户提供的 markdown PRD 文件。

#### Step 2: 归档旧运行（如需要）

检查是否存在 `prd.json` 且 `branchName` 不同。如果是：
1. 读取当前 `prd.json` 提取 `branchName`
2. 比较新功能的分支名
3. 如果不同且 `prd-progress.txt` 有内容：
   - 创建归档文件夹：`.claude/archive/YYYY-MM-DD-[feature-name]/`
   - 复制当前 `prd.json` 和 `prd-progress.txt` 到归档
   - 重置 `prd-progress.txt` 为新的头部信息

#### Step 3: 转换为 prd.json

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

#### 转换规则

1. **每个用户故事成为一个 JSON 条目**
2. **ID**：顺序编号（US-001, US-002 等）
3. **Priority**：基于依赖顺序（schema → backend → UI）
4. **所有故事**：初始 `passes: false`，`notes` 为空
5. **branchName**：从功能名派生，kebab-case，前缀 `ralph/`
6. **始终添加**："Typecheck passes" 到每个故事
7. **UI 故事**：添加 "Verify in browser"

#### 故事大小关键原则

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

#### 故事排序

故事按 `priority` 顺序执行。前面的故事不能依赖后面的。

**正确顺序：**
1. Schema/数据库变更（migrations）
2. Server actions / 后端逻辑
3. 使用后端的 UI 组件
4. 汇总数据的 Dashboard/summary 视图

---

### Phase 2: Ralph YOLO 执行

#### Step 1: 预检

验证以下条件：

1. **Git 工作区干净**
   ```bash
   git status --porcelain
   ```
   如果不干净，要求用户提交或暂存更改

2. **prd.json 存在且有效**
   ```bash
   cat prd.json | jq .
   ```
   如果无效，显示错误并退出

#### Step 2: 创建或检出功能分支

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

#### Step 3: 初始化进度文件

如果 `prd-progress.txt` 不存在，创建它：
```bash
echo "# Ralph YOLO Progress Log" > prd-progress.txt
echo "Started: $(date)" >> prd-progress.txt
echo "---" >> prd-progress.txt
```

#### Step 4: 顺序执行用户故事

这是 Ralph YOLO 的核心工作流程：

```javascript
// 伪代码示意
while (有未完成的用户故事) {
  1. 读取 prd.json
  2. 找到最高 priority 且 passes=false 的故事
  3. 如果没有未完成故事，退出循环
  4. 创建子 agent 处理该故事
  5. 等待子 agent 完成
  6. 验证完成情况
  7. 更新 prd.json (passes=true)
  8. 追加进度到 prd-progress.txt
  9. 继续下一个故事
}
```

#### Step 4 详细流程

##### 4.1 选择下一个故事

读取 `prd.json`，找到：
- `passes: false`
- 最低 `priority` 值（最高优先级）
- 按 `priority` 升序排序

##### 4.2 创建子 agent

根据故事类型选择合适的子 agent：

**前端故事（涉及 UI）：**
```javascript
使用 `Task` tool 创建 `ui-ux-designer` 子 agent（如需要设计）
然后创建 `Full-stack-developer` 子 agent 实施开发
```

**后端/全栈故事：**
```javascript
使用 `Task` tool 创建 `Full-stack-developer` 子 agent
```

**复杂多步骤任务：**
```javascript
使用 `Task` tool 创建 `general-purpose` 子 agent
```

**子 Agent 提示词模板：**

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

##### 4.3 等待子 agent 完成

使用 `Task` tool 的 **阻塞模式**（默认），等待子 agent 完全完成后再继续。

不要使用 `run_in_background` 参数，确保顺序执行。

##### 4.4 验证完成情况

子 agent 完成后，验证：

1. **检查 Git 状态**
   ```bash
   git log --oneline -1
   ```
   应该看到新的提交，提交信息匹配故事 ID 和标题

2. **检查工作区**
   ```bash
   git status --porcelain
   ```
   应该是干净的（所有更改已提交）

3. **运行质量检查**
   ```bash
   # 根据项目配置运行
   npm run typecheck  # 或等效命令
   npm run lint       # 或等效命令
   npm test           # 或等效命令
   ```

##### 4.5 更新 prd.json

如果验证成功：
1. 读取当前 `prd.json`
2. 将该故事的 `passes` 设置为 `true`
3. 保持其他字段不变
4. 写回 `prd.json`

##### 4.6 追加进度日志

追加到 `prd-progress.txt`：

```markdown
## [Date/Time] - [Story ID]
- **Story**: [Story Title]
- **Agent**: [子 agent 类型]
- **What was implemented**: [实现内容]
- **Files changed**: [变更文件列表]
- **Learnings**:
  - [发现的模式]
  - [遇到的问题]
  - [有用的上下文]
---
```

##### 4.7 继续下一个故事

返回到 Step 4.1，选择下一个未完成的故事。

#### Step 5: 完成检测

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

## 子 Agent 管理

### Agent 类型选择

| 任务类型 | Agent 类型 | 说明 |
|---------|-----------|------|
| UI 设计需求 | `ui-ux-designer` | 设计界面和用户体验 |
| 一般开发 | `Full-stack-developer` | 日常全栈开发任务 |
| 复杂任务 | `general-purpose` | 多步骤复杂任务 |

### 创建子 Agent

使用 Claude Code 的 `Task` tool：

```javascript
Task({
  subagent_type: "Full-stack-developer",
  description: "实现 US-001 用户故事",
  prompt: `[详细的任务指令]`
})
```

### 等待完成

不使用 `run_in_background`，确保同步执行：

```javascript
// 正确 ✓
Task({ subagent_type: "...", prompt: "..." })

// 错误 ✗（会异步执行）
Task({ subagent_type: "...", prompt: "...", run_in_background: true })
```

---

## 进度监控

在执行过程中，定期向用户报告进度：

### 每个 Agent 完成后

```markdown
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

### 每 N 个故事后

每完成 2-3 个故事，显示详细摘要：

```markdown
────────────────────────────────────────────────────────────
  Ralph YOLO 进度报告
────────────────────────────────────────────────────────────
已完成: 3/10 (30%)
当前分支: ralph/task-priority
最近提交:
  - abc1234 feat: US-001 - Add priority field
  - def5678 feat: US-002 - Display priority indicator
  - ghi9012 feat: US-003 - Add priority selector

下一步: US-004 - Filter by priority
────────────────────────────────────────────────────────────
```

---

## 错误处理

### 子 Agent 失败

如果子 agent 报告失败或无法完成任务：

1. **记录失败信息**
   - 将错误信息添加到故事的 `notes` 字段
   - 在 `prd-progress.txt` 中记录详细错误

2. **询问用户**
   ```
   ❌ 子 agent 无法完成 US-001

   错误信息: [具体错误]
   建议: [如何修复]

   选项:
   A. 跳过此故事，继续下一个
   B. 手动修复后重试此故事
   C. 暂停执行，让用户介入

   请选择 (A/B/C):
   ```

3. **根据用户选择处理**
   - A: 标记 `notes`，继续下一个故事
   - B: 暂停，等待用户手动修复后再继续
   - C: 完全停止，保存当前状态

### 质量检查失败

如果子 agent 完成但质量检查失败：

1. **不更新 prd.json**
   - `passes` 保持 `false`
   - 添加失败原因到 `notes`

2. **创建新的 agent 重试**
   ```
   ⚠️ US-001 质量检查失败

   失败的检查:
   - typecheck: 找到 3 个类型错误

   正在创建新的 agent 尝试修复...
   ```

3. **最多重试 2 次**
   - 如果 2 次重试后仍失败，询问用户是否跳过

---

## 关键文件

| 文件 | 用途 |
|------|------|
| `prd.json` | 用户故事及其 `passes` 状态（任务清单）|
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

## 示例会话

```
User: /ralph-yolo tasks/prd-task-priority.md

Ralph YOLO:
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

────────────────────────────────────────────────────────────
[Agent 2/4] Full-stack-developer
任务: US-002 - Display priority indicator on task cards
────────────────────────────────────────────────────────────

[继续执行...]

进度报告
────────────────────────────────────────────────────────────
已完成: 3/4 (75%)
当前分支: ralph/task-priority

✓ 完成 US-001 - Add priority field to database
✓ 完成 US-002 - Display priority indicator on task cards
✓ 完成 US-003 - Add priority selector to task edit

下一步: US-004 - Filter tasks by priority

────────────────────────────────────────────────────────────

[最后的故事执行...]

══════════════════════════════════════════════════════
  Ralph YOLO 完成所有任务！
══════════════════════════════════════════════════════
总计完成: 4 个用户故事
分支: ralph/task-priority

查看详情:
  cat prd-progress.txt
  git log --oneline

<promise>COMPLETE</promise>
```

---

## 故障排除

### 执行中断

如果 Ralph YOLO 被中断（Ctrl+C 或错误）：

```bash
# 查看当前状态
cat prd.json | jq '.userStories[] | select(.passes == false) | {id, title, priority}'

# 查看进度日志
cat prd-progress.txt | tail -20

# 重新运行 Ralph YOLO（会继续未完成的故事）
/ralph-yolo
```

### 故事失败

如果某个故事反复失败：

1. 检查 `prd.json` 中该故事的 `notes` 字段
2. 检查 `prd-progress.txt` 了解错误详情
3. 可能需要：
   - 手动修复代码
   - 调整故事范围（拆分得更小）
   - 更新依赖项

### Git 冲突

如果在创建分支时遇到冲突：

```bash
# 查看当前分支
git branch

# 如果分支已存在，可以选择：
# 1. 继续使用现有分支
git checkout ralph/feature-name

# 2. 删除并重新创建（谨慎！）
git branch -D ralph/feature-name
git checkout -b ralph/feature-name
```

---

**准备好运行 Ralph YOLO 了喵～ 提供 PRD 路径进行转换，或者浮浮酱会使用现有的 prd.json** φ(≧ω≦*)♪
