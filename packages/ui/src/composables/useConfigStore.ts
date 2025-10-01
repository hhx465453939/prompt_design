/**
 * 配置状态管理
 */

import { ref, computed } from 'vue';
import type { UserConfig } from '../types';

const STORAGE_KEY = 'prompt-matrix-config';

// 默认配置
const defaultConfig: UserConfig = {
  provider: 'deepseek',
  apiKey: '',
  baseURL: '',
  model: 'deepseek-chat',
  temperature: 0.7,
  maxTokens: 4096,
  topP: 0.95,
};

export function useConfigStore() {
  const config = ref<UserConfig>(loadConfig());

  /**
   * 是否已配置
   */
  const isConfigured = computed(() => {
    return !!config.value.apiKey && !!config.value.model;
  });

  /**
   * 保存配置
   */
  const saveConfig = (newConfig: UserConfig) => {
    config.value = { ...newConfig };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config.value));
  };

  /**
   * 重置配置
   */
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
 * 从 localStorage 加载配置
 */
function loadConfig(): UserConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultConfig, ...parsed };
    }
  } catch (error) {
    console.error('Failed to load config:', error);
  }

  // 尝试从环境变量加载
  if (import.meta.env) {
    const envConfig: Partial<UserConfig> = {};
    
    if (import.meta.env.VITE_DEEPSEEK_API_KEY) {
      envConfig.provider = 'deepseek';
      envConfig.apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
      envConfig.baseURL = import.meta.env.VITE_DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
      envConfig.model = import.meta.env.DEFAULT_EXPERT_MODEL || 'deepseek-chat';
    }

    if (Object.keys(envConfig).length > 0) {
      return { ...defaultConfig, ...envConfig };
    }
  }

  return defaultConfig;
}

