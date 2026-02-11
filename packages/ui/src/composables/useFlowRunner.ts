import { computed, ref } from 'vue';
import type { FlowStep, FlowTemplate } from '../types';

/**
 * 前端 Flow 状态机（MVP 版）
 *
 * - 只负责管理模板与步骤状态，不直接调用 LLM / RouterService
 * - 由上层应用（如 @prompt-matrix/web）注入实际的执行逻辑
 */

const DEFAULT_FLOW_TEMPLATES: FlowTemplate[] = [
  {
    id: 'flow-programming-assistant',
    name: '编程助手设计（单步 X4）',
    description: '使用 X4 场景工程师，一步生成专业编程助手提示词',
    steps: [
      {
        id: 'step-x4-programming',
        title: 'X4 场景工程师：设计编程助手提示词',
        agentType: 'X4_SCENARIO',
        inputSource: 'user',
        customInput:
          '根据用户对编程语言、框架和风格的描述，输出一个可直接用于代码助手的系统提示词。',
        systemPromptHints:
          '请使用清晰的结构化格式，包含角色定位、能力边界、安全约束和交互风格说明。',
      },
    ],
  },
  {
    id: 'flow-prompt-optimizer',
    name: '提示词优化流水线（X0→X1→X0）',
    description: '逆向分析 → 标准化 → 系统性优化的三步流水线',
    steps: [
      {
        id: 'step-x0-reverse',
        title: 'X0 逆向工程师：分析现有提示词',
        agentType: 'X0_REVERSE',
        inputSource: 'user',
        customInput:
          '用户会提供一个现有提示词，请输出其结构分析与设计意图总结，方便后续重构。',
        systemPromptHints:
          '重点识别角色设定、输入输出约束、安全边界和工作流步骤，并用结构化列表输出。',
      },
      {
        id: 'step-x1-basic',
        title: 'X1 基础工程师：重构为 ATOM 提示词',
        agentType: 'X1_BASIC',
        inputSource: 'previousStep',
        customInput:
          '基于上一步的分析结果，用 ATOM 或类似结构重写一个更规范的系统提示词。',
        systemPromptHints:
          '输出只包含新的系统提示词本身，不需要额外解释，方便用户直接复制使用。',
      },
      {
        id: 'step-x0-optimizer',
        title: 'X0 优化师：系统性优化并给出对比',
        agentType: 'X0_OPTIMIZER',
        inputSource: 'previousStep',
        customInput:
          '在保留核心语义的前提下，从鲁棒性、安全性和可维护性三个维度优化提示词。',
        systemPromptHints:
          '先简要说明主要改进点，再给出最终优化后的完整提示词。',
      },
    ],
  },
];

export function useFlowRunner() {
  const templates = ref<FlowTemplate[]>(DEFAULT_FLOW_TEMPLATES);
  const activeTemplateId = ref<string | null>(
    DEFAULT_FLOW_TEMPLATES.length > 0 ? DEFAULT_FLOW_TEMPLATES[0].id : null
  );

  const steps = ref<FlowStep[]>([]);

  /**
   * 根据当前模板重置步骤（清空运行时状态）
   */
  const resetCurrentFlow = () => {
    const tpl = templates.value.find((t) => t.id === activeTemplateId.value);
    if (!tpl) {
      steps.value = [];
      return;
    }
    steps.value = tpl.steps.map((s) => ({
      ...s,
      status: 'idle',
      outputSummary: undefined,
      outputFull: undefined,
      errorMessage: undefined,
    }));
  };

  /**
   * 切换模板
   */
  const selectTemplate = (id: string) => {
    if (activeTemplateId.value === id) return;
    activeTemplateId.value = id;
    resetCurrentFlow();
  };

  /**
   * 更新某一步的运行时状态
   */
  const updateStep = (stepId: string, patch: Partial<FlowStep>) => {
    const index = steps.value.findIndex((s) => s.id === stepId);
    if (index === -1) return;
    const updated = {
      ...steps.value[index],
      ...patch,
    };
    const next = [...steps.value];
    next.splice(index, 1, updated);
    steps.value = next;
  };

  const activeTemplate = computed(() =>
    templates.value.find((t) => t.id === activeTemplateId.value) || null
  );

  // 初始化一次
  if (steps.value.length === 0 && activeTemplateId.value) {
    resetCurrentFlow();
  }

  return {
    templates,
    activeTemplateId,
    activeTemplate,
    steps,
    selectTemplate,
    resetCurrentFlow,
    updateStep,
  };
}

