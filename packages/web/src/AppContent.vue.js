/// <reference types="../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, onMounted, watch } from 'vue';
import { NModal, NSpace, NText, NAlert, useMessage, useDialog, } from 'naive-ui';
import { ChatWindow, ConfigPanel, FlowTimeline, useChatStore, useConfigStore, useChatHistory, useFlowRunner, } from '@prompt-matrix/ui';
import { LLMService, RouterService } from '@prompt-matrix/core';
// 导出/复制：取最后一条 AI 消息
const exportMarkdown = () => {
    const ai = [...chatStore.messages.value].reverse().find(m => m.role === 'assistant' && !m.isLoading && !m.isError);
    if (!ai)
        return message.warning('没有可导出的内容');
    const blob = new Blob([ai.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ts = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
    a.href = url;
    a.download = `prompt-${ts}.md`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('已导出 Markdown');
};
const copyMarkdown = async () => {
    const ai = [...chatStore.messages.value].reverse().find(m => m.role === 'assistant' && !m.isLoading && !m.isError);
    if (!ai)
        return message.warning('没有可复制的内容');
    try {
        await navigator.clipboard.writeText(ai.content);
        message.success('已复制 Markdown');
    }
    catch (error) {
        console.error('复制 Markdown 失败:', error);
        message.error('复制失败，请检查浏览器剪贴板权限');
    }
};
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
const flowSteps = flow.steps;
const flowTemplates = flow.templates;
const flowActiveTemplateId = flow.activeTemplateId;
// 服务实例
let llmService = null;
let routerService = null;
let customAgentsRegistered = false; // 添加标记防止重复注册
let pendingCustomAgents = [];
const normalizeCustomAgentId = (id) => {
    return String(id || '').replace(/^CUSTOM_+/i, '').trim();
};
const normalizeCustomAgents = (agents) => {
    const deduped = new Map();
    agents.forEach((agent) => {
        const normalizedId = normalizeCustomAgentId(agent.id);
        if (!normalizedId)
            return;
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
const registerCustomAgents = (agents) => {
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
            routerService.registerCustomAgent(agentConfig);
            console.log(`✅ 注册自定义Agent: ${agent.name} (CUSTOM_${agent.id})`);
        });
        customAgentsRegistered = normalizedAgents.length > 0;
        if (normalizedAgents.length > 0) {
            console.log(`✅ 已注册 ${normalizedAgents.length} 个自定义Agent`);
        }
    }
    catch (error) {
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
        const coreConfig = {
            provider: configStore.config.value.provider,
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
                provider: 'deepseek',
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
                }
                catch (error) {
                    console.error('❌ 加载自定义Agent失败:', error);
                }
            }
        }
        if (agentsToRegister.length > 0) {
            registerCustomAgents(agentsToRegister);
        }
        return true;
    }
    catch (error) {
        console.error('❌ Failed to initialize services:', error);
        message.error('服务初始化失败: ' + error.message);
        return false;
    }
};
/**
 * 发送消息
 */
const handleSend = async (text, selectedAgent) => {
    if (!configStore.isConfigured.value) {
        message.warning('请先配置 API 密钥');
        showConfig.value = true;
        return;
    }
    // 确保服务已初始化
    if (!routerService) {
        const success = initializeServices();
        if (!success)
            return;
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
        const meta = await routerService.handleRequestStream(text, (chunk) => {
            accumulatedContent += chunk;
            // 直接更新streamingMsg的内容
            streamingMsg.content = accumulatedContent;
            // 强制触发响应式更新
            const messageIndex = chatStore.messages.value.findIndex(m => m.id === streamingMsg.id);
            if (messageIndex !== -1) {
                chatStore.messages.value = [...chatStore.messages.value];
            }
        }, (thinkingChunk) => {
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
        }, {
            metadata: {
                forcedAgent: selectedAgent === 'AUTO' ? undefined : selectedAgent,
            },
        });
        // 完成
        streamingMsg.streaming = false;
        streamingMsg.agentType = meta.agentType;
        streamingMsg.intent = meta.intent;
        // 确保最终内容是完整的
        streamingMsg.content = accumulatedContent;
        // 清理思考过程显示
        streamingMsg.thinkingProcess = undefined;
    }
    catch (error) {
        console.error('❌ Request failed:', error);
        // 移除加载中消息
        chatStore.removeLoadingMessage();
        // 添加错误消息
        chatStore.addErrorMessage(`请求失败: ${error.message}\n\n请检查：\n1. API Key 是否正确\n2. 网络连接是否正常\n3. API 额度是否充足`);
        message.error('请求失败，请查看错误详情');
    }
    finally {
        chatStore.loading.value = false;
    }
};
/**
 * 运行当前 Flow（线性多 Agent 串行执行）
 */
const runCurrentFlow = async () => {
    if (flowRunning.value)
        return;
    const steps = flow.steps.value;
    if (!steps.length)
        return;
    if (!routerService) {
        const success = initializeServices();
        if (!success)
            return;
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
                }
                else {
                    inputText = step.customInput || '';
                }
            }
            else if (step.inputSource === 'previousStep') {
                if (previousOutput) {
                    inputText = step.customInput
                        ? `${step.customInput}\n\n=== 上一步输出 ===\n${previousOutput}`
                        : previousOutput;
                }
                else if (lastUserMessage) {
                    inputText = step.customInput
                        ? `${step.customInput}\n\n=== 用户输入 ===\n${lastUserMessage.content}`
                        : lastUserMessage.content;
                }
                else {
                    inputText = step.customInput || '';
                }
            }
            else {
                inputText = step.customInput || '';
            }
            let accumulatedContent = '';
            await routerService.handleRequestStream(inputText, (chunk) => {
                accumulatedContent += chunk;
                flow.updateStep(step.id, {
                    outputFull: accumulatedContent,
                    outputSummary: accumulatedContent.slice(0, 200),
                });
            }, undefined, {
                metadata: {
                    forcedAgent: step.agentType,
                },
            });
            previousOutput = accumulatedContent;
            flow.updateStep(step.id, {
                status: 'success',
            });
        }
    }
    catch (error) {
        const messageText = error.message || 'Flow execution failed';
        const runningStep = steps.find((s) => s.status === 'running');
        if (runningStep) {
            flow.updateStep(runningStep.id, {
                status: 'error',
                errorMessage: messageText,
            });
        }
        message.error('Flow 执行失败：' + messageText);
    }
    finally {
        flowRunning.value = false;
    }
};
const handleSelectFlowTemplate = (id) => {
    flow.selectTemplate(id);
};
/**
 * 发送示例
 */
const handleSendExample = (example) => {
    handleSend(example);
};
/**
 * 保存配置
 */
const handleSaveConfig = (config) => {
    configStore.saveConfig(config);
    message.success('配置已保存');
    // 重新初始化服务
    initializeServices();
};
/**
 * 加载会话
 */
const handleLoadSession = (messages) => {
    chatStore.setMessages(messages);
    if (routerService) {
        routerService.clearHistory();
        // 将历史消息添加到路由服务的历史记录中
        messages.forEach(msg => {
            if (msg.role === 'user' && msg.content) {
                // 通过公共方法添加历史记录（如果有的话）
                routerService.addHistoryMessage({
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
const handleCopyMessage = async (chatMessage, option = 'markdown') => {
    try {
        let contentToCopy = '';
        if (option === 'markdown-with-thinking' && chatMessage.thinkingProcess) {
            // 包含思考过程的内容
            contentToCopy = `## 思考过程

${chatMessage.thinkingProcess}

## 回答

${chatMessage.content}`;
        }
        else {
            // 普通markdown内容
            contentToCopy = chatMessage.content;
        }
        await navigator.clipboard.writeText(contentToCopy);
        const actionText = option === 'markdown-with-thinking' ? '（包含思考）' : '';
        message.success(`Markdown内容${actionText}已复制到剪贴板`);
    }
    catch (error) {
        console.error('复制失败:', error);
        message.error('复制失败');
    }
};
/**
 * 处理自由聊天
 */
const handleFreeChat = async (prompt) => {
    // 确保服务已初始化
    if (!llmService) {
        const success = initializeServices();
        if (!success) {
            message.error('服务初始化失败，请检查配置');
            return;
        }
    }
    if (!llmService.isInitialized()) {
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
        await llmService.chatStream([{ role: 'user', content: prompt }], (chunk) => {
            accumulatedContent += chunk;
            streamingMsg.content = accumulatedContent;
            // 强制触发响应式更新
            const messageIndex = chatStore.messages.value.findIndex(m => m.id === streamingMsg.id);
            if (messageIndex !== -1) {
                chatStore.messages.value = [...chatStore.messages.value];
            }
        }, {
            // 传递 reasoning tokens 配置
            reasoningTokens: configStore.config.value.reasoningTokens,
        });
        // 完成
        streamingMsg.streaming = false;
        streamingMsg.content = accumulatedContent;
    }
    catch (error) {
        console.error('❌ 自由聊天失败:', error);
        chatStore.removeLoadingMessage();
        chatStore.addErrorMessage('请求失败: ' + error.message);
    }
    finally {
        chatStore.loading.value = false;
    }
};
/**
 * 处理测试提示词
 */
const handleTestPrompt = (prompt) => {
    // 显示提示信息
    message.info(`🧪 已切换到自由聊天模式，正在测试提示词...`);
    // 直接调用自由聊天处理
    handleFreeChat(prompt);
};
/**
 * 处理自定义Agent更新
 */
const handleCustomAgentsUpdate = (agents) => {
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
const handleDeleteMessage = (messageToDelete) => {
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
    }
    else {
        message.error('未找到要删除的消息');
    }
};
/**
 * 处理重新生成
 */
const handleRegenerate = async (userMessage, originalAssistantMessage) => {
    if (!routerService) {
        const success = initializeServices();
        if (!success)
            return;
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
        const existsInHistory = originalAssistantMessage.alternatives.some((alt) => alt.content === originalAssistantMessage.content);
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
        const meta = await routerService.handleRequestStream(userMessage, (chunk) => {
            accumulatedContent += chunk;
            originalAssistantMessage.content = accumulatedContent;
            // 强制触发响应式更新
            const messageIndex = chatStore.messages.value.findIndex(m => m.id === originalAssistantMessage.id);
            if (messageIndex !== -1) {
                chatStore.messages.value = [...chatStore.messages.value];
            }
        }, (thinkingChunk) => {
            if (thinkingChunk) {
                currentThinkingProcess = thinkingChunk;
                originalAssistantMessage.thinkingProcess = currentThinkingProcess;
                // 强制触发响应式更新
                const messageIndex = chatStore.messages.value.findIndex(m => m.id === originalAssistantMessage.id);
                if (messageIndex !== -1) {
                    chatStore.messages.value = [...chatStore.messages.value];
                }
            }
        }, {
            metadata: {
                forcedAgent: 'CONDUCTOR', // 重新生成时使用自动路由
            },
        });
        // 完成重新生成
        originalAssistantMessage.streaming = false;
        originalAssistantMessage.agentType = meta.agentType;
        originalAssistantMessage.intent = meta.intent;
        originalAssistantMessage.content = accumulatedContent;
        originalAssistantMessage.thinkingProcess = undefined;
        originalAssistantMessage.regenerationCount = (originalAssistantMessage.regenerationCount || 0) + 1;
        message.success('回复已重新生成');
    }
    catch (error) {
        console.error('❌ 重新生成失败:', error);
        // 移除加载中消息
        chatStore.removeLoadingMessage();
        // 添加错误消息
        chatStore.addErrorMessage(`重新生成失败: ${error.message}`);
        message.error('重新生成失败，请查看错误详情');
    }
};
/**
 * 组件挂载
 */
// 监听消息变化，更新会话历史
watch(() => chatStore.messages.value, (messages) => {
    if (messages.length > 0) {
        updateSessionMessages(messages);
    }
}, { deep: true });
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
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "app-content" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "app-main" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "app-flow-wrapper" },
});
const __VLS_0 = {}.FlowTimeline;
/** @type {[typeof __VLS_components.FlowTimeline, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onSelectTemplate': {} },
    ...{ 'onRunFlow': {} },
    steps: (__VLS_ctx.flowSteps),
    templates: (__VLS_ctx.flowTemplates),
    activeTemplateId: (__VLS_ctx.flowActiveTemplateId),
    running: (__VLS_ctx.flowRunning),
}));
const __VLS_2 = __VLS_1({
    ...{ 'onSelectTemplate': {} },
    ...{ 'onRunFlow': {} },
    steps: (__VLS_ctx.flowSteps),
    templates: (__VLS_ctx.flowTemplates),
    activeTemplateId: (__VLS_ctx.flowActiveTemplateId),
    running: (__VLS_ctx.flowRunning),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onSelectTemplate: (__VLS_ctx.handleSelectFlowTemplate)
};
const __VLS_8 = {
    onRunFlow: (__VLS_ctx.runCurrentFlow)
};
var __VLS_3;
const __VLS_9 = {}.ChatWindow;
/** @type {[typeof __VLS_components.ChatWindow, ]} */ ;
// @ts-ignore
const __VLS_10 = __VLS_asFunctionalComponent(__VLS_9, new __VLS_9({
    ...{ 'onSend': {} },
    ...{ 'onSendExample': {} },
    ...{ 'onOpenSettings': {} },
    ...{ 'onExportMd': {} },
    ...{ 'onCopyMd': {} },
    ...{ 'onLoadSession': {} },
    ...{ 'onCopyMessage': {} },
    ...{ 'onFreeChat': {} },
    ...{ 'onTestPrompt': {} },
    ...{ 'onUpdateLoading': {} },
    ...{ 'onRegenerate': {} },
    ...{ 'onCustomAgentsUpdate': {} },
    ...{ 'onDeleteMessage': {} },
    messages: (__VLS_ctx.chatStore.messages.value),
    loading: (__VLS_ctx.chatStore.loading.value),
    isConfigured: (__VLS_ctx.configStore.isConfigured.value),
}));
const __VLS_11 = __VLS_10({
    ...{ 'onSend': {} },
    ...{ 'onSendExample': {} },
    ...{ 'onOpenSettings': {} },
    ...{ 'onExportMd': {} },
    ...{ 'onCopyMd': {} },
    ...{ 'onLoadSession': {} },
    ...{ 'onCopyMessage': {} },
    ...{ 'onFreeChat': {} },
    ...{ 'onTestPrompt': {} },
    ...{ 'onUpdateLoading': {} },
    ...{ 'onRegenerate': {} },
    ...{ 'onCustomAgentsUpdate': {} },
    ...{ 'onDeleteMessage': {} },
    messages: (__VLS_ctx.chatStore.messages.value),
    loading: (__VLS_ctx.chatStore.loading.value),
    isConfigured: (__VLS_ctx.configStore.isConfigured.value),
}, ...__VLS_functionalComponentArgsRest(__VLS_10));
let __VLS_13;
let __VLS_14;
let __VLS_15;
const __VLS_16 = {
    onSend: (__VLS_ctx.handleSend)
};
const __VLS_17 = {
    onSendExample: (__VLS_ctx.handleSendExample)
};
const __VLS_18 = {
    onOpenSettings: (...[$event]) => {
        __VLS_ctx.showConfig = true;
    }
};
const __VLS_19 = {
    onExportMd: (...[$event]) => {
        __VLS_ctx.exportMarkdown();
    }
};
const __VLS_20 = {
    onCopyMd: (...[$event]) => {
        __VLS_ctx.copyMarkdown();
    }
};
const __VLS_21 = {
    onLoadSession: (__VLS_ctx.handleLoadSession)
};
const __VLS_22 = {
    onCopyMessage: (__VLS_ctx.handleCopyMessage)
};
const __VLS_23 = {
    onFreeChat: (__VLS_ctx.handleFreeChat)
};
const __VLS_24 = {
    onTestPrompt: (__VLS_ctx.handleTestPrompt)
};
const __VLS_25 = {
    onUpdateLoading: (...[$event]) => {
        __VLS_ctx.chatStore.loading.value = $event;
    }
};
const __VLS_26 = {
    onRegenerate: (__VLS_ctx.handleRegenerate)
};
const __VLS_27 = {
    onCustomAgentsUpdate: (__VLS_ctx.handleCustomAgentsUpdate)
};
const __VLS_28 = {
    onDeleteMessage: (__VLS_ctx.handleDeleteMessage)
};
var __VLS_12;
const __VLS_29 = {}.ConfigPanel;
/** @type {[typeof __VLS_components.ConfigPanel, ]} */ ;
// @ts-ignore
const __VLS_30 = __VLS_asFunctionalComponent(__VLS_29, new __VLS_29({
    ...{ 'onSave': {} },
    show: (__VLS_ctx.showConfig),
    config: (__VLS_ctx.configStore.config.value),
}));
const __VLS_31 = __VLS_30({
    ...{ 'onSave': {} },
    show: (__VLS_ctx.showConfig),
    config: (__VLS_ctx.configStore.config.value),
}, ...__VLS_functionalComponentArgsRest(__VLS_30));
let __VLS_33;
let __VLS_34;
let __VLS_35;
const __VLS_36 = {
    onSave: (__VLS_ctx.handleSaveConfig)
};
var __VLS_32;
const __VLS_37 = {}.NModal;
/** @type {[typeof __VLS_components.NModal, typeof __VLS_components.nModal, typeof __VLS_components.NModal, typeof __VLS_components.nModal, ]} */ ;
// @ts-ignore
const __VLS_38 = __VLS_asFunctionalComponent(__VLS_37, new __VLS_37({
    ...{ 'onPositiveClick': {} },
    show: (__VLS_ctx.showWelcome),
    preset: "dialog",
    title: "👋 欢迎使用智能提示词工程师系统",
    positiveText: "开始使用",
}));
const __VLS_39 = __VLS_38({
    ...{ 'onPositiveClick': {} },
    show: (__VLS_ctx.showWelcome),
    preset: "dialog",
    title: "👋 欢迎使用智能提示词工程师系统",
    positiveText: "开始使用",
}, ...__VLS_functionalComponentArgsRest(__VLS_38));
let __VLS_41;
let __VLS_42;
let __VLS_43;
const __VLS_44 = {
    onPositiveClick: (...[$event]) => {
        __VLS_ctx.showWelcome = false;
    }
};
__VLS_40.slots.default;
const __VLS_45 = {}.NSpace;
/** @type {[typeof __VLS_components.NSpace, typeof __VLS_components.nSpace, typeof __VLS_components.NSpace, typeof __VLS_components.nSpace, ]} */ ;
// @ts-ignore
const __VLS_46 = __VLS_asFunctionalComponent(__VLS_45, new __VLS_45({
    vertical: true,
}));
const __VLS_47 = __VLS_46({
    vertical: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_46));
__VLS_48.slots.default;
const __VLS_49 = {}.NText;
/** @type {[typeof __VLS_components.NText, typeof __VLS_components.nText, typeof __VLS_components.NText, typeof __VLS_components.nText, ]} */ ;
// @ts-ignore
const __VLS_50 = __VLS_asFunctionalComponent(__VLS_49, new __VLS_49({}));
const __VLS_51 = __VLS_50({}, ...__VLS_functionalComponentArgsRest(__VLS_50));
__VLS_52.slots.default;
var __VLS_52;
const __VLS_53 = {}.NText;
/** @type {[typeof __VLS_components.NText, typeof __VLS_components.nText, typeof __VLS_components.NText, typeof __VLS_components.nText, ]} */ ;
// @ts-ignore
const __VLS_54 = __VLS_asFunctionalComponent(__VLS_53, new __VLS_53({
    depth: "3",
}));
const __VLS_55 = __VLS_54({
    depth: "3",
}, ...__VLS_functionalComponentArgsRest(__VLS_54));
__VLS_56.slots.default;
var __VLS_56;
__VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
if (!__VLS_ctx.configStore.isConfigured.value) {
    const __VLS_57 = {}.NAlert;
    /** @type {[typeof __VLS_components.NAlert, typeof __VLS_components.nAlert, typeof __VLS_components.NAlert, typeof __VLS_components.nAlert, ]} */ ;
    // @ts-ignore
    const __VLS_58 = __VLS_asFunctionalComponent(__VLS_57, new __VLS_57({
        type: "warning",
        title: "温馨提示",
    }));
    const __VLS_59 = __VLS_58({
        type: "warning",
        title: "温馨提示",
    }, ...__VLS_functionalComponentArgsRest(__VLS_58));
    __VLS_60.slots.default;
    var __VLS_60;
}
var __VLS_48;
var __VLS_40;
/** @type {__VLS_StyleScopedClasses['app-content']} */ ;
/** @type {__VLS_StyleScopedClasses['app-main']} */ ;
/** @type {__VLS_StyleScopedClasses['app-flow-wrapper']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            NModal: NModal,
            NSpace: NSpace,
            NText: NText,
            NAlert: NAlert,
            ChatWindow: ChatWindow,
            ConfigPanel: ConfigPanel,
            FlowTimeline: FlowTimeline,
            exportMarkdown: exportMarkdown,
            copyMarkdown: copyMarkdown,
            chatStore: chatStore,
            configStore: configStore,
            showConfig: showConfig,
            showWelcome: showWelcome,
            flowRunning: flowRunning,
            flowSteps: flowSteps,
            flowTemplates: flowTemplates,
            flowActiveTemplateId: flowActiveTemplateId,
            handleSend: handleSend,
            runCurrentFlow: runCurrentFlow,
            handleSelectFlowTemplate: handleSelectFlowTemplate,
            handleSendExample: handleSendExample,
            handleSaveConfig: handleSaveConfig,
            handleLoadSession: handleLoadSession,
            handleCopyMessage: handleCopyMessage,
            handleFreeChat: handleFreeChat,
            handleTestPrompt: handleTestPrompt,
            handleCustomAgentsUpdate: handleCustomAgentsUpdate,
            handleDeleteMessage: handleDeleteMessage,
            handleRegenerate: handleRegenerate,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
