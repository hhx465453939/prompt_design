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
            @regenerate="handleRegenerateMessage"
            @delete="handleDeleteMessage"
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
          <n-button
            quaternary
            size="small"
            @click="showCustomAgentDialog = true"
            title="自定义提示词工程师"
          >
            <template #icon>
              <n-icon><AddCircleOutline /></n-icon>
            </template>
          </n-button>
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

    <!-- 自定义工程师对话框 -->
    <n-modal v-model:show="showCustomAgentDialog" preset="card" title="自定义提示词工程师" style="width: 500px;">
      <n-form ref="customAgentFormRef" :model="customAgentForm" label-placement="top">
        <n-form-item label="工程师名称" required>
          <n-input 
            v-model:value="customAgentForm.name" 
            placeholder="给你的提示词工程师起个名字，如：Python专家、营销顾问等"
          />
        </n-form-item>
        <n-form-item label="系统提示词" required>
          <n-input 
            v-model:value="customAgentForm.prompt" 
            type="textarea"
            placeholder="定义工程师的角色、专业领域、工作风格等。例如：你是一个资深的Python开发工程师，擅长代码优化、架构设计..."
            :autosize="{ minRows: 4, maxRows: 8 }"
          />
        </n-form-item>
        <n-form-item label="专业领域（可选）">
          <n-input 
            v-model:value="customAgentForm.expertise" 
            placeholder="如：编程、写作、营销、设计等"
          />
        </n-form-item>
      </n-form>
      
      <template #footer>
        <n-space justify="end">
          <n-button @click="showCustomAgentDialog = false">取消</n-button>
          <n-button type="primary" @click="handleCreateCustomAgent" :disabled="!customAgentForm?.name?.trim() || !customAgentForm?.prompt?.trim()">
            创建工程师
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted } from 'vue';
import { NButton, NIcon, NEmpty, NSpace, NText, NSelect, NModal, NCard, NInput, NForm, NFormItem, useMessage, useDialog } from 'naive-ui';
import {
  SettingsOutline,
  TrashOutline,
  ChatboxOutline,
  AddCircleOutline,
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
  (e: 'exportMd'): void;
  (e: 'copyMd'): void;
  (e: 'loadSession', messages: ChatMessage[]): void;
  (e: 'copyMessage', message: ChatMessage): void;
  (e: 'deleteMessage', message: ChatMessage): void;
  (e: 'freeChat', message: string): void;
  (e: 'testPrompt', prompt: string): void;
  (e: 'updateLoading', loading: boolean): void;
  (e: 'regenerate', userMessage: string, originalMessage: ChatMessage): void;
  (e: 'customAgentsUpdate', agents: Array<{ id: string; name: string; prompt: string; expertise?: string; icon: string; color: string }>): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  isConfigured: false,
});

const emit = defineEmits<Emits>();
const message = useMessage();
const dialog = useDialog();

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

// 自定义工程师相关状态
const showCustomAgentDialog = ref(false);
const customAgentFormRef = ref();
const customAgents = ref<Array<{ id: string; name: string; prompt: string; expertise?: string; icon: string; color: string }>>([]);
const customAgentForm = ref({
  name: '',
  prompt: '',
  expertise: '',
});

// 从 localStorage 加载自定义工程师
const loadCustomAgents = () => {
  try {
    const saved = localStorage.getItem('custom-engineers');
    if (saved) {
      customAgents.value = JSON.parse(saved);
      console.log('🔧 加载自定义工程师:', customAgents.value.length, '个');
      
      // 通知父组件更新自定义Agent
      if (customAgents.value.length > 0) {
        emit('customAgentsUpdate', customAgents.value);
      }
    }
  } catch (error) {
    console.error('❌ 加载自定义工程师失败:', error);
  }
};

// 保存自定义工程师到 localStorage
const saveCustomAgents = () => {
  try {
    localStorage.setItem('custom-engineers', JSON.stringify(customAgents.value));
    console.log('🔧 保存自定义工程师:', customAgents.value.length, '个');
  } catch (error) {
    console.error('❌ 保存自定义工程师失败:', error);
  }
};

// 模式选项
const modeOptions = [
  { label: '🤖 智能Agent模式', value: 'agent' },
  { label: '💬 自由聊天模式', value: 'free' },
];

const agentOptions = computed(() => [
  { label: '自动（Conductor）', value: 'AUTO' },
  { label: 'X0 优化师', value: 'X0_OPTIMIZER' },
  { label: 'X0 逆向', value: 'X0_REVERSE' },
  { label: 'X1 基础', value: 'X1_BASIC' },
  { label: 'X4 场景', value: 'X4_SCENARIO' },
  ...customAgents.value.map(agent => ({
    label: `🔧 ${agent.name}`,
    value: agent.id.startsWith('CUSTOM_') ? agent.id : `CUSTOM_${agent.id}`,
  })),
]);

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

// 处理重新生成
const handleRegenerateMessage = (message: ChatMessage) => {
  console.log('🔄 开始重新生成，目标消息:', message);
  
  // 找到对应的用户消息
  const messageIndex = props.messages.findIndex(m => m.id === message.id);
  console.log('🔄 消息索引:', messageIndex);
  
  if (messageIndex > 0) {
    const userMessage = props.messages[messageIndex - 1];
    console.log('🔄 找到用户消息:', userMessage);
    
    if (userMessage.role === 'user') {
      // 触发重新生成
      console.log('🔄 触发重新生成事件');
      emit('regenerate', userMessage.content, message);
    } else {
      console.log('🔄 前一条消息不是用户消息:', userMessage.role);
    }
  } else {
    console.log('🔄 没有找到对应的用户消息');
  }
};

// 处理删除消息
const handleDeleteMessage = (message: ChatMessage) => {
  console.log('🗑️ 删除消息:', message);
  
  // 显示确认对话框
  dialog.warning({
    title: '确认删除',
    content: `确定要删除这条${message.role === 'user' ? '用户' : '助手'}消息吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: () => {
      emit('deleteMessage', message);
    },
  });
};

// 创建自定义工程师
const handleCreateCustomAgent = () => {
  // 安全检查表单数据
  if (!customAgentForm.value || !customAgentForm.value.name || !customAgentForm.value.prompt) {
    message.warning('请填写完整的工程师信息');
    return;
  }

  const newAgent = {
    id: `${Date.now()}`,
    name: customAgentForm.value.name,
    prompt: customAgentForm.value.prompt,
    expertise: customAgentForm.value.expertise,
    icon: '🔧',
    color: '#7c3aed',
  };

  customAgents.value.push(newAgent);
  
  // 保存到 localStorage
  saveCustomAgents();
  
  // 重置表单
  customAgentForm.value = {
    name: '',
    prompt: '',
    expertise: '',
  };
  
  showCustomAgentDialog.value = false;
  
  message.success(`自定义工程师 "${newAgent.name}" 创建成功！`);
  
  // 自动选择新创建的工程师
  forcedAgent.value = `CUSTOM_${newAgent.id}`;
  
  // 通知父组件更新自定义Agent
  emit('customAgentsUpdate', customAgents.value);
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

// 初始化时加载自定义工程师
onMounted(() => {
  // 加载自定义工程师
  loadCustomAgents();
  // 注意：不在这里自动创建会话，避免与清空历史功能冲突
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

