/// <reference types="../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, onMounted } from 'vue';
import { NSpace, NButton, NAlert, useMessage } from 'naive-ui';
const message = useMessage();
const uiPackageLoaded = ref(false);
const showMessage = () => {
    message.success('基础Naive UI工作正常！');
};
// 测试UI包和Core包导入
onMounted(async () => {
    try {
        console.log('🔍 开始测试UI包导入...');
        // 尝试导入UI包
        const uiPackage = await import('@prompt-matrix/ui');
        console.log('✅ UI包导入成功:', Object.keys(uiPackage));
        uiPackageLoaded.value = true;
        message.success('UI包导入成功！');
        // 测试Core包导入
        console.log('🔍 开始测试Core包导入...');
        const corePackage = await import('@prompt-matrix/core');
        console.log('✅ Core包导入成功:', Object.keys(corePackage));
        // 测试具体服务类
        const { LLMService, RouterService } = corePackage;
        console.log('✅ 核心服务类导入成功:', {
            LLMService: !!LLMService,
            RouterService: !!RouterService
        });
        message.success('Core包也导入成功！');
    }
    catch (error) {
        console.error('❌ 包导入失败:', error);
        message.error(`包导入失败: ${error}`);
    }
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
const __VLS_0 = {}.NSpace;
/** @type {[typeof __VLS_components.NSpace, typeof __VLS_components.nSpace, typeof __VLS_components.NSpace, typeof __VLS_components.nSpace, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    vertical: true,
    ...{ style: {} },
}));
const __VLS_2 = __VLS_1({
    vertical: true,
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
const __VLS_4 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    ...{ 'onClick': {} },
    type: "primary",
}));
const __VLS_6 = __VLS_5({
    ...{ 'onClick': {} },
    type: "primary",
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
let __VLS_8;
let __VLS_9;
let __VLS_10;
const __VLS_11 = {
    onClick: (__VLS_ctx.showMessage)
};
__VLS_7.slots.default;
var __VLS_7;
const __VLS_12 = {}.NAlert;
/** @type {[typeof __VLS_components.NAlert, typeof __VLS_components.nAlert, typeof __VLS_components.NAlert, typeof __VLS_components.nAlert, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    type: "info",
}));
const __VLS_14 = __VLS_13({
    type: "info",
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
__VLS_15.slots.default;
var __VLS_15;
var __VLS_3;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
if (__VLS_ctx.uiPackageLoaded) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
}
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            NSpace: NSpace,
            NButton: NButton,
            NAlert: NAlert,
            uiPackageLoaded: uiPackageLoaded,
            showMessage: showMessage,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
