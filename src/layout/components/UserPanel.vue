<template>
  <van-popup
    v-model:show="showPanel"
    position="right"
    :style="{ width: '75%', height: '100%' }"
    :close-on-click-overlay="true"
    :safe-area-inset-bottom="true"
  >
    <div class="user-panel">
      <!-- 用户信息头部 -->
      <div class="user-header">
        <div class="user-bg"></div>
        <div class="user-info-wrapper">
          <van-image
            round
            width="64"
            height="64"
            :src="userStore.userInfo?.imageUrl || defaultAvatar"
            class="user-avatar-large"
          >
            <template #error>
              <van-icon name="user-circle-o" size="64" color="#fff" />
            </template>
          </van-image>
          <div class="user-detail">
            <div class="user-name">
              {{ userStore.userInfo?.realName || "用户" }}
            </div>
            <div class="user-type">
              <van-tag :type="getUserTypeColor()" size="medium">
                {{ userStore.userInfo?.userTypeName || "用户" }}
              </van-tag>
            </div>
          </div>
        </div>
      </div>

      <!-- 菜单列表 -->
      <van-cell-group class="menu-group" :border="false">
        <van-cell
          title="个人中心"
          icon="user-o"
          is-link
          @click="handleCommand('profile')"
        />
        <van-cell
          title="我的咨询"
          icon="chat-o"
          is-link
          @click="handleCommand('consult')"
        />
        <van-cell
          v-if="isAdmin"
          title="后台管理"
          icon="setting-o"
          is-link
          @click="handleCommand('management')"
        />
      </van-cell-group>

      <!-- 退出登录 -->
      <div class="logout-wrapper">
        <van-button
          block
          type="danger"
          round
          icon="close"
          @click="handleLogout"
        >
          退出登录
        </van-button>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores";
import { showToast } from "vant";
import defaultAvatar from "@/assets/image/default1.png";

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:show"]);

const router = useRouter();
const userStore = useUserStore();

const showPanel = computed({
  get: () => props.show,
  set: (val) => emit("update:show", val),
});

// 判断是否是管理员
const isAdmin = computed(() => {
  return (
    userStore.userInfo?.userType === 1 ||
    userStore.userInfo?.userType === "1" ||
    userStore.userInfo?.userTypeName === "管理员"
  );
});

// 根据用户类型返回标签颜色
const getUserTypeColor = () => {
  const typeMap = {
    管理员: "danger",
    医生: "success",
    患者: "primary",
    员工: "warning",
  };
  return typeMap[userStore.userInfo?.userTypeName] || "default";
};

// 菜单点击事件
const handleCommand = (command) => {
  showPanel.value = false;

  setTimeout(() => {
    switch (command) {
      case "profile":
        router.push("/person");
        break;
      case "consult":
        router.push("/index-order");
        break;
      case "management":
        // 跳转到管理后台（可能需要跳转到PC端）
        showToast("管理后台请使用电脑访问");
        break;
      default:
        break;
    }
  }, 300);
};

// 退出登录
const handleLogout = async () => {
  try {
    // 使用store的logout方法（已包含确认对话框）
    const confirmed = await userStore.logout();

    if (confirmed) {
      // 关闭面板
      showPanel.value = false;

      // 延迟跳转，让面板关闭动画完成
      setTimeout(() => {
        router.push("/home");
      }, 300);
    }
  } catch (error) {
    console.error("退出登录失败:", error);
  }
};
</script>

<style scoped>
.user-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f7f8fa;
}

/* 用户信息头部 */
.user-header {
  position: relative;
  padding: 60px 20px 30px;
  overflow: hidden;
}

.user-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 200px;
  background: linear-gradient(135deg, #4682dc 0%, #5ba3f5 100%);
}

.user-info-wrapper {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.user-avatar-large {
  border: 3px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  margin-bottom: 12px;
}

.user-detail {
  color: #ffffff;
}

.user-name {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
}

.user-type {
  display: flex;
  justify-content: center;
}

:deep(.van-tag) {
  background-color: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #ffffff;
  padding: 4px 12px;
}

/* 菜单组 */
.menu-group {
  margin-top: 12px;
  flex: 1;
}

:deep(.van-cell) {
  padding: 16px;
  font-size: 15px;
}

:deep(.van-cell__left-icon) {
  font-size: 20px;
  margin-right: 12px;
  color: #4682dc;
}

:deep(.van-cell:active) {
  background-color: #f2f3f5;
}

/* 退出按钮 */
.logout-wrapper {
  padding: 20px;
  margin-top: auto;
}

:deep(.van-button--danger) {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
  border: none;
}

:deep(.van-button--danger:active) {
  background: linear-gradient(135deg, #ff5252 0%, #e53935 100%);
}
</style>
