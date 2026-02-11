# Chat History Persistence Debug Log

## Art Direction
**Mood**: stable, predictable, low-friction  
**Metaphor**: one notebook shared by all views (single source of truth)

## Runtime Context And Test Rules
- Runtime: local Windows
- SSH mode: N/A
- Remote path: N/A
- Validation and checkfix: run locally from repo root

## Visual Audit
| Dimension | Current state | Upgrade strategy |
|------|------|----------|
| Consistency | Multiple `useChatHistory()` instances could overwrite each other with stale data | Convert history composable into singleton module state |
| Persistence | Session switch/delete path changed memory but did not always write `prompt-matrix-chat-history` | Add explicit `setMessages/persistMessages` and use them in delete/load paths |
| Feedback | Batch delete did not sync main panel selection | Emit `selectSession` after batch delete |

## Implementation Notes
- `packages/ui/src/composables/useChatHistory.ts`
  - refactored to singleton store state at module scope;
  - added current-session consistency guard;
  - prevented empty-session auto-creation when no active session and message list is empty.
- `packages/ui/src/composables/useChatStore.ts`
  - added `setMessages(newMessages)` to update + persist;
  - added `persistMessages()` for explicit persistence after in-place mutations.
- `packages/web/src/AppContent.vue`
  - replaced direct assignment with `chatStore.setMessages(messages)`;
  - persisted after delete-message mutations with `chatStore.persistMessages()`.
- `packages/ui/src/components/ChatSidebar.vue`
  - rebuilt component in clean UTF-8;
  - kept same features (new/switch/rename/delete/batch delete/export);
  - emit `selectSession` after batch delete to sync main panel.
- User docs update: `docs/CHAT_HISTORY.md` (new).
- Deployment docs linkage check: `docs/DEPLOYMENT.md` does not exist.

## Checkfix Results
- `npm run lint`: failed
  - reason: missing `vue-eslint-parser` in current lint environment (pre-existing project setup issue).
- `npm run build`: passed
  - `core/ui/web` all built successfully.
  - existing warnings remained (`fs/path` externalization and chunk-size warnings).
