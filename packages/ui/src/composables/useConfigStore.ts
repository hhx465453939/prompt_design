/**
 * Config state store.
 */

import { ref, computed } from 'vue';
import type { UserConfig } from '../types';

const STORAGE_KEY = 'prompt-matrix-config';
const RUNTIME_ENV_KEY = '__PROMPT_MATRIX_ENV__';
const PROVIDER_DEFAULT_BASE_URLS: Record<UserConfig['provider'], string> = {
  deepseek: 'https://api.deepseek.com/v1',
  openai: 'https://api.openai.com/v1',
  gemini: 'https://generativelanguage.googleapis.com/v1beta',
  openrouter: 'https://openrouter.ai/api/v1',
  custom: '',
};

const defaultConfig: UserConfig = {
  provider: 'deepseek',
  apiKey: '',
  baseURL: '',
  model: 'deepseek-chat',
  temperature: 0.7,
  maxTokens: 4096,
  topP: 0.95,
};

type RuntimeEnv = Partial<Record<string, string>>;

function hasText(value?: string): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeBaseURL(provider: UserConfig['provider'], baseURL?: string): string {
  const raw = (baseURL || '').trim();
  if (!raw) {
    return PROVIDER_DEFAULT_BASE_URLS[provider] || '';
  }

  const trimmed = raw.replace(/\/+$/, '');
  if (provider === 'deepseek' || provider === 'openai' || provider === 'openrouter') {
    return /\/v\d+($|\/)/i.test(trimmed) ? trimmed : `${trimmed}/v1`;
  }
  return trimmed;
}

function getRuntimeEnv(): RuntimeEnv | null {
  const env = (globalThis as any)[RUNTIME_ENV_KEY];
  if (!env || typeof env !== 'object') return null;
  return env as RuntimeEnv;
}

/**
 * Read DeepSeek bootstrap config from runtime env.
 */
function getEnvConfig(): Partial<UserConfig> | null {
  const runtimeEnv = getRuntimeEnv();
  if (!runtimeEnv) return null;

  const apiKey = runtimeEnv.VITE_DEEPSEEK_API_KEY?.trim();
  const model = runtimeEnv.DEFAULT_EXPERT_MODEL?.trim();
  const rawBaseURL = runtimeEnv.VITE_DEEPSEEK_BASE_URL?.trim();
  if (!apiKey && !model && !rawBaseURL) return null;

  const envConfig: Partial<UserConfig> = {
    provider: 'deepseek',
    model: model || 'deepseek-chat',
  };

  if (apiKey) {
    envConfig.apiKey = apiKey;
  }
  if (rawBaseURL) {
    envConfig.baseURL = normalizeBaseURL('deepseek', rawBaseURL);
  }

  return envConfig;
}

function getStoredConfig(): Partial<UserConfig> | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as Partial<UserConfig>;
    if (parsed.provider) {
      parsed.baseURL = normalizeBaseURL(parsed.provider, parsed.baseURL);
    }
    return parsed;
  } catch (error) {
    console.error('Failed to load config:', error);
    return null;
  }
}

export function useConfigStore() {
  const config = ref<UserConfig>(loadConfig());

  const isConfigured = computed(() => {
    return !!config.value.apiKey && !!config.value.model;
  });

  const saveConfig = (newConfig: UserConfig) => {
    config.value = {
      ...newConfig,
      baseURL: normalizeBaseURL(newConfig.provider, newConfig.baseURL),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config.value));
  };

  const resetConfig = () => {
    config.value = { ...defaultConfig };
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    config,
    isConfigured,
    saveConfig,
    resetConfig,
  };
}

/**
 * Priority: WebUI(localStorage) > runtime env > default.
 */
function loadConfig(): UserConfig {
  const envConfig = getEnvConfig() || {};
  const storedConfig = getStoredConfig() || {};

  const fallbackBaseURL =
    hasText(storedConfig.baseURL) || !hasText(envConfig.baseURL)
      ? storedConfig.baseURL
      : envConfig.baseURL;

  const finalConfig: UserConfig = {
    ...defaultConfig,
    ...envConfig,
    ...storedConfig,
    baseURL: fallbackBaseURL as string | undefined,
  };
  finalConfig.baseURL = normalizeBaseURL(finalConfig.provider, finalConfig.baseURL);

  if (storedConfig.apiKey) {
    console.log('Using localStorage config (higher priority than runtime env)');
    return finalConfig;
  }

  if (envConfig.apiKey) {
    console.log('Using runtime env config:', {
      provider: finalConfig.provider,
      baseURL: finalConfig.baseURL,
      model: finalConfig.model,
      hasApiKey: !!finalConfig.apiKey,
    });
    return finalConfig;
  }

  return { ...defaultConfig };
}
