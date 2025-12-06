// main.js
import { createApp } from "vue";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import App from "./App.vue";
import router from "./router";

// ==================== 样式导入 ====================
import "vant/lib/index.css";
import "@/assets/fonts/iconfont.css";

// ==================== Buffer 兼容（MQTT需要） ====================
import { Buffer } from "buffer";
window.Buffer = Buffer;

// ==================== Markdown 预览组件 ====================
import VMdPreview from "@kangc/v-md-editor/lib/preview";
import "@kangc/v-md-editor/lib/style/preview.css";
import githubTheme from "@kangc/v-md-editor/lib/theme/github.js";
import "@kangc/v-md-editor/lib/theme/style/github.css";
import hljs from "highlight.js";

VMdPreview.use(githubTheme, {
  Hljs: hljs,
});

// ==================== Vant 函数式组件配置（Vant 4 写法） ====================
import {
  setToastDefaultOptions,
  setDialogDefaultOptions,
  Lazyload,
} from "vant";

// ==================== 创建应用 ====================
const app = createApp(App);

// Pinia 状态管理
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
app.use(pinia);

// 路由
app.use(router);

// Markdown 预览
app.use(VMdPreview);

// 图片懒加载
app.use(Lazyload);

// ==================== 全局默认配置（Vant 4 写法） ====================
setToastDefaultOptions({ duration: 2000 });
setDialogDefaultOptions({ confirmButtonColor: "#1989fa" });

// ==================== 挂载应用 ====================
app.mount("#app");
