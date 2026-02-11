<template>
  <div class="flow-timeline">
    <div class="flow-header">
      <div class="flow-header-main">
        <div class="flow-title">Prompt Flow</div>
        <div class="flow-subtitle">
          以线性步骤编排 X0/X1/X4 等工程师，形成可复用的提示词流水线。
        </div>
      </div>
      <div class="flow-header-actions">
        <n-select
          v-model:value="internalActiveId"
          :options="templateOptions"
          size="small"
          style="min-width: 220px"
          @update:value="handleTemplateChange"
        />
        <n-button
          size="small"
          type="primary"
          :loading="running"
          :disabled="!canRun"
          @click="$emit('run-flow')"
        >
          {{ running ? '运行中…' : '运行当前 Flow' }}
        </n-button>
      </div>
    </div>

    <div v-if="steps.length === 0" class="flow-empty">
      当前没有可用的 Flow 模板。
    </div>

    <div v-else class="flow-steps">
      <FlowStepCard
        v-for="(step, index) in steps"
        :key="step.id"
        :step="step"
        :index="index"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NSelect, NButton } from 'naive-ui';
import FlowStepCard from './FlowStepCard.vue';
import type { FlowStep, FlowTemplate } from '../types';

interface Props {
  steps: FlowStep[];
  templates: FlowTemplate[];
  activeTemplateId: string | null;
  running?: boolean;
}

interface Emits {
  (e: 'select-template', id: string): void;
  (e: 'run-flow'): void;
}

const props = withDefaults(defineProps<Props>(), {
  running: false,
});

const emit = defineEmits<Emits>();

const internalActiveId = ref<string | null>(props.activeTemplateId);

watch(
  () => props.activeTemplateId,
  (val) => {
    internalActiveId.value = val;
  }
);

const templateOptions = computed(() =>
  props.templates.map((tpl) => ({
    label: tpl.name,
    value: tpl.id,
  }))
);

const canRun = computed(() => props.steps.length > 0 && !props.running);

const handleTemplateChange = (id: string | null) => {
  if (!id) return;
  emit('select-template', id);
};
</script>

<style scoped>
.flow-timeline {
  border-radius: 18px;
  border: 1px solid var(--pm-line-soft);
  background: radial-gradient(circle at 0% 0%, rgba(16, 185, 129, 0.06), transparent 55%),
    radial-gradient(circle at 100% 0%, rgba(59, 130, 246, 0.06), transparent 55%),
    rgba(255, 255, 255, 0.96);
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.flow-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.flow-header-main {
  min-width: 0;
}

.flow-title {
  font-size: 13px;
  font-weight: 620;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--pm-ink-800);
}

.flow-subtitle {
  font-size: 11px;
  color: var(--pm-ink-500);
  margin-top: 2px;
}

.flow-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.flow-steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 8px;
}

.flow-empty {
  font-size: 12px;
  color: var(--pm-ink-500);
}

@media (max-width: 900px) {
  .flow-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .flow-header-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>

