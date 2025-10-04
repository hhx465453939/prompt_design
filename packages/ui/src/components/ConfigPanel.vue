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
          <n-space vertical style="width: 100%;">
            <n-select
              :value="getProviderValue()"
              :options="providerOptions"
              placeholder="选择模型提供商"
              @update:value="handleProviderChange"
            />
            <n-button 
              type="info" 
              dashed 
              size="small" 
              @click="showCustomProviderManager = true"
            >
              🔧 管理自定义供应商
            </n-button>
          </n-space>
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
          <n-space vertical style="width: 100%;">
            <n-input-group>
              <n-select
                v-model:value="formData.model"
                :options="modelSelectOptions"
                placeholder="选择或输入模型名称"
                filterable
                tag
                :loading="loadingModels"
                clearable
              />
              <n-button 
                type="primary" 
                ghost 
                @click="testConnection"
                :loading="testingConnection"
                size="medium"
              >
                测试连接
              </n-button>
              <n-button 
                type="info" 
                ghost 
                @click="loadModels"
                :loading="loadingModels"
                size="medium"
              >
                刷新模型
              </n-button>
            </n-input-group>
            <n-text v-if="availableModels.length > 0" depth="3" style="font-size: 12px;">
              已加载 {{ availableModels.length }} 个模型，点击"刷新模型"更新列表
            </n-text>
          </n-space>
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

  <!-- 自定义供应商管理器 -->
  <CustomProviderManager
    :show="showCustomProviderManager"
    @update:show="showCustomProviderManager = $event"
    @provider-saved="handleCustomProviderSaved"
  />
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue';
import {
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NSelect,
  NInput,
  NInputGroup,
  NInputNumber,
  NSlider,
  NButton,
  NSpace,
  NDivider,
  NCollapse,
  NCollapseItem,
  NText,
  useMessage,
} from 'naive-ui';
import type { UserConfig } from '../types';
import { LLMService, CustomProviderManager as CoreCustomProviderManager } from '@prompt-matrix/core';
import CustomProviderManager from './CustomProviderManager.vue';

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
const providerOptions = computed(() => {
  const options = [
    { label: 'DeepSeek', value: 'deepseek' },
    { label: 'OpenAI', value: 'openai' },
    { label: 'Gemini', value: 'gemini' },
  ];
  
  // 添加自定义供应商选项
  const customProviders = CoreCustomProviderManager.getProviders();
  if (customProviders.length > 0) {
    options.push(
      { label: '──────────', value: 'divider' } as any,
      { label: '🔧 自定义供应商', value: 'divider' } as any,
      ...customProviders.map(provider => ({
        label: `🔌 ${provider.name}`,
        value: `custom_${provider.id}`,
      }))
    );
  }
  
  return options;
});

// 测试连接和模型相关状态
const testingConnection = ref(false);
const loadingModels = ref(false);
const availableModels = ref<string[]>([]);

// 自定义供应商管理器状态
const showCustomProviderManager = ref(false);

// 模型选择选项
const modelSelectOptions = computed(() => {
  return availableModels.value.map(model => ({
    label: model,
    value: model,
  }));
});

// 测试连接
const testConnection = async () => {
  if (!formData.value.apiKey) {
    message.warning('请先输入 API Key');
    return;
  }

  testingConnection.value = true;
  try {
    const llmService = new LLMService();
    llmService.initialize(formData.value);
    
    await llmService.testConnection();
    message.success('连接测试成功！');
  } catch (error) {
    console.error('Connection test failed:', error);
    message.error(`连接测试失败: ${(error as Error).message}`);
  } finally {
    testingConnection.value = false;
  }
};

// 加载模型列表
const loadModels = async () => {
  if (!formData.value.apiKey) {
    message.warning('请先输入 API Key');
    return;
  }

  loadingModels.value = true;
  try {
    const llmService = new LLMService();
    llmService.initialize(formData.value);
    
    const models = await llmService.getAvailableModels();
    availableModels.value = models;
    
    message.success(`成功加载 ${models.length} 个模型`);
  } catch (error) {
    console.error('Failed to load models:', error);
    message.error(`加载模型失败: ${(error as Error).message}`);
    availableModels.value = [];
  } finally {
    loadingModels.value = false;
  }
};

// 处理供应商变更
const handleProviderChange = (value: string) => {
  if (value.startsWith('custom_')) {
    // 切换到自定义供应商
    const providerId = value.replace('custom_', '');
    const provider = CoreCustomProviderManager.getProvider(providerId);
    if (provider) {
      formData.value.provider = 'custom';
      formData.value.customProviderId = providerId;
      formData.value.baseURL = provider.baseURL;
      availableModels.value = provider.models;
    }
  } else {
    // 切换到预设供应商
    formData.value.provider = value as any;
    formData.value.customProviderId = undefined;
    availableModels.value = [];
  }
};

// 自定义供应商保存成功处理
const handleCustomProviderSaved = (provider: any) => {
  message.success(`自定义供应商 "${provider.name}" 保存成功！`);
  // 刷新供应商选项 - 强制触发computed重新计算
  const temp = providerOptions.value;
  nextTick(() => {
    // 重新计算providerOptions以包含新添加的供应商
    providerOptions.value;
  });
};

// 获取当前供应商值（用于v-model）
const getProviderValue = () => {
  if (formData.value.provider === 'custom' && formData.value.customProviderId) {
    return `custom_${formData.value.customProviderId}`;
  }
  return formData.value.provider;
};

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

