<template>
  <n-config-provider :locale="zhCN" :date-locale="dateZhCN">
    <n-message-provider>
      <n-dialog-provider>
        <n-notification-provider>
          <AppContent />
        </n-notification-provider>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import {
  NConfigProvider,
  NMessageProvider,
  NDialogProvider,
  NNotificationProvider,
  zhCN,
  dateZhCN,
} from 'naive-ui';
import AppContent from './AppContent.vue';
</script>

<style>
:root {
  --pm-bg-canvas: #eef4ef;
  --pm-bg-mint: #dff0e9;
  --pm-bg-warm: #fff4e8;
  --pm-ink-900: #142225;
  --pm-ink-700: #2b3f44;
  --pm-ink-500: #60757b;
  --pm-line-soft: rgba(21, 58, 61, 0.12);
  --pm-line-strong: rgba(21, 58, 61, 0.24);
  --pm-surface-0: rgba(255, 255, 255, 0.74);
  --pm-surface-1: rgba(255, 255, 255, 0.92);
  --pm-brand-500: #0e9489;
  --pm-brand-600: #0b736a;
  --pm-accent-500: #e6792f;
  --pm-radius-xl: 28px;
  --pm-radius-lg: 18px;
  --pm-radius-md: 12px;
  --pm-shadow-sm: 0 8px 20px rgba(12, 62, 66, 0.08);
  --pm-shadow-md: 0 18px 40px rgba(10, 58, 60, 0.12);
  --pm-shadow-xl: 0 30px 80px rgba(8, 48, 50, 0.14);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  font-family: 'IBM Plex Sans', 'Source Han Sans SC', 'PingFang SC', 'Microsoft YaHei',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background:
    radial-gradient(1200px 520px at -10% -20%, rgba(14, 148, 137, 0.18) 0%, rgba(14, 148, 137, 0) 55%),
    radial-gradient(1000px 460px at 112% 8%, rgba(230, 121, 47, 0.16) 0%, rgba(230, 121, 47, 0) 58%),
    linear-gradient(180deg, var(--pm-bg-canvas) 0%, #f6faf7 100%);
  color: var(--pm-ink-900);
}

body::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  background-image: linear-gradient(rgba(16, 68, 72, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(16, 68, 72, 0.04) 1px, transparent 1px);
  background-size: 30px 30px;
  mask-image: radial-gradient(circle at center, black 40%, transparent 85%);
  z-index: -1;
}

#app {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  position: relative;
  isolation: isolate;
}
</style>

