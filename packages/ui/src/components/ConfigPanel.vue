<template>
  <n-drawer v-model:show="visible" :width="480" placement="right">
    <n-drawer-content title="⚙️ 系统配置" closable>
      <n-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-placement="top"
      >
        <!-- 模型提供商 -->
        <n-form-item label="模型提供商" path="provider">
          <n-select
            v-model:value="formData.provider"
            :options="providerOptions"
            placeholder="选择模型提供商"
          />
        </n-form-item>

        <!-- API Key -->
        <n-form-item label="API Key" path="apiKey">
          <n-input
            v-model:value="formData.apiKey"
            type="password"
            show-password-on="click"
            placeholder="输入 API Key"
          />
        </n-form-item>

        <!-- Base URL -->
        <n-form-item label="Base URL（可选）" path="baseURL">
          <n-input
            v-model:value="formData.baseURL"
            placeholder="例如: https://api.deepseek.com"
          />
        </n-form-item>

        <!-- 模型名称 -->
        <n-form-item label="模型名称" path="model">
          <n-input
            v-model:value="formData.model"
            placeholder="例如: deepseek-chat"
          />
        </n-form-item>

        <!-- 高级参数 -->
        <n-divider />
        <n-collapse>
          <n-collapse-item title="高级参数" name="advanced">
            <!-- Temperature -->
            <n-form-item label="Temperature" path="temperature">
              <n-slider
                v-model:value="formData.temperature"
                :min="0"
                :max="2"
                :step="0.1"
                :marks="{ 0: '0', 1: '1', 2: '2' }"
              />
              <n-input-number
                v-model:value="formData.temperature"
                :min="0"
                :max="2"
                :step="0.1"
                size="small"
                style="margin-top: 8px"
              />
            </n-form-item>

            <!-- Max Tokens -->
            <n-form-item label="Max Tokens" path="maxTokens">
              <n-input-number
                v-model:value="formData.maxTokens"
                :min="512"
                :max="32000"
                :step="512"
                style="width: 100%"
              />
            </n-form-item>

            <!-- Top P -->
            <n-form-item label="Top P" path="topP">
              <n-slider
                v-model:value="formData.topP"
                :min="0"
                :max="1"
                :step="0.05"
                :marks="{ 0: '0', 0.5: '0.5', 1: '1' }"
              />
              <n-input-number
                v-model:value="formData.topP"
                :min="0"
                :max="1"
                :step="0.05"
                size="small"
                style="margin-top: 8px"
              />
            </n-form-item>
          </n-collapse-item>
        </n-collapse>
      </n-form>

      <template #footer>
        <n-space justify="end">
          <n-button @click="handleCancel">取消</n-button>
          <n-button type="primary" @click="handleSave">保存配置</n-button>
        </n-space>
      </template>
    </n-drawer-content>
  </n-drawer>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NSelect,
  NInput,
  NInputNumber,
  NSlider,
  NButton,
  NSpace,
  NDivider,
  NCollapse,
  NCollapseItem,
  useMessage,
} from 'naive-ui';
import type { UserConfig } from '../types';

interface Props {
  show: boolean;
  config: UserConfig;
}

interface Emits {
  (e: 'update:show', value: boolean): void;
  (e: 'save', config: UserConfig): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const message = useMessage();

// 表单数据
const formData = ref<UserConfig>({ ...props.config });

// 显示状态
const visible = ref(props.show);

// 表单引用
const formRef = ref();

// 提供商选项
const providerOptions = [
  { label: 'DeepSeek', value: 'deepseek' },
  { label: 'OpenAI', value: 'openai' },
  { label: 'Gemini', value: 'gemini' },
];

// 验证规则
const rules = {
  provider: {
    required: true,
    message: '请选择模型提供商',
    trigger: 'change',
  },
  apiKey: {
    required: true,
    message: '请输入 API Key',
    trigger: 'blur',
  },
  model: {
    required: true,
    message: '请输入模型名称',
    trigger: 'blur',
  },
};

// 监听 show 变化
watch(() => props.show, (val) => {
  visible.value = val;
  if (val) {
    formData.value = { ...props.config };
  }
});

// 监听 visible 变化
watch(visible, (val) => {
  emit('update:show', val);
});

// 取消
const handleCancel = () => {
  visible.value = false;
};

// 保存
const handleSave = () => {
  formRef.value?.validate((errors: any) => {
    if (!errors) {
      emit('save', { ...formData.value });
      visible.value = false;
      message.success('配置已保存');
    } else {
      message.error('请填写必填项');
    }
  });
};
</script>

