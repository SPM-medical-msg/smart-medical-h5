<template>
  <div class="evaluate-mobile">
    <!-- 1. 评价输入区域 -->
    <div
      class="input-section"
      v-if="evaluateType === 'all' || evaluateType === 'input'"
    >
      <div class="popup-header">
        <h3>发表评价</h3>
      </div>

      <div class="evaluate-form">
        <!-- 评分 -->
        <div class="rate-section">
          <span class="rate-label">服务评分</span>
          <van-rate
            v-model="form.score"
            :size="24"
            color="#4a69bd"
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
          :rows="4"
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
          color="linear-gradient(135deg, #4a69bd 0%, #5f8dee 100%)"
        >
          发表评价
        </van-button>
      </div>
    </div>

    <!-- 2. 评价列表区域 -->
    <div
      class="list-section"
      v-if="evaluateType === 'all' || evaluateType === 'list'"
    >
      <!-- 列表标题 (仅在有数据时或单独列表模式下显示) -->
      <div class="list-header" v-if="commentList.length > 0">
        <span class="title">全部评价</span>
        <span class="count">{{ commentList.length }}条</span>
      </div>

      <div class="comment-list" v-if="commentList.length > 0">
        <div
          class="comment-item"
          v-for="(item, index) in commentList"
          :key="index"
        >
          <!-- 用户信息行 -->
          <div class="user-row">
            <div class="avatar-box">
              <van-image
                round
                fit="cover"
                width="36px"
                height="36px"
                :src="item.imageUrl || defaultAvatar"
              >
                <template v-slot:error>
                  <div class="avatar-fallback">
                    {{ item.realName?.charAt(0) || "患" }}
                  </div>
                </template>
              </van-image>
            </div>
            <div class="info-box">
              <div class="name-line">
                <span class="name">{{ item.realName }}</span>
                <span class="time">{{ item.createTime }}</span>
              </div>
              <div class="rate-line">
                <!-- 接口通常返回10分制，van-rate通常展示5星，所以除以2 -->
                <van-rate
                  :model-value="item.score ? item.score / 2 : 0"
                  readonly
                  :size="12"
                  color="#ff9800"
                  allow-half
                />
                <span class="score-num">{{ item.score }}分</span>
              </div>
            </div>
          </div>

          <!-- 评论内容 -->
          <div class="content-row">
            {{ item.comment }}
          </div>

          <!-- 医生回复 -->
          <div class="reply-box" v-if="item.status === 2">
            <div class="reply-header">
              <span class="doc-tag">医生回复</span>
              <span class="reply-time">{{ item.updateTime }}</span>
            </div>
            <div class="reply-content">
              {{ item.replayComment }}
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div class="empty-state" v-else>
        <van-empty description="暂无评价" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from "vue";
import { showToast, showSuccessToast } from "vant";
import { useUserStore } from "@/stores";
import { useRoute } from "vue-router";
import { saveEvaluateInfo } from "@/api/evaluate";
// 引入默认头像，路径需根据实际项目调整，或者直接使用CDN/静态资源
import defaultAvatar from "@/assets/image/default1.png";
const route = useRoute();
const props = defineProps({
  doctorId: {
    type: [String, Number],
    required: true,
  },
  // 新增：评价类型 all=全部, input=仅输入, list=仅列表
  evaluateType: {
    type: String,
    default: "all",
  },
  // 新增：评价列表数据，由父组件传入
  commentList: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["success", "reloadData"]);

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
      doctorUserId: route.query.id || props.doctorId,
      userId: userStore.userInfo.id,
      score: form.value.score * 2, // 转换为10分制传给后端
      comment: form.value.comment,
    });

    showSuccessToast("评价成功");
    emit("success");
    // 如果是all模式，通常需要通知父组件刷新列表
    emit("reloadData");

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
  background: #fff;
  border-radius: 12px 12px 0 0;
  overflow: hidden;

  /* --- 输入区域样式 --- */
  .input-section {
    padding: 20px 16px;
    border-bottom: 8px solid #f7f8fa; // 分隔线

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
        border-radius: 12px;
        margin-bottom: 16px;

        .rate-label {
          font-size: 14px;
          color: #666;
          margin-right: 12px;
          font-weight: 500;
        }

        .rate-text {
          margin-left: auto;
          font-size: 16px;
          font-weight: 600;
          color: #4a69bd;
        }
      }

      .comment-field {
        margin-bottom: 20px;
        background: #fff;
        border: 1px solid #ebedf0;
        border-radius: 12px;
        padding: 12px;

        :deep(.van-field__control) {
          font-size: 14px;
          line-height: 1.6;
        }
      }

      .submit-btn {
        height: 44px;
        font-size: 16px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(74, 105, 189, 0.2);
      }
    }
  }

  /* --- 列表区域样式 --- */
  .list-section {
    padding: 16px;
    min-height: 200px;

    .list-header {
      display: flex;
      align-items: center;
      margin-bottom: 16px;

      .title {
        font-size: 16px;
        font-weight: 600;
        color: #333;
      }

      .count {
        margin-left: 8px;
        background: #f0f2f5;
        color: #666;
        font-size: 12px;
        padding: 2px 8px;
        border-radius: 10px;
      }
    }

    .comment-item {
      padding-bottom: 20px;
      margin-bottom: 20px;
      border-bottom: 1px solid #f5f6f7;

      &:last-child {
        border-bottom: none;
        margin-bottom: 0;
      }

      .user-row {
        display: flex;
        align-items: center;
        margin-bottom: 10px;

        .avatar-box {
          margin-right: 12px;
          .avatar-fallback {
            width: 100%;
            height: 100%;
            background: #b3c0d1;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
          }
        }

        .info-box {
          flex: 1;

          .name-line {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 4px;

            .name {
              font-size: 14px;
              font-weight: 600;
              color: #333;
            }

            .time {
              font-size: 12px;
              color: #999;
            }
          }

          .rate-line {
            display: flex;
            align-items: center;

            .score-num {
              margin-left: 6px;
              font-size: 12px;
              color: #ff9800;
              font-weight: 500;
            }
          }
        }
      }

      .content-row {
        font-size: 14px;
        color: #333;
        line-height: 1.6;
        margin-bottom: 12px;
        padding-left: 48px; /* 对齐头像右侧 */
      }

      .reply-box {
        margin-left: 48px;
        background: #f7f8fa;
        border-radius: 8px;
        padding: 12px;
        font-size: 13px;

        .reply-header {
          display: flex;
          align-items: center;
          margin-bottom: 6px;
          justify-content: space-between;

          .doc-tag {
            color: #4a69bd;
            font-weight: 600;
            &::before {
              content: "|";
              margin-right: 6px;
              color: #4a69bd;
              font-weight: bold;
            }
          }

          .reply-time {
            color: #999;
            font-size: 12px;
            transform: scale(0.9);
            transform-origin: right center;
          }
        }

        .reply-content {
          color: #666;
          line-height: 1.5;
        }
      }
    }

    .empty-state {
      padding: 40px 0;
      :deep(.van-empty__image) {
        width: 120px;
        height: 120px;
      }
    }
  }
}

/* 移除输入部分在单独显示时的底部边框 */
.input-section:last-child {
  border-bottom: none;
}
</style>
