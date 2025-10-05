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
            style="width: 280px"
            placeholder="选择专家Agent"
            :render-label="renderAgentSelectOption"
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
    <n-modal v-model:show="showCustomAgentDialog" preset="card" :title="customAgentDialogTitle" style="width: 500px;">
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
            placeholder="isEditingAgent ? '更新工程师的系统提示词...' : '定义工程师的角色、专业领域、工作风格等。例如：你是一个资深的Python开发工程师，擅长代码优化、架构设计...'"
            :autosize="{ minRows: 4, maxRows: 8 }"
          />
        </n-form-item>
        <n-form-item label="专业领域（可选）">
          <n-input 
            v-model:value="customAgentForm.expertise" 
            placeholder="isEditingAgent ? '更新专业领域...' : '如：编程、写作、营销、设计等'"
          />
        </n-form-item>
      </n-form>
      
      <template #footer>
        <n-space justify="end">
          <n-button @click="handleCancelCustomAgentDialog">取消</n-button>
          <n-button type="primary" @click="isEditingAgent ? handleUpdateCustomAgent() : handleCreateCustomAgent()" :disabled="!customAgentForm?.name?.trim() || !customAgentForm?.prompt?.trim()">
            {{ isEditingAgent ? '更新工程师' : '创建工程师' }}
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 删除确认对话框 -->
    <n-modal
      v-model:show="showDeleteAgentDialog"
      preset="dialog"
      title="确认删除"
      type="warning"
      positive-text="删除"
      negative-text="取消"
      @positive-click="handleDeleteCustomAgent"
    >
      确定要删除自定义工程师「{{ agentToDelete?.name }}」吗？此操作不可撤销。
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted, h } from 'vue';
import { NButton, NIcon, NEmpty, NSpace, NText, NSelect, NModal, NCard, NInput, NForm, NFormItem, useMessage, useDialog } from 'naive-ui';
import {
  SettingsOutline,
  TrashOutline,
  ChatboxOutline,
  AddCircleOutline,
  CreateOutline,
  PencilOutline,
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

// 编辑和删除相关状态
const isEditingAgent = ref(false);
const editingAgentId = ref<string | null>(null);
const showDeleteAgentDialog = ref(false);
const agentToDelete = ref<{ id: string; name: string; prompt: string; expertise?: string; icon: string; color: string } | null>(null);

// 计算属性
const customAgentDialogTitle = computed(() => {
  return isEditingAgent.value ? '编辑自定义工程师' : '自定义提示词工程师';
});

// 从 localStorage 加载自定义工程师
const loadCustomAgents = () => {
  try {
    const saved = localStorage.getItem('custom-engineers');
    if (saved) {
      customAgents.value = JSON.parse(saved);
      // console.log('🔧 加载自定义工程师:', customAgents.value.length, '个');
      
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
    // console.log('🔧 保存自定义工程师:', customAgents.value.length, '个');
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
  { 
    label: '自动（Conductor）', 
    value: 'AUTO',
    hasActions: true,
    agentType: 'system',
    agentId: 'AUTO',
    agentName: 'Conductor'
  },
  { 
    label: 'X0 优化师', 
    value: 'X0_OPTIMIZER',
    hasActions: true,
    agentType: 'system',
    agentId: 'X0_OPTIMIZER',
    agentName: 'X0 优化师'
  },
  { 
    label: 'X0 逆向', 
    value: 'X0_REVERSE',
    hasActions: true,
    agentType: 'system',
    agentId: 'X0_REVERSE',
    agentName: 'X0 逆向'
  },
  { 
    label: 'X1 基础', 
    value: 'X1_BASIC',
    hasActions: true,
    agentType: 'system',
    agentId: 'X1_BASIC',
    agentName: 'X1 基础'
  },
  { 
    label: 'X4 场景', 
    value: 'X4_SCENARIO',
    hasActions: true,
    agentType: 'system',
    agentId: 'X4_SCENARIO',
    agentName: 'X4 场景'
  },
  ...customAgents.value.map(agent => ({
    label: `🔧 ${agent.name}`,
    value: agent.id.startsWith('CUSTOM_') ? agent.id : `CUSTOM_${agent.id}`,
    hasActions: true,
    agentType: 'custom',
    agentId: agent.id,
    agentName: agent.name,
    customAgent: true,
  })),
]);

// 渲染Agent选择选项
const renderAgentSelectOption = (option: any) => {
  if (!option) return h('span', '');
  
  return h('div', {
    class: 'agent-option',
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      position: 'relative'
    }
  }, [
    // Agent名称
    h('span', {
      style: {
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        paddingRight: '8px'
      }
    }, option.label || ''),
    
    // 操作按钮容器
    option.hasActions ? h('div', {
      class: 'agent-actions',
      style: {
        display: 'flex',
        gap: '2px',
        flexShrink: 0
      }
    }, [
      // 编辑按钮
      h('button', {
        type: 'button',
        class: 'agent-action-btn edit-btn',
        style: {
          background: 'none',
          border: 'none',
          color: '#666',
          cursor: 'pointer',
          padding: '2px 4px',
          fontSize: '11px',
          borderRadius: '3px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '20px',
          height: '20px'
        },
        title: '编辑',
        onClick: (e: MouseEvent) => {
          e.stopPropagation();
          handleEditAgent(option);
        }
      }, '✏️'),
      
      // 删除按钮（仅自定义Agent显示）
      option.agentType === 'custom' ? h('button', {
        type: 'button',
        class: 'agent-action-btn delete-btn',
        style: {
          background: 'none',
          border: 'none',
          color: '#e74c3c',
          cursor: 'pointer',
          padding: '2px 4px',
          fontSize: '11px',
          borderRadius: '3px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '20px',
          height: '20px'
        },
        title: '删除',
        onClick: (e: MouseEvent) => {
          e.stopPropagation();
          handleDeleteAgent(option);
        }
      }, '🗑️') : null
    ]) : null
  ]);
};

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
  // console.log('🔄 开始重新生成，目标消息:', message);
  
  // 找到对应的用户消息
  const messageIndex = props.messages.findIndex(m => m.id === message.id);
  // console.log('🔄 消息索引:', messageIndex);
  
  if (messageIndex > 0) {
    const userMessage = props.messages[messageIndex - 1];
    // console.log('🔄 找到用户消息:', userMessage);
    
    if (userMessage.role === 'user') {
      // 触发重新生成
      // console.log('🔄 触发重新生成事件');
      emit('regenerate', userMessage.content, message);
    } else {
      // console.log('🔄 前一条消息不是用户消息:', userMessage.role);
    }
  } else {
    // console.log('🔄 没有找到对应的用户消息');
  }
};

// 处理删除消息
const handleDeleteMessage = (message: ChatMessage) => {
  // console.log('🗑️ 删除消息:', message);
  
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
  
  // 重置表单和状态
  resetCustomAgentForm();
  
  showCustomAgentDialog.value = false;
  
  message.success(`自定义工程师 "${newAgent.name}" 创建成功！`);
  
  // 自动选择新创建的工程师
  forcedAgent.value = `CUSTOM_${newAgent.id}`;
  
  // 通知父组件更新自定义Agent
  emit('customAgentsUpdate', customAgents.value);
};

// 重置自定义Agent表单
const resetCustomAgentForm = () => {
  customAgentForm.value = {
    name: '',
    prompt: '',
    expertise: '',
  };
  isEditingAgent.value = false;
  editingAgentId.value = null;
};


// 处理Agent编辑（支持系统和自定义Agent）
const handleEditAgent = (option: any) => {
  if (option.agentType === 'custom') {
    // 编辑自定义Agent
    handleEditCustomAgent(option.agentId);
  } else {
    // 编辑系统Agent - 显示提示对话框
    dialog.warning({
      title: '编辑系统Agent',
      content: `您确定要编辑系统内置的"${option.agentName}"吗？\n\n⚠️ 注意：修改系统Agent可能会影响系统稳定性，建议仅在有经验的用户操作时进行。`,
      positiveText: '继续编辑',
      negativeText: '取消',
      onPositiveClick: () => {
        handleEditSystemAgent(option);
      }
    });
  }
};

// 处理Agent删除（支持系统和自定义Agent）
const handleDeleteAgent = (option: any) => {
  if (option.agentType === 'custom') {
    // 删除自定义Agent
    const agent = customAgents.value.find(a => a.id === option.agentId);
    if (agent) {
      agentToDelete.value = agent;
      showDeleteAgentDialog.value = true;
    }
  } else {
    // 删除系统Agent - 显示警告对话框
    dialog.error({
      title: '删除系统Agent',
      content: `⚠️ 系统内置Agent不能删除！\n\n"${option.agentName}" 是核心功能组件，删除会导致系统无法正常工作。\n\n如需临时禁用，请在自定义Agent中创建替代版本。`,
      positiveText: '我了解了',
      negativeText: '取消',
      onPositiveClick: () => {
        // 不执行任何操作，只是关闭对话框
      }
    });
  }
};

// 处理系统Agent编辑
const handleEditSystemAgent = (option: any) => {
  message.info(`正在准备编辑 "${option.agentName}" 的配置...`);
  // TODO: 这里可以实现系统Agent的编辑功能
  // 目前先显示一个提示，后续可以扩展为真正的编辑功能
  message.warning('系统Agent编辑功能正在开发中，敬请期待！');
};

// 编辑自定义Agent
const handleEditCustomAgent = (agentId: string) => {
  const agent = customAgents.value.find(a => a.id === agentId);
  if (!agent) {
    message.error('未找到要编辑的工程师');
    return;
  }

  // console.log('🔧 编辑自定义Agent:', agent);
  
  // 设置表单数据
  customAgentForm.value = {
    name: agent.name,
    prompt: agent.prompt,
    expertise: agent.expertise || '',
  };
  
  // 设置编辑状态
  isEditingAgent.value = true;
  editingAgentId.value = agentId;
  showCustomAgentDialog.value = true;
};

// 更新自定义Agent
const handleUpdateCustomAgent = () => {
  if (!editingAgentId.value) {
    message.error('编辑状态异常');
    return;
  }

  // 安全检查表单数据
  if (!customAgentForm.value || !customAgentForm.value.name || !customAgentForm.value.prompt) {
    message.warning('请填写完整的工程师信息');
    return;
  }

  const agentIndex = customAgents.value.findIndex(a => a.id === editingAgentId.value);
  if (agentIndex === -1) {
    message.error('未找到要更新的工程师');
    return;
  }

  // 更新Agent数据
  customAgents.value[agentIndex] = {
    ...customAgents.value[agentIndex],
    name: customAgentForm.value.name,
    prompt: customAgentForm.value.prompt,
    expertise: customAgentForm.value.expertise,
  };

  // 保存到 localStorage
  saveCustomAgents();
  
  // 重置表单和状态
  resetCustomAgentForm();
  
  showCustomAgentDialog.value = false;
  
  message.success(`自定义工程师 "${customAgentForm.value.name}" 更新成功！`);
  
  // 通知父组件更新自定义Agent
  emit('customAgentsUpdate', customAgents.value);
};

// 删除自定义Agent
const handleDeleteCustomAgent = () => {
  if (!agentToDelete.value) {
    message.error('删除状态异常');
    return;
  }

  // console.log('🗑️ 删除自定义Agent:', agentToDelete.value);

  // 从列表中移除
  const agentIndex = customAgents.value.findIndex(a => a.id === agentToDelete.value?.id);
  if (agentIndex !== -1) {
    customAgents.value.splice(agentIndex, 1);
    
    // 保存到 localStorage
    saveCustomAgents();
    
    // 如果当前选择的是要删除的Agent，重置为AUTO
    if (forcedAgent.value === `CUSTOM_${agentToDelete.value.id}`) {
      forcedAgent.value = 'AUTO';
    }
    
    message.success(`自定义工程师 "${agentToDelete.value.name}" 已删除`);
    
    // 通知父组件更新自定义Agent
    emit('customAgentsUpdate', customAgents.value);
  }

  // 重置删除状态
  agentToDelete.value = null;
  showDeleteAgentDialog.value = false;
};

// 取消自定义Agent对话框
const handleCancelCustomAgentDialog = () => {
  resetCustomAgentForm();
  showCustomAgentDialog.value = false;
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

/* Agent选择框悬停效果 */
.agent-option {
  position: relative;
}

.agent-option .agent-actions {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.agent-option:hover .agent-actions {
  opacity: 1;
}

.agent-action-btn {
  opacity: 0.7;
  transition: all 0.2s ease;
}

.agent-action-btn:hover {
  opacity: 1 !important;
  background-color: rgba(0, 0, 0, 0.05) !important;
  transform: scale(1.1);
}

.edit-btn:hover {
  background-color: rgba(102, 126, 234, 0.1) !important;
  color: #667eea !important;
}

.delete-btn:hover {
  background-color: rgba(231, 76, 60, 0.1) !important;
  color: #e74c3c !important;
}
</style>

