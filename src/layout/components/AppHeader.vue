<template>
  <div class="app-header">
    <van-nav-bar
      :title="pageTitle"
      fixed
      placeholder
      :border="true"
      :safe-area-inset-top="true"
    >
      <!-- 左侧：Logo或返回按钮 -->
      <template #left>
        <div class="header-left" @click="handleLeftClick">
          <template v-if="showBack">
            <van-icon name="arrow-left" size="18" color="#fff" />
          </template>
          <template v-else>
            <van-image
              :src="logoUrl"
              width="28"
              height="28"
              fit="cover"
              class="logo-img"
              @click.stop="goHome"
            />
            <span class="brand-name" @click.stop="goHome">医讯通</span>
          </template>
        </div>
      </template>

      <!-- 右侧：用户信息 -->
      <template #right>
        <!-- 未登录 -->
        <van-button
          v-if="!userStore.userInfo"
          size="small"
          type="primary"
          round
          @click="toLogin"
          class="login-btn"
        >
          登录
        </van-button>

        <!-- 已登录 -->
        <div v-else class="user-avatar" @click="showUserPanel = true">
          <van-image
            round
            width="32"
            height="32"
            :src="userStore.userInfo?.imageUrl || defaultAvatar"
            fit="cover"
          >
            <template #error>
              <van-icon name="user-circle-o" size="32" color="#fff" />
            </template>
          </van-image>
        </div>
      </template>
    </van-nav-bar>

    <!-- 用户信息面板 -->
    <user-panel v-model:show="showUserPanel" />
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useUserStore } from "@/stores";
import UserPanel from "./UserPanel.vue";
import logoUrl from "@/assets/image/icon.png";
import defaultAvatar from "@/assets/image/default1.png";

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const showUserPanel = ref(false);

// 页面标题
const pageTitle = computed(() => {
  return route.meta.title || "医讯通";
});

// 是否显示返回按钮
const showBack = computed(() => {
  // 首页不显示返回按钮
  const mainPages = ["/home", "/"];

  // 如果当前页是主页，不显示返回
  if (mainPages.includes(route.path)) {
    return false;
  }

  // 如果有历史记录，显示返回
  return window.history.length > 1;
});

// 左侧点击事件
const handleLeftClick = () => {
  if (showBack.value) {
    router.back();
  } else {
    goHome();
  }
};

// 跳转登录
const toLogin = () => {
  router.push("/login");
};

// 回到首页
const goHome = () => {
  if (route.path !== "/home") {
    router.push("/home");
  }
};
</script>

<style scoped>
.app-header {
  position: relative;
}

:deep(.van-nav-bar) {
  background: linear-gradient(135deg, #4682dc 0%, #5ba3f5 100%);
}

:deep(.van-nav-bar__title) {
  color: #ffffff;
  font-size: 17px;
  font-weight: 500;
}

:deep(.van-nav-bar::after) {
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

:deep(.van-icon) {
  color: #ffffff;
}

/* 左侧区域 */
.header-left {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #ffffff;
  cursor: pointer;
}

.logo-img {
  border-radius: 6px;
}

.brand-name {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  margin-left: 2px;
}

/* 登录按钮 */
.login-btn {
  background: #ffffff;
  color: #4682dc;
  border: none;
  font-weight: 500;
  padding: 0 16px;
  height: 28px;
}

.login-btn:active {
  background: rgba(255, 255, 255, 0.9);
}

/* 用户头像 */
.user-avatar {
  display: flex;
  align-items: center;
  cursor: pointer;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  padding: 1px;
  transition: all 0.3s;
}

.user-avatar:active {
  transform: scale(0.95);
}
</style>
