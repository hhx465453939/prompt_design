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
        <n-form-item v-if="formData.provider === 'custom' && formData.customProviderId" label="当前供应商" path="currentProvider">
          <n-alert type="info" :show-icon="false">
            🔌 {{ CoreCustomProviderManager.getProvider(formData.customProviderId)?.name || '自定义供应商' }}
          </n-alert>
        </n-form-item>

        <n-form-item label="API Key" path="apiKey">
          <n-input
            v-model:value="formData.apiKey"
            type="password"
            show-password-on="click"
            :placeholder="formData.provider === 'custom' ? '自定义供应商 API Key' : '输入 API Key'"
          />
        </n-form-item>

        <!-- Base URL -->
        <n-form-item label="Base URL（可选）" path="baseURL">
          <n-input
            v-model:value="formData.baseURL"
            :placeholder="formData.provider === 'openrouter' ? 'https://openrouter.ai/api/v1' : '例如: https://api.deepseek.com'"
          />
          <n-text v-if="formData.provider === 'openrouter'" depth="3" style="font-size: 12px; margin-top: 4px;">
            💡 OpenRouter 默认: https://openrouter.ai/api/v1
          </n-text>
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

        <!-- 模型信息 -->
        <n-form-item v-if="selectedModelInfo" label="模型特性">
          <n-space>
            <n-tag v-if="selectedModelInfo.isThinkingModel" type="warning" size="small">
              🧠 思考模型
            </n-tag>
            <n-tag v-if="selectedModelInfo.isMultimodal" type="info" size="small">
              🖼️ 多模态
            </n-tag>
            <n-tag v-if="selectedModelInfo.isLatest" type="success" size="small">
              ✨ 最新版本
            </n-tag>
            <n-tag v-if="selectedModelInfo.size !== 'Unknown'" type="default" size="small">
              📊 {{ selectedModelInfo.size }}
            </n-tag>
            <n-tag v-if="selectedModelInfo.contextLength !== 'Unknown'" type="default" size="small">
              📝 {{ selectedModelInfo.contextLength }}
            </n-tag>
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

            <!-- Reasoning Tokens (思维链预算) -->
            <n-form-item 
              label="Reasoning Tokens (思维链预算)" 
              path="reasoningTokens"
              v-if="selectedModelInfo && selectedModelInfo.isThinkingModel"
            >
              <n-slider
                v-model:value="formData.reasoningTokens"
                :min="1024"
                :max="64000"
                :step="1024"
                :marks="{ 1024: '1K', 16384: '16K', 32768: '32K', 64000: '64K' }"
              />
              <n-input-number
                v-model:value="formData.reasoningTokens"
                :min="1024"
                :max="64000"
                :step="1024"
                size="small"
                style="margin-top: 8px"
              />
              <n-text depth="3" style="font-size: 12px; margin-top: 4px;">
                为思考模型分配的推理预算token数量
              </n-text>
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
import { ref, watch, computed } from 'vue';
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
  NAlert,
  NTag,
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
const runtimeEnv = (globalThis as any).__PROMPT_MATRIX_ENV__ as Partial<Record<string, string>> | undefined;
const PROVIDER_DEFAULT_MODELS: Record<UserConfig['provider'], string[]> = {
  deepseek: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'],
  openai: ['gpt-4o', 'gpt-4.1', 'gpt-4o-mini', 'o1', 'o3-mini'],
  gemini: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'],
  openrouter: ['openai/gpt-4o', 'openai/gpt-4o-mini', 'openai/o1', 'google/gemini-2.5-pro'],
  custom: [],
};

const normalizeProviderBaseURL = (provider: UserConfig['provider'], baseURL?: string): string => {
  const raw = (baseURL || '').trim();
  if (!raw) return '';
  const trimmed = raw.replace(/\/+$/, '');

  if (provider === 'gemini') {
    if (/\/openai$/i.test(trimmed)) return trimmed;
    if (/generativelanguage\.googleapis\.com/i.test(trimmed)) {
      if (/\/v\d+(\w+)?$/i.test(trimmed)) return `${trimmed}/openai`;
      return `${trimmed}/v1beta/openai`;
    }
    if (/\/v\d+(\w+)?$/i.test(trimmed)) return `${trimmed}/openai`;
    return trimmed;
  }

  if (provider === 'deepseek' || provider === 'openai' || provider === 'openrouter') {
    return /\/v\d+($|\/)/i.test(trimmed) ? trimmed : `${trimmed}/v1`;
  }
  return trimmed;
};

const setProviderDefaults = (provider: UserConfig['provider']) => {
  const fallbackModels = PROVIDER_DEFAULT_MODELS[provider] || [];
  availableModels.value = fallbackModels;
  if (fallbackModels.length > 0) {
    formData.value.model = fallbackModels[0];
  }
};

// 表单数据
const formData = ref<UserConfig>({ 
  ...props.config,
  reasoningTokens: props.config.reasoningTokens || 16384, // 默认16K
});

// 显示状态
const visible = ref(props.show);
const providerOptionsVersion = ref(0);

// 表单引用
const formRef = ref();

// 提供商选项
const providerOptions = computed(() => {
  const version = providerOptionsVersion.value;
  const dividerValue = `divider_${version}`;
  const options = [
    { label: 'DeepSeek', value: 'deepseek' },
    { label: 'OpenAI', value: 'openai' },
    { label: 'Gemini', value: 'gemini' },
    { label: 'OpenRouter', value: 'openrouter' },
  ];
  
  // 添加自定义供应商选项
  const customProviders = CoreCustomProviderManager.getProviders();
  if (customProviders.length > 0) {
    options.push(
      { label: '──────────', value: dividerValue, disabled: true } as any,
      { label: '🔧 自定义供应商', value: `${dividerValue}_title`, disabled: true } as any,
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
const selectedModelInfo = ref<any>(null);

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
    if (models.length > 0 && !models.includes(formData.value.model)) {
      formData.value.model = models[0];
    }
    
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
  // console.log('🔧 切换供应商:', value);
  if (value.startsWith('divider_')) return;
  
  if (value.startsWith('custom_')) {
    // 切换到自定义供应商
    const providerId = value.replace('custom_', '');
    const provider = CoreCustomProviderManager.getProvider(providerId);
    if (provider) {
      formData.value.provider = 'custom';
      formData.value.customProviderId = providerId;
      formData.value.baseURL = provider.baseURL;
      formData.value.apiKey = provider.apiKey || '';
      availableModels.value = provider.models;
      
      // 如果有模型列表，自动设置第一个为默认模型
      if (provider.models.length > 0 && !provider.models.includes(formData.value.model)) {
        formData.value.model = provider.models[0];
      }
    }
  } else {
    // 切换到预设供应商
    // console.log('🔧 切换到预设供应商:', value);
    
    // 获取默认的 baseURL
    const deepseekBaseFromEnv = normalizeProviderBaseURL('deepseek', runtimeEnv?.VITE_DEEPSEEK_BASE_URL);
    const defaultBaseURLs: Record<string, string> = {
      deepseek: deepseekBaseFromEnv || 'https://api.deepseek.com/v1',
      openai: 'https://api.openai.com/v1',
      gemini: 'https://generativelanguage.googleapis.com/v1beta/openai',
      openrouter: 'https://openrouter.ai/api/v1',
    };
    
    formData.value.provider = value as any;
    formData.value.customProviderId = undefined;
    // 重置 baseURL 为默认值
    formData.value.baseURL = defaultBaseURLs[value] || '';
    setProviderDefaults(value as UserConfig['provider']);
    
    // console.log('🔧 设置新的 baseURL:', formData.value.baseURL);
  }
};

// 自定义供应商保存成功处理
const handleCustomProviderSaved = (provider: any) => {
  message.success(`自定义供应商 "${provider.name}" 保存成功！`);
  providerOptionsVersion.value += 1;
};

// 获取当前供应商值（用于v-model）
const getProviderValue = () => {
  if (formData.value.provider === 'custom' && formData.value.customProviderId) {
    return `custom_${formData.value.customProviderId}`;
  }
  return formData.value.provider;
};

// 分析模型信息
const analyzeModelInfo = (modelName: string) => {
  if (!modelName) {
    selectedModelInfo.value = null;
    return;
  }

  const info = {
    name: modelName,
    // 检测是否为思考模型（扩展检测更多模型）
    isThinkingModel: modelName.toLowerCase().includes('reasoner') || 
                      modelName.toLowerCase().includes('thinking') ||
                      modelName.toLowerCase().includes('o1') ||
                      modelName.toLowerCase().includes('o3') ||
                      modelName.toLowerCase().includes('o1-preview') ||
                      modelName.toLowerCase().includes('o1-mini') ||
                      modelName.toLowerCase().includes('r1') ||
                      modelName.toLowerCase().includes('r1-') ||
                      modelName.toLowerCase().includes('gemini-2.0') ||
                      modelName.toLowerCase().includes('gemini-2.5') ||
                      modelName.toLowerCase().includes('gemini-exp') ||
                      modelName.toLowerCase().includes('gpt-5') ||
                      modelName.toLowerCase().includes('claude-3.5-sonnet') ||
                      modelName.toLowerCase().includes('claude-3.5-haiku') ||
                      modelName.toLowerCase().includes('claude-3.5-opus') ||
                      modelName.toLowerCase().includes('qwq-') ||
                      modelName.toLowerCase().includes('deepseek-r1') ||
                      modelName.toLowerCase().includes('grok-3') ||
                      // OpenRouter 中的思维模型标识
                      modelName.toLowerCase().includes('openrouter') && (
                        modelName.toLowerCase().includes('o1') ||
                        modelName.toLowerCase().includes('o3') ||
                        modelName.toLowerCase().includes('r1') ||
                        modelName.toLowerCase().includes('reasoner') ||
                        modelName.toLowerCase().includes('thinking') ||
                        modelName.toLowerCase().includes('qwen-') ||
                        modelName.toLowerCase().includes('qwq-') ||
                        modelName.toLowerCase().includes('deepseek-r1') ||
                        modelName.toLowerCase().includes('gemini-2.0') ||
                        modelName.toLowerCase().includes('gemini-2.5') ||
                        modelName.toLowerCase().includes('gpt-5')
                      ) ||
                      // OpenRouter 思考模型的常见命名模式
                      /^openrouter\//.test(modelName.toLowerCase()) && (
                        modelName.toLowerCase().includes('o1') ||
                        modelName.toLowerCase().includes('o3') ||
                        modelName.toLowerCase().includes('r1') ||
                        modelName.toLowerCase().includes('reason') ||
                        modelName.toLowerCase().includes('think')
                      ),
    // 检测是否为多模态模型
    isMultimodal: modelName.toLowerCase().includes('vision') ||
                  modelName.toLowerCase().includes('image') ||
                  modelName.toLowerCase().includes('gpt-4v') ||
                  modelName.toLowerCase().includes('claude-3') ||
                  modelName.toLowerCase().includes('gemini-pro-vision') ||
                  modelName.toLowerCase().includes('gemini-2.0') ||
                  modelName.toLowerCase().includes('gemini-2.5') ||
                  modelName.toLowerCase().includes('multimodal'),
    // 检测是否为最新版本
    isLatest: modelName.toLowerCase().includes('turbo') ||
              modelName.toLowerCase().includes('gpt-4o') ||
              modelName.toLowerCase().includes('claude-3.5') ||
              modelName.toLowerCase().includes('deepseek-v3') ||
              modelName.toLowerCase().includes('qwen-2.5') ||
              modelName.toLowerCase().includes('gemini-2.0') ||
              modelName.toLowerCase().includes('gemini-2.5') ||
              modelName.toLowerCase().includes('o1') ||
              modelName.toLowerCase().includes('o3') ||
              modelName.toLowerCase().includes('gpt-5'),
    // 估算模型大小
    size: 'Unknown',
    // 上下文长度
    contextLength: 'Unknown',
  };

  // 根据模型名称推断更多信息
  if (modelName.includes('8b') || modelName.includes('8B')) {
    info.size = '8B';
  } else if (modelName.includes('70b') || modelName.includes('70B')) {
    info.size = '70B';
  } else if (modelName.includes('32b') || modelName.includes('32B')) {
    info.size = '32B';
  } else if (modelName.includes('13b') || modelName.includes('13B')) {
    info.size = '13B';
  } else if (modelName.includes('7b') || modelName.includes('7B')) {
    info.size = '7B';
  }

  // 根据模型名称推断上下文长度
  if (modelName.includes('32k') || modelName.includes('32K')) {
    info.contextLength = '32K';
  } else if (modelName.includes('128k') || modelName.includes('128K')) {
    info.contextLength = '128K';
  } else if (modelName.includes('200k') || modelName.includes('200K')) {
    info.contextLength = '200K';
  } else if (modelName.includes('1m') || modelName.includes('1M')) {
    info.contextLength = '1M';
  }

  selectedModelInfo.value = info;
};

// 监听模型变化
watch(() => formData.value.model, (newModel) => {
  analyzeModelInfo(newModel);
});

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
    const defaultModels = PROVIDER_DEFAULT_MODELS[formData.value.provider] || [];
    const modelSet = new Set(defaultModels);
    if (formData.value.model) modelSet.add(formData.value.model);
    availableModels.value = Array.from(modelSet);
    // 分析当前选择的模型
    analyzeModelInfo(formData.value.model);
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

