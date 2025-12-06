<template>
  <div class="mobile-layout">
    <!-- 顶部导航 -->
    <app-header v-if="showHeader" />

    <!-- 页面内容 -->
    <div class="page-container" :class="{ 'has-tabbar': showTabbar }">
      <router-view />
    </div>

    <!-- 底部导航（仅患者显示） -->
    <app-tabbar v-if="showTabbar" />
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useUserStore } from "@/stores";
import AppHeader from "./components/AppHeader.vue";
import AppTabbar from "./components/AppTabbar.vue";

const route = useRoute();
const userStore = useUserStore();

// 不显示Header的页面
const hideHeaderPages = ["/login", "/register"];

// 不显示Tabbar的页面
const hideTabbarPages = ["/login", "/register", "/doctor-detail"];

// 控制是否显示Header
const showHeader = computed(() => {
  return !hideHeaderPages.includes(route.path);
});

// 控制是否显示Tabbar（只有患者端且已登录才显示）
const showTabbar = computed(() => {
  // 检查是否登录
  const isLogin = userStore.userInfo ? true : false;

  // 检查是否是患者（userType为3或userTypeName为"患者"）
  const isPatient =
    userStore.userInfo?.userType === 3 ||
    userStore.userInfo?.userType === "3" ||
    userStore.userInfo?.userTypeName === "患者";

  // 检查是否在需要隐藏Tabbar的页面
  const shouldHide = hideTabbarPages.includes(route.path);

  return isLogin && isPatient && !shouldHide;
});
</script>

<style scoped>
.mobile-layout {
  width: 100%;
  min-height: 100vh;
  background-color: #f7f8fa;
}

.page-container {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.page-container:not(.has-tabbar) {
  /* NavBar高度 */
  /* padding-top: 46px;  */
  min-height: calc(100vh - 46px);
}

.page-container.has-tabbar {
  /* padding-top: 46px; */
  padding-bottom: 50px; /* Tabbar高度 */
  min-height: calc(100vh - 96px);
}
</style>
