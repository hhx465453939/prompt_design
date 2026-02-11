---
name: ralph
description: "Convert PRD to Ralph format and run the autonomous agent loop. Use when you have a PRD and want Ralph to implement it automatically."
---

# Ralph - Autonomous Agent Loop

Ralph is an autonomous AI agent loop that implements PRDs by repeatedly spawning fresh AI instances to complete user stories one by one.

---

## What This Skill Does

This skill handles two phases:

1. **PRD Conversion**: Converts a markdown PRD to `prd.json` format
2. **Ralph Execution**: Launches the autonomous loop that implements each story

---

## Usage

```
/ralph [path-to-prd.md]
```

If no path is provided, looks for `prd.json` in the project root and runs directly.

Examples:
- `/ralph tasks/prd-my-feature.md` - Convert PRD and run Ralph
- `/ralph prd.json` - Run Ralph with existing prd.json
- `/ralph` - Run Ralph (looks for prd.json)

---

## Phase 1: PRD Conversion (if markdown provided)

### Step 1: Read the PRD

Read the provided markdown PRD file.

### Step 2: Archive Previous Run (if needed)

Check if `prd.json` exists with a different `branchName`. If so:
1. Read current `prd.json` and extract `branchName`
2. Check if it differs from the new feature's branch
3. If different AND `prd-progress.txt` has content:
   - Create archive folder: `.claude/archive/YYYY-MM-DD-[feature-name]/`
   - Copy current `prd.json` and `prd-progress.txt` to archive
   - Reset `prd-progress.txt` with fresh header

### Step 3: Convert to prd.json

Parse the PRD and generate `prd.json` in the project root:

```json
{
  "project": "[Project Name from PRD or auto-detected]",
  "branchName": "ralph/[feature-name-kebab-case]",
  "description": "[Feature description from PRD]",
  "userStories": [
    {
      "id": "US-001",
      "title": "[Story title]",
      "description": "As a [user], I want [feature] so that [benefit]",
      "acceptanceCriteria": [
        "Criterion 1",
        "Criterion 2",
        "Typecheck passes"
      ],
      "priority": 1,
      "passes": false,
      "notes": ""
    }
  ]
}
```

### Conversion Rules

1. **Each user story becomes one JSON entry**
2. **IDs**: Sequential (US-001, US-002, etc.)
3. **Priority**: Based on dependency order (schema → backend → UI)
4. **All stories**: `passes: false` and empty `notes`
5. **branchName**: Derive from feature name, kebab-case, prefixed with `ralph/`
6. **Always add**: "Typecheck passes" to every story
7. **For UI stories**: Add "Verify in browser using dev-browser skill"

### Story Sizing is Critical

Each story MUST be completable in ONE Ralph iteration.

**Right-sized stories:**
- Add a database column and migration
- Add a UI component to an existing page
- Update a server action with new logic
- Add a filter dropdown to a list

**Too big (must split):**
- "Build the entire dashboard" → Split into: schema, queries, UI components, filters
- "Add authentication" → Split into: schema, middleware, login UI, session handling

**Rule of thumb:** If you cannot describe the change in 2-3 sentences, it is too big.

### Story Ordering

Stories execute in `priority` order. Earlier stories must NOT depend on later ones.

**Correct order:**
1. Schema/database changes (migrations)
2. Server actions / backend logic
3. UI components that use the backend
4. Dashboard/summary views that aggregate data

### Verification Before Proceeding

Before running Ralph, verify:
- [ ] Previous run archived (if applicable)
- [ ] Each story is completable in one iteration
- [ ] Stories are ordered by dependencies
- [ ] Every story has "Typecheck passes"
- [ ] UI stories have "Verify in browser using dev-browser skill"
- [ ] Acceptance criteria are verifiable (not vague)

---

## Phase 2: Ralph Execution

### Step 1: Pre-flight Checks

Verify the following before starting:

1. **Amp CLI installed**
   ```bash
   which amp
   ```
   If not found, instruct user to install from https://ampcode.com

2. **jq installed**
   ```bash
   which jq
   ```
   If not found, instruct user to install (brew install jq on macOS)

3. **Git working directory clean**
   ```bash
   git status --porcelain
   ```
   If not clean, ask user to commit or stash changes

4. **prd.json exists and is valid**
   ```bash
   cat prd.json | jq .
   ```
   If invalid, show error and exit

### Step 2: Create or Checkout Feature Branch

Read `branchName` from `prd.json`:
```bash
jq -r '.branchName' prd.json
```

If branch doesn't exist, create it from main:
```bash
git checkout -b $(jq -r '.branchName' prd.json)
```

If branch exists, checkout it:
```bash
git checkout $(jq -r '.branchName' prd.json)
```

### Step 3: Run Ralph Loop

Execute the Ralph script:
```bash
bash .claude/scripts/ralph.sh [max_iterations]
```

Default is 10 iterations. The script will:

1. Spawn a fresh Amp instance with `.claude/scripts/prompt.md`
2. Amp picks the highest priority story with `passes: false`
3. Amp implements that single story
4. Amp runs quality checks (typecheck, lint, test)
5. If checks pass, Amp commits with message: `feat: [Story ID] - [Story Title]`
6. Amp updates `prd.json` to set `passes: true` for the story
7. Amp appends progress to `prd-progress.txt`
8. Loop repeats until all stories pass or max iterations reached

### Step 4: Monitor Progress

Show the user how to monitor:
```bash
# See which stories are done
cat prd.json | jq '.userStories[] | {id, title, passes}'

# See learnings from previous iterations
cat prd-progress.txt

# Check git history
git log --oneline -10
```

### Step 5: Completion

When ALL stories have `passes: true`, Ralph will output:
```
<promise>COMPLETE</promise>
```

And the loop exits successfully.

---

## Ralph's Inner Loop (What Happens During Execution)

Each iteration spawns a fresh Amp instance with instructions from `.claude/scripts/prompt.md`.

The Amp instance:

1. Reads `prd.json` to pick the next story
2. Reads `prd-progress.txt` for context
3. Implements that ONE story
4. Runs quality checks
5. Updates `AGENTS.md` files if patterns are discovered
6. Commits if checks pass
7. Updates `prd.json` to mark story complete
8. Appends learnings to `prd-progress.txt`

### Memory Between Iterations

The only memory between iterations:
- Git history (commits from previous iterations)
- `prd-progress.txt` (learnings and context)
- `prd.json` (which stories are done)

Each iteration is a **fresh Amp instance** with clean context.

---

## Key Files

| File | Purpose |
|------|---------|
| `.claude/scripts/ralph.sh` | The bash loop that spawns Amp instances |
| `.claude/scripts/prompt.md` | Instructions given to each Amp instance |
| `prd.json` | User stories with `passes` status |
| `prd-progress.txt` | Append-only learnings log |
| `.claude/archive/` | Previous run archives |

---

## Troubleshooting

### Ralph stops mid-execution

Check `prd-progress.txt` for the last completed story, then resume:
```bash
# Just run ralph again, it will continue from where it left off
bash .claude/scripts/ralph.sh
```

### Amp context fills up

Enable auto-handoff in `~/.config/amp/settings.json`:
```json
{
  "amp.experimental.autoHandoff": { "context": 90 }
}
```

### Story fails quality checks

Ralph won't commit broken code. Check:
- `prd-progress.txt` for errors
- Git working directory for uncommitted changes
- Fix the issue and run Ralph again

---

## Tips for Best Results

1. **Keep stories small** - Each must complete in one context window
2. **Order by dependencies** - Schema before backend before UI
3. **Verifiable criteria** - "Typecheck passes" not "Works correctly"
4. **Clean git state** - Start with a clean working directory
5. **Monitor progress** - Check `prd-progress.txt` and git log regularly

---

## Example Session

```
User: /ralph tasks/prd-task-priority.md

Ralph Skill:
- Converting PRD to prd.json...
- Created prd.json with 4 user stories
- Checking prerequisites...
- Creating branch ralph/task-priority...
- Starting Ralph loop...

[Ralph executes iterations...]

Iteration 1: US-001 - Add priority field to database ✓
Iteration 2: US-002 - Display priority indicator on task cards ✓
Iteration 3: US-003 - Add priority selector to task edit ✓
Iteration 4: US-004 - Filter tasks by priority ✓

<promise>COMPLETE</promise>

All stories completed! Check prd-progress.txt for details.
```
