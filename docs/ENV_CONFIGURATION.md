# Frontend Env And Provider Configuration

This project is a monorepo. The Web app reads runtime env from the workspace root and injects it to the UI package at startup.

## Goal

Configure model provider once, then make sure requests go to the expected endpoint.

## What Changed (2026-02-11)

- Runtime env now supports loading `VITE_DEEPSEEK_BASE_URL` even when `VITE_DEEPSEEK_API_KEY` is not set.
- In settings, when switching provider to `DeepSeek`, default Base URL now prefers `.env.local` value first.
- Chat message IDs are now auto-sanitized to prevent duplicate-key warnings in Vue (`TransitionGroup`).

## Prerequisites

- Node.js and pnpm installed
- Dependencies installed (`pnpm install`)
- Valid API key from your provider

## Step By Step

1. Create root env file:
```bash
cp env.example .env.local
```

2. Fill your provider config in `./.env.local`:
```env
VITE_DEEPSEEK_API_KEY=your-real-key
VITE_DEEPSEEK_BASE_URL=https://api.siliconflow.cn
DEFAULT_EXPERT_MODEL=deepseek-chat
```

3. Start dev server:
```bash
pnpm dev
```

4. Open Settings in UI and verify:
- `Provider`: `DeepSeek` (or your custom provider)
- `Base URL`: should become `https://api.siliconflow.cn/v1` automatically for DeepSeek/OpenAI/OpenRouter providers.

## Config Priority

Priority is:
1. WebUI saved config (`localStorage`, highest)
2. Runtime env (`.env.local`)
3. Internal defaults

If you previously saved wrong settings in UI, they override `.env.local`.

## Troubleshooting

### 401 with request URL still `https://api.deepseek.com/v1/...`

- Cause: UI saved config or env injection mismatch.
- Fix:
  1. Open UI Settings and set `Base URL` explicitly, then save.
  2. If still wrong, clear local storage key `prompt-matrix-config` and refresh.
  3. Restart `pnpm dev` after editing `.env.local`.

### I only configured `VITE_DEEPSEEK_BASE_URL`, not `VITE_DEEPSEEK_API_KEY`

- This is now supported for endpoint bootstrap.
- But requests still require a valid API key:
  1. Fill key in UI settings, or
  2. Add `VITE_DEEPSEEK_API_KEY` into `.env.local`.

### API key invalid

- Confirm key belongs to the selected endpoint/provider.
- If using SiliconFlow endpoint, use SiliconFlow-issued key, not DeepSeek official key.

## Rollback

To rollback this behavior, revert:
- `packages/web/src/main.ts`
- `packages/web/vite.config.ts`
- `packages/ui/src/composables/useConfigStore.ts`
