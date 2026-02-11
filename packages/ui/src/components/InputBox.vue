<template>
  <div class="input-box">
    <n-input
      v-model:value="inputValue"
      type="textarea"
      :placeholder="placeholder"
      :autosize="{ minRows: 1, maxRows: 6 }"
      :disabled="disabled"
      @keydown.enter.exact.prevent="handleSend"
    />
    <div class="input-actions">
      <n-button
        class="send-btn"
        type="primary"
        :loading="loading"
        :disabled="disabled || !inputValue.trim()"
        @click="handleSend"
      >
        <template #icon>
          <n-icon><SendOutline /></n-icon>
        </template>
        Send
      </n-button>
      <n-button class="tool-btn" quaternary @click="emit('export-md')">Export Markdown</n-button>
      <n-button class="tool-btn" quaternary @click="emit('copy-md')">Copy Markdown</n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { NInput, NButton, NIcon } from 'naive-ui';
import { SendOutline } from '@vicons/ionicons5';

interface Props {
  modelValue?: string;
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'send'): void;
  (e: 'export-md'): void;
  (e: 'copy-md'): void;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  loading: false,
  disabled: false,
  placeholder: 'Describe what you need and let an AI agent help you build the prompt...',
});

const emit = defineEmits<Emits>();

const inputValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const handleSend = () => {
  if (!props.disabled && !props.loading && inputValue.value.trim()) {
    emit('send');
  }
};
</script>

<style scoped>
.input-box {
  display: flex;
  align-items: stretch;
  gap: 10px;
  padding: 10px;
  border-radius: 16px;
  border: 1px solid var(--pm-line-soft);
  background: rgba(255, 255, 255, 0.84);
  box-shadow: var(--pm-shadow-sm);
  position: relative;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.input-box:focus-within {
  border-color: rgba(14, 148, 137, 0.44);
  box-shadow: 0 0 0 4px rgba(14, 148, 137, 0.14), var(--pm-shadow-md);
  transform: translateY(-1px);
}

.input-box :deep(.n-input) {
  flex: 1;
  min-width: 0;
}

.input-box :deep(.n-input__border),
.input-box :deep(.n-input__state-border) {
  display: none;
}

.input-box :deep(.n-input-wrapper) {
  background: transparent;
  padding: 6px 2px;
}

.input-box :deep(.n-input__textarea-el) {
  font-size: 14px;
  line-height: 1.7;
  color: var(--pm-ink-900);
}

.input-actions {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  flex-wrap: wrap;
}

.send-btn {
  height: 40px;
  min-width: 108px;
  border-radius: 11px;
  font-weight: 620;
  background: linear-gradient(130deg, #119c91 0%, #0d7d74 100%);
  border: 1px solid rgba(12, 96, 89, 0.28);
  box-shadow: 0 10px 24px rgba(10, 92, 84, 0.24);
}

.send-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 26px rgba(10, 92, 84, 0.3);
}

.tool-btn {
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--pm-line-soft);
  background: rgba(255, 255, 255, 0.88);
  color: var(--pm-ink-700);
  font-size: 12px;
}

.tool-btn:hover {
  border-color: rgba(14, 148, 137, 0.32);
  color: #0d7d74;
}

@media (max-width: 760px) {
  .input-box {
    flex-direction: column;
    align-items: stretch;
  }

  .input-actions {
    justify-content: flex-end;
  }

  .send-btn {
    min-width: 96px;
  }
}
</style>