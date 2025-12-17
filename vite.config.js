// vite.config.js
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import Components from "unplugin-vue-components/vite";
import { VantResolver } from "unplugin-vue-components/resolvers";
import { fileURLToPath, URL } from "node:url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

export default defineConfig({
  base: "/mobile/", // 这里是mobile
  plugins: [
    vue(),
    // Vant 自动按需引入
    Components({
      resolvers: [VantResolver()],
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  // ==================== Buffer 兼容配置（MQTT需要） ====================
  define: {
    global: "globalThis",
  },
  optimizeDeps: {
    include: ["buffer", "mqtt/dist/mqtt.min"],
  },
  css: {
    // SCSS 预处理器配置
    preprocessorOptions: {
      scss: {
        api: "modern-compiler",
      },
    },
    // PostCSS 配置（px 转 vw）
    postcss: {
      plugins: [
        require("postcss-px-to-viewport-8-plugin")({
          viewportWidth: 375,
          viewportHeight: 667,
          unitPrecision: 5,
          viewportUnit: "vw",
          selectorBlackList: [".ignore", ".hairlines"],
          minPixelValue: 1,
          mediaQuery: false,
          exclude: [/node_modules/],
        }),
      ],
    },
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    open: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:9001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
