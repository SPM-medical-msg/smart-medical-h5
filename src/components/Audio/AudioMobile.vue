<template>
  <div class="audio-wrapper" :class="{ 'is-playing': isPlaying }">
    <!-- 播放/暂停按钮区域 -->
    <div class="control-btn" @click.stop="togglePlay">
      <!-- 加载中 -->
      <van-loading v-if="isLoading" type="spinner" size="20" color="#1989fa" />
      <!-- 播放/暂停图标 -->
      <van-icon
        v-else
        :name="isPlaying ? 'pause-circle' : 'play-circle'"
        size="28"
        :color="isPlaying ? '#1989fa' : '#666'"
      />
    </div>

    <!-- 中间内容区域：进度条 + 标题/波纹 -->
    <div class="content-area">
      <!-- 这里展示进度条，支持拖拽 -->
      <div class="slider-container">
        <input
          type="range"
          min="0"
          :max="duration"
          step="0.1"
          v-model="currentTime"
          class="seek-slider"
          @input="onSeekInput"
          @change="onSeekChange"
          :style="{ backgroundSize: progressPercent + '% 100%' }"
        />
      </div>

      <!-- 装饰性波纹 (仅在播放时显示或作为装饰) -->
      <!-- 如果你想保留原来的波纹风格，可以放在这里，或者作为背景 -->
      <!-- <div class="audio-waves" :class="{ playing: isPlaying }">...</div> -->
    </div>

    <!-- 时间显示 -->
    <div class="time-display">
      {{ formatDuration(currentTime) }} / {{ formatDuration(duration) }}
    </div>

    <!-- 原生 Audio 标签 (隐藏) -->
    <audio
      ref="audioRef"
      :src="audioUrl"
      preload="metadata"
      @loadedmetadata="onLoadedMetadata"
      @timeupdate="onTimeUpdate"
      @waiting="onWaiting"
      @playing="onPlaying"
      @ended="onEnded"
      @error="onError"
    />
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount, watch } from "vue";
import { showToast } from "vant";

const props = defineProps({
  audioUrl: {
    type: String,
    required: true,
  },
  // 支持外部传入标题或自定义样式
  title: String,
});

const audioRef = ref(null);
const isPlaying = ref(false);
const isLoading = ref(false); // 新增：加载状态
const duration = ref(0);
const currentTime = ref(0);
const isDragging = ref(false); // 新增：是否正在拖拽进度条

// 计算进度百分比用于 CSS 样式
const progressPercent = computed(() => {
  if (!duration.value) return 0;
  return (currentTime.value / duration.value) * 100;
});

// 切换播放
const togglePlay = async () => {
  if (!audioRef.value) return;
  if (!props.audioUrl) {
    showToast("无效的音频地址");
    return;
  }

  try {
    if (isPlaying.value) {
      audioRef.value.pause();
      isPlaying.value = false;
    } else {
      // 暂停页面上其他所有的 audio 元素
      pauseAllOtherAudios();

      // 播放
      const playPromise = audioRef.value.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error("播放被阻止或失败:", error);
          // 这里不弹窗，可能是因为用户未交互导致的自动播放限制，静默处理或显示UI提示
          isPlaying.value = false;
        });
      }
      isPlaying.value = true;
    }
  } catch (err) {
    console.error(err);
    isPlaying.value = false;
  }
};

// 暂停其他音频的核心逻辑
const pauseAllOtherAudios = () => {
  const audios = document.querySelectorAll("audio");
  audios.forEach((audio) => {
    if (audio !== audioRef.value && !audio.paused) {
      audio.pause();
      // 如果其他组件也依赖 isPlaying 变量，这里其实只是暂停了 DOM。
      // 理想情况下应该使用 EventBus 通知其他组件状态改变，但在纯组件封装下，操作 DOM 是最直接的。
    }
  });
};

// --- 事件监听 ---

const onLoadedMetadata = () => {
  if (audioRef.value) {
    duration.value = audioRef.value.duration || 0;
    isLoading.value = false;
  }
};

const onTimeUpdate = () => {
  if (audioRef.value && !isDragging.value) {
    // 只有在非拖拽状态下才更新时间，防止滑块跳动
    currentTime.value = audioRef.value.currentTime || 0;
  }
};

// 缓冲中
const onWaiting = () => {
  isLoading.value = true;
};

// 开始播放（缓冲结束）
const onPlaying = () => {
  isLoading.value = false;
  isPlaying.value = true;
};

const onEnded = () => {
  isPlaying.value = false;
  currentTime.value = 0;
  // 播放结束回到起点
  if (audioRef.value) audioRef.value.currentTime = 0;
};

const onError = () => {
  isPlaying.value = false;
  isLoading.value = false;
  showToast("音频加载失败");
};

// --- 进度条交互 ---

// 拖拽中：只更新 UI 数值，不设置 audio 时间（防止声音鬼畜）
const onSeekInput = () => {
  isDragging.value = true;
};

// 拖拽结束：设置 audio 时间
const onSeekChange = () => {
  if (audioRef.value) {
    audioRef.value.currentTime = currentTime.value;
    // 如果之前是暂停的，拖拽后通常保持暂停；如果是播放的，保持播放
    if (!isPlaying.value) {
      // 可选：拖拽后自动播放
      // togglePlay();
    }
  }
  isDragging.value = false;
};

// --- 工具函数 ---

const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds) || !isFinite(seconds)) return "0:00";

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const mStr = m.toString().padStart(2, "0");
  const sStr = s.toString().padStart(2, "0");

  if (h > 0) {
    return `${h}:${mStr}:${sStr}`;
  }
  return `${m}:${sStr}`; // 去掉小时前导0，更像常见播放器
};

// 监听 URL 变化重置状态
watch(
  () => props.audioUrl,
  () => {
    if (audioRef.value) {
      audioRef.value.pause();
      isPlaying.value = false;
      currentTime.value = 0;
      duration.value = 0;
    }
  }
);

onBeforeUnmount(() => {
  if (audioRef.value) {
    audioRef.value.pause();
    audioRef.value = null;
  }
});
</script>

<style lang="scss" scoped>
.audio-wrapper {
  display: flex;
  align-items: center;
  background-color: #f7f8fa; // 气泡背景色
  border-radius: 999px; // 圆角胶囊样式
  padding: 8px 16px;
  width: 100%;
  max-width: 400px; // 限制最大宽度，PC端更好看
  box-sizing: border-box;
  transition: all 0.3s ease;
  user-select: none;
  border: 1px solid transparent;

  /* PC端 Hover 效果 */
  @media (hover: hover) {
    &:hover {
      background-color: #ecf5ff;
      border-color: #b3d8ff;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);

      .seek-slider::-webkit-slider-thumb {
        transform: scale(1.2); // 鼠标悬停时滑块变大
      }
    }
  }

  /* 移动端点击效果 */
  &:active {
    background-color: #ebedf0;
  }

  &.is-playing {
    background-color: #ecf9ff; // 播放时的背景色高亮
    border-color: #1989fa4d;
  }

  .control-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    margin-right: 12px;
    cursor: pointer;
    flex-shrink: 0;

    &:active {
      opacity: 0.7;
    }
  }

  .content-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin-right: 12px;
    min-width: 0; // 防止flex子项溢出
  }

  .time-display {
    font-size: 12px;
    color: #969799;
    font-variant-numeric: tabular-nums; // 等宽数字，防止跳动
    white-space: nowrap;
    flex-shrink: 0;
  }

  /* --- 进度条样式 --- */
  .slider-container {
    width: 100%;
    height: 16px; // 增加触控区域
    display: flex;
    align-items: center;
  }

  .seek-slider {
    -webkit-appearance: none;
    width: 100%;
    height: 4px;
    border-radius: 2px;
    background: #ebedf0; // 轨道底色
    outline: none;
    cursor: pointer;

    // 使用 linear-gradient 实现已播放进度的颜色
    background-image: linear-gradient(#1989fa, #1989fa);
    background-repeat: no-repeat;

    /* 滑块样式 - Webkit */
    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #1989fa;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      transition: transform 0.2s;
    }

    /* 滑块样式 - Firefox */
    &::-moz-range-thumb {
      width: 12px;
      height: 12px;
      border: none;
      border-radius: 50%;
      background: #1989fa;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
  }
}
</style>
