<template>
  <n-tag :type="tagType" size="small" :bordered="false">
    {{ agentInfo.icon }} {{ agentInfo.name }}
    <template v-if="intent">
      · {{ intentName }}
    </template>
  </n-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { NTag } from 'naive-ui';
import type { AgentType, IntentType } from '@prompt-matrix/core';

interface Props {
  agentType: AgentType;
  intent?: IntentType;
}

const props = defineProps<Props>();

// Agent 信息映射
const agentMap: Record<AgentType, { name: string; icon: string; tagType: any }> = {
  CONDUCTOR: { name: '指挥官', icon: '🎯', tagType: 'success' },
  X0_OPTIMIZER: { name: 'X0优化师', icon: '⚡', tagType: 'info' },
  X0_REVERSE: { name: 'X0逆向', icon: '🔍', tagType: 'warning' },
  X1_BASIC: { name: 'X1基础', icon: '📝', tagType: 'default' },
  X4_SCENARIO: { name: 'X4场景', icon: '🎨', tagType: 'error' },
};

// 处理自定义Agent
const getCustomAgentInfo = (agentType: AgentType) => {
  if (typeof agentType === 'string' && agentType.startsWith('CUSTOM_')) {
    const id = agentType.replace('CUSTOM_', '');
    return {
      name: `自定义工程师 (${id})`,
      icon: '🤖',
      tagType: 'info',
    };
  }
  return null;
};

// 意图名称映射
const intentMap: Record<IntentType, string> = {
  REVERSE_ANALYSIS: '逆向分析',
  OPTIMIZE: '优化提升',
  SCENARIO_DESIGN: '场景设计',
  BASIC_DESIGN: '基础设计',
  CHAT: '对话',
};

const agentInfo = computed(() => {
  // 先检查是否是自定义Agent
  const customInfo = getCustomAgentInfo(props.agentType);
  if (customInfo) {
    return customInfo;
  }
  
  // 返回预定义Agent信息
  return agentMap[props.agentType] || {
    name: 'Unknown',
    icon: '🤖',
    tagType: 'default',
  };
});

const intentName = computed(() => props.intent ? intentMap[props.intent] : '');

const tagType = computed(() => agentInfo.value.tagType);
</script>

