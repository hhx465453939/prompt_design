/**
 * 聊天历史管理
 */

import { ref, computed } from 'vue';
import type { ChatMessage } from '../types';

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export function useChatHistory() {
  const STORAGE_KEY = 'prompt-matrix-chat-sessions';
  const CURRENT_SESSION_KEY = 'prompt-matrix-current-session';
  
  const sessions = ref<ChatSession[]>(loadSessions());
  const currentSessionId = ref<string | null>(
    localStorage.getItem(CURRENT_SESSION_KEY) || null
  );

  // 当前会话
  const currentSession = computed(() => {
    if (!currentSessionId.value) return null;
    return sessions.value.find(s => s.id === currentSessionId.value) || null;
  });

  // 加载所有会话
  function loadSessions(): ChatSession[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
      return [];
    }
  }

  // 保存所有会话
  function saveSessions() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.value));
    } catch (error) {
      console.error('Failed to save chat sessions:', error);
    }
  }

  // 保存当前会话ID
  function saveCurrentSession() {
    if (currentSessionId.value) {
      localStorage.setItem(CURRENT_SESSION_KEY, currentSessionId.value);
    } else {
      localStorage.removeItem(CURRENT_SESSION_KEY);
    }
  }

  // 创建新会话
  function createSession(): ChatSession {
    const session: ChatSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: '新对话',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    sessions.value.unshift(session);
    currentSessionId.value = session.id;
    saveSessions();
    saveCurrentSession();
    
    return session;
  }

  // 切换会话
  function switchSession(sessionId: string) {
    const session = sessions.value.find(s => s.id === sessionId);
    if (session) {
      currentSessionId.value = sessionId;
      saveCurrentSession();
      return session.messages;
    }
    return [];
  }

  // 更新会话消息
  function updateSessionMessages(messages: ChatMessage[]) {
    if (!currentSessionId.value) return;

    const session = sessions.value.find(s => s.id === currentSessionId.value);
    if (session) {
      session.messages = messages;
      session.updatedAt = Date.now();
      
      // 自动生成标题（使用第一条用户消息）
      if (session.title === '新对话' && messages.length > 0) {
        const firstUserMessage = messages.find(m => m.role === 'user');
        if (firstUserMessage) {
          session.title = firstUserMessage.content.slice(0, 30) + 
            (firstUserMessage.content.length > 30 ? '...' : '');
        }
      }
      
      saveSessions();
    }
  }

  // 删除会话
  function deleteSession(sessionId: string) {
    const index = sessions.value.findIndex(s => s.id === sessionId);
    if (index !== -1) {
      sessions.value.splice(index, 1);
      saveSessions();
      
      // 如果删除的是当前会话，切换到第一个会话或创建新会话
      if (currentSessionId.value === sessionId) {
        if (sessions.value.length > 0) {
          currentSessionId.value = sessions.value[0].id;
        } else {
          currentSessionId.value = null;
        }
        saveCurrentSession();
      }
    }
  }

  // 重命名会话
  function renameSession(sessionId: string, newTitle: string) {
    const session = sessions.value.find(s => s.id === sessionId);
    if (session) {
      session.title = newTitle;
      session.updatedAt = Date.now();
      saveSessions();
    }
  }

  // 清空所有会话
  function clearAllSessions() {
    sessions.value = [];
    currentSessionId.value = null;
    saveSessions();
    saveCurrentSession();
  }

  return {
    sessions,
    currentSession,
    currentSessionId,
    createSession,
    switchSession,
    updateSessionMessages,
    deleteSession,
    renameSession,
    clearAllSessions,
  };
}