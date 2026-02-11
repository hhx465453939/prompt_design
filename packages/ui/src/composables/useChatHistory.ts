/**
 * Chat session history store.
 * This module keeps a singleton state so multiple components do not overwrite
 * each other with stale copies.
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

const STORAGE_KEY = 'prompt-matrix-chat-sessions';
const CURRENT_SESSION_KEY = 'prompt-matrix-current-session';
const DEFAULT_SESSION_TITLE = '新对话';

const sessions = ref<ChatSession[]>(loadSessionsFromStorage());
const currentSessionId = ref<string | null>(
  localStorage.getItem(CURRENT_SESSION_KEY) || null
);

const currentSession = computed(() => {
  if (!currentSessionId.value) return null;
  return sessions.value.find((s) => s.id === currentSessionId.value) || null;
});

ensureCurrentSessionConsistency();

function loadSessionsFromStorage(): ChatSession[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load chat sessions:', error);
    return [];
  }
}

function saveSessions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.value));
  } catch (error) {
    console.error('Failed to save chat sessions:', error);
  }
}

function saveCurrentSession() {
  if (currentSessionId.value) {
    localStorage.setItem(CURRENT_SESSION_KEY, currentSessionId.value);
  } else {
    localStorage.removeItem(CURRENT_SESSION_KEY);
  }
}

function ensureCurrentSessionConsistency() {
  if (!currentSessionId.value) return;
  const exists = sessions.value.some((s) => s.id === currentSessionId.value);
  if (!exists) {
    currentSessionId.value = sessions.value[0]?.id ?? null;
    saveCurrentSession();
  }
}

function createSession(): ChatSession {
  const now = Date.now();
  const session: ChatSession = {
    id: `session_${now}_${Math.random().toString(36).slice(2, 11)}`,
    title: DEFAULT_SESSION_TITLE,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };

  sessions.value.unshift(session);
  currentSessionId.value = session.id;
  saveSessions();
  saveCurrentSession();

  return session;
}

function switchSession(sessionId: string) {
  const session = sessions.value.find((s) => s.id === sessionId);
  if (session) {
    currentSessionId.value = sessionId;
    saveCurrentSession();
    return session.messages;
  }
  return [];
}

function updateSessionMessages(messages: ChatMessage[]) {
  // Do not auto-create empty sessions when there is no active one.
  if (!currentSessionId.value && messages.length === 0) {
    return;
  }

  if (!currentSessionId.value) {
    createSession();
  }

  let session = sessions.value.find((s) => s.id === currentSessionId.value);
  if (!session) {
    if (messages.length === 0) {
      currentSessionId.value = null;
      saveCurrentSession();
      return;
    }
    session = createSession();
  }

  session.messages = [...messages];
  session.updatedAt = Date.now();

  if (session.title === DEFAULT_SESSION_TITLE && messages.length > 0) {
    const firstUserMessage = messages.find((m) => m.role === 'user');
    if (firstUserMessage) {
      session.title =
        firstUserMessage.content.slice(0, 30) +
        (firstUserMessage.content.length > 30 ? '...' : '');
    }
  }

  saveSessions();
}

function deleteSession(sessionId: string): string | null {
  const index = sessions.value.findIndex((s) => s.id === sessionId);
  if (index === -1) return currentSessionId.value;

  const isDeletingCurrent = currentSessionId.value === sessionId;
  sessions.value.splice(index, 1);

  if (isDeletingCurrent) {
    currentSessionId.value = sessions.value[0]?.id ?? null;
  }

  saveSessions();
  saveCurrentSession();
  return currentSessionId.value;
}

function renameSession(sessionId: string, newTitle: string) {
  const session = sessions.value.find((s) => s.id === sessionId);
  if (session) {
    session.title = newTitle;
    session.updatedAt = Date.now();
    saveSessions();
  }
}

export function useChatHistory() {
  return {
    sessions,
    currentSession,
    currentSessionId,
    createSession,
    switchSession,
    updateSessionMessages,
    deleteSession,
    renameSession,
  };
}

