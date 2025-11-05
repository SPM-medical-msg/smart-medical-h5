import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import Components from "unplugin-vue-components/vite";
import { VantResolver } from "unplugin-vue-components/resolvers";
import { fileURLToPath, URL } from "node:url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

export default defineConfig({
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
  css: {
    // SCSS 预处理器配置
    preprocessorOptions: {
      scss: {
        api: "modern-compiler", // 使用现代编译器API（提升性能）
        // 全局引入 SCSS 变量和混入（如果需要的话）
        // additionalData: `
        //   @use "@/styles/variables.scss" as *;
        // `,
        // 如果不需要全局引入，可以注释掉 additionalData
      },
    },
    // PostCSS 配置（保留原有的 px 转 vw）
    postcss: {
      plugins: [
        require("postcss-px-to-viewport-8-plugin")({
          viewportWidth: 375, // 设计稿宽度
          viewportHeight: 667, // 设计稿高度（可选）
          unitPrecision: 5, // 转换后保留的小数位数
          viewportUnit: "vw", // 使用的视口单位
          selectorBlackList: [".ignore", ".hairlines"], // 不转换的类名
          minPixelValue: 1, // 小于1px不转换
          mediaQuery: false, // 允许媒体查询中转换
          exclude: [/node_modules/], // 排除node_modules
        }),
      ],
    },
  },
  server: {
    host: true, // 添加这行支持内网访问
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
