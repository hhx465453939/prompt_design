# UI Visual System Debug Record

## Art Direction
**Mood**: calm, technical, high-contrast, editorial  
**Metaphor**: studio dashboard with layered glass cards over a soft textured canvas

## Runtime Context And Test Rules
- Runtime: local Windows
- SSH mode: N/A
- Remote path: N/A
- Validation and checkfix: run locally from repo root

## Visual Audit
| Dimension | Current state | Upgrade strategy |
|------|------|----------|
| Sidebar texture | Previous fallback style looked flat and low hierarchy | Use high-contrast gradient shell with interactive active/hover states |
| Message readability | Bubble and markdown areas lacked visual structure | Rebuild message surfaces with strong role contrast, code/quote blocks, and action affordances |
| Input feedback | Input and action buttons looked generic | Introduce elevated container, clear primary CTA, and responsive spacing |
| App atmosphere | Page-level background lacked identity | Add design tokens and multi-layer ambient background in app shell |

## Context Map
- Entry app shell: `packages/web/src/App.vue`
- Runtime/service orchestration: `packages/web/src/AppContent.vue`
- UI composition: `packages/ui/src/components/ChatWindow.vue`
- Sidebar module: `packages/ui/src/components/ChatSidebar.vue`
- Message rendering: `packages/ui/src/components/MessageItem.vue`
- Input experience: `packages/ui/src/components/InputBox.vue`
- Config/env merge: `packages/ui/src/composables/useConfigStore.ts`
- Provider switch defaults: `packages/ui/src/components/ConfigPanel.vue`
- Message ID stability: `packages/ui/src/composables/useChatStore.ts`

## Debug History
### [2026-02-11 16:45] Visual refresh + init race + env/baseURL sync
- Problem
  - User reported aesthetic degradation in chat history panel.
  - Console showed startup registration warnings (`service not initialized`) during custom-agent registration.
  - `.env.local` `VITE_DEEPSEEK_BASE_URL` was not reliably reflected in runtime/provider switching behavior.
  - History rendering previously showed duplicate message key warnings.
- Root cause
  - Custom agent update event could arrive before service initialization on mount.
  - Runtime env merge logic required `VITE_DEEPSEEK_API_KEY` before accepting env config, so endpoint-only bootstrap was ignored.
  - Provider switch logic in config panel hardcoded DeepSeek default URL.
  - Legacy/loaded message IDs could collide.
- Solution
  - Keep pending custom agents and register only after service is initialized; re-sync on service rebuild.
  - Accept env bootstrap when `VITE_DEEPSEEK_BASE_URL` or model exists even without env API key.
  - On provider switch to `DeepSeek`, use env-driven base URL first.
  - Sanitize message IDs on history load/set to ensure uniqueness.
  - Apply full UI visual system refresh across shell/sidebar/chat/message/input components.
- Code changes
  - `packages/web/src/App.vue`
  - `packages/web/src/AppContent.vue`
  - `packages/ui/src/components/ChatWindow.vue`
  - `packages/ui/src/components/ChatSidebar.vue`
  - `packages/ui/src/components/MessageItem.vue`
  - `packages/ui/src/components/InputBox.vue`
  - `packages/ui/src/composables/useConfigStore.ts`
  - `packages/ui/src/components/ConfigPanel.vue`
  - `packages/ui/src/composables/useChatStore.ts`
- Verification
  - `npm run build` ✅ pass (core/ui/web)
  - `npm run lint` ❌ fail (pre-existing environment issue: missing `vue-eslint-parser`)
- Impact assessment
  - Fixes custom-agent startup race conditions in frontend orchestration.
  - Improves endpoint bootstrap consistency for env + UI settings workflows.
  - Reduces front-end render warnings from duplicate message keys.
  - Delivers a coherent visual language across desktop/mobile layouts.

### [2026-02-11 17:05] FlowTimeline export runtime error
- Problem
  - Browser runtime error: `@prompt-matrix_ui.js does not provide an export named 'FlowTimeline'`.
- Root cause
  - `packages/ui` already exported `FlowTimeline`, but web-side Vite prebundle cache served stale dependency snapshot.
  - `packages/web/vite.config.ts` forced workspace packages into `optimizeDeps.include`, making stale cache issues more likely.
- Solution
  - Removed workspace packages from `optimizeDeps.include`.
  - Added `optimizeDeps.exclude` for `@prompt-matrix/core` and `@prompt-matrix/ui`.
  - Added troubleshooting steps to clear Vite cache and force-restart dev server.
- Code changes
  - `packages/web/vite.config.ts`
  - `docs/UI_VISUAL_REFRESH.md`
- Verification
  - `npm run build` ✅ pass after config change.
  - `pnpm -F @prompt-matrix/web dev --force` is a long-running command; automated check timed out while process stayed active.
  - Checked `packages/web/node_modules/.vite/deps/_metadata.json`: only `vue`/`naive-ui`/`openai`/`uuid` are optimized, no `@prompt-matrix/ui` prebundle artifact remains.
  - `npm run lint` ❌ still blocked by missing `vue-eslint-parser` (existing environment issue).
- Impact assessment
  - Prevents most stale-prebundle missing-export errors for local workspace package iteration.

## ADR
- ADR-001: Keep localStorage as highest priority, but allow env base URL fallback when stored base URL is empty; this preserves user intent while fixing endpoint bootstrap gaps.
- ADR-002: Register custom agents via queued synchronization instead of eager mutation; this avoids startup order hazards without cross-layer workarounds.
- ADR-003: Use design tokens at app-shell level and component-level gradients/shadows for consistent visual hierarchy and maintainability.

## Docs Updates
- Updated: `docs/ENV_CONFIGURATION.md`
  - Added latest behavior notes for env base URL bootstrap and provider switching.
- Added: `docs/UI_VISUAL_REFRESH.md`
  - User-facing operation manual: purpose, prerequisites, step-by-step verification, expected results, FAQ, rollback.
- Deployment linkage check
  - `docs/DEPLOYMENT.md` not found in repository; no direct deployment doc update performed.

## Technical Debt
- Lint pipeline currently blocked by missing dependency (`vue-eslint-parser`) in project eslint config; needs dependency alignment.
