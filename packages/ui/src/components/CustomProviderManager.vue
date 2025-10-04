<template>
  <n-drawer v-model:show="visible" :width="600" placement="right">
    <n-drawer-content title="🔧 自定义供应商管理" closable>
      <n-space vertical style="width: 100%;">
        <!-- 添加新供应商 -->
        <n-card title="添加新供应商" size="small">
          <n-form
            ref="formRef"
            :model="formData"
            :rules="rules"
            label-placement="top"
          >
            <n-form-item label="供应商名称" path="name">
              <n-input
                v-model:value="formData.name"
                placeholder="例如：我的自定义API"
              />
            </n-form-item>

            <n-form-item label="Base URL" path="baseURL">
              <n-input
                v-model:value="formData.baseURL"
                placeholder="例如：https://api.example.com/v1"
              />
            </n-form-item>

            <n-form-item label="模型列表" path="models">
              <n-input
                v-model:value="modelsText"
                type="textarea"
                placeholder="每行一个模型名称，例如：&#10;gpt-4&#10;gpt-3.5-turbo&#10;claude-3-sonnet"
                :rows="4"
              />
              <n-text depth="3" style="font-size: 12px;">
                每行输入一个模型名称，点击"解析模型"按钮自动解析
              </n-text>
            </n-form-item>

            <n-form-item>
              <n-space>
                <n-button type="primary" @click="parseModels">
                  解析模型
                </n-button>
                <n-button type="info" @click="fetchProviderModels" :loading="fetchingModels">
                  刷新模型
                </n-button>
                <n-button type="info" @click="testProvider" :loading="testing">
                  测试连接
                </n-button>
                <n-button @click="resetForm">
                  重置
                </n-button>
              </n-space>
            </n-form-item>

            <n-form-item>
              <n-button 
                type="primary" 
                @click="saveProvider" 
                :disabled="parsedModels.length === 0"
                block
              >
                保存供应商
              </n-button>
            </n-form-item>
          </n-form>
        </n-card>

        <!-- 已保存的供应商列表 -->
        <n-card title="已保存的供应商" size="small">
          <n-list v-if="providers.length > 0">
            <n-list-item v-for="provider in providers" :key="provider.id">
              <n-thing>
                <template #header>
                  <n-space align="center">
                    <n-text strong>{{ provider.name }}</n-text>
                    <n-tag size="small" type="info">
                      {{ provider.models.length }} 个模型
                    </n-tag>
                  </n-space>
                </template>
                <template #description>
                  <n-text code>{{ provider.baseURL }}</n-text>
                </template>
                <template #footer>
                  <n-space>
                    <n-button size="small" @click="editProvider(provider)">
                      编辑
                    </n-button>
                    <n-button 
                      size="small" 
                      type="error" 
                      @click="deleteProvider(provider.id)"
                    >
                      删除
                    </n-button>
                  </n-space>
                </template>
              </n-thing>
            </n-list-item>
          </n-list>
          <n-empty v-else description="暂无自定义供应商" />
        </n-card>
      </n-space>
    </n-drawer-content>
  </n-drawer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  NDrawer,
  NDrawerContent,
  NSpace,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NButton,
  NText,
  NList,
  NListItem,
  NThing,
  NTag,
  NEmpty,
  useMessage,
} from 'naive-ui';
import { CustomProviderManager, LLMService } from '@prompt-matrix/core';
import type { CustomProvider } from '@prompt-matrix/core';

interface Props {
  show: boolean;
}

interface Emits {
  (e: 'update:show', value: boolean): void;
  (e: 'provider-saved', provider: CustomProvider): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const message = useMessage();

// 显示状态
const visible = computed({
  get: () => props.show,
  set: (value: boolean) => emit('update:show', value),
});

// 表单数据
const formData = ref({
  name: '',
  baseURL: '',
});

const modelsText = ref('');
const parsedModels = ref<string[]>([]);
const testing = ref(false);
const fetchingModels = ref(false);
const editingProvider = ref<CustomProvider | null>(null);

// 表单验证规则
const rules = {
  name: {
    required: true,
    message: '请输入供应商名称',
    trigger: 'blur',
  },
  baseURL: {
    required: true,
    message: '请输入 Base URL',
    trigger: 'blur',
    pattern: /^https?:\/\/.+/,
  },
};

// 获取已保存的供应商列表
const providers = computed(() => CustomProviderManager.getProviders());

// 解析模型列表
const parseModels = () => {
  const models = modelsText.value
    .split('\n')
    .map(model => model.trim())
    .filter(model => model.length > 0);
  
  if (models.length === 0) {
    message.warning('请至少输入一个模型名称');
    return;
  }
  
  parsedModels.value = models;
  message.success(`成功解析 ${models.length} 个模型`);
};

// 从供应商API获取模型列表
const fetchProviderModels = async () => {
  const isValid = await validateForm();
  if (!isValid) return;

  fetchingModels.value = true;
  try {
    // 创建临时配置进行测试
    const tempConfig = {
      provider: 'custom' as const,
      apiKey: 'test-key', // 临时测试key
      baseURL: formData.value.baseURL,
      model: 'test-model',
      customProviderId: 'temp-fetch-models',
    };

    const llmService = new LLMService();
    
    // 创建临时自定义供应商用于获取模型
    const tempProvider: CustomProvider = {
      id: 'temp-fetch-models',
      name: formData.value.name,
      baseURL: formData.value.baseURL,
      models: [],
      createdAt: Date.now(),
    };

    // 临时保存供应商用于获取模型
    CustomProviderManager.addProvider(tempProvider);
    
    await llmService.initialize(tempConfig);
    const models = await llmService.getAvailableModels();
    
    // 删除临时供应商
    CustomProviderManager.deleteProvider('temp-fetch-models');
    
    if (models.length > 0) {
      modelsText.value = models.join('\n');
      parsedModels.value = models;
      message.success(`成功获取 ${models.length} 个模型`);
    } else {
      message.warning('未能获取到模型列表，请手动输入');
    }
  } catch (error) {
    // 清理临时供应商
    CustomProviderManager.deleteProvider('temp-fetch-models');
    message.warning(`获取模型失败: ${(error as Error).message}，请手动输入模型名称`);
  } finally {
    fetchingModels.value = false;
  }
};

// 测试供应商连接
const testProvider = async () => {
  const isValid = await validateForm();
  if (!isValid) return;

  testing.value = true;
  try {
    // 创建临时配置进行测试
    const tempConfig = {
      provider: 'custom' as const,
      apiKey: 'test-key', // 临时测试key
      baseURL: formData.value.baseURL,
      model: 'test-model',
      customProviderId: 'temp-test',
    };

    const llmService = new LLMService();
    
    // 创建临时自定义供应商用于测试
    const tempProvider: CustomProvider = {
      id: 'temp-test',
      name: formData.value.name,
      baseURL: formData.value.baseURL,
      models: ['test-model'],
      createdAt: Date.now(),
    };

    // 临时保存供应商用于测试
    CustomProviderManager.addProvider(tempProvider);
    
    await llmService.initialize(tempConfig);
    await llmService.testConnection();
    
    // 删除临时供应商
    CustomProviderManager.deleteProvider('temp-test');
    
    message.success('连接测试成功！');
  } catch (error) {
    // 清理临时供应商
    CustomProviderManager.deleteProvider('temp-test');
    message.error(`连接测试失败: ${(error as Error).message}`);
  } finally {
    testing.value = false;
  }
};

// 保存供应商
const saveProvider = () => {
  if (parsedModels.value.length === 0) {
    message.warning('请先解析模型列表');
    return;
  }

  try {
    const providerData = {
      name: formData.value.name,
      baseURL: formData.value.baseURL,
      models: parsedModels.value,
    };

    let savedProvider: CustomProvider;
    
    if (editingProvider.value) {
      // 更新现有供应商
      CustomProviderManager.updateProvider(editingProvider.value.id, providerData);
      savedProvider = { ...editingProvider.value, ...providerData };
      message.success('供应商更新成功！');
    } else {
      // 添加新供应商
      savedProvider = CustomProviderManager.addProvider(providerData);
      message.success('供应商保存成功！');
    }

    emit('provider-saved', savedProvider);
    resetForm();
  } catch (error) {
    message.error(`保存失败: ${(error as Error).message}`);
  }
};

// 编辑供应商
const editProvider = (provider: CustomProvider) => {
  editingProvider.value = provider;
  formData.value = {
    name: provider.name,
    baseURL: provider.baseURL,
  };
  modelsText.value = provider.models.join('\n');
  parsedModels.value = provider.models;
};

// 删除供应商
const deleteProvider = (id: string) => {
  try {
    CustomProviderManager.deleteProvider(id);
    message.success('供应商删除成功！');
  } catch (error) {
    message.error(`删除失败: ${(error as Error).message}`);
  }
};

// 重置表单
const resetForm = () => {
  formData.value = {
    name: '',
    baseURL: '',
  };
  modelsText.value = '';
  parsedModels.value = [];
  editingProvider.value = null;
};

// 验证表单
const validateForm = async () => {
  try {
    // 基本URL验证
    if (!formData.value.baseURL) {
      message.error('请输入 Base URL');
      return false;
    }
    
    if (!/^https?:\/\/.+/.test(formData.value.baseURL)) {
      message.error('请输入有效的URL格式');
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
};
</script>