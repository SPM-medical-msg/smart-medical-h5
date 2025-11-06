<template>
  <div class="evaluate-replay-mobile">
    <van-list
      v-model:loading="loading"
      :finished="finished"
      finished-text="没有更多了"
      @load="onLoad"
    >
      <van-cell
        v-for="(item, index) in list"
        :key="index"
        class="evaluate-item"
      >
        <div class="evaluate-header">
          <van-image
            round
            width="32"
            height="32"
            :src="item.avatarUrl || '/default-avatar.png'"
            class="user-avatar"
          />
          <div class="user-info">
            <div class="user-name">{{ item.userName || "匿名用户" }}</div>
            <div class="evaluate-time">{{ formatTime(item.createTime) }}</div>
          </div>
          <van-rate
            v-model="item.displayScore"
            :size="12"
            color="#1989fa"
            void-color="#eee"
            readonly
            allow-half
          />
        </div>
        <div class="evaluate-content">
          {{ item.content }}
        </div>
        <div v-if="item.reply" class="doctor-reply">
          <div class="reply-label">医生回复：</div>
          <div class="reply-content">{{ item.reply }}</div>
        </div>
      </van-cell>
    </van-list>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  commentList: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["reload-data"]);

const list = ref([]);
const loading = ref(false);
const finished = ref(false);

const onLoad = () => {
  // 模拟加载
  loading.value = true;
  setTimeout(() => {
    list.value = props.commentList.map((item) => ({
      ...item,
      displayScore: item.score ? item.score / 2 : 5,
    }));
    loading.value = false;
    finished.value = true;
  }, 500);
};
</script>

<style lang="scss" scoped>
.evaluate-replay-mobile {
  .evaluate-item {
    padding: 12px 16px;
    border-bottom: 1px solid #f5f5f5;

    .evaluate-header {
      display: flex;
      align-items: center;
      margin-bottom: 10px;

      .user-avatar {
        margin-right: 10px;
      }

      .user-info {
        flex: 1;

        .user-name {
          font-size: 14px;
          font-weight: 500;
          color: #333;
          margin-bottom: 2px;
        }

        .evaluate-time {
          font-size: 12px;
          color: #969799;
        }
      }
    }

    .evaluate-content {
      font-size: 14px;
      line-height: 1.6;
      color: #666;
      margin-bottom: 10px;
    }

    .doctor-reply {
      padding: 10px;
      background: #f8fbff;
      border-radius: 6px;

      .reply-label {
        font-size: 12px;
        color: #1989fa;
        margin-bottom: 4px;
        font-weight: 500;
      }

      .reply-content {
        font-size: 13px;
        color: #666;
        line-height: 1.5;
      }
    }
  }
}
</style>
