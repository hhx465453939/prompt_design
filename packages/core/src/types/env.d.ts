/**
 * 环境变量类型定义
 */

interface ImportMetaEnv {
  readonly VITE_DEEPSEEK_API_KEY?: string;
  readonly VITE_DEEPSEEK_BASE_URL?: string;
  readonly VITE_OPENAI_API_KEY?: string;
  readonly VITE_OPENAI_BASE_URL?: string;
  readonly VITE_GEMINI_API_KEY?: string;
  readonly DEFAULT_CONDUCTOR_MODEL?: string;
  readonly DEFAULT_EXPERT_MODEL?: string;
  readonly MAX_TOKENS?: string;
  readonly TEMPERATURE?: string;
  readonly TOP_P?: string;
  readonly DEBUG_MODE?: string;
  readonly VITE_DEBUG_MODE?: string;
  readonly MAX_HISTORY_LENGTH?: string;
  readonly VITE_MAX_HISTORY_LENGTH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

