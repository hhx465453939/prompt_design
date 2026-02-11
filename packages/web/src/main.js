import { createApp } from 'vue';
import App from './App.vue';
import '@prompt-matrix/ui/style.css';
// Inject Vite runtime env for prebuilt workspace packages (e.g. @prompt-matrix/ui).
window.__PROMPT_MATRIX_ENV__ = { ...import.meta.env };
const app = createApp(App);
app.mount('#app');
