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
  - normalized base URL and auto-appended `/v1` for DeepSeek/OpenAI/OpenRouter;
  - normalized Gemini base URL to `.../v1beta/openai`.
- `packages/core/src/services/llm/service.ts`:
  - normalized provider base URLs at initialization;
  - changed Gemini default endpoint to OpenAI-compatible `.../v1beta/openai`;
  - Gemini model refresh now requests live models from `.../v1beta/models?key=...` and falls back to defaults;
  - Gemini chat/chatStream switched to native `fetch` path to reduce browser preflight compatibility issues from SDK headers;
  - improved request error text with provider/baseURL hints and key-style mismatch hints.
- `packages/ui/src/components/ConfigPanel.vue`:
  - provider switch now resets provider-specific default model to avoid provider/model mismatch;
  - Gemini default URL updated to `.../v1beta/openai`;
  - disabled divider options in provider selector and added explicit guard in provider change handler;
  - custom provider list now supports forced refresh after save.
- `packages/web/src/AppContent.vue`:
  - fixed copy handler variable shadowing (`message2.success is not a function`);
  - added clipboard error fallback for markdown copy.
- `packages/ui/src/composables/useChatStore.ts`: replaced `Date.now()`-only IDs with seeded IDs to prevent duplicate keys in `TransitionGroup`.
- User docs update: `docs/ENV_CONFIGURATION.md` (updated 2026-03-05).
- Deployment docs linkage check: `docs/DEPLOYMENT.md` does not exist.

## Context Map (2026-03-05)
- Entry UI: `packages/web/src/AppContent.vue` (`handleSend` / `handleCopyMessage`)
- Provider config UI: `packages/ui/src/components/ConfigPanel.vue`
- Config persistence and bootstrap: `packages/ui/src/composables/useConfigStore.ts`
- LLM request and model loading: `packages/core/src/services/llm/service.ts`

## Debug History
### [2026-03-05 22:20] Gemini provider refresh + QA errors + UX sweep
- Issue:
  - Gemini provider model refresh returned stale fallback models only.
  - QA failed after key input with mixed errors: DeepSeek 401, Gemini CORS/preflight failures.
  - Copy message action threw runtime error (`message2.success/error is not a function`).
- Root cause:
  - `getAvailableModels` mostly used hardcoded defaults; no live provider model query.
  - Gemini base URL used generic `.../v1beta`; compatibility and browser preflight behavior was fragile.
  - Event arg named `message` shadowed `useMessage()` instance.
  - Provider switch did not reset model, causing hidden provider/model mismatch risk.
- Solution:
  - Added live model loading strategy + fallback for Gemini.
  - Normalized Gemini endpoint to `.../v1beta/openai`.
  - Moved Gemini request path to native `fetch`.
  - Added provider/key mismatch hint in error text.
  - Fixed copy handler variable shadowing.
  - Added provider default model reset and custom provider option refresh behavior.
- Verification:
  - `pnpm -F @prompt-matrix/core build` passed.
  - `pnpm -F @prompt-matrix/ui build` passed.
  - `pnpm -F @prompt-matrix/web build` passed.
- Impact:
  - Gemini setup becomes more deterministic in browser.
  - Provider configuration UX is safer and less error-prone.
  - Copy action runtime crash removed.
- Docs updated:
  - `docs/ENV_CONFIGURATION.md`: Gemini quick setup, mismatch troubleshooting, fallback model behavior.

## Checkfix Results
- `pnpm -F @prompt-matrix/core build`: passed
- `pnpm -F @prompt-matrix/ui build`: passed
- `pnpm -F @prompt-matrix/web build`: passed
  - existing warnings remained:
    - browser externalization warning for `fs/path` imported from core dist in web bundle;
    - large chunk size warning.
