---
name: ralph
description: 基于 PRD 的自主 Agent 循环执行系统。将 Markdown PRD 转换为 prd.json，然后自动循环执行每个 User Story（每轮一个全新 Agent 实例），直到全部完成。适用于需要将 PRD 自动化实现的场景。
---

# Ralph - Autonomous Agent Loop

## Overview

将 PRD 转为结构化 `prd.json`，然后循环生成全新 Agent 实例逐个完成 User Story，每轮实例只有 Git 历史 + `prd-progress.txt` + `prd.json` 作为上下文记忆。

## Workflow

### Phase 1: PRD Conversion (if markdown provided)

1. **读取 PRD** — 解析用户提供的 Markdown PRD 文件。
2. **归档上一次运行** — 若 `prd.json` 已存在且 `branchName` 不同，归档到 `.claude/archive/YYYY-MM-DD-[feature]/`。
3. **生成 prd.json** — 按以下格式：

```json
{
  "project": "[Project Name]",
  "branchName": "ralph/[feature-kebab-case]",
  "description": "[Description]",
  "userStories": [
    {
      "id": "US-001",
      "title": "[Story title]",
      "description": "As a [user], I want [feature] so that [benefit]",
      "acceptanceCriteria": ["Criterion 1", "Typecheck passes"],
      "priority": 1,
      "passes": false,
      "notes": ""
    }
  ]
}
```

**Story 规则**：
- 每个 Story 必须单轮可完成（2-3 句话能描述的变更）。
- 按依赖排序：schema → backend → UI → dashboard。
- 每个 Story 必须包含 "Typecheck passes"。
- UI Story 额外包含 "Verify in browser"。

### Phase 2: Ralph Execution

1. **预检** — 确认 `amp` CLI、`jq` 已安装，Git 工作目录干净，`prd.json` 有效。
2. **创建/切换分支** — 从 `prd.json` 读取 `branchName`。
3. **执行循环** — `bash .claude/scripts/ralph.sh [max_iterations]`（默认 10 轮）：
   - 生成全新 Agent 实例 + `.claude/scripts/prompt.md`
   - Agent 选取最高优先级未完成 Story
   - 实现 → 质量检查（typecheck/lint/test）→ 通过则提交
   - 更新 `prd.json`（passes: true）+ 追加 `prd-progress.txt`
   - 循环直到全部通过或达到最大轮数

### Memory Between Iterations

唯一的跨轮记忆：
- Git 历史（之前的提交）
- `prd-progress.txt`（学习日志）
- `prd.json`（完成状态）

每轮都是全新实例，无隐式状态泄漏。

## Key Files

| 文件 | 用途 |
|------|------|
| `.claude/scripts/ralph.sh` | Bash 循环脚本 |
| `.claude/scripts/prompt.md` | 每轮 Agent 的指令 |
| `prd.json` | User Story 及完成状态 |
| `prd-progress.txt` | 追加式学习日志 |
| `.claude/archive/` | 历史运行归档 |

## Guardrails

- Story 必须小到单轮可完成，否则强制拆分。
- 不提交未通过质量检查的代码。
- Git 工作目录必须干净才能启动。
- 支持断点续传（重新运行即从未完成处继续）。
