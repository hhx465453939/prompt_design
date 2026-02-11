# CLAUDE.md — Full-Stack Dev Environment

This project includes a pre-installed AI-assisted development skill suite covering the entire workflow from requirements to debugging.

## Available Commands

| Command | Purpose |
|---------|---------|
| `/ai-spec` | Translate natural language requirements into precise technical specifications |
| `/api-first` | Activate the API-First modular development framework |
| `/debug` | Context-first code debugging (maintains `.debug/` records) |
| `/debug-ui` | Frontend UI debugging specialist |
| `/prd` | Generate structured PRD documents |
| `/ralph` | Autonomous dev loop driven by PRD (manual cycle count) |
| `/ralph-yolo` | Ralph fully autonomous mode (unattended) |

## Core Development Rules

1. **API-First (mandatory)**: All frontend/backend work follows three-layer separation (Frontend / BFF / Backend API packages). Every backend feature must complete the 5-step loop: Implement → Checkfix → Encapsulate → Expose API → Document API. See `.claude/skills/api-first-modular.md` for details.
2. **Layer-scoped debugging**: Always identify the bug's owning layer (backend / frontend / BFF / contract mismatch) before making any fix. Never patch one layer to work around another layer's bug.
3. **Cross-layer task decomposition**: Requirements spanning multiple layers must be split into ordered sub-tasks along API boundaries — backend first → API docs → frontend consumption → integration verification.

## Configuration

- Allowed / denied shell commands: `.claude/settings.local.json`
- Ralph loop config: `.claude/ralph-config.json`
- PRD template: `.claude/templates/prd.json.example`
