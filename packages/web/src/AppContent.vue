<template>
  <div class="app-content">
    <div class="app-main">
      <div class="app-flow-wrapper">
        <FlowTimeline
          :steps="flowSteps"
          :templates="flowTemplates"
          :active-template-id="flowActiveTemplateId"
          :running="flowRunning"
          @select-template="handleSelectFlowTemplate"
          @run-flow="runCurrentFlow"
        />
      </div>

      <!-- 主聊天窗口 -->
    <ChatWindow
      :messages="chatStore.messages.value"
      :loading="chatStore.loading.value"
      :is-configured="configStore.isConfigured.value"
      @send="handleSend"
      @send-example="handleSendExample"
      @open-settings="showConfig = true"
        @export-md="exportMarkdown()"
      @copy-md="copyMarkdown()"
      @load-session="handleLoadSession"
      @copy-message="handleCopyMessage"
      @free-chat="handleFreeChat"
      @test-prompt="handleTestPrompt"
      @update-loading="chatStore.loading.value = $event"
      @regenerate="handleRegenerate"
      @custom-agents-update="handleCustomAgentsUpdate"
      @delete-message="handleDeleteMessage"
    />
    </div>

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
import { ref, onMounted, watch } from 'vue';
import {
  NModal,
  NSpace,
  NText,
  NAlert,
  useMessage,
  useDialog,
} from 'naive-ui';
import {
  ChatWindow,
  ConfigPanel,
  FlowTimeline,
  useChatStore,
  useConfigStore,
  useChatHistory,
  useFlowRunner,
} from '@prompt-matrix/ui';
import type { UserConfig as UIUserConfig, FlowStep, FlowTemplate } from '@prompt-matrix/ui';
import { LLMService, RouterService } from '@prompt-matrix/core';
import type { ChatMessage } from '@prompt-matrix/ui';
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
  try {
    await navigator.clipboard.writeText(ai.content);
    message.success('已复制 Markdown');
  } catch (error) {
    console.error('复制 Markdown 失败:', error);
    message.error('复制失败，请检查浏览器剪贴板权限');
  }
};
import type { UserConfig as CoreUserConfig } from '@prompt-matrix/core';

// 状态管理
const chatStore = useChatStore();
const configStore = useConfigStore();
const { currentSession, updateSessionMessages } = useChatHistory();
const message = useMessage();
const dialog = useDialog();

// UI 状态
const showConfig = ref(false);
const showWelcome = ref(false);

// Flow 状态机（前端多 Agent 编排）
const flow = useFlowRunner();
const flowRunning = ref(false);

const flowSteps = flow.steps as unknown as FlowStep[];
const flowTemplates = flow.templates as unknown as FlowTemplate[];
const flowActiveTemplateId = flow.activeTemplateId as unknown as string | null;

// 服务实例
let llmService: LLMService | null = null;
let routerService: RouterService | null = null;
let customAgentsRegistered = false; // 添加标记防止重复注册

type CustomAgentPayload = {
  id: string;
  name: string;
  prompt: string;
  expertise?: string;
  icon: string;
  color: string;
};

let pendingCustomAgents: CustomAgentPayload[] = [];

const normalizeCustomAgentId = (id: string): string => {
  return String(id || '').replace(/^CUSTOM_+/i, '').trim();
};

const normalizeCustomAgents = (agents: CustomAgentPayload[]): CustomAgentPayload[] => {
  const deduped = new Map<string, CustomAgentPayload>();
  agents.forEach((agent) => {
    const normalizedId = normalizeCustomAgentId(agent.id);
    if (!normalizedId) return;
    deduped.set(normalizedId, {
      ...agent,
      id: normalizedId,
    });
  });
  return Array.from(deduped.values());
};

/**
 * 注册自定义Agent到RouterService
 */
const registerCustomAgents = (agents: CustomAgentPayload[]) => {
  const normalizedAgents = normalizeCustomAgents(agents);
  pendingCustomAgents = normalizedAgents;

  if (!routerService || !llmService) {
    return;
  }

  try {
    normalizedAgents.forEach((agent) => {
      const agentConfig = {
        id: agent.id,
        name: agent.name,
        prompt: agent.prompt,
        expertise: agent.expertise,
      };

      routerService!.registerCustomAgent(agentConfig);
      console.log(`✅ 注册自定义Agent: ${agent.name} (CUSTOM_${agent.id})`);
    });

    customAgentsRegistered = normalizedAgents.length > 0;
    if (normalizedAgents.length > 0) {
      console.log(`✅ 已注册 ${normalizedAgents.length} 个自定义Agent`);
    }
  } catch (error) {
    console.error('❌ 自定义Agent注册失败:', error);
  }
};

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
      customProviderId: configStore.config.value.customProviderId,
    };

    // 如果provider是'custom'但没有customProviderId，尝试恢复或重置配置
    if (coreConfig.provider === 'custom' && !coreConfig.customProviderId) {
      console.warn('Custom provider detected but missing ID, switching to deepseek');
      coreConfig.provider = 'deepseek';
      // 更新配置存储
      const updatedConfig = {
        ...configStore.config.value,
        provider: 'deepseek' as const,
        customProviderId: undefined,
      };
      configStore.saveConfig(updatedConfig);
    }

    llmService.initialize(coreConfig);

    // 每次初始化都重建 RouterService，确保使用最新 LLM 配置
    routerService = new RouterService(llmService);
    customAgentsRegistered = false;

    // 优先使用缓存中的自定义 Agent（处理先触发 custom-agents-update 的情况）
    let agentsToRegister = pendingCustomAgents;
    if (agentsToRegister.length === 0) {
      const savedAgents = localStorage.getItem('custom-engineers');
      if (savedAgents) {
        try {
          const parsed = JSON.parse(savedAgents);
          if (Array.isArray(parsed)) {
            agentsToRegister = parsed;
          }
        } catch (error) {
          console.error('❌ 加载自定义Agent失败:', error);
        }
      }
    }

    if (agentsToRegister.length > 0) {
      registerCustomAgents(agentsToRegister);
    }

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
      thinkingProcess: '正在分析您的需求...',
    });

    // 真实流式：调用流式接口
    let accumulatedContent = '';
    let currentThinkingProcess = '正在分析您的需求...';
    
    const meta = await routerService!.handleRequestStream(
      text,
      (chunk: string) => {
        accumulatedContent += chunk;
        // 直接更新streamingMsg的内容
        streamingMsg.content = accumulatedContent;
        // 强制触发响应式更新
        const messageIndex = chatStore.messages.value.findIndex(m => m.id === streamingMsg.id);
        if (messageIndex !== -1) {
          chatStore.messages.value = [...chatStore.messages.value];
        }
      },
      (thinkingChunk?: string) => {
        // 如果有思考过程更新，更新thinkingProcess
        if (thinkingChunk) {
          currentThinkingProcess = thinkingChunk;
          streamingMsg.thinkingProcess = currentThinkingProcess;
          // 强制触发响应式更新
          const messageIndex = chatStore.messages.value.findIndex(m => m.id === streamingMsg.id);
          if (messageIndex !== -1) {
            chatStore.messages.value = [...chatStore.messages.value];
          }
        }
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
    // 确保最终内容是完整的
    streamingMsg.content = accumulatedContent;
    // 清理思考过程显示
    streamingMsg.thinkingProcess = undefined;

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
 * 运行当前 Flow（线性多 Agent 串行执行）
 */
const runCurrentFlow = async () => {
  if (flowRunning.value) return;

  const steps = flow.steps.value;
  if (!steps.length) return;

  if (!routerService) {
    const success = initializeServices();
    if (!success) return;
  }

  flowRunning.value = true;
  let previousOutput = '';

  try {
    const lastUserMessage = [...chatStore.messages.value]
      .reverse()
      .find((m) => m.role === 'user' && m.content);

    for (const step of steps) {
      flow.updateStep(step.id, {
        status: 'running',
        errorMessage: undefined,
      });

      let inputText = '';
      if (step.inputSource === 'user') {
        if (lastUserMessage) {
          inputText = step.customInput
            ? `${step.customInput}\n\n=== 用户输入 ===\n${lastUserMessage.content}`
            : lastUserMessage.content;
        } else {
          inputText = step.customInput || '';
        }
      } else if (step.inputSource === 'previousStep') {
        if (previousOutput) {
          inputText = step.customInput
            ? `${step.customInput}\n\n=== 上一步输出 ===\n${previousOutput}`
            : previousOutput;
        } else if (lastUserMessage) {
          inputText = step.customInput
            ? `${step.customInput}\n\n=== 用户输入 ===\n${lastUserMessage.content}`
            : lastUserMessage.content;
        } else {
          inputText = step.customInput || '';
        }
      } else {
        inputText = step.customInput || '';
      }

      let accumulatedContent = '';

      await routerService!.handleRequestStream(
        inputText,
        (chunk: string) => {
          accumulatedContent += chunk;
          flow.updateStep(step.id, {
            outputFull: accumulatedContent,
            outputSummary: accumulatedContent.slice(0, 200),
          });
        },
        undefined,
        {
          metadata: {
            forcedAgent: step.agentType,
          },
        }
      );

      previousOutput = accumulatedContent;

      flow.updateStep(step.id, {
        status: 'success',
      });
    }
  } catch (error) {
    const messageText = (error as Error).message || 'Flow execution failed';
    const runningStep = steps.find((s) => s.status === 'running');
    if (runningStep) {
      flow.updateStep(runningStep.id, {
        status: 'error',
        errorMessage: messageText,
      });
    }
    message.error('Flow 执行失败：' + messageText);
  } finally {
    flowRunning.value = false;
  }
};

const handleSelectFlowTemplate = (id: string) => {
  flow.selectTemplate(id);
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
 * 加载会话
 */
const handleLoadSession = (messages: any[]) => {
  chatStore.setMessages(messages);
  if (routerService) {
    routerService.clearHistory();
    // 将历史消息添加到路由服务的历史记录中
    messages.forEach(msg => {
      if (msg.role === 'user' && msg.content) {
        // 通过公共方法添加历史记录（如果有的话）
        routerService!.addHistoryMessage({
          role: 'user',
          content: msg.content,
          timestamp: msg.timestamp || Date.now(),
        });
      }
    });
  }
};

/**
 * 复制消息
 */
const handleCopyMessage = async (chatMessage: any, option: string = 'markdown') => {
  try {
    let contentToCopy = '';
    
    if (option === 'markdown-with-thinking' && chatMessage.thinkingProcess) {
      // 包含思考过程的内容
      contentToCopy = `## 思考过程

${chatMessage.thinkingProcess}

## 回答

${chatMessage.content}`;
    } else {
      // 普通markdown内容
      contentToCopy = chatMessage.content;
    }
    
    await navigator.clipboard.writeText(contentToCopy);
    
    const actionText = option === 'markdown-with-thinking' ? '（包含思考）' : '';
    message.success(`Markdown内容${actionText}已复制到剪贴板`);
  } catch (error) {
    console.error('复制失败:', error);
    message.error('复制失败');
  }
};

/**
 * 处理自由聊天
 */
const handleFreeChat = async (prompt: string) => {
  // 确保服务已初始化
  if (!llmService) {
    const success = initializeServices();
    if (!success) {
      message.error('服务初始化失败，请检查配置');
      return;
    }
  }

  if (!llmService!.isInitialized()) {
    message.error('请先配置API密钥');
    return;
  }

  try {
    chatStore.addLoadingMessage();
    chatStore.loading.value = true;

    // 添加用户消息
    chatStore.addUserMessage(prompt);
    chatStore.removeLoadingMessage();

    // 创建流式响应消息
    const streamingMsg = chatStore.addAssistantMessage('', {
      agentType: 'CONDUCTOR',
      intent: 'CHAT',
      streaming: true,
    });

    // 直接调用LLM服务
    let accumulatedContent = '';
    await llmService!.chatStream(
      [{ role: 'user', content: prompt }], 
      (chunk: string) => {
        accumulatedContent += chunk;
        streamingMsg.content = accumulatedContent;
        // 强制触发响应式更新
        const messageIndex = chatStore.messages.value.findIndex(m => m.id === streamingMsg.id);
        if (messageIndex !== -1) {
          chatStore.messages.value = [...chatStore.messages.value];
        }
      },
      {
        // 传递 reasoning tokens 配置
        reasoningTokens: configStore.config.value.reasoningTokens,
      }
    );

    // 完成
    streamingMsg.streaming = false;
    streamingMsg.content = accumulatedContent;

  } catch (error) {
    console.error('❌ 自由聊天失败:', error);
    chatStore.removeLoadingMessage();
    chatStore.addErrorMessage('请求失败: ' + (error as Error).message);
  } finally {
    chatStore.loading.value = false;
  }
};

/**
 * 处理测试提示词
 */
const handleTestPrompt = (prompt: string) => {
  // 显示提示信息
  message.info(`🧪 已切换到自由聊天模式，正在测试提示词...`);
  
  // 直接调用自由聊天处理
  handleFreeChat(prompt);
};

/**
 * 处理自定义Agent更新
 */
const handleCustomAgentsUpdate = (agents: CustomAgentPayload[]) => {
  pendingCustomAgents = normalizeCustomAgents(agents);

  // 服务已就绪时，重建一次 Router 以同步自定义 Agent 的增删改
  if (llmService && routerService) {
    initializeServices();
    return;
  }

  registerCustomAgents(pendingCustomAgents);
};

/**
 * 处理删除消息
 */
const handleDeleteMessage = (messageToDelete: ChatMessage) => {
  
  // 找到消息在列表中的索引
  const messageIndex = chatStore.messages.value.findIndex(m => m.id === messageToDelete.id);
  
  if (messageIndex !== -1) {
    // 删除消息
    chatStore.messages.value.splice(messageIndex, 1);
    
    // 如果删除的是用户消息，同时删除后续的助手回复
    if (messageToDelete.role === 'user') {
      // 查找该用户消息后面的助手消息并删除
      const nextMessage = chatStore.messages.value[messageIndex];
      if (nextMessage && nextMessage.role === 'assistant') {
        chatStore.messages.value.splice(messageIndex, 1);
      }
    }
    
    chatStore.persistMessages();

    message.success('消息已删除');
  } else {
    message.error('未找到要删除的消息');
  }
};

/**
 * 处理重新生成
 */
const handleRegenerate = async (userMessage: string, originalAssistantMessage: any) => {
  if (!routerService) {
    const success = initializeServices();
    if (!success) return;
  }

  try {
    // 保存原始回复到历史记录
    if (!originalAssistantMessage.alternatives) {
      originalAssistantMessage.alternatives = [];
    }
    
    // 创建新的回复对象（保存原始内容）
    const originalCopy = { ...originalAssistantMessage };
    delete originalCopy.alternatives; // 避免循环引用
    
    // 如果当前回复不在历史记录中，添加进去
    const existsInHistory = originalAssistantMessage.alternatives.some(
      (alt: any) => alt.content === originalAssistantMessage.content
    );
    
    if (!existsInHistory) {
      originalAssistantMessage.alternatives.unshift(originalCopy);
    }
    
    // 移除加载中消息
    chatStore.removeLoadingMessage();
    
    // 创建新的流式响应消息
    const streamingMsg = chatStore.addAssistantMessage('', {
      agentType: originalAssistantMessage.agentType,
      intent: originalAssistantMessage.intent,
      streaming: true,
      thinkingProcess: '正在重新生成回复...',
    });
    
    // 更新原始消息的内容为流式消息
    originalAssistantMessage.content = '';
    originalAssistantMessage.streaming = true;
    
    // 重新调用路由服务
    let accumulatedContent = '';
    let currentThinkingProcess = '正在重新生成回复...';
    
    const meta = await routerService!.handleRequestStream(
      userMessage,
      (chunk: string) => {
        accumulatedContent += chunk;
        originalAssistantMessage.content = accumulatedContent;
        // 强制触发响应式更新
        const messageIndex = chatStore.messages.value.findIndex(m => m.id === originalAssistantMessage.id);
        if (messageIndex !== -1) {
          chatStore.messages.value = [...chatStore.messages.value];
        }
      },
      (thinkingChunk?: string) => {
        if (thinkingChunk) {
          currentThinkingProcess = thinkingChunk;
          originalAssistantMessage.thinkingProcess = currentThinkingProcess;
          // 强制触发响应式更新
          const messageIndex = chatStore.messages.value.findIndex(m => m.id === originalAssistantMessage.id);
          if (messageIndex !== -1) {
            chatStore.messages.value = [...chatStore.messages.value];
          }
        }
      },
      {
        metadata: {
          forcedAgent: 'CONDUCTOR', // 重新生成时使用自动路由
        },
      }
    );
    
    // 完成重新生成
    originalAssistantMessage.streaming = false;
    originalAssistantMessage.agentType = meta.agentType;
    originalAssistantMessage.intent = meta.intent;
    originalAssistantMessage.content = accumulatedContent;
    originalAssistantMessage.thinkingProcess = undefined;
    originalAssistantMessage.regenerationCount = (originalAssistantMessage.regenerationCount || 0) + 1;
    
    message.success('回复已重新生成');
    
  } catch (error) {
    console.error('❌ 重新生成失败:', error);
    
    // 移除加载中消息
    chatStore.removeLoadingMessage();
    
    // 添加错误消息
    chatStore.addErrorMessage(
      `重新生成失败: ${(error as Error).message}`
    );
    
    message.error('重新生成失败，请查看错误详情');
  }
};

/**
 * 组件挂载
 */
// 监听消息变化，更新会话历史
watch(
  () => chatStore.messages.value,
  (messages) => {
    if (messages.length > 0) {
      updateSessionMessages(messages);
    }
  },
  { deep: true }
);

onMounted(() => {

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

.app-main {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
}

.app-flow-wrapper {
  padding: 10px 10px 0;
}

ul {
  margin: 8px 0;
  line-height: 1.8;
}
</style>
