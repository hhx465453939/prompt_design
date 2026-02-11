<template>
  <div class="chat-sidebar">
    <div class="sidebar-header">
      <h3 class="sidebar-title">聊天记录</h3>
      <div class="sidebar-actions">
        <n-button quaternary circle size="small" @click="showBatchActionsDialog = true" title="批量操作">
          <template #icon>
            <n-icon><SettingsOutline /></n-icon>
          </template>
        </n-button>
        <n-button quaternary circle size="small" @click="handleNewChat" title="新建对话">
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
        <n-empty description="暂无聊天记录" size="small" />
      </div>
    </div>

    <n-modal
      v-model:show="showRenameDialog"
      preset="dialog"
      title="重命名对话"
      positive-text="确定"
      negative-text="取消"
      @positive-click="handleRenameSession"
    >
      <n-input
        v-model:value="newSessionTitle"
        placeholder="请输入新的对话名称"
        @keyup.enter="handleRenameSession"
      />
    </n-modal>

    <n-modal
      v-model:show="showDeleteDialog"
      preset="dialog"
      title="确认删除"
      type="warning"
      positive-text="删除"
      negative-text="取消"
      @positive-click="handleDeleteSession"
    >
      确定要删除这个对话吗？此操作不可撤销。
    </n-modal>

    <n-modal v-model:show="showBatchActionsDialog" preset="card" title="批量操作" style="width: 400px">
      <n-space vertical>
        <n-button @click="handleExportAllSessions" :disabled="sessions.length === 0">
          <template #icon>
            <n-icon><DownloadOutline /></n-icon>
          </template>
          导出所有聊天记录
        </n-button>
      </n-space>

      <template #footer>
        <n-space justify="end">
          <n-button @click="toggleSelectMode" :type="isSelectMode ? 'primary' : 'default'">
            {{ isSelectMode ? '取消选择' : '多选模式' }}
          </n-button>
          <n-button
            v-if="isSelectMode"
            type="error"
            :disabled="selectedSessions.length === 0"
            @click="handleDeleteSelected"
          >
            删除选中 ({{ selectedSessions.length }})
          </n-button>
          <n-button @click="showBatchActionsDialog = false">关闭</n-button>
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
import {
  AddOutline,
  EllipsisVerticalOutline,
  SettingsOutline,
  DownloadOutline,
} from '@vicons/ionicons5';
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
  if (!isSelectMode.value) selectedSessions.value = [];
};

const toggleSessionSelection = (sessionId: string, checked: boolean) => {
  if (checked) {
    if (!selectedSessions.value.includes(sessionId)) selectedSessions.value.push(sessionId);
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
    message.success(`已删除 ${deletedCount} 个聊天记录`);
  } catch (error) {
    console.error('Delete sessions failed:', error);
    message.error('删除失败，请重试');
  }
};

const getSessionMenuOptions = (sessionId: string) => {
  const session = sessions.value.find((s) => s.id === sessionId);
  return [
    {
      label: '重命名',
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
      label: '删除',
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
    message.warning('请输入对话名称');
    return false;
  }

  renameSession(selectedSessionId.value, title);
  showRenameDialog.value = false;
  message.success('重命名成功');
  return true;
};

const handleDeleteSession = () => {
  deleteSession(selectedSessionId.value);
  showDeleteDialog.value = false;
  emit('selectSession', currentSessionId.value || '');
  message.success('删除成功');
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
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;
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
    message.success(`已导出 ${sessions.value.length} 个聊天记录`);
  } catch (error) {
    console.error('Export sessions failed:', error);
    message.error('导出失败，请重试');
  }
};
</script>

<style scoped>
.chat-sidebar {
  width: 260px;
  height: 100%;
  background: #fafafa;
  border-right: 1px solid #e5e5e5;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sidebar-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.sidebar-actions {
  display: flex;
  gap: 8px;
}

.sessions-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.session-item {
  padding: 12px;
  margin-bottom: 4px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.session-item:hover {
  background: #f0f0f0;
}

.session-item.active {
  background: #e3f2fd;
  border: 1px solid #2196f3;
}

.session-content {
  flex: 1;
  min-width: 0;
}

.session-title {
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-time {
  font-size: 12px;
  color: #95a5a6;
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

.session-item:hover .session-actions {
  opacity: 1;
}

.session-item.selected {
  background: #e0f2fe;
  border-color: #2196f3;
}

.session-item.selected:hover {
  background: #b3e5fc;
}

.empty-sessions {
  padding: 32px 16px;
  text-align: center;
}
</style>
