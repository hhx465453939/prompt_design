import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  envDir: resolve(__dirname, '../../'),
  server: {
    port: 5173,
    open: true,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  optimizeDeps: {
    include: ['vue', 'naive-ui'],
    // Workspace packages are rebuilt frequently during local development.
    // Excluding them avoids stale prebundle cache causing missing export errors.
    exclude: ['@prompt-matrix/core', '@prompt-matrix/ui'],
  },
});

