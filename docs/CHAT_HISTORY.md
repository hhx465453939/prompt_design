# Chat History Guide

This guide explains how chat session deletion works and how to verify it is persisted after refresh.

## Purpose

Help users safely manage left sidebar chat sessions:
- create a new chat
- switch chats
- rename chats
- delete one or multiple chats

## Prerequisites

- Frontend is running (`pnpm dev`)
- Browser local storage is enabled

## Step By Step

1. Open the app and look at the left sidebar (`聊天记录`).
2. Delete one session:
   - click the `...` menu on a session
   - click `删除`
   - confirm in the dialog
3. Refresh the page.
4. Confirm the deleted session does not reappear.

## Batch Delete

1. Click the settings icon in the sidebar header.
2. Click `多选模式`.
3. Select multiple sessions.
4. Click `删除选中`.
5. Refresh the page and confirm the selected sessions remain deleted.

## Expected Result

- Deleting the current session switches to the next available session automatically.
- If no session remains, the chat panel becomes empty.
- Deleted sessions stay deleted after page refresh.

## Troubleshooting

### Deleted sessions come back after refresh

1. Hard refresh the browser once.
2. Check browser devtools local storage keys:
   - `prompt-matrix-chat-sessions`
   - `prompt-matrix-chat-history`
3. If keys contain stale data from older versions, clear both keys and retry.

## Rollback

To rollback this behavior, revert:
- `packages/ui/src/composables/useChatHistory.ts`
- `packages/ui/src/composables/useChatStore.ts`
- `packages/ui/src/components/ChatSidebar.vue`
- `packages/web/src/AppContent.vue`
