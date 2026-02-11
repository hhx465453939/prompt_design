---
description: Convert PRD to Ralph format and run the autonomous agent loop
---

# Ralph - Autonomous Agent Loop

Ralph implements PRDs by repeatedly spawning fresh AI instances to complete user stories one by one.

---

## Phase 1: PRD Conversion (if markdown PRD provided)

### Step 1: Check Input

Check if the user provided a path to a PRD file. If not, look for `prd.json` in the project root.

**User input formats:**
- `/ralph tasks/prd-my-feature.md` - Convert PRD and run Ralph
- `/ralph prd.json` - Run Ralph with existing prd.json
- `/ralph` - Run Ralph (looks for prd.json)

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

**1. Amp CLI installed**
```bash
which amp
```
If not found, instruct user to install from https://ampcode.com

**2. jq installed**
```bash
which jq
```
If not found, instruct user to install (brew install jq on macOS)

**3. Git working directory clean**
```bash
git status --porcelain
```
If not clean, ask user to commit or stash changes

**4. prd.json exists and is valid**
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

## Example Session

```
User: /ralph tasks/prd-task-priority.md

AI:
- Converting PRD to prd.json...
- Created prd.json with 4 user stories
- Checking prerequisites...
✓ Amp CLI installed
✓ jq installed
✓ Git working directory clean
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

---

**Ready to run Ralph. Provide a PRD path to convert, or I'll use existing prd.json.**
