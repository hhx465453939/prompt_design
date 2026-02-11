/**
 * @prompt-matrix/ui
 * Vue 3 组件库
 */

// 组件导出
export { default as ChatWindow } from './components/ChatWindow.vue';
export { default as MessageItem } from './components/MessageItem.vue';
export { default as InputBox } from './components/InputBox.vue';
export { default as ConfigPanel } from './components/ConfigPanel.vue';
export { default as AgentIndicator } from './components/AgentIndicator.vue';
export { default as CustomProviderManager } from './components/CustomProviderManager.vue';
export { default as ChatSidebar } from './components/ChatSidebar.vue';
export { default as FlowTimeline } from './components/FlowTimeline.vue';

// 类型导出
export * from './types';

// Composables 导出
export { useChatStore } from './composables/useChatStore';
export { useConfigStore } from './composables/useConfigStore';
export { useChatHistory } from './composables/useChatHistory';
export { useFlowRunner } from './composables/useFlowRunner';

