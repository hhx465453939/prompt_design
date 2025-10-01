/**
 * 聊天状态管理
 */

import { ref, watch } from 'vue';
import type { ChatMessage } from '../types';

export function useChatStore() {
  const STORAGE_KEY = 'prompt-matrix-chat-history';
  const messages = ref<ChatMessage[]>(loadHistory());
  const loading = ref(false);

  /**
   * 添加用户消息
   */
  const addUserMessage = (content: string): ChatMessage => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    messages.value.push(message);
    persist();
    return message;
  };

  /**
   * 添加助手消息
   */
  const addAssistantMessage = (
    content: string,
    options?: {
      agentType?: ChatMessage['agentType'];
      intent?: ChatMessage['intent'];
      tokensUsed?: number;
      streaming?: boolean;
      thinkingProcess?: string;
    }
  ): ChatMessage => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content,
      timestamp: Date.now(),
      ...options,
    };
    messages.value.push(message);
    persist();
    return message;
  };

  /**
   * 添加加载中消息
   */
  const addLoadingMessage = (): ChatMessage => {
    const message: ChatMessage = {
      id: `loading-${Date.now()}`,
      role: 'assistant',
      content: '正在思考中...',
      timestamp: Date.now(),
      isLoading: true,
      streaming: true,
    };
    messages.value.push(message);
    persist();
    return message;
  };

  /**
   * 移除加载中消息
   */
  const removeLoadingMessage = () => {
    messages.value = messages.value.filter((m) => !m.isLoading);
    persist();
  };

  /**
   * 添加错误消息
   */
  const addErrorMessage = (error: string): ChatMessage => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: error,
      timestamp: Date.now(),
      isError: true,
    };
    messages.value.push(message);
    persist();
    return message;
  };

  /**
   * 清空历史
   */
  const clearMessages = () => {
    messages.value = [];
    persist();
  };

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.value));
    } catch {}
  }

  function loadHistory(): ChatMessage[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  return {
    messages,
    loading,
    addUserMessage,
    addAssistantMessage,
    addLoadingMessage,
    removeLoadingMessage,
    addErrorMessage,
    clearMessages,
  };
}

