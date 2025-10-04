<template>
  <div style="padding: 20px;">
    <h1>带Naive UI的App</h1>
    <p>测试Naive UI组件是否正常</p>
    <n-button type="primary" @click="showMessage">测试按钮</n-button>
  </div>
</template>

<script setup lang="ts">
import { NButton, useMessage } from 'naive-ui';

const message = useMessage();

const showMessage = () => {
  message.success('Naive UI工作正常！');
};
</script>