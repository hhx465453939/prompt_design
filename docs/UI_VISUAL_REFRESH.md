# UI Visual Refresh And Runtime Fix Guide

## Purpose

This guide helps you verify two updates:

1. The frontend visual style refresh is active (sidebar/message/input aesthetics restored).
2. Runtime initialization issues are fixed (custom agents no longer fail to register during first load).

## Prerequisites

- Project path: `E:\Development\prompt_design`
- Dependencies installed (`npm install` or `pnpm install`)
- `.env.local` exists at repo root (if using env-based endpoint defaults)

## Step By Step

1. Start the app:
```bash
pnpm dev
```

2. Open browser at:
```text
http://localhost:5173
```

3. Open settings (top-right icon) and confirm:
- `Provider` matches your target provider.
- `Base URL` is correct (for SiliconFlow: `https://api.siliconflow.cn/v1`).
- `API Key` belongs to the same provider endpoint.

4. Save settings, then refresh page once.

5. Check visual refresh:
- Left sidebar is gradient-based and high contrast.
- Message cards are layered with rounded glass-like surfaces.
- Input area has elevated container and clear primary action button.

6. Check runtime fix:
- Open DevTools console.
- Reload page and ensure no blocking error about "service not initialized, cannot register custom agent".
- Create or load custom agents and confirm they are available in agent dropdown.

## Expected Result

- Chat sidebar style is visible and not plain gray fallback.
- Sending messages works without startup registration race warnings.
- No duplicate-key warning for message list caused by repeated message IDs.

## FAQ

### Q1: Request still goes to `https://api.deepseek.com/v1` instead of SiliconFlow

- Cause: saved UI config in localStorage has higher priority than env defaults.
- Fix:
  1. Set Base URL explicitly in UI settings and save.
  2. If needed, clear localStorage key `prompt-matrix-config`, then refresh.

### Q2: Still receiving `401 Authentication Fails`

- Usually API key and endpoint are mismatched.
- If endpoint is SiliconFlow, key must be SiliconFlow-issued key.

### Q3: I still see random extension errors in console

- Browser extensions (for example Grammarly) may inject logs.
- Validate core app behavior with extensions disabled if needed.

### Q4: `does not provide an export named 'FlowTimeline'`

- Cause: Vite prebundle cache may keep an old `@prompt-matrix/ui` export snapshot.
- Fix:
  1. Stop dev server.
  2. Remove cache folder `packages/web/node_modules/.vite`.
  3. Start again with `pnpm dev` (or `pnpm -F @prompt-matrix/web dev --force`).

## Rollback

If you need to revert this UI/runtime update, rollback these files to previous commit:

- `packages/web/src/App.vue`
- `packages/web/src/AppContent.vue`
- `packages/ui/src/components/ChatWindow.vue`
- `packages/ui/src/components/ChatSidebar.vue`
- `packages/ui/src/components/MessageItem.vue`
- `packages/ui/src/components/InputBox.vue`
- `packages/ui/src/composables/useConfigStore.ts`
- `packages/ui/src/components/ConfigPanel.vue`
- `packages/ui/src/composables/useChatStore.ts`
