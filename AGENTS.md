# AGENTS.md — Codex Full-Stack Dev Environment

This project includes pre-installed Codex skills (`.codex/skills/`) covering the full development lifecycle.

## Available Skills

| Skill | Trigger Scenarios | Path |
|-------|-------------------|------|
| `api-first-modular` | Frontend/backend development, cross-layer task decomposition, API design | `.codex/skills/api-first-modular/` |
| `code-debugger` | Bug fixing, performance tuning, incremental development | `.codex/skills/code-debugger/` |
| `debug-ui` | Frontend UI debugging — styling, interaction, rendering issues | `.codex/skills/debug-ui/` |
| `ai-spec` | Natural language requirements → precise technical spec translation | `.codex/skills/ai-spec/` |
| `ralph` | Autonomous development loop driven by PRD | `.codex/skills/ralph/` |

## Core Rules

- **API-First**: Every backend feature must be encapsulated as an independent API package (Implement → Checkfix → Encapsulate → Expose API → Document API). Frontend only consumes APIs per documentation — no business logic in the frontend.
- **Layer-scoped debugging**: Identify the bug's owning layer before making changes. Never apply cross-layer workarounds.
- **Ordered cross-layer execution**: Backend first → API docs → frontend consumption → integration verification.
