<template>
  <div class="chat-window">
    <ChatSidebar @new-chat="handleNewChat" @select-session="handleSelectSession" />

    <div class="chat-main">
      <div class="chat-header">
        <div class="header-left">
          <h1 class="title">Prompt Matrix Studio</h1>
          <p class="subtitle">AI Agent Matrix - Smart Routing</p>
        </div>
        <div class="header-right">
          <n-button quaternary circle @click="emit('openSettings')">
            <template #icon>
              <n-icon><SettingsOutline /></n-icon>
            </template>
          </n-button>
        </div>
      </div>

      <div ref="messagesContainer" class="messages-container">
        <div v-if="messages.length === 0" class="empty-state">
          <div class="empty-icon">
            <n-icon size="120" :color="'#667eea'">
              <ChatboxOutline />
            </n-icon>
          </div>
          <h2 class="empty-title">Start chatting and let AI agents build better prompts for you</h2>
          <p class="empty-description">
            The conductor routes your request to the best expert automatically.
          </p>
          <div class="example-cards">
            <div class="example-label">Quick Start</div>
            <div class="example-grid">
              <div
                v-for="(example, index) in examples"
                :key="index"
                class="example-card"
                @click="emit('sendExample', example.text)"
              >
                <div class="example-icon">{{ example.icon }}</div>
                <div class="example-text">{{ example.text }}</div>
              </div>
            </div>
          </div>
        </div>

        <TransitionGroup name="message" tag="div">
          <MessageItem
            v-for="message in messages"
            :key="message.id"
            :message="message"
            @copy="handleCopyMessage"
            @test="handleTestMessage"
            @regenerate="handleRegenerateMessage"
            @delete="handleDeleteMessage"
          />
        </TransitionGroup>
      </div>

      <div class="input-area">
        <div class="mode-select">
          <n-select v-model:value="chatMode" :options="modeOptions" size="small" style="width: 180px" />
        </div>
        <div v-if="chatMode === 'agent'" class="agent-select">
          <n-select
            v-model:value="forcedAgent"
            :options="agentOptions"
            size="small"
            style="width: 280px"
            placeholder="Choose an expert agent"
          />
          <n-button
            quaternary
            size="small"
            @click="showCustomAgentDialog = true"
            title="Create custom prompt engineer"
          >
            <template #icon>
              <n-icon><AddCircleOutline /></n-icon>
            </template>
          </n-button>
        </div>
        <div v-else class="free-chat-hint">
          <n-text type="info" depth="3" style="font-size: 12px;">
            Free chat mode: test a prompt directly
          </n-text>
        </div>

        <InputBox
          v-model="inputText"
          :loading="loading"
          :disabled="!isConfigured"
          :placeholder="chatMode === 'free' ? 'Enter a prompt or question to test...' : 'Ask your question and the best agent will respond...'"
          @send="handleSend"
          @export-md="emit('exportMd')"
          @copy-md="emit('copyMd')"
        />

        <n-text v-if="!isConfigured" depth="3" class="config-hint">
          Configure API key first in settings.
        </n-text>
      </div>
    </div>

    <n-modal v-model:show="showCustomAgentDialog" preset="card" title="Custom Engineer" style="width: 500px;">
      <n-form :model="customAgentForm" label-placement="top">
        <n-form-item label="Engineer name" required>
          <n-input v-model:value="customAgentForm.name" placeholder="e.g. Python Architect" />
        </n-form-item>
        <n-form-item label="System prompt" required>
          <n-input
            v-model:value="customAgentForm.prompt"
            type="textarea"
            placeholder="Define role, expertise, workflow and output style"
            :autosize="{ minRows: 4, maxRows: 8 }"
          />
        </n-form-item>
        <n-form-item label="Expertise (optional)">
          <n-input v-model:value="customAgentForm.expertise" placeholder="e.g. coding, writing, marketing" />
        </n-form-item>
      </n-form>

      <template #footer>
        <n-space justify="end">
          <n-button @click="showCustomAgentDialog = false">Cancel</n-button>
          <n-button
            type="primary"
            @click="handleCreateCustomAgent"
            :disabled="!customAgentForm.name.trim() || !customAgentForm.prompt.trim()"
          >
            Create
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted } from 'vue';
import {
  NButton,
  NIcon,
  NSpace,
  NText,
  NSelect,
  NModal,
  NInput,
  NForm,
  NFormItem,
  useMessage,
  useDialog,
} from 'naive-ui';
import { SettingsOutline, ChatboxOutline, AddCircleOutline } from '@vicons/ionicons5';
import MessageItem from './MessageItem.vue';
import InputBox from './InputBox.vue';
import ChatSidebar from './ChatSidebar.vue';
import type { ChatMessage } from '../types';
import { useChatHistory } from '../composables/useChatHistory';

interface Props {
  messages: ChatMessage[];
  loading?: boolean;
  isConfigured?: boolean;
}

interface CustomAgent {
  id: string;
  name: string;
  prompt: string;
  expertise?: string;
  icon: string;
  color: string;
}

interface Emits {
  (e: 'send', message: string, forcedAgent?: string): void;
  (e: 'sendExample', example: string): void;
  (e: 'openSettings'): void;
  (e: 'exportMd'): void;
  (e: 'copyMd'): void;
  (e: 'loadSession', messages: ChatMessage[]): void;
  (e: 'copyMessage', message: ChatMessage): void;
  (e: 'deleteMessage', message: ChatMessage): void;
  (e: 'freeChat', message: string): void;
  (e: 'testPrompt', prompt: string): void;
  (e: 'updateLoading', loading: boolean): void;
  (e: 'regenerate', userMessage: string, originalMessage: ChatMessage): void;
  (e: 'customAgentsUpdate', agents: CustomAgent[]): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  isConfigured: false,
});

const emit = defineEmits<Emits>();
const message = useMessage();
const dialog = useDialog();

const { createSession, switchSession, updateSessionMessages } = useChatHistory();

const inputText = ref('');
const forcedAgent = ref<string>('AUTO');
const chatMode = ref<'agent' | 'free'>('agent');
const showCustomAgentDialog = ref(false);
const customAgents = ref<CustomAgent[]>([]);
const customAgentForm = ref({
  name: '',
  prompt: '',
  expertise: '',
});
const messagesContainer = ref<HTMLElement>();

const modeOptions = [
  { label: 'Agent Mode', value: 'agent' },
  { label: 'Free Chat', value: 'free' },
];

const agentOptions = computed(() => [
  { label: 'Auto (Conductor)', value: 'AUTO' },
  { label: 'X0 Optimizer', value: 'X0_OPTIMIZER' },
  { label: 'X0 Reverse', value: 'X0_REVERSE' },
  { label: 'X1 Basic', value: 'X1_BASIC' },
  { label: 'X4 Scenario', value: 'X4_SCENARIO' },
  ...customAgents.value.map((agent) => ({
    label: `Custom: ${agent.name}`,
    value: agent.id.startsWith('CUSTOM_') ? agent.id : `CUSTOM_${agent.id}`,
  })),
]);

const examples = [
  { icon: '📊', text: 'Design a data analysis assistant prompt' },
  { icon: '⚡', text: 'Optimize this prompt: You are a Python assistant' },
  { icon: '🤖', text: 'Design a general AI assistant prompt' },
  { icon: '🧪', text: 'Build a code review agent prompt' },
];

const loadCustomAgents = () => {
  try {
    const saved = localStorage.getItem('custom-engineers');
    if (!saved) return;
    const parsed = JSON.parse(saved) as CustomAgent[];
    if (!Array.isArray(parsed)) return;
    customAgents.value = parsed;
    if (customAgents.value.length > 0) {
      emit('customAgentsUpdate', customAgents.value);
    }
  } catch (error) {
    console.error('Failed to load custom agents:', error);
  }
};

const saveCustomAgents = () => {
  localStorage.setItem('custom-engineers', JSON.stringify(customAgents.value));
};

const handleCreateCustomAgent = () => {
  if (!customAgentForm.value.name.trim() || !customAgentForm.value.prompt.trim()) {
    message.warning('Please provide engineer name and system prompt.');
    return;
  }

  const newAgent: CustomAgent = {
    id: `${Date.now()}`,
    name: customAgentForm.value.name.trim(),
    prompt: customAgentForm.value.prompt.trim(),
    expertise: customAgentForm.value.expertise.trim() || undefined,
    icon: '🧠',
    color: '#0d7d74',
  };

  customAgents.value.push(newAgent);
  saveCustomAgents();
  emit('customAgentsUpdate', customAgents.value);
  forcedAgent.value = `CUSTOM_${newAgent.id}`;

  customAgentForm.value = { name: '', prompt: '', expertise: '' };
  showCustomAgentDialog.value = false;
  message.success(`Custom engineer "${newAgent.name}" created.`);
};

const handleNewChat = () => {
  createSession();
  emit('loadSession', []);
  emit('updateLoading', false);
};

const handleSelectSession = (sessionId: string) => {
  const messages = switchSession(sessionId);
  emit('loadSession', messages);
  emit('updateLoading', false);
};

const handleCopyMessage = (chatMessage: ChatMessage) => {
  emit('copyMessage', chatMessage);
};

const handleTestMessage = (chatMessage: ChatMessage) => {
  if (chatMessage.role !== 'assistant' || !chatMessage.content) return;
  chatMode.value = 'free';
  emit('testPrompt', chatMessage.content);
  nextTick(scrollToBottom);
};

const handleRegenerateMessage = (chatMessage: ChatMessage) => {
  const messageIndex = props.messages.findIndex((m) => m.id === chatMessage.id);
  if (messageIndex <= 0) return;

  const userMessage = props.messages[messageIndex - 1];
  if (userMessage.role !== 'user') return;

  emit('regenerate', userMessage.content, chatMessage);
};

const handleDeleteMessage = (chatMessage: ChatMessage) => {
  dialog.warning({
    title: 'Confirm delete',
    content: `Delete this ${chatMessage.role} message?`,
    positiveText: 'Delete',
    negativeText: 'Cancel',
    onPositiveClick: () => emit('deleteMessage', chatMessage),
  });
};

const handleSend = () => {
  const text = inputText.value.trim();
  if (!text) return;

  if (chatMode.value === 'free') {
    emit('freeChat', text);
  } else {
    emit('send', text, forcedAgent.value);
  }

  inputText.value = '';
};

const scrollToBottom = () => {
  if (!messagesContainer.value) return;
  messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
};

watch(
  () => props.messages,
  (newMessages) => {
    updateSessionMessages(newMessages);
    nextTick(scrollToBottom);
  },
  { deep: true }
);

watch(
  () => props.messages.length,
  () => nextTick(scrollToBottom)
);

onMounted(() => {
  loadCustomAgents();
});
</script>

<style scoped>
.chat-window {
  display: flex;
  height: 100vh;
  gap: 14px;
  padding: 14px;
  background: transparent;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  border-radius: var(--pm-radius-xl);
  border: 1px solid var(--pm-line-soft);
  background: var(--pm-surface-1);
  box-shadow: var(--pm-shadow-xl);
  overflow: hidden;
  position: relative;
}

.chat-main::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(14, 148, 137, 0.03) 0%, rgba(230, 121, 47, 0.03) 100%);
}

.chat-header {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(120deg, #0f9589 0%, #0d7e75 55%, #0b5e60 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.22);
  box-shadow: inset 0 -1px 0 rgba(255, 255, 255, 0.22);
}

.header-left {
  flex: 1;
}

.title {
  margin: 0;
  font-size: 25px;
  font-weight: 640;
  letter-spacing: 0.015em;
  color: white;
  text-wrap: balance;
  text-shadow: 0 3px 16px rgba(0, 0, 0, 0.16);
}

.subtitle {
  margin: 6px 0 0;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 560;
}

.header-right {
  display: flex;
  gap: 8px;
}

.header-right :deep(.n-button) {
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(14px);
}

.header-right :deep(.n-button:hover) {
  background: rgba(255, 255, 255, 0.24);
}

.header-right :deep(.n-icon) {
  color: white;
}

.messages-container {
  position: relative;
  z-index: 1;
  flex: 1;
  overflow-y: auto;
  padding: 28px 26px 18px;
  scroll-behavior: smooth;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 252, 250, 0.9) 100%);
}

.messages-container::-webkit-scrollbar {
  width: 9px;
}

.messages-container::-webkit-scrollbar-track {
  background: rgba(16, 71, 73, 0.04);
  border-radius: 999px;
}

.messages-container::-webkit-scrollbar-thumb {
  background: rgba(17, 76, 78, 0.2);
  border-radius: 999px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: rgba(17, 76, 78, 0.34);
}

.empty-state {
  margin-top: 66px;
  text-align: center;
  padding: 0 8px;
}

.empty-icon {
  margin-bottom: 14px;
}

.empty-title {
  font-size: 20px;
  font-weight: 620;
  color: var(--pm-ink-900);
  margin: 10px 0 6px;
}

.empty-description {
  color: var(--pm-ink-500);
  font-size: 13px;
  line-height: 1.7;
}

.example-cards {
  margin-top: 22px;
}

.example-label {
  color: var(--pm-ink-700);
  font-size: 12px;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  margin-bottom: 12px;
}

.example-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  max-width: 760px;
  margin: 0 auto;
}

.example-card {
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.95) 0%, rgba(243, 251, 248, 0.88) 100%);
  border: 1px solid var(--pm-line-soft);
  border-radius: 14px;
  padding: 12px 12px;
  display: flex;
  gap: 9px;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.22s ease, border-color 0.2s ease;
}

.example-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--pm-shadow-sm);
  border-color: rgba(14, 148, 137, 0.35);
}

.example-icon {
  font-size: 17px;
}

.example-text {
  font-size: 13px;
  color: var(--pm-ink-700);
}

.input-area {
  position: relative;
  z-index: 1;
  padding: 14px 22px 18px;
  background: linear-gradient(180deg, rgba(246, 252, 249, 0.84) 0%, rgba(255, 255, 255, 0.97) 100%);
  border-top: 1px solid var(--pm-line-soft);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mode-select,
.agent-select,
.free-chat-hint {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mode-select :deep(.n-base-selection),
.agent-select :deep(.n-base-selection) {
  border-radius: 11px;
  border: 1px solid var(--pm-line-soft);
  background: rgba(255, 255, 255, 0.86);
}

.free-chat-hint {
  flex: 1;
  padding: 8px 10px;
  background: rgba(14, 148, 137, 0.08);
  border: 1px solid rgba(14, 148, 137, 0.2);
  border-radius: 10px;
}

.config-hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  letter-spacing: 0.02em;
  text-align: center;
  color: #b7642a;
  font-weight: 560;
}

.message-enter-active {
  transition: all 0.36s cubic-bezier(0.16, 1, 0.3, 1);
}

.message-enter-from {
  opacity: 0;
  transform: translateY(18px);
}

@media (max-width: 1100px) {
  .chat-window {
    padding: 10px;
    gap: 10px;
  }

  .chat-header {
    padding: 16px 18px;
  }

  .messages-container {
    padding: 22px 16px 14px;
  }

  .input-area {
    padding: 12px 14px 14px;
  }

  .example-grid {
    grid-template-columns: 1fr;
    max-width: 540px;
  }
}

@media (max-width: 760px) {
  .chat-window {
    flex-direction: column;
    padding: 8px;
    gap: 8px;
  }

  .chat-main {
    min-height: 0;
    border-radius: 20px;
  }

  .title {
    font-size: 21px;
  }

  .subtitle {
    font-size: 11px;
  }

  .messages-container {
    padding: 18px 12px 10px;
  }

  .empty-state {
    margin-top: 30px;
  }

  .input-area {
    gap: 8px;
  }

  .agent-select,
  .mode-select {
    width: 100%;
  }
}
</style>