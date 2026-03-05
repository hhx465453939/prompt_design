# Frontend Env And Provider Configuration

This project is a monorepo. The Web app reads runtime env from the workspace root and injects it to the UI package at startup.

## Goal

Configure model provider once, then make sure requests go to the expected endpoint.

## What Changed (2026-03-05)

- Runtime env now supports loading `VITE_DEEPSEEK_BASE_URL` even when `VITE_DEEPSEEK_API_KEY` is not set.
- In settings, when switching provider to `DeepSeek`, default Base URL now prefers `.env.local` value first.
- Chat message IDs are now auto-sanitized to prevent duplicate-key warnings in Vue (`TransitionGroup`).
- Gemini provider now defaults to OpenAI-compatible endpoint:
  - `https://generativelanguage.googleapis.com/v1beta/openai`
- Gemini model refresh now tries live model list first (Google `models` API), then falls back to built-in defaults.
- Provider switch now auto-resets to provider-appropriate default model to reduce `provider/model` mismatch errors.

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

## Gemini Quick Setup

1. Open Settings.
2. Set `Provider` to `Gemini`.
3. Confirm `Base URL` is:
   - `https://generativelanguage.googleapis.com/v1beta/openai`
4. Paste your Gemini API key.
5. Click `刷新模型`.
6. Select one model from the refreshed list and save.

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

### Provider and API key look mismatched

- Typical mismatch:
  - Gemini key used with `DeepSeek` provider.
  - `sk-...` style key used with `Gemini` provider.
- Fix:
  1. Open Settings and confirm `Provider`.
  2. Confirm `Base URL` matches that provider.
  3. Re-enter key for that provider and save.

### Gemini model refresh still only shows fallback models

- Cause: live model list request failed, system fell back to built-in list.
- Fix:
  1. Verify Gemini key is valid.
  2. Keep default Gemini Base URL (`.../v1beta/openai`) unless you use a compatible proxy.
  3. Retry `刷新模型`.
  4. If still failing, inspect browser network panel for `/v1beta/models?key=...` response details.

## Rollback

To rollback this behavior, revert:
- `packages/web/src/main.ts`
- `packages/web/vite.config.ts`
- `packages/ui/src/composables/useConfigStore.ts`
