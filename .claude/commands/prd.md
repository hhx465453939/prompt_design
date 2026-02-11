---
description: Generate a Product Requirements Document (PRD) for a new feature
---

# PRD Generator

You are creating a detailed Product Requirements Document (PRD) that is clear, actionable, and suitable for implementation with the Ralph autonomous agent system.

---

## Step 1: Ask Clarifying Questions

Ask the user 3-5 clarifying questions to understand the feature requirements. Each question should have lettered options (a, b, c, etc.).

Example format:
```
**Question 1**: What type of authentication do you need?
a) Email/password with session
b) OAuth (Google, GitHub)
c) Magic link authentication
d) Other (please specify)
```

---

## Step 2: Generate PRD

Once you have enough information, generate a PRD in markdown format with the following structure:

```markdown
# [Feature Name]

## Overview
[Brief description of what this feature does and why it matters]

## User Stories

### US-001: [Story Title]
**As a** [user type],
**I want** [feature],
**So that** [benefit].

**Acceptance Criteria:**
- [ ] [Specific, verifiable criterion 1]
- [ ] [Specific, verifiable criterion 2]
- [ ] Typecheck passes

### US-002: [Story Title]
[...]
```

---

## Critical Rules for Ralph Compatibility

### Story Sizing (MOST IMPORTANT)
Each user story MUST be completable in ONE iteration (one context window).

**Right-sized stories:**
- Add a database column and migration
- Add a UI component to an existing page
- Update a server action with new logic
- Add a filter dropdown to a list

**Too big (split these):**
- "Build the entire dashboard" → Split into: schema, queries, UI components, filters
- "Add authentication" → Split into: schema, middleware, login UI, session handling

**Rule of thumb:** If you cannot describe the change in 2-3 sentences, it is too big.

### Story Ordering
Stories execute in priority order. Earlier stories must NOT depend on later ones.

**Correct order:**
1. Schema/database changes (migrations)
2. Server actions / backend logic
3. UI components that use the backend
4. Dashboard/summary views that aggregate data

### Acceptance Criteria
All criteria must be verifiable (not vague).

**Good:**
- "Add `status` column to tasks table with default 'pending'"
- "Filter dropdown has options: All, Active, Completed"
- "Typecheck passes"

**Bad:**
- "Works correctly"
- "Good UX"
- "Handles edge cases"

**Always include "Typecheck passes"** as the final criterion for every story.

**For UI stories, also include:** "Verify in browser using dev-browser skill"

---

## Step 3: Save PRD

Save the generated PRD to `tasks/prd-[feature-name].md` (convert feature name to kebab-case).

---

## Output Example

```
User: /prd Add a task status feature

AI: Let me ask a few questions to understand your requirements...

**Question 1**: What statuses do you need?
a) Pending/Done only
b) Pending/In Progress/Done
c) Custom statuses
d) Other (please specify)

User: b

[Continue questions...]

**Question 5**: Should the status persist?
a) Yes, in the database
b) No, just in-memory
c) Other

User: a

Great! Here's your PRD...

[Generate PRD]

Saving to tasks/prd-task-status.md...
```

---

**User, describe the feature you want to build:**
