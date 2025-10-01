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
        };
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
            thinkingProcess: '解析意图中…\n\n- 检测是否为完整提示词\n- 判断是否为优化请求\n- 场景/基础设计分流',
        });
        // 真实流式：调用流式接口
        const meta = await routerService.handleRequestStream(text, (chunk) => {
            streamingMsg.content += chunk;
        }, {
            metadata: {
                forcedAgent: selectedAgent === 'AUTO' ? undefined : selectedAgent,
            },
        });
        // 完成
        streamingMsg.streaming = false;
        streamingMsg.agentType = meta.agentType;
        streamingMsg.intent = meta.intent;
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
var __VLS_3;
const __VLS_13 = {}.ConfigPanel;
/** @type {[typeof __VLS_components.ConfigPanel, ]} */ ;
// @ts-ignore
const __VLS_14 = __VLS_asFunctionalComponent(__VLS_13, new __VLS_13({
    ...{ 'onSave': {} },
    show: (__VLS_ctx.showConfig),
    config: (__VLS_ctx.configStore.config.value),
}));
const __VLS_15 = __VLS_14({
    ...{ 'onSave': {} },
    show: (__VLS_ctx.showConfig),
    config: (__VLS_ctx.configStore.config.value),
}, ...__VLS_functionalComponentArgsRest(__VLS_14));
let __VLS_17;
let __VLS_18;
let __VLS_19;
const __VLS_20 = {
    onSave: (__VLS_ctx.handleSaveConfig)
};
var __VLS_16;
const __VLS_21 = {}.NModal;
/** @type {[typeof __VLS_components.NModal, typeof __VLS_components.nModal, typeof __VLS_components.NModal, typeof __VLS_components.nModal, ]} */ ;
// @ts-ignore
const __VLS_22 = __VLS_asFunctionalComponent(__VLS_21, new __VLS_21({
    ...{ 'onPositiveClick': {} },
    show: (__VLS_ctx.showWelcome),
    preset: "dialog",
    title: "👋 欢迎使用智能提示词工程师系统",
    positiveText: "开始使用",
}));
const __VLS_23 = __VLS_22({
    ...{ 'onPositiveClick': {} },
    show: (__VLS_ctx.showWelcome),
    preset: "dialog",
    title: "👋 欢迎使用智能提示词工程师系统",
    positiveText: "开始使用",
}, ...__VLS_functionalComponentArgsRest(__VLS_22));
let __VLS_25;
let __VLS_26;
let __VLS_27;
const __VLS_28 = {
    onPositiveClick: (...[$event]) => {
        __VLS_ctx.showWelcome = false;
    }
};
__VLS_24.slots.default;
const __VLS_29 = {}.NSpace;
/** @type {[typeof __VLS_components.NSpace, typeof __VLS_components.nSpace, typeof __VLS_components.NSpace, typeof __VLS_components.nSpace, ]} */ ;
// @ts-ignore
const __VLS_30 = __VLS_asFunctionalComponent(__VLS_29, new __VLS_29({
    vertical: true,
}));
const __VLS_31 = __VLS_30({
    vertical: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_30));
__VLS_32.slots.default;
const __VLS_33 = {}.NText;
/** @type {[typeof __VLS_components.NText, typeof __VLS_components.nText, typeof __VLS_components.NText, typeof __VLS_components.nText, ]} */ ;
// @ts-ignore
const __VLS_34 = __VLS_asFunctionalComponent(__VLS_33, new __VLS_33({}));
const __VLS_35 = __VLS_34({}, ...__VLS_functionalComponentArgsRest(__VLS_34));
__VLS_36.slots.default;
var __VLS_36;
const __VLS_37 = {}.NText;
/** @type {[typeof __VLS_components.NText, typeof __VLS_components.nText, typeof __VLS_components.NText, typeof __VLS_components.nText, ]} */ ;
// @ts-ignore
const __VLS_38 = __VLS_asFunctionalComponent(__VLS_37, new __VLS_37({
    depth: "3",
}));
const __VLS_39 = __VLS_38({
    depth: "3",
}, ...__VLS_functionalComponentArgsRest(__VLS_38));
__VLS_40.slots.default;
var __VLS_40;
__VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
if (!__VLS_ctx.configStore.isConfigured.value) {
    const __VLS_41 = {}.NAlert;
    /** @type {[typeof __VLS_components.NAlert, typeof __VLS_components.nAlert, typeof __VLS_components.NAlert, typeof __VLS_components.nAlert, ]} */ ;
    // @ts-ignore
    const __VLS_42 = __VLS_asFunctionalComponent(__VLS_41, new __VLS_41({
        type: "warning",
        title: "温馨提示",
    }));
    const __VLS_43 = __VLS_42({
        type: "warning",
        title: "温馨提示",
    }, ...__VLS_functionalComponentArgsRest(__VLS_42));
    __VLS_44.slots.default;
    var __VLS_44;
}
var __VLS_32;
var __VLS_24;
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
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
