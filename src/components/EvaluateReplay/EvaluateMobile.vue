<template>
  <div class="evaluate-mobile">
    <div class="popup-header">
      <h3>发表评价</h3>
    </div>

    <div class="evaluate-form">
      <!-- 评分 -->
      <div class="rate-section">
        <span class="rate-label">服务评分</span>
        <van-rate
          v-model="form.score"
          :size="28"
          color="#ff9800"
          void-color="#eee"
          allow-half
          :count="5"
        />
        <span class="rate-text" v-if="form.score">
          {{ (form.score * 2).toFixed(1) }}分
        </span>
      </div>

      <!-- 评价内容 -->
      <van-field
        v-model="form.comment"
        type="textarea"
        placeholder="分享您的就诊体验，您的评价对其他患者很重要..."
        :rows="5"
        maxlength="500"
        show-word-limit
        class="comment-field"
      />

      <!-- 提交按钮 -->
      <van-button
        type="primary"
        block
        round
        :loading="submitting"
        :disabled="!canSubmit"
        @click="submitEvaluate"
        class="submit-btn"
      >
        发表评价
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { showToast, showSuccessToast } from "vant";
import { useUserStore } from "@/stores";
import { saveEvaluateInfo } from "@/api/evaluate";

const props = defineProps({
  doctorId: {
    type: [String, Number],
    required: true,
  },
});

const emit = defineEmits(["success"]);

const userStore = useUserStore();

const form = ref({
  score: 0,
  comment: "",
});
const submitting = ref(false);

const canSubmit = computed(() => {
  return form.value.score > 0 && form.value.comment.trim().length > 0;
});

const submitEvaluate = async () => {
  if (!userStore.userInfo) {
    showToast("请先登录");
    return;
  }

  if (!form.value.comment.trim()) {
    showToast("请输入评价内容");
    return;
  }

  if (form.value.score === 0) {
    showToast("请选择评分");
    return;
  }

  submitting.value = true;

  try {
    await saveEvaluateInfo({
      doctorUserId: props.doctorId,
      userId: userStore.userInfo.id,
      score: form.value.score * 2, // 转换为10分制
      comment: form.value.comment,
    });

    showSuccessToast("评价成功");
    emit("success");

    // 重置表单
    form.value = {
      score: 0,
      comment: "",
    };
  } catch (error) {
    console.error("评价失败:", error);
    showToast("评价失败，请重试");
  } finally {
    submitting.value = false;
  }
};
</script>

<style lang="scss" scoped>
.evaluate-mobile {
  padding: 20px 16px;

  .popup-header {
    text-align: center;
    margin-bottom: 20px;

    h3 {
      font-size: 18px;
      font-weight: 600;
      color: #333;
      margin: 0;
    }
  }

  .evaluate-form {
    .rate-section {
      display: flex;
      align-items: center;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
      margin-bottom: 16px;

      .rate-label {
        font-size: 14px;
        color: #666;
        margin-right: 12px;
      }

      .rate-text {
        margin-left: 12px;
        font-size: 16px;
        font-weight: 600;
        color: #ff9800;
      }
    }

    .comment-field {
      margin-bottom: 20px;

      :deep(.van-field__control) {
        font-size: 14px;
        line-height: 1.6;
      }
    }

    .submit-btn {
      height: 44px;
      font-size: 16px;
    }
  }
}
</style>
