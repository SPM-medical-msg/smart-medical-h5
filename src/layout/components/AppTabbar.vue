<template>
  <van-tabbar
    v-model="activeTab"
    active-color="#4682dc"
    inactive-color="#646566"
    :border="true"
    :placeholder="true"
    :safe-area-inset-bottom="true"
    @change="onTabChange"
  >
    <van-tabbar-item
      v-for="item in tabList"
      :key="item.name"
      :name="item.name"
      :icon="item.icon"
      :badge="item.badge"
    >
      {{ item.title }}
    </van-tabbar-item>
  </van-tabbar>
</template>

<script setup>
import { ref, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { showToast } from "vant";
import { useUserStore } from "@/stores";

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

// 底部导航列表（根据您的实际功能模块调整）
const tabList = ref([
  {
    title: "首页",
    name: "home",
    path: "/home",
    icon: "wap-home-o",
  },
  {
    title: "咨询管理",
    name: "doctor",
    path: "/index-order",
    icon: "friends-o",
  },
  {
    title: "疾病知识",
    name: "consult",
    path: "/index-notice",
    icon: "chat-o",
    badge: "", // 可以设置消息数量
  },
  {
    title: "药品知识",
    name: "knowledge",
    path: "/index-mediciation",
    icon: "notes-o",
  },
  {
    title: "我的",
    name: "mine",
    path: "/person",
    icon: "user-o",
  },
]);

const activeTab = ref("home");

// 监听路由变化，更新激活的tab
watch(
  () => route.path,
  (newPath) => {
    const matchedTab = tabList.value.find((item) =>
      newPath.startsWith(item.path)
    );
    if (matchedTab) {
      activeTab.value = matchedTab.name;
    }
  },
  { immediate: true }
);

// Tab切换
const onTabChange = (name) => {
  const item = tabList.value.find((tab) => tab.name === name);
  if (!item) return;

  // 首页不需要登录检查
  if (item.name !== "home" && !userStore.userInfo) {
    showToast("请先登录");
    router.push("/login");
    return;
  }

  // 如果路径不同才跳转
  if (route.path !== item.path) {
    router.push(item.path);
  }
};
</script>

<style scoped>
:deep(.van-tabbar) {
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.08);
  background-color: #ffffff;
}

:deep(.van-tabbar-item__text) {
  font-size: 12px;
}

:deep(.van-tabbar-item__icon) {
  font-size: 20px;
  margin-bottom: 4px;
}

:deep(.van-tabbar-item--active) {
  background-color: rgba(70, 130, 220, 0.05);
}

:deep(.van-tabbar-item) {
  transition: all 0.3s;
}

:deep(.van-tabbar-item:active) {
  background-color: rgba(70, 130, 220, 0.1);
}
</style>
