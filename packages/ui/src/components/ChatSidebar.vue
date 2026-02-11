<template>
  <div class="chat-sidebar">
    <div class="sidebar-header">
      <h3 class="sidebar-title">Chat History</h3>
      <div class="sidebar-actions">
        <n-button quaternary circle size="small" @click="showBatchActionsDialog = true" title="Batch actions">
          <template #icon>
            <n-icon><SettingsOutline /></n-icon>
          </template>
        </n-button>
        <n-button quaternary circle size="small" @click="handleNewChat" title="New chat">
          <template #icon>
            <n-icon><AddOutline /></n-icon>
          </template>
        </n-button>
      </div>
    </div>

    <div class="sessions-list">
      <div
        v-for="session in sessions"
        :key="session.id"
        :class="[
          'session-item',
          { active: session.id === currentSessionId, selected: isSelectMode && selectedSessions.includes(session.id) },
        ]"
        @click="handleSessionClick(session.id)"
      >
        <div v-if="isSelectMode" class="session-checkbox">
          <n-checkbox
            :checked="selectedSessions.includes(session.id)"
            @update:checked="toggleSessionSelection(session.id, $event)"
          />
        </div>

        <div class="session-content">
          <div class="session-title">{{ session.title }}</div>
          <div class="session-time">{{ formatTime(session.updatedAt) }}</div>
        </div>

        <div class="session-actions" v-if="!isSelectMode" @click.stop>
          <n-dropdown :options="getSessionMenuOptions(session.id)" placement="bottom-end">
            <n-button quaternary circle size="tiny">
              <template #icon>
                <n-icon><EllipsisVerticalOutline /></n-icon>
              </template>
            </n-button>
          </n-dropdown>
        </div>
      </div>

      <div v-if="sessions.length === 0" class="empty-sessions">
        <n-empty description="No chat sessions yet" size="small" />
      </div>
    </div>

    <n-modal
      v-model:show="showRenameDialog"
      preset="dialog"
      title="Rename chat"
      positive-text="Save"
      negative-text="Cancel"
      @positive-click="handleRenameSession"
    >
      <n-input v-model:value="newSessionTitle" placeholder="Enter new chat title" @keyup.enter="handleRenameSession" />
    </n-modal>

    <n-modal
      v-model:show="showDeleteDialog"
      preset="dialog"
      title="Confirm delete"
      type="warning"
      positive-text="Delete"
      negative-text="Cancel"
      @positive-click="handleDeleteSession"
    >
      Delete this chat session? This action cannot be undone.
    </n-modal>

    <n-modal v-model:show="showBatchActionsDialog" preset="card" title="Batch actions" style="width: 400px">
      <n-space vertical>
        <n-button @click="handleExportAllSessions" :disabled="sessions.length === 0">
          <template #icon>
            <n-icon><DownloadOutline /></n-icon>
          </template>
          Export all chat sessions
        </n-button>
      </n-space>

      <template #footer>
        <n-space justify="end">
          <n-button @click="toggleSelectMode" :type="isSelectMode ? 'primary' : 'default'">
            {{ isSelectMode ? 'Cancel select' : 'Multi-select' }}
          </n-button>
          <n-button v-if="isSelectMode" type="error" :disabled="selectedSessions.length === 0" @click="handleDeleteSelected">
            Delete selected ({{ selectedSessions.length }})
          </n-button>
          <n-button @click="showBatchActionsDialog = false">Close</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  NButton,
  NIcon,
  NEmpty,
  NModal,
  NInput,
  NDropdown,
  NSpace,
  NCheckbox,
  useMessage,
} from 'naive-ui';
import { AddOutline, EllipsisVerticalOutline, SettingsOutline, DownloadOutline } from '@vicons/ionicons5';
import { useChatHistory } from '../composables/useChatHistory';

interface Emits {
  (e: 'newChat'): void;
  (e: 'selectSession', sessionId: string): void;
}

const emit = defineEmits<Emits>();
const message = useMessage();

const { sessions, currentSessionId, createSession, switchSession, deleteSession, renameSession } = useChatHistory();

const showRenameDialog = ref(false);
const showDeleteDialog = ref(false);
const showBatchActionsDialog = ref(false);
const selectedSessionId = ref('');
const newSessionTitle = ref('');
const isSelectMode = ref(false);
const selectedSessions = ref<string[]>([]);

const handleNewChat = () => {
  createSession();
  emit('newChat');
};

const handleSelectSession = (sessionId: string) => {
  if (sessionId === currentSessionId.value) return;
  switchSession(sessionId);
  emit('selectSession', sessionId);
};

const handleSessionClick = (sessionId: string) => {
  if (isSelectMode.value) {
    toggleSessionSelection(sessionId, !selectedSessions.value.includes(sessionId));
    return;
  }
  handleSelectSession(sessionId);
};

const toggleSelectMode = () => {
  isSelectMode.value = !isSelectMode.value;
  if (!isSelectMode.value) {
    selectedSessions.value = [];
  }
};

const toggleSessionSelection = (sessionId: string, checked: boolean) => {
  if (checked) {
    if (!selectedSessions.value.includes(sessionId)) {
      selectedSessions.value.push(sessionId);
    }
    return;
  }
  selectedSessions.value = selectedSessions.value.filter((id) => id !== sessionId);
};

const handleDeleteSelected = () => {
  try {
    const deletedCount = selectedSessions.value.length;
    selectedSessions.value.forEach((sessionId) => deleteSession(sessionId));

    selectedSessions.value = [];
    isSelectMode.value = false;
    showBatchActionsDialog.value = false;

    emit('selectSession', currentSessionId.value || '');
    message.success(`Deleted ${deletedCount} chat session(s)`);
  } catch (error) {
    console.error('Delete sessions failed:', error);
    message.error('Delete failed, please retry.');
  }
};

const getSessionMenuOptions = (sessionId: string) => {
  const session = sessions.value.find((s) => s.id === sessionId);
  return [
    {
      label: 'Rename',
      key: 'rename',
      props: {
        onClick: () => {
          selectedSessionId.value = sessionId;
          newSessionTitle.value = session?.title || '';
          showRenameDialog.value = true;
        },
      },
    },
    {
      label: 'Delete',
      key: 'delete',
      props: {
        style: 'color: #e74c3c',
        onClick: () => {
          selectedSessionId.value = sessionId;
          showDeleteDialog.value = true;
        },
      },
    },
  ];
};

const handleRenameSession = () => {
  const title = newSessionTitle.value.trim();
  if (!title) {
    message.warning('Please enter a session title.');
    return false;
  }

  renameSession(selectedSessionId.value, title);
  showRenameDialog.value = false;
  message.success('Chat title updated.');
  return true;
};

const handleDeleteSession = () => {
  deleteSession(selectedSessionId.value);
  showDeleteDialog.value = false;
  emit('selectSession', currentSessionId.value || '');
  message.success('Chat deleted.');
  return true;
};

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
};

const handleExportAllSessions = () => {
  try {
    const exportData = {
      exportDate: new Date().toISOString(),
      sessions: sessions.value.map((session) => ({
        id: session.id,
        title: session.title,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        messages: session.messages,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
    a.download = `chat-history-${timestamp}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showBatchActionsDialog.value = false;
    message.success(`Exported ${sessions.value.length} chat session(s).`);
  } catch (error) {
    console.error('Export sessions failed:', error);
    message.error('Export failed, please retry.');
  }
};
</script>

<style scoped>
.chat-sidebar {
  width: 296px;
  height: 100%;
  background: linear-gradient(165deg, #0d3f44 0%, #135f66 58%, #1a7a72 100%);
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: var(--pm-radius-xl);
  box-shadow: var(--pm-shadow-xl);
  color: #e9fbf7;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.chat-sidebar::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(500px 180px at -20% -12%, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 60%);
}

.sidebar-header {
  position: relative;
  z-index: 1;
  padding: 16px 16px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sidebar-title {
  margin: 0;
  font-size: 14px;
  font-weight: 620;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(236, 255, 250, 0.95);
}

.sidebar-actions {
  display: flex;
  gap: 8px;
}

.sidebar-actions :deep(.n-button) {
  color: #e9fbf7;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.16);
}

.sidebar-actions :deep(.n-button:hover) {
  background: rgba(255, 255, 255, 0.2);
}

.sessions-list {
  position: relative;
  z-index: 1;
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.sessions-list::-webkit-scrollbar {
  width: 8px;
}

.sessions-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
}

.sessions-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.24);
  border-radius: 999px;
}

.session-item {
  padding: 11px 10px;
  margin-bottom: 6px;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid transparent;
  background: rgba(255, 255, 255, 0.04);
}

.session-item:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.24);
}

.session-item.active {
  background: linear-gradient(140deg, rgba(255, 255, 255, 0.2) 0%, rgba(244, 187, 122, 0.22) 100%);
  border-color: rgba(255, 209, 157, 0.72);
  box-shadow: 0 8px 22px rgba(6, 44, 49, 0.24);
}

.session-item.selected {
  background: linear-gradient(140deg, rgba(228, 142, 80, 0.28) 0%, rgba(237, 168, 105, 0.2) 100%);
  border-color: rgba(244, 188, 141, 0.7);
}

.session-content {
  flex: 1;
  min-width: 0;
}

.session-title {
  font-size: 13px;
  font-weight: 580;
  color: #f1fffc;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-time {
  font-size: 11px;
  letter-spacing: 0.02em;
  color: rgba(223, 247, 244, 0.72);
}

.session-checkbox {
  margin-right: 8px;
  display: flex;
  align-items: center;
}

.session-actions {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.session-actions :deep(.n-button) {
  color: rgba(245, 255, 252, 0.9);
  background: rgba(255, 255, 255, 0.12);
}

.session-item:hover .session-actions,
.session-item.active .session-actions {
  opacity: 1;
}

.empty-sessions {
  padding: 32px 16px;
  text-align: center;
}

.empty-sessions :deep(.n-empty__description) {
  color: rgba(231, 249, 244, 0.78);
}

@media (max-width: 1100px) {
  .chat-sidebar {
    width: 242px;
  }
}

@media (max-width: 760px) {
  .chat-sidebar {
    width: 100%;
    height: auto;
    min-height: 178px;
    max-height: 212px;
    border-radius: 20px;
  }

  .sidebar-header {
    padding: 12px;
  }

  .sessions-list {
    padding: 8px;
  }

  .session-item {
    padding: 10px 9px;
  }
}
</style>