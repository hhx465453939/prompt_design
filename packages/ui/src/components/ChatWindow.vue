<template>
  <div class="chat-window">
    <!-- 侧边栏 -->
    <ChatSidebar
      @new-chat="handleNewChat"
      @select-session="handleSelectSession"
    />

    <!-- 主聊天区域 -->
    <div class="chat-main">
      <!-- 顶部标题栏 -->
      <div class="chat-header">
        <div class="header-left">
          <h1 class="title">🤖 智能提示词工程师</h1>
          <p class="subtitle">AI Agent 矩阵 · 智能路由系统</p>
        </div>
        <div class="header-right">
          <n-button quaternary circle @click="emit('openSettings')">
            <template #icon>
              <n-icon><SettingsOutline /></n-icon>
            </template>
          </n-button>
          <n-button quaternary circle @click="emit('clearHistory')">
            <template #icon>
              <n-icon><TrashOutline /></n-icon>
            </template>
          </n-button>
        </div>
      </div>

      <!-- 消息列表区域 -->
      <div ref="messagesContainer" class="messages-container">
        <div v-if="messages.length === 0" class="empty-state">
          <div class="empty-icon">
            <n-icon size="120" :color="'#667eea'">
              <ChatboxOutline />
            </n-icon>
          </div>
          <h2 class="empty-title">开始对话，让 AI Agent 帮你生成和优化提示词</h2>
          <p class="empty-description">
            基于智能路由系统，自动识别你的需求并调度专业 Agent
          </p>
          <div class="example-cards">
            <div class="example-label">💡 快速开始</div>
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
          />
        </TransitionGroup>
      </div>

      <!-- 输入框区域 -->
      <div class="input-area">
        <div class="mode-select">
          <n-select 
            v-model:value="chatMode" 
            :options="modeOptions"
            size="small" 
            style="width: 180px"
          />
        </div>
        <div v-if="chatMode === 'agent'" class="agent-select">
          <n-select 
            v-model:value="forcedAgent" 
            :options="agentOptions" 
            size="small" 
            style="width: 200px"
            placeholder="选择专家Agent"
          />
        </div>
        <div v-else class="free-chat-hint">
          <n-text type="info" depth="3" style="font-size: 12px;">
            📝 自由聊天模式 - 直接测试提示词
          </n-text>
        </div>
        <InputBox
          v-model="inputText"
          :loading="loading"
          :disabled="!isConfigured"
          :placeholder="chatMode === 'free' ? '输入提示词或问题进行测试...' : '输入您的问题，AI Agent 将自动为您处理...'"
          @send="handleSend"
          @export-md="emit('exportMd')"
          @copy-md="emit('copyMd')"
        />
        <n-text v-if="!isConfigured" depth="3" class="config-hint">
          ⚠️ 请先在设置中配置 API 密钥
        </n-text>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, onMounted } from 'vue';
import { NButton, NIcon, NEmpty, NSpace, NText, NSelect } from 'naive-ui';
import {
  SettingsOutline,
  TrashOutline,
  ChatboxOutline,
} from '@vicons/ionicons5';
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

interface Emits {
  (e: 'send', message: string, forcedAgent?: string): void;
  (e: 'sendExample', example: string): void;
  (e: 'openSettings'): void;
  (e: 'clearHistory'): void;
  (e: 'exportMd'): void;
  (e: 'copyMd'): void;
  (e: 'loadSession', messages: ChatMessage[]): void;
  (e: 'copyMessage', message: ChatMessage): void;
  (e: 'freeChat', message: string): void;
  (e: 'testPrompt', prompt: string): void;
  (e: 'updateLoading', loading: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  isConfigured: false,
});

const emit = defineEmits<Emits>();

// 聊天历史管理
const {
  currentSession,
  createSession,
  switchSession,
  updateSessionMessages,
} = useChatHistory();

// 输入文本
const inputText = ref('');
const forcedAgent = ref<string>('AUTO');
const chatMode = ref('agent'); // 'agent' 或 'free'

// 模式选项
const modeOptions = [
  { label: '🤖 智能Agent模式', value: 'agent' },
  { label: '💬 自由聊天模式', value: 'free' },
];

const agentOptions = [
  { label: '自动（Conductor）', value: 'AUTO' },
  { label: 'X0 优化师', value: 'X0_OPTIMIZER' },
  { label: 'X0 逆向', value: 'X0_REVERSE' },
  { label: 'X1 基础', value: 'X1_BASIC' },
  { label: 'X4 场景', value: 'X4_SCENARIO' },
];

// 消息容器
const messagesContainer = ref<HTMLElement>();

// 处理新建聊天
const handleNewChat = () => {
  createSession();
  // 直接清空当前消息，不触发确认对话框
  emit('loadSession', []);
  // 重置loading状态
  emit('updateLoading', false);
};

// 处理选择会话
const handleSelectSession = (sessionId: string) => {
  const messages = switchSession(sessionId);
  emit('loadSession', messages);
  // 重置loading状态
  emit('updateLoading', false);
};

// 处理复制消息
const handleCopyMessage = (message: ChatMessage) => {
  emit('copyMessage', message);
};

// 处理测试提示词
const handleTestMessage = (message: ChatMessage) => {
  if (message.role === 'assistant' && message.content) {
    // 切换到自由聊天模式
    chatMode.value = 'free';
    // 发送提示词到自由聊天
    emit('testPrompt', message.content);
    // 滚动到底部
    nextTick(() => {
      scrollToBottom();
    });
  }
};

// 示例提示
const examples = [
  { icon: '📊', text: '帮我设计一个数据分析助手' },
  { icon: '⚡', text: '优化这个提示词：你是一个Python助手' },
  { icon: '🤖', text: '设计一个通用的AI助手' },
  { icon: '📝', text: '我需要一个代码审查助手' },
];

// 发送消息
const handleSend = () => {
  if (inputText.value.trim()) {
    const text = inputText.value.trim();
    if (chatMode.value === 'free') {
      // 自由聊天模式
      emit('freeChat', text);
    } else {
      // Agent模式
      emit('send', text, forcedAgent.value);
    }
    inputText.value = '';
  }
};

// 自动滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

// 监听消息变化，更新聊天历史
watch(() => props.messages, (newMessages) => {
  updateSessionMessages(newMessages);
  scrollToBottom();
}, { deep: true });

// 监听消息变化，自动滚动
watch(() => props.messages.length, scrollToBottom);

// 初始化时检查是否有当前会话，没有则创建新会话
onMounted(() => {
  if (!currentSession.value) {
    createSession();
  }
});
</script>

<style scoped>
.chat-window {
  display: flex;
  height: 100vh;
  background: #f8f9fa;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.header-left {
  flex: 1;
}

.title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.subtitle {
  margin: 6px 0 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 500;
}

.header-right {
  display: flex;
  gap: 12px;
}

.header-right :deep(.n-button) {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
}

.header-right :deep(.n-button:hover) {
  background: rgba(255, 255, 255, 0.25);
}

.header-right :deep(.n-icon) {
  color: white;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
  scroll-behavior: smooth;
}

.messages-container::-webkit-scrollbar {
  width: 8px;
}

.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.messages-container::-webkit-scrollbar-thumb {
  background: #d0d0d0;
  border-radius: 4px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: #b0b0b0;
}

.empty-state {
  margin-top: 80px;
  text-align: center;
}

.empty-icon { margin-bottom: 16px; }

.empty-title {
  font-size: 18px;
  color: #4b5563;
  margin: 8px 0 6px;
}

.empty-description {
  color: #9ca3af;
  font-size: 13px;
}

.example-cards { margin-top: 18px; }
.example-label { color: #6b7280; font-size: 13px; margin-bottom: 10px; }
.example-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; max-width: 720px; margin: 0 auto; }
.example-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px 12px; display: flex; gap: 8px; align-items: center; justify-content: center; cursor: pointer; transition: all .2s ease; }
.example-card:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(102,126,234,.18); border-color: #c7d2fe; }
.example-icon { font-size: 16px; }
.example-text { font-size: 13px; color: #374151; }

.input-area {
  padding: 20px 32px 24px;
  background: white;
  border-top: 1px solid #e8e8e8;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mode-select,
.agent-select,
.free-chat-hint {
  display: flex;
  align-items: center;
}

.free-chat-hint {
  flex: 1;
  padding: 8px 12px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 6px;
}

.config-hint {
  display: block;
  margin-top: 12px;
  font-size: 13px;
  text-align: center;
  color: #f0a020;
  font-weight: 500;
}

/* 消息动画 */
.message-enter-active {
  transition: all 0.4s ease;
}

.message-enter-from {
  opacity: 0;
  transform: translateY(30px);
}
</style>

