<template>
  <div :class="['message-item', `message-${message.role}`]">
    <div class="message-avatar">
      <n-avatar v-if="message.role === 'user'" :size="36">
        <n-icon><PersonOutline /></n-icon>
      </n-avatar>
      <n-avatar v-else :size="36" :style="{ background: agentColor }">
        {{ agentIcon }}
      </n-avatar>
    </div>

    <div class="message-content">
      <!-- 消息头部 -->
      <div class="message-header">
        <span class="message-sender">{{ senderName }}</span>
        <AgentIndicator
          v-if="message.role === 'assistant' && message.agentType"
          :agent-type="message.agentType"
          :intent="message.intent"
        />
        <span class="message-time">
          {{ formatTime(message.timestamp) }}
        </span>
      </div>

      <!-- 消息主体 -->
      <div class="message-body">
        <template v-if="message.streaming">
          <div v-if="message.thinkingProcess" class="thinking-block">
            <div class="thinking-title">思考过程</div>
            <div class="thinking-content" v-html="renderMarkdown(message.thinkingProcess)" />
          </div>
          <div v-if="message.content" class="message-text" v-html="renderMarkdown(message.content)" />
        </template>
        <n-alert
          v-else-if="message.isError"
          type="error"
          :title="'错误'"
        >
          {{ message.content }}
        </n-alert>
        <div v-else class="message-text" v-html="renderMarkdown(message.content)" />
      </div>

      <!-- 消息底部元信息 -->
      <div class="message-footer">
        <div class="message-meta">
          <n-tag v-if="message.tokensUsed" size="tiny" :bordered="false">
            📊 {{ message.tokensUsed }} tokens
          </n-tag>
        </div>
        <div class="message-actions">
          <n-dropdown
            :options="copyOptions"
            placement="bottom-end"
            @select="handleCopyAction"
          >
            <n-button quaternary size="tiny" circle>
              <template #icon>
                <n-icon><CopyOutline /></n-icon>
              </template>
            </n-button>
          </n-dropdown>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { NAvatar, NIcon, NSpin, NAlert, NTag, NButton, NDropdown } from 'naive-ui';
import { PersonOutline, CopyOutline } from '@vicons/ionicons5';
import { marked } from 'marked';
import AgentIndicator from './AgentIndicator.vue';
import type { ChatMessage } from '../types';
import type { AgentType } from '@prompt-matrix/core';

interface Props {
  message: ChatMessage;
}

interface Emits {
  (e: 'copy', message: ChatMessage, option?: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Agent 映射
const agentMap: Record<AgentType, { name: string; icon: string; color: string }> = {
  CONDUCTOR: { name: '指挥官', icon: '🎯', color: '#18a058' },
  X0_OPTIMIZER: { name: 'X0优化师', icon: '⚡', color: '#2080f0' },
  X0_REVERSE: { name: 'X0逆向', icon: '🔍', color: '#f0a020' },
  X1_BASIC: { name: 'X1基础', icon: '📝', color: '#9c27b0' },
  X4_SCENARIO: { name: 'X4场景', icon: '🎨', color: '#f06292' },
};

// 发送者名称
const senderName = computed(() => {
  if (props.message.role === 'user') return '你';
  if (props.message.agentType) {
    return agentMap[props.message.agentType]?.name || 'AI助手';
  }
  return 'AI助手';
});

// Agent 图标
const agentIcon = computed(() => {
  if (props.message.agentType) {
    return agentMap[props.message.agentType]?.icon || '🤖';
  }
  return '🤖';
});

// Agent 颜色
const agentColor = computed(() => {
  if (props.message.agentType) {
    return agentMap[props.message.agentType]?.color || '#18a058';
  }
  return '#18a058';
});

// 格式化时间
const formatTime = (timestamp?: number) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// 渲染 Markdown
const renderMarkdown = (content: string) => {
  return marked(content, {
    breaks: true,
    gfm: true,
  });
};

// 复制选项
const copyOptions = computed(() => {
  const options = [
    {
      label: '复制 Markdown',
      key: 'markdown',
    },
  ];

  // 如果是助手消息且有思考过程，添加包含思考的选项
  if (props.message.role === 'assistant' && props.message.thinkingProcess) {
    options.push({
      label: '复制 Markdown（包含思考）',
      key: 'markdown-with-thinking',
    });
  }

  return options;
});

// 处理复制操作
const handleCopyAction = (key: string) => {
  emit('copy', props.message, key);
};
</script>

<style scoped>
.message-item {
  display: flex;
  gap: 16px;
  margin-bottom: 28px;
  animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.message-user {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
}

.message-avatar :deep(.n-avatar) {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.message-content {
  flex: 1;
  min-width: 0;
  max-width: 80%;
}

.message-user .message-content {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.message-sender {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
}

.message-time {
  font-size: 12px;
  color: #95a5a6;
  margin-left: auto;
}

.message-body {
  padding: 16px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e8e8e8;
  transition: all 0.2s ease;
}

.message-body:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.message-user .message-body {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.message-text {
  font-size: 15px;
  line-height: 1.7;
  word-break: break-word;
  color: #2c3e50;
}

.message-user .message-text {
  color: white;
}

.message-text :deep(h1),
.message-text :deep(h2),
.message-text :deep(h3) {
  margin: 16px 0 12px;
  font-weight: 600;
  color: inherit;
}

.message-text :deep(p) {
  margin: 8px 0;
}

.message-text :deep(ul),
.message-text :deep(ol) {
  margin: 12px 0;
  padding-left: 24px;
}

.message-text :deep(li) {
  margin: 4px 0;
}

.message-text :deep(pre) {
  background: #f6f8fa;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 12px 0;
  border: 1px solid #e1e4e8;
}

.message-user .message-text :deep(pre) {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.2);
}

.message-text :deep(code) {
  background: #f6f8fa;
  padding: 3px 8px;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.9em;
  color: #e83e8c;
  border: 1px solid #e1e4e8;
}

.message-user .message-text :deep(code) {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  color: white;
}

.message-text :deep(blockquote) {
  border-left: 4px solid #667eea;
  padding-left: 16px;
  margin: 12px 0;
  color: #6c757d;
  font-style: italic;
}

.message-footer {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.message-meta {
  display: flex;
  gap: 8px;
  align-items: center;
}

.message-actions {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.message-item:hover .message-actions {
  opacity: 1;
}

.thinking {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #667eea;
}

.thinking-text {
  font-size: 13px;
}

.thinking-block {
  margin-top: 10px;
  padding: 12px;
  border-radius: 8px;
  background: #f6f7ff;
  border: 1px solid #e5e7ff;
}

.thinking-title {
  font-weight: 600;
  color: #4f46e5;
  margin-bottom: 6px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>

