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
      <div class="message-header">
        <span class="message-sender">{{ senderName }}</span>
        <AgentIndicator
          v-if="message.role === 'assistant' && message.agentType"
          :agent-type="message.agentType"
          :intent="message.intent"
        />
        <span class="message-time">{{ formatTime(message.timestamp) }}</span>
      </div>

      <div class="message-body">
        <template v-if="message.streaming">
          <div v-if="message.thinkingProcess" class="thinking-block">
            <div class="thinking-title">Thinking process</div>
            <div class="thinking-content" v-html="renderMarkdown(message.thinkingProcess)" />
          </div>
          <div v-if="message.content" class="message-text" v-html="renderMarkdown(message.content)" />
        </template>
        <n-alert v-else-if="message.isError" type="error" :title="'Error'">
          {{ currentContent }}
        </n-alert>
        <div v-else class="message-text" v-html="renderMarkdown(currentContent)" />
      </div>

      <div class="message-footer">
        <div class="message-meta">
          <n-tag v-if="message.tokensUsed" size="tiny" :bordered="false">
            {{ message.tokensUsed }} tokens
          </n-tag>
        </div>
        <div class="message-actions">
          <template v-if="message.role === 'assistant'">
            <div v-if="message.alternatives && message.alternatives.length > 0" class="history-navigation">
              <n-button
                quaternary
                size="tiny"
                @click="handlePreviousAlternative"
                :disabled="currentAlternativeIndex === 0"
                title="Previous answer"
              >
                <template #icon>
                  <n-icon><ChevronBackOutline /></n-icon>
                </template>
              </n-button>
              <span class="alternative-counter">{{ currentAlternativeIndex + 1 }} / {{ message.alternatives.length + 1 }}</span>
              <n-button
                quaternary
                size="tiny"
                @click="handleNextAlternative"
                :disabled="currentAlternativeIndex === message.alternatives.length"
                title="Next answer"
              >
                <template #icon>
                  <n-icon><ChevronForwardOutline /></n-icon>
                </template>
              </n-button>
            </div>

            <n-button
              quaternary
              size="tiny"
              circle
              @click="handleRegenerateAction"
              title="Regenerate answer"
              :loading="isRegenerating"
            >
              <template #icon>
                <n-icon><RefreshOutline /></n-icon>
              </template>
            </n-button>

            <n-button
              quaternary
              size="tiny"
              circle
              @click="emit('test', message)"
              title="Test this prompt in free chat"
            >
              <template #icon>
                <n-icon><FlaskOutline /></n-icon>
              </template>
            </n-button>
          </template>

          <n-dropdown :options="copyOptions" placement="bottom-end" @select="handleCopyAction">
            <n-button quaternary size="tiny" circle>
              <template #icon>
                <n-icon><CopyOutline /></n-icon>
              </template>
            </n-button>
          </n-dropdown>

          <n-button quaternary size="tiny" circle @click="emit('delete', message)" title="Delete message">
            <template #icon>
              <n-icon><TrashOutline /></n-icon>
            </template>
          </n-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { NAvatar, NIcon, NAlert, NTag, NButton, NDropdown } from 'naive-ui';
import {
  PersonOutline,
  CopyOutline,
  FlaskOutline,
  RefreshOutline,
  ChevronBackOutline,
  ChevronForwardOutline,
  TrashOutline,
} from '@vicons/ionicons5';
import { marked } from 'marked';
import AgentIndicator from './AgentIndicator.vue';
import type { ChatMessage } from '../types';
import type { AgentType } from '@prompt-matrix/core';

interface Props {
  message: ChatMessage;
}

interface Emits {
  (e: 'copy', message: ChatMessage, option?: string): void;
  (e: 'test', message: ChatMessage): void;
  (e: 'regenerate', message: ChatMessage): void;
  (e: 'delete', message: ChatMessage): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const currentAlternativeIndex = ref(0);
const isRegenerating = ref(false);

watch(
  () => props.message.streaming,
  (streaming) => {
    if (!streaming) {
      isRegenerating.value = false;
    }
  }
);

const currentContent = computed(() => {
  if (currentAlternativeIndex.value === 0) {
    return props.message.content;
  }
  return props.message.alternatives?.[currentAlternativeIndex.value - 1]?.content || '';
});

const handlePreviousAlternative = () => {
  if (currentAlternativeIndex.value > 0) {
    currentAlternativeIndex.value -= 1;
  }
};

const handleNextAlternative = () => {
  if (!props.message.alternatives) return;
  if (currentAlternativeIndex.value < props.message.alternatives.length) {
    currentAlternativeIndex.value += 1;
  }
};

const handleRegenerateAction = () => {
  isRegenerating.value = true;
  emit('regenerate', props.message);
};

const agentMap: Record<AgentType, { name: string; icon: string; color: string }> = {
  CONDUCTOR: { name: 'Conductor', icon: '🎯', color: '#18a058' },
  X0_OPTIMIZER: { name: 'X0 Optimizer', icon: '⚡', color: '#2080f0' },
  X0_REVERSE: { name: 'X0 Reverse', icon: '🔍', color: '#f0a020' },
  X1_BASIC: { name: 'X1 Basic', icon: '🧩', color: '#7d56f4' },
  X4_SCENARIO: { name: 'X4 Scenario', icon: '🎨', color: '#f06292' },
};

const senderName = computed(() => {
  if (props.message.role === 'user') return 'You';
  if (props.message.agentType) {
    return agentMap[props.message.agentType]?.name || 'Assistant';
  }
  return 'Assistant';
});

const agentIcon = computed(() => {
  if (props.message.agentType) {
    return agentMap[props.message.agentType]?.icon || '🤖';
  }
  return '🤖';
});

const agentColor = computed(() => {
  if (props.message.agentType) {
    return agentMap[props.message.agentType]?.color || '#18a058';
  }
  return '#18a058';
});

const formatTime = (timestamp?: number) => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const renderMarkdown = (content: string) => {
  return marked(content || '', {
    breaks: true,
    gfm: true,
  });
};

const copyOptions = computed(() => {
  const options = [{ label: 'Copy Markdown', key: 'markdown' }];
  if (props.message.role === 'assistant' && props.message.thinkingProcess) {
    options.push({
      label: 'Copy Markdown (with thinking)',
      key: 'markdown-with-thinking',
    });
  }
  return options;
});

const handleCopyAction = (key: string) => {
  emit('copy', props.message, key);
};
</script>

<style scoped>
.message-item {
  display: flex;
  gap: 12px;
  margin-bottom: 22px;
  animation: fadeIn 0.28s cubic-bezier(0.2, 0.9, 0.2, 1);
}

.message-user {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
}

.message-avatar :deep(.n-avatar) {
  box-shadow: 0 8px 22px rgba(8, 52, 56, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.message-content {
  flex: 1;
  min-width: 0;
  max-width: min(86%, 920px);
}

.message-user .message-content {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.message-sender {
  font-size: 13px;
  font-weight: 620;
  color: var(--pm-ink-700);
  letter-spacing: 0.02em;
}

.message-time {
  font-size: 11px;
  color: var(--pm-ink-500);
  margin-left: auto;
}

.message-user .message-time {
  margin-left: 0;
  margin-right: auto;
}

.message-body {
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.88);
  border-radius: 16px;
  box-shadow: var(--pm-shadow-sm);
  border: 1px solid var(--pm-line-soft);
  transition: transform 0.18s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.message-body:hover {
  box-shadow: var(--pm-shadow-md);
  transform: translateY(-1px);
  border-color: rgba(14, 148, 137, 0.24);
}

.message-user .message-body {
  background: linear-gradient(136deg, #ea8f45 0%, #d4712d 100%);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 12px 24px rgba(161, 91, 34, 0.24);
}

.message-text {
  font-size: 14px;
  line-height: 1.72;
  word-break: break-word;
  color: var(--pm-ink-900);
}

.message-user .message-text {
  color: #fff;
}

.message-text :deep(h1),
.message-text :deep(h2),
.message-text :deep(h3) {
  margin: 14px 0 10px;
  font-weight: 650;
  color: inherit;
}

.message-text :deep(p) {
  margin: 8px 0;
}

.message-text :deep(ul),
.message-text :deep(ol) {
  margin: 10px 0;
  padding-left: 22px;
}

.message-text :deep(li) {
  margin: 4px 0;
}

.message-text :deep(pre) {
  background: #132b30;
  color: #f3fffd;
  padding: 13px;
  border-radius: 10px;
  overflow-x: auto;
  margin: 10px 0;
  border: 1px solid rgba(220, 248, 243, 0.16);
  font-size: 12px;
}

.message-user .message-text :deep(pre) {
  background: rgba(255, 255, 255, 0.18);
  border-color: rgba(255, 255, 255, 0.3);
}

.message-text :deep(code) {
  background: rgba(13, 54, 58, 0.08);
  padding: 2px 6px;
  border-radius: 6px;
  font-family: 'JetBrains Mono', 'Cascadia Code', 'Consolas', monospace;
  font-size: 0.9em;
  color: #0d6164;
  border: 1px solid rgba(13, 54, 58, 0.1);
}

.message-user .message-text :deep(code) {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.35);
  color: #fff;
}

.message-text :deep(blockquote) {
  border-left: 3px solid #0d887e;
  padding-left: 12px;
  margin: 10px 0;
  color: #385156;
  font-style: italic;
}

.message-user .message-text :deep(blockquote) {
  border-left-color: rgba(255, 255, 255, 0.5);
  color: rgba(255, 255, 255, 0.92);
}

.message-footer {
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.message-meta {
  display: flex;
  gap: 6px;
  align-items: center;
}

.thinking-block {
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  background: linear-gradient(140deg, rgba(14, 148, 137, 0.08) 0%, rgba(14, 148, 137, 0.14) 100%);
  border: 1px solid rgba(14, 148, 137, 0.2);
}

.thinking-title {
  font-weight: 620;
  color: #0d746d;
  margin-bottom: 6px;
}

.history-navigation {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-right: 6px;
}

.alternative-counter {
  font-size: 11px;
  color: #0d7d74;
  font-weight: 620;
  padding: 0 4px;
  user-select: none;
}

.message-actions {
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 0.2s ease, transform 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.message-item:hover .message-actions {
  opacity: 1;
  transform: translateY(0);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 760px) {
  .message-item {
    gap: 8px;
    margin-bottom: 16px;
  }

  .message-content {
    max-width: 100%;
  }

  .message-body {
    padding: 12px 12px;
  }

  .message-text {
    font-size: 13px;
  }
}
</style>