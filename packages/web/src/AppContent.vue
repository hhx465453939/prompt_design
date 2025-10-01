<template>
  <div class="app-content">
    <!-- 主聊天窗口 -->
    <ChatWindow
      :messages="chatStore.messages.value"
      :loading="chatStore.loading.value"
      :is-configured="configStore.isConfigured.value"
      @send="handleSend"
      @send-example="handleSendExample"
      @open-settings="showConfig = true"
      @clear-history="handleClearHistory"
    @exportMd="exportMarkdown()"
    @copyMd="copyMarkdown()"
    />

    <!-- 配置面板 -->
    <ConfigPanel
      v-model:show="showConfig"
      :config="configStore.config.value"
      @save="handleSaveConfig"
    />

    <!-- 欢迎提示 -->
    <n-modal
      v-model:show="showWelcome"
      preset="dialog"
      title="👋 欢迎使用智能提示词工程师系统"
      positive-text="开始使用"
      @positive-click="showWelcome = false"
    >
      <n-space vertical>
        <n-text>这是一个基于 AI Agent 矩阵架构的智能提示词生成系统。</n-text>
        <n-text depth="3">系统特点：</n-text>
        <ul style="padding-left: 20px">
          <li>🎯 智能意图识别，自动调度专家 Agent</li>
          <li>⚡ X0 优化师 - 提示词融合优化</li>
          <li>🔍 X0 逆向工程师 - 提示词分析</li>
          <li>📝 X1 基础工程师 - ATOM 框架设计</li>
          <li>🎨 X4 场景工程师 - 场景化设计</li>
        </ul>
        <n-alert v-if="!configStore.isConfigured.value" type="warning" title="温馨提示">
          首次使用需要配置 API 密钥，请点击右上角设置按钮进行配置。
        </n-alert>
      </n-space>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  NModal,
  NSpace,
  NText,
  NAlert,
  useMessage,
  useDialog,
} from 'naive-ui';
import { ChatWindow, ConfigPanel, useChatStore, useConfigStore } from '@prompt-matrix/ui';
import type { UserConfig as UIUserConfig } from '@prompt-matrix/ui';
import { LLMService, RouterService } from '@prompt-matrix/core';
// 导出/复制：取最后一条 AI 消息
const exportMarkdown = () => {
  const ai = [...chatStore.messages.value].reverse().find(m => m.role === 'assistant' && !m.isLoading && !m.isError);
  if (!ai) return message.warning('没有可导出的内容');
  const blob = new Blob([ai.content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const ts = new Date().toISOString().replace(/[:T]/g,'-').slice(0,19);
  a.href = url;
  a.download = `prompt-${ts}.md`;
  a.click();
  URL.revokeObjectURL(url);
  message.success('已导出 Markdown');
};

const copyMarkdown = async () => {
  const ai = [...chatStore.messages.value].reverse().find(m => m.role === 'assistant' && !m.isLoading && !m.isError);
  if (!ai) return message.warning('没有可复制的内容');
  await navigator.clipboard.writeText(ai.content);
  message.success('已复制 Markdown');
};
import type { UserConfig as CoreUserConfig } from '@prompt-matrix/core';

// 状态管理
const chatStore = useChatStore();
const configStore = useConfigStore();
const message = useMessage();
const dialog = useDialog();

// UI 状态
const showConfig = ref(false);
const showWelcome = ref(false);

// 服务实例
let llmService: LLMService | null = null;
let routerService: RouterService | null = null;

/**
 * 初始化服务
 */
const initializeServices = () => {
  if (!configStore.isConfigured.value) {
    return false;
  }

  try {
    // 创建 LLM 服务
    llmService = new LLMService();
    
    // 转换配置格式
    const coreConfig: CoreUserConfig = {
      provider: configStore.config.value.provider as any,
      apiKey: configStore.config.value.apiKey,
      baseURL: configStore.config.value.baseURL,
      model: configStore.config.value.model,
      temperature: configStore.config.value.temperature,
      maxTokens: configStore.config.value.maxTokens,
      topP: configStore.config.value.topP,
    };

    llmService.initialize(coreConfig);

    // 创建路由服务
    routerService = new RouterService(llmService);

    console.log('✅ Services initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
    message.error('服务初始化失败: ' + (error as Error).message);
    return false;
  }
};

/**
 * 发送消息
 */
const handleSend = async (text: string, selectedAgent?: string) => {
  if (!configStore.isConfigured.value) {
    message.warning('请先配置 API 密钥');
    showConfig.value = true;
    return;
  }

  // 确保服务已初始化
  if (!routerService) {
    const success = initializeServices();
    if (!success) return;
  }

  // 添加用户消息
  chatStore.addUserMessage(text);

  // 添加加载中消息
  chatStore.addLoadingMessage();
  chatStore.loading.value = true;

  try {
    // 伪流式：先创建流式占位消息
    chatStore.removeLoadingMessage();
    const streamingMsg = chatStore.addAssistantMessage('', {
      agentType: 'CONDUCTOR',
      intent: 'CHAT',
      streaming: true,
      thinkingProcess: '解析意图中…\n\n- 检测是否为完整提示词\n- 判断是否为优化请求\n- 场景/基础设计分流',
    });

    // 真实流式：调用流式接口
    const meta = await routerService!.handleRequestStream(
      text,
      (chunk: string) => {
        streamingMsg.content += chunk;
      },
      {
        metadata: {
          forcedAgent: selectedAgent === 'AUTO' ? undefined : (selectedAgent as any),
        },
      }
    );

    // 完成
    streamingMsg.streaming = false;
    streamingMsg.agentType = meta.agentType;
    streamingMsg.intent = meta.intent;

    console.log('✅ Response received:', {
      agent: meta.agentType,
      intent: meta.intent,
      tokens: meta.metadata?.tokensUsed,
    });
  } catch (error) {
    console.error('❌ Request failed:', error);
    
    // 移除加载中消息
    chatStore.removeLoadingMessage();
    
    // 添加错误消息
    chatStore.addErrorMessage(
      `请求失败: ${(error as Error).message}\n\n请检查：\n1. API Key 是否正确\n2. 网络连接是否正常\n3. API 额度是否充足`
    );
    
    message.error('请求失败，请查看错误详情');
  } finally {
    chatStore.loading.value = false;
  }
};

/**
 * 发送示例
 */
const handleSendExample = (example: string) => {
  handleSend(example);
};

/**
 * 保存配置
 */
const handleSaveConfig = (config: UIUserConfig) => {
  configStore.saveConfig(config);
  message.success('配置已保存');
  
  // 重新初始化服务
  initializeServices();
};

/**
 * 清空历史
 */
const handleClearHistory = () => {
  dialog.warning({
    title: '确认清空',
    content: '确定要清空所有对话历史吗？',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: () => {
      chatStore.clearMessages();
      if (routerService) {
        routerService.clearHistory();
      }
      message.success('历史已清空');
    },
  });
};

/**
 * 组件挂载
 */
onMounted(() => {
  console.log('🚀 智能提示词工程师系统启动');
  console.log('📊 配置状态:', {
    isConfigured: configStore.isConfigured.value,
    provider: configStore.config.value.provider,
  });

  // 如果已配置，初始化服务
  if (configStore.isConfigured.value) {
    initializeServices();
  }

  // 首次访问显示欢迎
  const hasVisited = localStorage.getItem('has-visited');
  if (!hasVisited) {
    showWelcome.value = true;
    localStorage.setItem('has-visited', 'true');
  }
});
</script>

<style scoped>
.app-content {
  width: 100%;
  height: 100vh;
}

ul {
  margin: 8px 0;
  line-height: 1.8;
}
</style>

