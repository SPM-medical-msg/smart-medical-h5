<template>
  <div class="chat-history-mobile">
    <!-- 头部 -->
    <div class="popup-header">
      <h3>聊天记录</h3>
      <van-button
        type="primary"
        size="small"
        plain
        icon="replay"
        @click="refreshHistory"
      >
        刷新
      </van-button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <van-loading type="spinner" size="36" color="#1989fa">
        加载中...
      </van-loading>
    </div>

    <!-- 消息列表 -->
    <div v-else class="chat-messages" ref="chatContainer">
      <van-list
        v-model:loading="listLoading"
        :finished="finished"
        finished-text="没有更多消息了"
        @load="loadMore"
        direction="up"
      >
        <div v-for="(item, index) in chatList" :key="index">
          <!-- 时间分隔 -->
          <div v-if="shouldShowTime(item, index)" class="time-divider">
            <span>{{ formatMessageTime(item.createTime) }}</span>
          </div>

          <!-- 对方消息 -->
          <div
            v-if="Number(item.sendUserId) !== Number(userId)"
            class="message-item left"
          >
            <van-image
              round
              width="36"
              height="36"
              :src="item.imageUrl"
              class="avatar"
            >
              <template #error>
                <van-icon name="user-o" size="18" />
              </template>
            </van-image>
            <div class="message-content">
              <div class="message-name">{{ item.senderName || "对方" }}</div>
              <!-- 文本消息 -->
              <div v-if="item.type === 1" class="message-bubble">
                {{ item.content }}
              </div>
              <!-- 图片消息 -->
              <div v-else-if="item.type === 2" class="message-bubble image">
                <van-image
                  :src="item.content"
                  width="200"
                  fit="cover"
                  radius="8"
                  @click="previewImage(item.content)"
                >
                  <template #loading>
                    <van-loading type="spinner" size="20" />
                  </template>
                  <template #error>
                    <van-icon name="photo-fail" size="40" />
                  </template>
                </van-image>
              </div>
              <!-- 文件消息 -->
              <div v-else-if="item.type === 3" class="message-bubble file">
                <van-icon name="description" size="24" />
                <span>{{ getFileName(item.content) }}</span>
              </div>
            </div>
          </div>

          <!-- 自己的消息 -->
          <div v-else class="message-item right">
            <div class="message-content">
              <div class="message-name">我</div>
              <!-- 文本消息 -->
              <div v-if="item.type === 1" class="message-bubble">
                {{ item.content }}
              </div>
              <!-- 图片消息 -->
              <div v-else-if="item.type === 2" class="message-bubble image">
                <van-image
                  :src="item.content"
                  width="200"
                  fit="cover"
                  radius="8"
                  @click="previewImage(item.content)"
                >
                  <template #loading>
                    <van-loading type="spinner" size="20" />
                  </template>
                  <template #error>
                    <van-icon name="photo-fail" size="40" />
                  </template>
                </van-image>
              </div>
              <!-- 文件消息 -->
              <div v-else-if="item.type === 3" class="message-bubble file">
                <van-icon name="description" size="24" />
                <span>{{ getFileName(item.content) }}</span>
              </div>
            </div>
            <van-image
              round
              width="36"
              height="36"
              :src="userInfo?.imageUrl"
              class="avatar"
            >
              <template #error>
                <van-icon name="user-o" size="18" />
              </template>
            </van-image>
          </div>
        </div>
      </van-list>

      <!-- 空状态 -->
      <van-empty
        v-if="!loading && chatList.length === 0"
        description="暂无聊天记录"
        image="default"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue";
import { showImagePreview, showToast } from "vant";
import { getUserInfo } from "@/api/user";
import { getFriendMessageInfo } from "@/api/friendMessage";

const props = defineProps({
  userId: {
    type: [String, Number],
    required: true,
  },
  doctorId: {
    type: [String, Number],
    required: true,
  },
  orderId: {
    type: [String, Number],
    default: null,
  },
});

const emit = defineEmits(["close"]);

const loading = ref(false);
const listLoading = ref(false);
const finished = ref(false);
const chatList = ref([]);
const userInfo = ref(null);
const chatContainer = ref(null);
const currentPage = ref(1);
const pageSize = ref(30);

onMounted(() => {
  initData();
});

const initData = async () => {
  loading.value = true;
  try {
    // 获取用户信息
    const userRes = await getUserInfo({ id: props.userId });
    userInfo.value = userRes.data;

    // 获取聊天记录
    await loadChatHistory();
  } catch (error) {
    console.error("初始化失败:", error);
  } finally {
    loading.value = false;
  }
};

const loadChatHistory = async () => {
  try {
    const params = {
      sendUserId: props.userId,
      receiveUserId: props.doctorId,
      strategyId: props.orderId || null,
      pageNum: currentPage.value,
      pageSize: pageSize.value,
    };

    const res = await getFriendMessageInfo(params);
    const list = res.data.list || [];

    if (currentPage.value === 1) {
      chatList.value = list;
    } else {
      chatList.value = [...list, ...chatList.value];
    }

    if (list.length < pageSize.value) {
      finished.value = true;
    }

    // 首次加载滚动到底部
    if (currentPage.value === 1) {
      scrollToBottom();
    }
  } catch (error) {
    console.error("加载聊天记录失败:", error);
  }
};

const loadMore = async () => {
  if (finished.value) return;
  currentPage.value++;
  await loadChatHistory();
  listLoading.value = false;
};

const refreshHistory = async () => {
  loading.value = true;
  currentPage.value = 1;
  finished.value = false;
  chatList.value = [];
  await loadChatHistory();
  loading.value = false;
  showToast("刷新成功");
};

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
};

const previewImage = (url) => {
  const imageList = chatList.value
    .filter((item) => item.type === 2)
    .map((item) => item.content);
  const index = imageList.indexOf(url);
  showImagePreview({
    images: imageList,
    startPosition: index >= 0 ? index : 0,
  });
};

const shouldShowTime = (item, index) => {
  if (index === 0) return true;
  const prevItem = chatList.value[index - 1];
  if (!prevItem) return false;
  const timeDiff = new Date(item.createTime) - new Date(prevItem.createTime);
  return timeDiff > 5 * 60 * 1000; // 5分钟
};

const formatMessageTime = (time) => {
  if (!time) return "";
  const date = new Date(time);
  return date.toLocaleString("zh-CN");
};

const getFileName = (content) => {
  if (!content) return "未知文件";
  const parts = content.split("/");
  return parts[parts.length - 1] || content;
};
</script>

<style lang="scss" scoped>
.chat-history-mobile {
  height: 100%;
  display: flex;
  flex-direction: column;

  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid #f5f5f5;
    flex-shrink: 0;

    h3 {
      font-size: 18px;
      font-weight: 600;
      color: #333;
      margin: 0;
    }
  }

  // 加载状态容器
  .loading-container {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f7fa;
  }

  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    background: #f5f7fa;

    .time-divider {
      text-align: center;
      margin: 16px 0;

      span {
        padding: 4px 12px;
        background: rgba(0, 0, 0, 0.05);
        border-radius: 12px;
        font-size: 12px;
        color: #909399;
      }
    }

    .message-item {
      display: flex;
      margin-bottom: 16px;

      &.left {
        justify-content: flex-start;

        .message-bubble {
          background: #fff;
          color: #333;
          border-radius: 4px 12px 12px 12px;
        }
      }

      &.right {
        justify-content: flex-end;

        .message-content {
          align-items: flex-end;
        }

        .message-bubble {
          background: #1989fa;
          color: #fff;
          border-radius: 12px 4px 12px 12px;
        }
      }

      .avatar {
        flex-shrink: 0;
        background: #f5f5f5;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .message-content {
        display: flex;
        flex-direction: column;
        margin: 0 8px;
        max-width: 70%;

        .message-name {
          font-size: 12px;
          color: #909399;
          margin-bottom: 4px;
        }

        .message-bubble {
          padding: 10px 14px;
          font-size: 14px;
          line-height: 1.5;
          word-break: break-word;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

          &.image {
            padding: 4px;
            background: transparent !important;
            box-shadow: none;
          }

          &.file {
            display: flex;
            align-items: center;
            gap: 8px;
            background: #fff !important;
            color: #333 !important;
          }
        }
      }
    }
  }
}
</style>
