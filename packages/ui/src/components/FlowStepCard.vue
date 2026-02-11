<template>
  <div class="flow-step-card" :class="`status-${step.status || 'idle'}`">
    <div class="flow-step-header">
      <div class="flow-step-title">
        <span class="flow-step-index">{{ indexLabel }}</span>
        <span class="flow-step-text">{{ step.title }}</span>
      </div>
      <div class="flow-step-meta">
        <n-tag size="small" type="info" round>
          {{ agentLabel }}
        </n-tag>
        <n-tag
          size="small"
          :type="statusTag.type"
          round
        >
          {{ statusTag.label }}
        </n-tag>
      </div>
    </div>

    <div v-if="step.customInput" class="flow-step-hint">
      {{ step.customInput }}
    </div>

    <div v-if="step.outputFull" class="flow-step-output">
      <div class="flow-step-output-label">输出预览：</div>
      <div class="flow-step-output-content">
        {{ truncatedOutput }}
      </div>
    </div>

    <div v-if="step.errorMessage" class="flow-step-error">
      {{ step.errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { NTag } from 'naive-ui';
import type { FlowStep } from '../types';

interface Props {
  step: FlowStep;
  index: number;
}

const props = defineProps<Props>();

const indexLabel = computed(() => {
  return props.index < 9 ? `0${props.index + 1}` : String(props.index + 1);
});

const agentLabel = computed(() => {
  if (props.step.agentType?.startsWith('CUSTOM_')) {
    return 'Custom Agent';
  }
  return props.step.agentType || 'CONDUCTOR';
});

const statusTag = computed(() => {
  const status = props.step.status || 'idle';
  switch (status) {
    case 'running':
      return { label: '运行中', type: 'info' as const };
    case 'success':
      return { label: '已完成', type: 'success' as const };
    case 'error':
      return { label: '出错', type: 'error' as const };
    default:
      return { label: '待执行', type: 'default' as const };
  }
});

const truncatedOutput = computed(() => {
  const text = props.step.outputSummary || props.step.outputFull || '';
  if (!text) return '';
  return text.length > 220 ? `${text.slice(0, 220)}…` : text;
});
</script>

<style scoped>
.flow-step-card {
  border-radius: 14px;
  border: 1px solid var(--pm-line-soft);
  background: rgba(255, 255, 255, 0.98);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.flow-step-card.status-running {
  border-color: rgba(14, 148, 137, 0.5);
  box-shadow: 0 0 0 1px rgba(14, 148, 137, 0.18);
}

.flow-step-card.status-success {
  border-color: rgba(5, 150, 105, 0.35);
}

.flow-step-card.status-error {
  border-color: rgba(220, 38, 38, 0.4);
  background: rgba(254, 242, 242, 0.96);
}

.flow-step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.flow-step-title {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.flow-step-index {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--pm-ink-500);
  padding: 2px 6px;
  border-radius: 999px;
  background: rgba(15, 118, 110, 0.06);
}

.flow-step-text {
  font-size: 13px;
  font-weight: 560;
  color: var(--pm-ink-800);
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.flow-step-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.flow-step-hint {
  font-size: 12px;
  color: var(--pm-ink-600);
  line-height: 1.6;
}

.flow-step-output {
  border-radius: 10px;
  background: rgba(15, 118, 110, 0.03);
  padding: 6px 8px;
}

.flow-step-output-label {
  font-size: 11px;
  color: var(--pm-ink-500);
  margin-bottom: 2px;
}

.flow-step-output-content {
  font-size: 12px;
  color: var(--pm-ink-800);
  max-height: 80px;
  overflow: hidden;
}

.flow-step-error {
  font-size: 12px;
  color: #b91c1c;
}
</style>

