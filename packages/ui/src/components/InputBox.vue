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
        type="primary"
        :loading="loading"
        :disabled="disabled || !inputValue.trim()"
        @click="handleSend"
      >
        <template #icon>
          <n-icon><SendOutline /></n-icon>
        </template>
        发送
      </n-button>
    <n-button quaternary style="margin-left:8px" @click="emit('export-md')">导出 Markdown</n-button>
    <n-button quaternary style="margin-left:4px" @click="emit('copy-md')">复制 Markdown</n-button>
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
  placeholder: '输入你的需求，让 AI Agent 帮你生成提示词...',
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
  align-items: flex-end;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 2px solid #e8e8e8;
  transition: all 0.3s ease;
}

.input-box:focus-within {
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.input-box :deep(.n-input) {
  flex: 1;
}

.input-box :deep(.n-input__textarea-el) {
  font-size: 15px;
  line-height: 1.6;
}

.input-actions {
  display: flex;
  align-items: center;
}

.input-actions :deep(.n-button) {
  height: 40px;
  padding: 0 24px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: all 0.3s ease;
}

.input-actions :deep(.n-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.input-actions :deep(.n-button:active) {
  transform: translateY(0);
}
</style>

