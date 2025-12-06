<template>
  <div class="voice-wrapper">
    <div class="voice-card">
      <div class="voice-header">
        <h3>语音消息</h3>
        <!-- 新增：非安全环境提示 -->
        <div v-if="!isSecure" class="insecure-tip">
          当前环境(HTTP)可能无法调用麦克风，请使用HTTPS或Localhost
        </div>
      </div>

      <div class="voice-content">
        <!-- 录音状态显示 -->
        <div class="record-status">
          <div class="wave-container" :class="{ active: isRecording }">
            <div class="wave-bar" v-for="i in 5" :key="i"></div>
          </div>
          <div class="duration">{{ formatDuration(duration) }}</div>
        </div>

        <!-- 操作按钮 -->
        <div class="record-actions">
          <template v-if="!hasRecorded">
            <van-button
              v-if="!isRecording"
              type="primary"
              round
              block
              class="action-btn"
              icon="audio"
              :loading="permissionLoading"
              loading-text="申请权限中..."
              @click="handleStartRecord"
            >
              开始录音
            </van-button>
            <van-button
              v-else
              type="danger"
              round
              block
              class="action-btn"
              icon="stop-circle-o"
              @click="stopRecord"
            >
              停止录音
            </van-button>
          </template>

          <template v-else>
            <div class="recorded-actions">
              <van-button
                class="action-btn-small"
                round
                icon="replay"
                @click="reRecord"
              >
                重录
              </van-button>

              <van-button
                class="action-btn-small"
                :type="isPlaying ? 'warning' : 'primary'"
                round
                plain
                :icon="isPlaying ? 'pause-circle-o' : 'play-circle-o'"
                @click="togglePlay"
              >
                {{ isPlaying ? "暂停" : "播放" }}
              </van-button>

              <van-button
                class="action-btn-small"
                type="primary"
                round
                icon="passed"
                @click="sendRecord"
              >
                发送
              </van-button>
            </div>
          </template>
        </div>

        <!-- 提示信息 -->
        <div class="record-tips">
          <van-icon name="info-o" />
          <span>{{
            isRecording
              ? "正在录音，点击停止结束"
              : "点击按钮开始录音，最长60秒"
          }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import { showToast, showFailToast, showDialog } from "vant";
import Recorder from "js-audio-recorder";

const emit = defineEmits(["send", "close"]);

// 状态管理
const recorder = ref(null);
const isRecording = ref(false);
const hasRecorded = ref(false);
const isPlaying = ref(false);
const duration = ref(0);
const permissionLoading = ref(false); // 权限申请loading状态

// 定时器引用
const timer = ref(null);
const playTimer = ref(null);

// 安全环境检查
const isSecure = computed(() => {
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  const isHttps = window.location.protocol === "https:";
  return isLocalhost || isHttps;
});

onMounted(() => {
  // 检查浏览器是否支持录音API
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    if (!isSecure.value) {
      showFailToast("录音需要HTTPS环境");
    } else {
      showFailToast("当前浏览器不支持录音");
    }
  }
});

onBeforeUnmount(() => {
  destroyRecorder();
});

// 初始化/销毁逻辑
const destroyRecorder = () => {
  stopTimer();
  stopPlayTimer();
  if (recorder.value) {
    // 停止并销毁，释放麦克风占用
    try {
      recorder.value.stop();
      recorder.value.destroy();
    } catch (e) {}
    recorder.value = null;
  }
};

// 停止录音计时器
const stopTimer = () => {
  if (timer.value) {
    clearInterval(timer.value);
    timer.value = null;
  }
};

const stopPlayTimer = () => {
  if (playTimer.value) {
    clearTimeout(playTimer.value);
    playTimer.value = null;
  }
};

// 核心：点击开始录音（包含权限申请逻辑）
const handleStartRecord = async () => {
  // 1. 再次环境检查
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showDialog({
      title: "无法录音",
      message:
        "您的浏览器或当前网络环境(HTTP)禁止访问麦克风。请尝试使用HTTPS或更换浏览器。",
    });
    return;
  }

  // 2. 销毁旧实例，防止移动端多实例冲突
  destroyRecorder();

  permissionLoading.value = true;

  try {
    // 3. 显式申请权限
    // 注意：移动端必须在点击事件中直接调用，不能包裹在setTimeout中
    await Recorder.getPermission();

    // 4. 权限获取成功后，实例化
    recorder.value = new Recorder({
      sampleBits: 16,
      sampleRate: 16000,
      numChannels: 1,
    });

    // 5. 开始录音
    recorder.value.start();
    isRecording.value = true;
    hasRecorded.value = false;
    duration.value = 0;
    permissionLoading.value = false;

    // 计时逻辑
    timer.value = setInterval(() => {
      duration.value++;
      if (duration.value >= 60) {
        stopRecord();
      }
    }, 1000);
  } catch (error) {
    permissionLoading.value = false;
    console.error("录音失败:", error);

    let errorMsg = "无法开启麦克风";
    if (
      error.name === "NotAllowedError" ||
      error.name === "PermissionDeniedError"
    ) {
      errorMsg = "请在设置中允许访问麦克风";
    } else if (error.name === "NotFoundError") {
      errorMsg = "未找到麦克风设备";
    }
    showFailToast(errorMsg);
  }
};

// 停止录音
const stopRecord = () => {
  if (!isRecording.value) return;

  stopTimer();
  try {
    if (recorder.value) recorder.value.stop();
  } catch (e) {
    console.error(e);
  }

  isRecording.value = false;
  hasRecorded.value = true;

  if (duration.value < 1) {
    showToast("录音时间太短");
    reRecord(); // 重置状态
  }
};

// 重新录制
const reRecord = () => {
  destroyRecorder(); // 彻底清理
  hasRecorded.value = false;
  duration.value = 0;
  isPlaying.value = false;
  isRecording.value = false;
};

// 播放/暂停控制
const togglePlay = () => {
  if (!recorder.value) return;

  if (isPlaying.value) {
    // 暂停
    recorder.value.pausePlay();
    isPlaying.value = false;
    stopPlayTimer();
  } else {
    // 播放
    recorder.value.play();
    isPlaying.value = true;

    // 获取音频总时长（秒）
    // 注意：recorder.duration 可能是总秒数
    const totalDuration = recorder.value.duration;

    stopPlayTimer();
    playTimer.value = setTimeout(() => {
      isPlaying.value = false;
    }, totalDuration * 1000);
  }
};

// 发送录音
const sendRecord = () => {
  if (!recorder.value || duration.value < 1) {
    showToast("无效的录音文件");
    return;
  }

  try {
    const wavBlob = recorder.value.getWAVBlob();
    const audioFile = new File([wavBlob], `voice_${Date.now()}.wav`, {
      type: "audio/wav",
      lastModified: Date.now(),
    });

    emit("send", audioFile);
    // 发送后关闭/清理
    emit("close");
  } catch (e) {
    console.error("生成音频文件失败", e);
    showFailToast("音频处理失败");
  }
};

// 格式化时长
const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};
</script>

<style lang="scss" scoped>
.voice-wrapper {
  /* PC端兼容：居中显示，背景遮罩效果 */
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
  box-sizing: border-box;
}

.voice-card {
  /* 核心样式：适配PC和移动 */
  width: 100%;
  max-width: 400px; /* PC端限制最大宽度 */
  background: #fff;
  border-radius: 16px;
  padding: 24px 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.3s ease-out;
}

.voice-header {
  text-align: center;
  margin-bottom: 24px;

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin: 0 0 8px 0;
  }

  .insecure-tip {
    font-size: 12px;
    color: #ff4d4f;
    background: #fff1f0;
    padding: 4px 8px;
    border-radius: 4px;
    display: inline-block;
  }
}

.voice-content {
  .record-status {
    text-align: center;
    margin-bottom: 32px;

    .wave-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 50px;
      gap: 6px;

      .wave-bar {
        width: 4px;
        height: 10px;
        background: #e0e0e0;
        border-radius: 2px;
        transition: all 0.2s;
      }

      &.active {
        .wave-bar {
          animation: wave 0.5s ease-in-out infinite alternate;
          background: #1989fa;

          @for $i from 1 through 5 {
            &:nth-child(#{$i}) {
              animation-delay: #{$i * 0.1}s;
            }
          }
        }
      }
    }

    .duration {
      font-size: 32px;
      font-weight: 600;
      color: #333;
      font-family: "Roboto", monospace;
      margin-top: 10px;
    }
  }

  .record-actions {
    margin-bottom: 24px;

    .action-btn {
      width: 100%;
      height: 44px;
      font-size: 16px;
    }

    .recorded-actions {
      display: flex;
      justify-content: space-between;
      gap: 12px;

      .action-btn-small {
        flex: 1;
        height: 40px;
        font-size: 14px;
        padding: 0 8px;
      }
    }
  }

  .record-tips {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 12px;
    color: #969799;
  }
}

@keyframes wave {
  0% {
    height: 10px;
    opacity: 0.5;
  }
  100% {
    height: 40px;
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
