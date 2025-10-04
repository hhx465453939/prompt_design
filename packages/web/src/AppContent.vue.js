/// <reference types="../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, onMounted } from 'vue';
import { NModal, NSpace, NText, NAlert, useMessage, useDialog, } from 'naive-ui';
import { ChatWindow, ConfigPanel, useChatStore, useConfigStore } from '@prompt-matrix/ui';
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
    await navigator.clipboard.writeText(ai.content);
    message.success('已复制 Markdown');
};
// 状态管理
const chatStore = useChatStore();
const configStore = useConfigStore();
const message = useMessage();
const dialog = useDialog();
// UI 状态
const showConfig = ref(false);
const showWelcome = ref(false);
// 服务实例
let llmService = null;
let routerService = null;
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
        // 创建路由服务
        routerService = new RouterService(llmService);
        console.log('✅ Services initialized successfully');
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
        console.log('✅ Response received:', {
            agent: meta.agentType,
            intent: meta.intent,
            tokens: meta.metadata?.tokensUsed,
        });
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
 * 加载会话
 */
const handleLoadSession = (messages) => {
    chatStore.messages.value = messages;
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
const handleCopyMessage = async (message, option = 'markdown') => {
    try {
        let contentToCopy = '';
        if (option === 'markdown-with-thinking' && message.thinkingProcess) {
            // 包含思考过程的内容
            contentToCopy = `## 思考过程

${message.thinkingProcess}

## 回答

${message.content}`;
        }
        else {
            // 普通markdown内容
            contentToCopy = message.content;
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
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "app-content" },
});
const __VLS_0 = {}.ChatWindow;
/** @type {[typeof __VLS_components.ChatWindow, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onSend': {} },
    ...{ 'onSendExample': {} },
    ...{ 'onOpenSettings': {} },
    ...{ 'onClearHistory': {} },
    ...{ 'onExportMd': {} },
    ...{ 'onCopyMd': {} },
    ...{ 'onLoadSession': {} },
    ...{ 'onCopyMessage': {} },
    messages: (__VLS_ctx.chatStore.messages.value),
    loading: (__VLS_ctx.chatStore.loading.value),
    isConfigured: (__VLS_ctx.configStore.isConfigured.value),
}));
const __VLS_2 = __VLS_1({
    ...{ 'onSend': {} },
    ...{ 'onSendExample': {} },
    ...{ 'onOpenSettings': {} },
    ...{ 'onClearHistory': {} },
    ...{ 'onExportMd': {} },
    ...{ 'onCopyMd': {} },
    ...{ 'onLoadSession': {} },
    ...{ 'onCopyMessage': {} },
    messages: (__VLS_ctx.chatStore.messages.value),
    loading: (__VLS_ctx.chatStore.loading.value),
    isConfigured: (__VLS_ctx.configStore.isConfigured.value),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onSend: (__VLS_ctx.handleSend)
};
const __VLS_8 = {
    onSendExample: (__VLS_ctx.handleSendExample)
};
const __VLS_9 = {
    onOpenSettings: (...[$event]) => {
        __VLS_ctx.showConfig = true;
    }
};
const __VLS_10 = {
    onClearHistory: (__VLS_ctx.handleClearHistory)
};
const __VLS_11 = {
    onExportMd: (...[$event]) => {
        __VLS_ctx.exportMarkdown();
    }
};
const __VLS_12 = {
    onCopyMd: (...[$event]) => {
        __VLS_ctx.copyMarkdown();
    }
};
const __VLS_13 = {
    onLoadSession: (__VLS_ctx.handleLoadSession)
};
const __VLS_14 = {
    onCopyMessage: (__VLS_ctx.handleCopyMessage)
};
var __VLS_3;
const __VLS_15 = {}.ConfigPanel;
/** @type {[typeof __VLS_components.ConfigPanel, ]} */ ;
// @ts-ignore
const __VLS_16 = __VLS_asFunctionalComponent(__VLS_15, new __VLS_15({
    ...{ 'onSave': {} },
    show: (__VLS_ctx.showConfig),
    config: (__VLS_ctx.configStore.config.value),
}));
const __VLS_17 = __VLS_16({
    ...{ 'onSave': {} },
    show: (__VLS_ctx.showConfig),
    config: (__VLS_ctx.configStore.config.value),
}, ...__VLS_functionalComponentArgsRest(__VLS_16));
let __VLS_19;
let __VLS_20;
let __VLS_21;
const __VLS_22 = {
    onSave: (__VLS_ctx.handleSaveConfig)
};
var __VLS_18;
const __VLS_23 = {}.NModal;
/** @type {[typeof __VLS_components.NModal, typeof __VLS_components.nModal, typeof __VLS_components.NModal, typeof __VLS_components.nModal, ]} */ ;
// @ts-ignore
const __VLS_24 = __VLS_asFunctionalComponent(__VLS_23, new __VLS_23({
    ...{ 'onPositiveClick': {} },
    show: (__VLS_ctx.showWelcome),
    preset: "dialog",
    title: "👋 欢迎使用智能提示词工程师系统",
    positiveText: "开始使用",
}));
const __VLS_25 = __VLS_24({
    ...{ 'onPositiveClick': {} },
    show: (__VLS_ctx.showWelcome),
    preset: "dialog",
    title: "👋 欢迎使用智能提示词工程师系统",
    positiveText: "开始使用",
}, ...__VLS_functionalComponentArgsRest(__VLS_24));
let __VLS_27;
let __VLS_28;
let __VLS_29;
const __VLS_30 = {
    onPositiveClick: (...[$event]) => {
        __VLS_ctx.showWelcome = false;
    }
};
__VLS_26.slots.default;
const __VLS_31 = {}.NSpace;
/** @type {[typeof __VLS_components.NSpace, typeof __VLS_components.nSpace, typeof __VLS_components.NSpace, typeof __VLS_components.nSpace, ]} */ ;
// @ts-ignore
const __VLS_32 = __VLS_asFunctionalComponent(__VLS_31, new __VLS_31({
    vertical: true,
}));
const __VLS_33 = __VLS_32({
    vertical: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_32));
__VLS_34.slots.default;
const __VLS_35 = {}.NText;
/** @type {[typeof __VLS_components.NText, typeof __VLS_components.nText, typeof __VLS_components.NText, typeof __VLS_components.nText, ]} */ ;
// @ts-ignore
const __VLS_36 = __VLS_asFunctionalComponent(__VLS_35, new __VLS_35({}));
const __VLS_37 = __VLS_36({}, ...__VLS_functionalComponentArgsRest(__VLS_36));
__VLS_38.slots.default;
var __VLS_38;
const __VLS_39 = {}.NText;
/** @type {[typeof __VLS_components.NText, typeof __VLS_components.nText, typeof __VLS_components.NText, typeof __VLS_components.nText, ]} */ ;
// @ts-ignore
const __VLS_40 = __VLS_asFunctionalComponent(__VLS_39, new __VLS_39({
    depth: "3",
}));
const __VLS_41 = __VLS_40({
    depth: "3",
}, ...__VLS_functionalComponentArgsRest(__VLS_40));
__VLS_42.slots.default;
var __VLS_42;
__VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
if (!__VLS_ctx.configStore.isConfigured.value) {
    const __VLS_43 = {}.NAlert;
    /** @type {[typeof __VLS_components.NAlert, typeof __VLS_components.nAlert, typeof __VLS_components.NAlert, typeof __VLS_components.nAlert, ]} */ ;
    // @ts-ignore
    const __VLS_44 = __VLS_asFunctionalComponent(__VLS_43, new __VLS_43({
        type: "warning",
        title: "温馨提示",
    }));
    const __VLS_45 = __VLS_44({
        type: "warning",
        title: "温馨提示",
    }, ...__VLS_functionalComponentArgsRest(__VLS_44));
    __VLS_46.slots.default;
    var __VLS_46;
}
var __VLS_34;
var __VLS_26;
/** @type {__VLS_StyleScopedClasses['app-content']} */ ;
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
            exportMarkdown: exportMarkdown,
            copyMarkdown: copyMarkdown,
            chatStore: chatStore,
            configStore: configStore,
            showConfig: showConfig,
            showWelcome: showWelcome,
            handleSend: handleSend,
            handleSendExample: handleSendExample,
            handleSaveConfig: handleSaveConfig,
            handleClearHistory: handleClearHistory,
            handleLoadSession: handleLoadSession,
            handleCopyMessage: handleCopyMessage,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
