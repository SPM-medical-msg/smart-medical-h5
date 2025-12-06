<template>
  <div class="chat-mobile">
    <!-- 顶部导航栏 -->
    <van-nav-bar
      :title="currentUserInfo?.realName || '在线咨询'"
      left-arrow
      @click-left="onClickLeft"
      fixed
      class="chat-nav-bar"
    >
      <template #right>
        <van-popover
          v-model:show="showPopover"
          :actions="popoverActions"
          @select="onPopoverSelect"
        >
          <template #reference>
            <van-icon name="ellipsis" size="20" />
          </template>
        </van-popover>
      </template>
    </van-nav-bar>

    <!-- 聊天头部信息 -->
    <div class="chat-header-info" v-if="currentUserInfo">
      <van-image
        round
        width="36"
        height="36"
        :src="currentUserInfo.imageUrl"
        class="user-avatar"
      >
        <template #error>
          <van-icon name="user-o" size="18" />
        </template>
      </van-image>
      <div class="user-info">
        <span class="user-name">{{ currentUserInfo.realName }}</span>
        <span class="user-role">{{ getUserRole() }}</span>
      </div>
      <div class="status-dot online"></div>
    </div>

    <!-- 消息列表区域 -->
    <div class="chat-messages" ref="chatContainer" @scroll="handleScroll">
      <!-- 加载更多 -->
      <div v-if="hasMore" class="load-more" @click="loadMoreHistory">
        <van-loading v-if="loadingMore" size="16" />
        <span v-else>点击加载更多消息</span>
      </div>

      <!-- 消息列表 -->
      <div v-for="(item, index) in chatList" :key="index">
        <!-- 时间分隔线 -->
        <div v-if="shouldShowTime(item, index)" class="time-divider">
          <span>{{ formatMessageTime(item.createTime) }}</span>
        </div>

        <!-- 对方消息 -->
        <div
          v-if="Number(item.sendUserId) !== userInfo.id"
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
            <!-- 文本消息 -->
            <div
              v-if="item.type === 1"
              class="message-bubble"
              @longpress="onMessageLongPress(item)"
            >
              {{ item.content }}
            </div>

            <!-- 图片消息 -->
            <div v-else-if="item.type === 2" class="message-bubble image">
              <van-image
                :src="item.content"
                width="180"
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
            <div
              v-else-if="item.type === 3"
              class="message-bubble file"
              @click="downloadFile(item)"
            >
              <van-icon name="description" size="28" class="file-icon" />
              <div class="file-info">
                <span class="file-name">{{ item.content }}</span>
                <span class="file-action">点击下载</span>
              </div>
            </div>

            <!-- 语音消息 -->
            <div v-else-if="item.type === 4" class="message-bubble audio">
              <AudioMobile :audio-url="item.content" />
            </div>

            <!-- 卡片消息 -->
            <!-- <div
              v-else-if="item.type === 5"
              class="message-bubble card"
              @click="toDetail(item)"
            >
              <div class="card-text">{{ item.content }}</div>
              <van-image
                v-if="item.fileUrl"
                :src="item.fileUrl"
                width="100%"
                fit="cover"
                radius="4"
              />
            </div> -->
          </div>
        </div>

        <!-- 自己的消息 -->
        <div v-else class="message-item right">
          <div class="message-content">
            <!-- 文本消息 -->
            <div
              v-if="item.type === 1"
              class="message-bubble"
              @longpress="onMessageLongPress(item)"
            >
              {{ item.content }}
            </div>

            <!-- 图片消息 -->
            <div v-else-if="item.type === 2" class="message-bubble image">
              <van-image
                :src="item.content"
                width="180"
                fit="cover"
                radius="8"
                @click="previewImage(item.content)"
              >
                <template #loading>
                  <van-loading type="spinner" size="20" />
                </template>
              </van-image>
            </div>

            <!-- 文件消息 -->
            <div
              v-else-if="item.type === 3"
              class="message-bubble file"
              @click="downloadFile(item)"
            >
              <van-icon name="description" size="28" class="file-icon" />
              <div class="file-info">
                <span class="file-name">{{ item.content }}</span>
                <span class="file-action">点击下载</span>
              </div>
            </div>

            <!-- 语音消息 -->
            <div v-else-if="item.type === 4" class="message-bubble audio">
              <AudioMobile :audio-url="item.content" />
            </div>

            <!-- 卡片消息 -->
            <!-- <div
              v-else-if="item.type === 5"
              class="message-bubble card"
              @click="toDetail(item)"
            >
              <div class="card-text">{{ item.content }}</div>
              <van-image
                v-if="item.fileUrl"
                :src="item.fileUrl"
                width="100%"
                fit="cover"
                radius="4"
              />
            </div> -->
          </div>

          <van-image
            round
            width="36"
            height="36"
            :src="userInfo.imageUrl"
            class="avatar"
          >
            <template #error>
              <van-icon name="user-o" size="18" />
            </template>
          </van-image>
        </div>
      </div>

      <!-- 空状态 -->
      <van-empty
        v-if="chatList.length === 0 && !loading"
        description="暂无消息，开始聊天吧"
        image="default"
      />
    </div>

    <!-- 底部输入区域 - 固定定位 -->
    <div class="chat-input-area">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="tool-item" @click="switchInputMode">
          <van-icon :name="isVoiceMode ? 'edit' : 'audio'" size="22" />
        </div>
      </div>

      <!-- 输入框/语音按钮 -->
      <div class="input-wrapper">
        <!-- 语音模式 -->
        <div
          v-if="isVoiceMode"
          class="voice-btn"
          :class="{ recording: isRecording }"
          @touchstart.prevent="startRecording"
          @touchend.prevent="stopRecording"
          @touchcancel.prevent="cancelRecording"
        >
          {{ isRecording ? "松开发送" : "按住说话" }}
        </div>

        <!-- 文字模式 -->
        <van-field
          v-else
          v-model="content"
          type="textarea"
          :rows="1"
          :autosize="{ maxHeight: 80 }"
          placeholder="输入消息..."
          class="message-input"
          @keypress.enter.prevent="sendMessage"
        />
      </div>

      <!-- 更多工具/发送按钮 -->
      <div class="action-wrapper">
        <van-icon
          v-if="!content.trim()"
          name="add-o"
          size="26"
          @click="showToolPanel = !showToolPanel"
        />
        <van-button
          v-else
          type="primary"
          size="small"
          round
          class="send-btn"
          @click="sendMessage"
        >
          发送
        </van-button>
      </div>
    </div>

    <!-- 工具面板 -->
    <van-action-sheet v-model:show="showToolPanel" title="更多功能">
      <div class="tool-panel">
        <div class="tool-grid">
          <div class="tool-grid-item" @click="chooseImage">
            <div class="tool-icon">
              <van-icon name="photo-o" size="26" />
            </div>
            <span>图片</span>
          </div>
          <div class="tool-grid-item" @click="chooseFile">
            <div class="tool-icon">
              <van-icon name="description" size="26" />
            </div>
            <span>文件</span>
          </div>
          <div class="tool-grid-item" @click="openVoiceRecord">
            <div class="tool-icon">
              <van-icon name="audio" size="26" />
            </div>
            <span>语音</span>
          </div>
          <div class="tool-grid-item" @click="endConsultation">
            <div class="tool-icon danger">
              <van-icon name="close" size="26" />
            </div>
            <span>结束咨询</span>
          </div>
        </div>
      </div>
    </van-action-sheet>

    <!-- 语音录制弹窗 -->
    <van-popup
      v-model:show="showVoicePopup"
      position="bottom"
      round
      :style="{ height: '50%' }"
    >
      <VoiceMobile @send="onVoiceSend" @close="showVoicePopup = false" />
    </van-popup>

    <!-- 录音中遮罩 -->
    <van-overlay :show="isRecording" class="recording-overlay">
      <div class="recording-content">
        <div class="recording-icon" :class="{ cancel: isRecordingCancel }">
          <van-icon :name="isRecordingCancel ? 'revoke' : 'audio'" size="60" />
        </div>
        <p>{{ isRecordingCancel ? "松开取消" : "松开发送，上滑取消" }}</p>
        <div class="recording-time">{{ recordingTime }}s</div>
      </div>
    </van-overlay>

    <!-- 隐藏的文件选择器 -->
    <input
      ref="imageInput"
      type="file"
      accept="image/*"
      style="display: none"
      @change="handleImageUpload"
    />
    <input
      ref="fileInput"
      type="file"
      accept=".pdf,.docx,.doc,.zip,.rar,.xlsx,.xls"
      style="display: none"
      @change="handleFileUpload"
    />
  </div>
</template>
<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  showToast,
  showSuccessToast,
  showFailToast,
  showConfirmDialog,
  showImagePreview,
  showLoadingToast,
  closeToast,
} from "vant";
import { useUserStore } from "@/stores";
import { getUserInfo } from "@/api/user";
import { getFriendInfoById } from "@/api/friend";
import { getFriendMessageInfo } from "@/api/friendMessage";
import { singleUploadFile } from "@/api/upload";
import { updateOrderStatus } from "@/api/order";
import {
  doPublish,
  doSubscribe,
  doUnSubscribe,
  createConnection,
} from "@/utils/mqtt";
import emitter from "@/utils/eventBus";
import VoiceMobile from "@/components/Voice/VoiceMobile.vue";
import AudioMobile from "@/components/Audio/AudioMobile.vue";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

// 路由参数
const orderId = ref(null);
const userId = ref(null);
const doctorId = ref(null);

// 数据
const userInfo = ref({});
const currentUserInfo = ref(null);
const chatList = ref([]);
const content = ref("");
const chatContainer = ref(null);
const loading = ref(false);
const loadingMore = ref(false);
const hasMore = ref(true);

// 分页
const pageInfo = ref({
  pageNum: 1,
  pageSize: 30,
});

// 输入模式
const isVoiceMode = ref(false);
const showToolPanel = ref(false);
const showVoicePopup = ref(false);
const showPopover = ref(false);

// 录音相关
const isRecording = ref(false);
const isRecordingCancel = ref(false);
const recordingTime = ref(0);
const recordingTimer = ref(null);
const recorder = ref(null);

// 文件选择器引用
const imageInput = ref(null);
const fileInput = ref(null);

// MQTT订阅
const subscribedTopic = ref("");

// 弹出菜单
const popoverActions = [
  { text: "查看资料", value: "profile" },
  { text: "结束咨询", value: "end", className: "danger-action" },
];

// 生命周期
onMounted(() => {
  initRouteParams();
  initData();
  initMqtt();
});

onBeforeUnmount(() => {
  cleanupMqttConnection();
});

// 初始化路由参数
const initRouteParams = () => {
  orderId.value = route.query.orderId;
  userId.value = route.query.userId || sessionStorage.getItem("userId");
  doctorId.value = route.query.doctorId;

  if (userId.value) sessionStorage.setItem("userId", userId.value);
  if (doctorId.value) sessionStorage.setItem("receiveUserId", doctorId.value);
  if (orderId.value) sessionStorage.setItem("orderId", orderId.value);
};

// 初始化数据
const initData = async () => {
  loading.value = true;
  try {
    const sendUserId = userId.value || sessionStorage.getItem("userId");
    if (sendUserId) {
      const userRes = await getUserInfo({ id: sendUserId });
      userInfo.value = userRes.data;
    }

    const receiveUserId =
      doctorId.value || sessionStorage.getItem("receiveUserId");
    if (sendUserId && receiveUserId) {
      const friendRes = await getFriendInfoById({
        userId: sendUserId,
        friendId: receiveUserId,
      });
      currentUserInfo.value = friendRes.data;
      await getChatList();
    }
  } catch (error) {
    console.error("初始化失败:", error);
    showFailToast("加载失败");
  } finally {
    loading.value = false;
  }
};

// 初始化MQTT
const initMqtt = () => {
  const sendUserId = userId.value || sessionStorage.getItem("userId");
  const receiveUserId =
    doctorId.value || sessionStorage.getItem("receiveUserId");
  // 创建MQTT连接
  createConnection();
  if (sendUserId && receiveUserId) {
    const topic = `BACK/SRV000/${sendUserId}/${receiveUserId}`;
    subscribedTopic.value = topic;
    doSubscribe(topic, 0);
  }

  emitter.on("message", receiveMessage);
};

// 清理MQTT
const cleanupMqttConnection = () => {
  if (subscribedTopic.value) {
    doUnSubscribe(subscribedTopic.value, 0);
  }
  emitter.off("message", receiveMessage);
  subscribedTopic.value = "";
};

// 接收消息
const receiveMessage = (data) => {
  const { topic, receiveMessage: msg } = data;

  if (topic.includes("CHAT/END")) {
    if (msg.messageType === "END_CONSULTATION") {
      handleEndNotice();
      return;
    }
  }

  if (topic.startsWith("BACK") || topic.startsWith("CHAT/SRV000")) {
    if (msg.isSystemMessage) {
      if (msg.messageType === "END_CONSULTATION") {
        handleEndNotice();
        return;
      }
    }

    const sendUserId = userId.value || sessionStorage.getItem("userId");
    const receiveUserId =
      doctorId.value || sessionStorage.getItem("receiveUserId");

    if (
      Number(msg.sendUserId) === Number(receiveUserId) ||
      Number(msg.receiveUserId) === Number(sendUserId)
    ) {
      chatList.value.push(msg);
      scrollToBottom();
    }
  }
};

// 获取聊天记录
const getChatList = async () => {
  const sendUserId = userId.value || sessionStorage.getItem("userId");
  const receiveUserId =
    doctorId.value || sessionStorage.getItem("receiveUserId");

  if (!sendUserId || !receiveUserId) return;

  try {
    const res = await getFriendMessageInfo({
      sendUserId,
      receiveUserId,
      pageNum: pageInfo.value.pageNum,
      pageSize: pageInfo.value.pageSize,
    });

    const list = res.data.list || [];

    if (pageInfo.value.pageNum === 1) {
      chatList.value = list;
    } else {
      chatList.value = [...list, ...chatList.value];
    }

    hasMore.value = list.length >= pageInfo.value.pageSize;

    if (pageInfo.value.pageNum === 1) {
      scrollToBottom();
    }
  } catch (error) {
    console.error("获取聊天记录失败:", error);
  }
};

// 加载更多历史消息
const loadMoreHistory = async () => {
  if (loadingMore.value || !hasMore.value) return;

  loadingMore.value = true;
  pageInfo.value.pageNum++;
  await getChatList();
  loadingMore.value = false;
};

// 发送文本消息
const sendMessage = () => {
  if (!content.value?.trim()) return;

  const sendUserId = userId.value || sessionStorage.getItem("userId");
  const receiveUserId =
    doctorId.value || sessionStorage.getItem("receiveUserId");

  if (!receiveUserId) {
    showToast("聊天对象不存在");
    return;
  }

  const msg = {
    content: content.value,
    type: 1,
    sendUserId: Number(sendUserId),
    receiveUserId: Number(receiveUserId),
    imageUrl: userInfo.value.imageUrl,
    strategyId: orderId.value,
  };

  doPublish(
    `CHAT/SRV000/${receiveUserId}/${sendUserId}`,
    JSON.stringify(msg),
    0
  );
  chatList.value.push(msg);
  content.value = "";
  scrollToBottom();
};

// 选择图片
const chooseImage = () => {
  showToolPanel.value = false;
  imageInput.value?.click();
};

// 处理图片上传
const handleImageUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const validTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  if (!validTypes.includes(file.type)) {
    showToast("请上传图片文件");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showToast("图片不能超过5MB");
    return;
  }

  const loadingToast = showLoadingToast({ message: "上传中...", duration: 0 });

  try {
    const formData = new FormData();
    formData.append("file", file);
    const res = await singleUploadFile(formData);
    const imageUrl = res.baseUrl + res.data;
    sendImageMessage(imageUrl);
    showSuccessToast("发送成功");
  } catch (error) {
    console.error("上传失败:", error);
    showFailToast("上传失败");
  } finally {
    closeToast();
    e.target.value = "";
  }
};

// 发送图片消息
const sendImageMessage = (imageUrl) => {
  const sendUserId = userId.value || sessionStorage.getItem("userId");
  const receiveUserId =
    doctorId.value || sessionStorage.getItem("receiveUserId");

  const msg = {
    content: imageUrl,
    type: 2,
    sendUserId: Number(sendUserId),
    receiveUserId: Number(receiveUserId),
    imageUrl: userInfo.value.imageUrl,
    strategyId: orderId.value,
  };

  doPublish(
    `CHAT/SRV000/${receiveUserId}/${sendUserId}`,
    JSON.stringify(msg),
    0
  );
  chatList.value.push(msg);
  scrollToBottom();
};

// 选择文件
const chooseFile = () => {
  showToolPanel.value = false;
  fileInput.value?.click();
};

// 处理文件上传
const handleFileUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const loadingToast = showLoadingToast({ message: "上传中...", duration: 0 });

  try {
    const formData = new FormData();
    formData.append("file", file);
    const res = await singleUploadFile(formData);
    const fileUrl = res.baseUrl + res.data;
    sendFileMessage(fileUrl, res.data);
    showSuccessToast("发送成功");
  } catch (error) {
    console.error("上传失败:", error);
    showFailToast("上传失败");
  } finally {
    closeToast();
    e.target.value = "";
  }
};

// 发送文件消息
const sendFileMessage = (fileUrl, fileName) => {
  const sendUserId = userId.value || sessionStorage.getItem("userId");
  const receiveUserId =
    doctorId.value || sessionStorage.getItem("receiveUserId");

  const msg = {
    content: fileName,
    fileUrl,
    type: 3,
    sendUserId: Number(sendUserId),
    receiveUserId: Number(receiveUserId),
    imageUrl: userInfo.value.imageUrl,
    strategyId: orderId.value,
  };

  doPublish(
    `CHAT/SRV000/${receiveUserId}/${sendUserId}`,
    JSON.stringify(msg),
    0
  );
  chatList.value.push(msg);
  scrollToBottom();
};

// 打开语音录制
const openVoiceRecord = () => {
  showToolPanel.value = false;
  showVoicePopup.value = true;
};

// 语音发送回调
const onVoiceSend = async (audioBlob) => {
  showVoicePopup.value = false;

  const loadingToast = showLoadingToast({ message: "发送中...", duration: 0 });

  try {
    const formData = new FormData();
    formData.append("file", audioBlob);
    const res = await singleUploadFile(formData);
    const audioUrl = res.baseUrl + res.data;
    sendVoiceMessage(audioUrl);
    showSuccessToast("发送成功");
  } catch (error) {
    console.error("发送失败:", error);
    showFailToast("发送失败");
  } finally {
    closeToast();
  }
};

// 发送语音消息
const sendVoiceMessage = (audioUrl) => {
  const sendUserId = userId.value || sessionStorage.getItem("userId");
  const receiveUserId =
    doctorId.value || sessionStorage.getItem("receiveUserId");

  const msg = {
    content: audioUrl,
    type: 4,
    sendUserId: Number(sendUserId),
    receiveUserId: Number(receiveUserId),
    imageUrl: userInfo.value.imageUrl,
    strategyId: orderId.value,
  };

  doPublish(
    `CHAT/SRV000/${receiveUserId}/${sendUserId}`,
    JSON.stringify(msg),
    0
  );
  chatList.value.push(msg);
  scrollToBottom();
};

// 切换输入模式
const switchInputMode = () => {
  isVoiceMode.value = !isVoiceMode.value;
};

// 长按录音开始
const startRecording = () => {
  isRecording.value = true;
  isRecordingCancel.value = false;
  recordingTime.value = 0;

  recordingTimer.value = setInterval(() => {
    recordingTime.value++;
    if (recordingTime.value >= 60) {
      stopRecording();
    }
  }, 1000);
};

// 录音结束
const stopRecording = () => {
  if (!isRecording.value) return;

  clearInterval(recordingTimer.value);
  isRecording.value = false;

  if (!isRecordingCancel.value && recordingTime.value >= 1) {
    showToast("请使用工具面板中的语音功能");
  }
};

// 取消录音
const cancelRecording = () => {
  clearInterval(recordingTimer.value);
  isRecording.value = false;
  isRecordingCancel.value = false;
};

// 下载文件
const downloadFile = async (item) => {
  if (!item.fileUrl) {
    showToast("文件地址无效");
    return;
  }

  showLoadingToast({ message: "下载中...", duration: 0 });

  try {
    const response = await fetch(item.fileUrl);
    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = item.content;
    link.click();
    URL.revokeObjectURL(link.href);
    showSuccessToast("下载成功");
  } catch (error) {
    console.error("下载失败:", error);
    showFailToast("下载失败");
  } finally {
    closeToast();
  }
};

// 预览图片
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

// 结束咨询
const endConsultation = async () => {
  showToolPanel.value = false;

  try {
    await showConfirmDialog({
      title: "结束咨询",
      message: "确定要结束本次咨询吗？结束后将无法继续发送消息。",
    });

    await sendEndNotice();

    await updateOrderStatus({
      orderId: orderId.value || sessionStorage.getItem("orderId"),
      status: 3,
    });

    cleanupMqttConnection();
    cleanupLocalStorage();

    showSuccessToast("咨询已结束");
    router.push("/index-order");
  } catch (error) {
    if (error !== "cancel") {
      console.error("结束咨询失败:", error);
      showFailToast("操作失败");
    }
  }
};

// 发送结束通知
const sendEndNotice = () => {
  return new Promise((resolve) => {
    const sendUserId = userId.value || sessionStorage.getItem("userId");
    const receiveUserId =
      doctorId.value || sessionStorage.getItem("receiveUserId");

    const msg = {
      content: "患者已结束咨询",
      type: 99,
      sendUserId: Number(sendUserId),
      receiveUserId: Number(receiveUserId),
      imageUrl: userInfo.value.imageUrl,
      strategyId: orderId.value,
      isSystemMessage: true,
      messageType: "END_CONSULTATION",
    };

    doPublish(
      `CHAT/END/${receiveUserId}/${sendUserId}`,
      JSON.stringify(msg),
      1
    );
    doPublish(
      `CHAT/SRV000/${receiveUserId}/${sendUserId}`,
      JSON.stringify(msg),
      1
    );

    setTimeout(resolve, 500);
  });
};

// 处理结束通知
const handleEndNotice = () => {
  showToast({
    message: "咨询已结束",
    duration: 3000,
    onClose: () => {
      cleanupMqttConnection();
      cleanupLocalStorage();
      router.push("/index-order");
    },
  });
};

// 清理本地存储
const cleanupLocalStorage = () => {
  sessionStorage.removeItem("receiveUserId");
  sessionStorage.removeItem("orderId");
};

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
};

// 处理滚动
const handleScroll = () => {};

// 返回
const onClickLeft = () => {
  router.back();
};

// 弹出菜单选择
const onPopoverSelect = (action) => {
  if (action.value === "profile") {
    router.push({
      path: "/doctor-detail",
      query: { id: doctorId.value },
    });
  } else if (action.value === "end") {
    endConsultation();
  }
};

// 消息长按
const onMessageLongPress = (item) => {};

// 跳转详情
const toDetail = (item) => {
  router.push({
    path: "/order/detail",
    query: { id: item.strategyId },
  });
};

// 是否显示时间
const shouldShowTime = (item, index) => {
  if (index === 0) return true;
  const prevItem = chatList.value[index - 1];
  if (!prevItem || !prevItem.createTime || !item.createTime) return false;
  const timeDiff = new Date(item.createTime) - new Date(prevItem.createTime);
  return timeDiff > 5 * 60 * 1000;
};

// 格式化消息时间
const formatMessageTime = (time) => {
  if (!time) return "";
  const date = new Date(time);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// 获取用户角色
const getUserRole = () => {
  const userType = currentUserInfo.value?.userType;
  if (userType === 1) return "患者";
  if (userType === 2) return "医生";
  return "在线";
};
</script>

<style lang="scss" scoped>
// ==================== 核心布局变量 ====================
$nav-bar-height: 46px; // 顶部导航栏高度
$header-info-height: 56px; // 聊天头部信息高度
$input-area-height: 54px; // 输入区域基础高度
$bottom-tabbar-height: 50px; // 底部导航栏高度

.chat-mobile {
  // 关键：适配底部导航栏，减去50px
  height: calc(100vh - #{$bottom-tabbar-height} - 46px);
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  position: relative;

  // ==================== 顶部导航栏 ====================
  .chat-nav-bar {
    flex-shrink: 0;
  }

  // ==================== 聊天头部信息 ====================
  .chat-header-info {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    padding: 8px 16px;
    background: #fff;
    border-bottom: 1px solid #f0f0f0;
    height: $header-info-height;
    box-sizing: border-box;
    // 距离顶部导航栏
    // margin-top: $nav-bar-height;

    .user-avatar {
      margin-right: 10px;
      flex-shrink: 0;
    }

    .user-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;

      .user-name {
        font-size: 15px;
        font-weight: 500;
        color: #333;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .user-role {
        font-size: 12px;
        color: #999;
      }
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;

      &.online {
        background: #52c41a;
        box-shadow: 0 0 0 2px rgba(82, 196, 26, 0.2);
      }
    }
  }

  // ==================== 消息区域 ====================
  .chat-messages {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 12px 12px;
    background: #f5f5f5;
    // 防止被输入框遮挡
    -webkit-overflow-scrolling: touch;

    .load-more {
      text-align: center;
      padding: 10px;
      color: #999;
      font-size: 13px;
    }

    .time-divider {
      text-align: center;
      margin: 12px 0;

      span {
        padding: 3px 10px;
        background: rgba(0, 0, 0, 0.06);
        border-radius: 10px;
        font-size: 11px;
        color: #999;
      }
    }

    .message-item {
      display: flex;
      margin-bottom: 12px;

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

        .message-bubble {
          background: #1989fa;
          color: #fff;
          border-radius: 12px 4px 12px 12px;
        }
      }

      .avatar {
        flex-shrink: 0;
      }

      .message-content {
        margin: 0 8px;
        max-width: 68%;

        .message-bubble {
          padding: 9px 12px;
          font-size: 14px;
          line-height: 1.5;
          word-break: break-word;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

          &.image {
            padding: 3px;
            background: transparent !important;
            box-shadow: none;
          }

          &.file {
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 160px;
            background: #fff !important;
            color: #333 !important;

            .file-icon {
              color: #1989fa;
            }

            .file-info {
              flex: 1;
              min-width: 0;

              .file-name {
                font-size: 13px;
                margin-bottom: 2px;
                word-break: break-all;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
              }

              .file-action {
                font-size: 11px;
                color: #999;
              }
            }
          }

          &.audio {
            min-width: 140px;
            background: #fff !important;
            padding: 6px 10px;
          }

          &.card {
            min-width: 180px;
            background: #fff !important;
            color: #333 !important;

            .card-text {
              margin-bottom: 6px;
              font-size: 13px;
            }
          }
        }
      }
    }

    // 底部留白，防止最后一条消息被输入框遮挡
    &::after {
      content: "";
      display: block;
      height: 10px;
    }
  }

  // ==================== 底部输入区域 ====================
  .chat-input-area {
    flex-shrink: 0;
    display: flex;
    align-items: flex-end;
    padding: 8px 10px;
    background: #fff;
    border-top: 1px solid #eee;
    min-height: $input-area-height;
    box-sizing: border-box;
    // 确保在底部导航栏上方
    position: relative;
    z-index: 10;

    .toolbar {
      flex-shrink: 0;

      .tool-item {
        padding: 6px;
        color: #666;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    .input-wrapper {
      flex: 1;
      margin: 0 8px;
      min-width: 0;

      .voice-btn {
        height: 34px;
        line-height: 34px;
        text-align: center;
        background: #f5f5f5;
        border-radius: 4px;
        color: #333;
        font-size: 14px;
        user-select: none;

        &:active,
        &.recording {
          background: #1989fa;
          color: #fff;
        }
      }

      .message-input {
        background: #f5f5f5;
        border-radius: 4px;
        padding: 0;

        :deep(.van-field__control) {
          min-height: 34px;
          max-height: 80px;
          padding: 6px 10px;
          font-size: 14px;
          line-height: 1.4;
        }

        :deep(.van-cell) {
          padding: 0;
          background: transparent;
        }

        :deep(.van-field__body) {
          background: #f5f5f5;
          border-radius: 4px;
        }
      }
    }

    .action-wrapper {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      padding: 2px 0;

      .send-btn {
        height: 32px;
        padding: 0 14px;
        font-size: 13px;
      }
    }
  }

  // ==================== 工具面板 ====================
  .tool-panel {
    padding: 16px 12px 30px;
    // 适配底部安全区域
    padding-bottom: calc(30px + env(safe-area-inset-bottom));

    .tool-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;

      .tool-grid-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;

        .tool-icon {
          width: 50px;
          height: 50px;
          background: #f5f5f5;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;

          &.danger {
            background: #fff1f0;
            color: #ff4d4f;
          }
        }

        span {
          font-size: 12px;
          color: #666;
        }
      }
    }
  }

  // ==================== 录音遮罩 ====================
  .recording-overlay {
    display: flex;
    align-items: center;
    justify-content: center;

    .recording-content {
      text-align: center;
      color: #fff;

      .recording-icon {
        width: 100px;
        height: 100px;
        margin: 0 auto 16px;
        background: rgba(0, 0, 0, 0.6);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;

        &.cancel {
          background: #ff4d4f;
        }
      }

      p {
        font-size: 14px;
        margin-bottom: 8px;
      }

      .recording-time {
        font-size: 24px;
        font-weight: 500;
      }
    }
  }
}

// ==================== 全局覆盖样式 ====================
:deep(.danger-action) {
  color: #ff4d4f !important;
}

// 修复 van-field 在输入区域的样式
:deep(.van-cell::after) {
  display: none;
}
</style>
