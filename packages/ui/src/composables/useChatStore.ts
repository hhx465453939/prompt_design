/**
 * Chat state store.
 */

import { ref } from 'vue';
import type { ChatMessage } from '../types';

let messageIdSeed = 0;

function nextMessageId(prefix = 'msg'): string {
  messageIdSeed = (messageIdSeed + 1) % 1_000_000;
  return `${prefix}-${Date.now()}-${messageIdSeed}`;
}

function ensureUniqueMessageIds(source: ChatMessage[]): ChatMessage[] {
  const usedIds = new Set<string>();
  return source.map((message) => {
    const currentId = String(message.id || '').trim();
    const prefix = message.role === 'assistant' ? 'assistant' : message.role === 'user' ? 'user' : 'msg';
    const finalId = currentId && !usedIds.has(currentId) ? currentId : nextMessageId(prefix);
    usedIds.add(finalId);
    return {
      ...message,
      id: finalId,
    };
  });
}

export function useChatStore() {
  const STORAGE_KEY = 'prompt-matrix-chat-history';
  const messages = ref<ChatMessage[]>(loadHistory());
  const loading = ref(false);

  const addUserMessage = (content: string): ChatMessage => {
    const message: ChatMessage = {
      id: nextMessageId('user'),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    messages.value.push(message);
    persist();
    return message;
  };

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
      id: nextMessageId('assistant'),
      role: 'assistant',
      content,
      timestamp: Date.now(),
      ...options,
    };
    messages.value.push(message);
    persist();
    return message;
  };

  const addLoadingMessage = (): ChatMessage => {
    const message: ChatMessage = {
      id: nextMessageId('loading'),
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

  const removeLoadingMessage = () => {
    messages.value = messages.value.filter((m) => !m.isLoading);
    persist();
  };

  const addErrorMessage = (error: string): ChatMessage => {
    const message: ChatMessage = {
      id: nextMessageId('error'),
      role: 'assistant',
      content: error,
      timestamp: Date.now(),
      isError: true,
    };
    messages.value.push(message);
    persist();
    return message;
  };

  const clearMessages = () => {
    messages.value = [];
    persist();
  };

  const setMessages = (newMessages: ChatMessage[]) => {
    messages.value = ensureUniqueMessageIds(newMessages);
    persist();
  };

  const persistMessages = () => {
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
      const parsed = raw ? (JSON.parse(raw) as ChatMessage[]) : [];
      return ensureUniqueMessageIds(parsed);
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
    setMessages,
    persistMessages,
  };
}
