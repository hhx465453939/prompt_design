<template>
  <div style="padding: 20px;">
    <h1>UI包组件测试</h1>
    <p>测试从@prompt-matrix/ui导入的组件</p>
    
    <!-- 测试基础Naive UI组件 -->
    <n-space vertical style="margin-bottom: 20px;">
      <n-button type="primary" @click="showMessage">基础按钮</n-button>
      <n-alert type="info">基础警告框</n-alert>
    </n-space>
    
    <!-- 测试UI包组件 -->
    <div style="margin-top: 20px;">
      <h3>UI包组件测试区域</h3>
      <p>如果下面有内容显示，说明UI包导入成功</p>
      
      <!-- 这里会逐步添加UI包组件 -->
      <div v-if="uiPackageLoaded" style="background: #f0f9ff; padding: 10px; border-radius: 4px;">
        ✅ UI包加载成功！
      </div>
      <div v-else style="background: #fef2f2; padding: 10px; border-radius: 4px;">
        ❌ UI包加载失败或正在加载...
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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
    
  } catch (error) {
    console.error('❌ 包导入失败:', error);
    message.error(`包导入失败: ${error}`);
  }
});
</script>