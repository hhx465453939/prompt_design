# UI Config And Env Debug Log

## Art Direction
**Mood**: reliable, explicit, traceable  
**Metaphor**: config mixer board (env injection layer -> store merge layer -> request layer)

## Runtime Context And Test Rules
- Runtime: local Windows
- SSH mode: N/A
- Remote path: N/A
- Validation and checkfix: run locally from repo root

## Visual Audit
| Dimension | Current state | Upgrade strategy |
|------|------|----------|
| Observability | User cannot verify if env is active from UI behavior | Print clear logs for source of config (localStorage vs runtime env) |
| Consistency | UI package build can freeze env behavior | Switch to runtime env injection from web app |
| Feedback | 401 does not clearly indicate key issue vs endpoint issue | Add docs-first troubleshooting with URL-first checks |

## Implementation Notes
- `packages/web/src/main.ts`: inject `window.__PROMPT_MATRIX_ENV__` for prebuilt workspace packages.
- `packages/web/vite.config.ts`: set `envDir: ../../` so root `.env.local` is loaded in monorepo mode.
- `packages/ui/src/composables/useConfigStore.ts`:
  - replaced direct `import.meta.env` reads with runtime env reads;
  - changed priority to `localStorage > runtime env > default`;
  - normalized base URL and auto-appended `/v1` for DeepSeek/OpenAI/OpenRouter.
- `packages/ui/src/composables/useChatStore.ts`: replaced `Date.now()`-only IDs with seeded IDs to prevent duplicate keys in `TransitionGroup`.
- User docs update: `docs/ENV_CONFIGURATION.md` (new).
- Deployment docs linkage check: `docs/DEPLOYMENT.md` does not exist.

## Checkfix Results
- `npm run lint`: failed
  - reason: missing `vue-eslint-parser` in current project lint environment (not introduced by this change).
- `npm run build`: passed
  - `core/ui/web` all built successfully.
  - existing warnings remained (browser externalization and chunk-size warnings).
