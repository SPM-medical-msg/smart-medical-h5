<template>
  <div class="doctor-detail-mobile">
    <!-- 顶部导航栏 -->
    <van-nav-bar
      title="医生详情"
      left-text="返回"
      left-arrow
      @click-left="onClickLeft"
      fixed
      placeholder
    />

    <!-- 医生基本信息卡片 -->
    <div class="doctor-card">
      <div class="doctor-header">
        <van-image
          round
          width="80"
          height="80"
          fit="cover"
          :src="doctor.imageUrl || '/default-avatar.png'"
          class="doctor-avatar"
        />
        <div class="doctor-info">
          <div class="doctor-name">
            {{ doctor.realName }}
            <van-tag type="primary" plain size="medium" class="doctor-title">
              {{ doctor.majorInfo }}
            </van-tag>
          </div>
          <div class="doctor-dept">{{ doctor.deptName }}</div>
          <div class="doctor-meta">
            <span class="work-time">
              <van-icon name="clock-o" size="14" />
              从业{{ doctor.workTime }}
            </span>
          </div>
        </div>
      </div>

      <!-- 评分区域 -->
      <div class="rating-section">
        <div class="rating-title">患者评分</div>
        <div class="rating-content">
          <van-rate
            v-if="doctor.score"
            v-model="scoreDisplay"
            :size="18"
            color="#1989fa"
            void-color="#eee"
            readonly
            allow-half
          />
          <span v-if="doctor.score" class="score-text">
            {{ (doctor.score / 2).toFixed(1) }}分
          </span>
          <span v-else class="no-rating">暂无评分</span>
        </div>
      </div>
    </div>

    <!-- 详细信息标签页 -->
    <van-tabs v-model:active="activeTab" sticky offset-top="46">
      <!-- 医生简介 -->
      <van-tab title="医生简介">
        <div class="content-section">
          <div class="section-content">
            {{ doctor.desc || "暂无简介" }}
          </div>
        </div>
      </van-tab>

      <!-- 医生详情 -->
      <van-tab title="医生详情">
        <div class="content-section">
          <div class="markdown-content" v-if="doctor.content">
            <v-md-preview v-highlight :text="doctor.content" ref="preview" />
          </div>
          <van-empty v-else description="暂无详细信息" image="default" />
        </div>
      </van-tab>

      <!-- 患者评价 -->
      <van-tab title="患者评价">
        <div class="evaluate-section">
          <EvaluateReplayMobile
            v-if="commentList.length > 0"
            :comment-list="commentList"
            @reload-data="getEvaluateData"
          />
          <van-empty v-else description="暂无评价" image="default" />
        </div>
      </van-tab>
    </van-tabs>

    <!-- 底部操作栏 -->
    <div class="bottom-bar">
      <van-button
        type="primary"
        block
        round
        size="large"
        @click="handleConsult"
      >
        <van-icon name="chat-o" />
        向医生咨询
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getUserList } from "@/api/user";
import { getEvaluateList } from "@/api/evaluate";
import { showDialog, showToast } from "vant";
import EvaluateReplayMobile from "@/components/EvaluateReplay/EvaluateReplayMobile.vue";

const route = useRoute();
const router = useRouter();

// 响应式数据
const doctor = ref({
  imageUrl: "",
  realName: "",
  majorInfo: "",
  deptName: "",
  score: 0,
  workTime: "",
  desc: "",
  content: "",
});

const commentList = ref([]);
const activeTab = ref(0);

// 计算属性 - 将10分制转换为5分制用于显示
const scoreDisplay = computed(() => {
  return doctor.value.score ? doctor.value.score / 2 : 0;
});

// 生命周期
onMounted(() => {
  getData();
  getEvaluateData();
});

// 获取医生信息
const getData = async () => {
  try {
    const res = await getUserList({ id: route.query.id });
    if (res.data.list && res.data.list.length > 0) {
      doctor.value = res.data.list[0];
    }
  } catch (error) {
    showToast("获取医生信息失败");
    console.error("获取医生信息失败:", error);
  }
};

// 获取评价列表
const getEvaluateData = async () => {
  try {
    const res = await getEvaluateList({
      doctorUserId: route.query.id,
      pageSize: 1000,
    });
    commentList.value = res.data.list || [];
  } catch (error) {
    console.error("获取评价列表失败:", error);
  }
};

// 返回上一页
const onClickLeft = () => {
  router.back();
};

// 咨询医生
const handleConsult = () => {
  showDialog({
    title: "提示",
    message: "确定要向该医生发起咨询吗？",
    confirmButtonText: "确定",
    confirmButtonColor: "#1989fa",
    cancelButtonText: "取消",
  })
    .then(() => {
      // TODO: 跳转到咨询页面或发起咨询
      showToast("功能开发中...");
    })
    .catch(() => {});
};
</script>

<style lang="scss" scoped>
.doctor-detail-mobile {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 70px;

  // 医生信息卡片
  .doctor-card {
    background: #fff;
    padding: 16px;
    margin-bottom: 10px;

    .doctor-header {
      display: flex;
      align-items: flex-start;
      margin-bottom: 16px;

      .doctor-avatar {
        margin-right: 12px;
        border: 2px solid #e8f4fd;
      }

      .doctor-info {
        flex: 1;

        .doctor-name {
          font-size: 18px;
          font-weight: 600;
          color: #333;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          flex-wrap: wrap;

          .doctor-title {
            margin-left: 8px;
          }
        }

        .doctor-dept {
          font-size: 14px;
          color: #1989fa;
          margin-bottom: 8px;
        }

        .doctor-meta {
          display: flex;
          align-items: center;
          font-size: 13px;
          color: #969799;

          .work-time {
            display: flex;
            align-items: center;

            .van-icon {
              margin-right: 4px;
              color: #1989fa;
            }
          }
        }
      }
    }

    // 评分区域
    .rating-section {
      padding: 12px;
      background: #f8fbff;
      border-radius: 8px;

      .rating-title {
        font-size: 13px;
        color: #666;
        margin-bottom: 8px;
      }

      .rating-content {
        display: flex;
        align-items: center;

        .score-text {
          margin-left: 8px;
          font-size: 16px;
          font-weight: 600;
          color: #1989fa;
        }

        .no-rating {
          font-size: 14px;
          color: #969799;
        }
      }
    }
  }

  // 内容区域
  .content-section {
    background: #fff;
    padding: 16px;
    min-height: 200px;

    .section-content {
      font-size: 14px;
      line-height: 1.8;
      color: #666;
      white-space: pre-wrap;
    }

    .markdown-content {
      :deep(.v-md-preview) {
        font-size: 14px;
        line-height: 1.8;

        h1,
        h2,
        h3,
        h4,
        h5,
        h6 {
          color: #333;
          margin: 16px 0 8px;
        }

        p {
          margin: 8px 0;
          color: #666;
        }

        ul,
        ol {
          padding-left: 20px;
          margin: 8px 0;
        }

        li {
          margin: 4px 0;
        }

        blockquote {
          padding: 8px 12px;
          margin: 12px 0;
          border-left: 3px solid #1989fa;
          background: #f8fbff;
        }

        code {
          padding: 2px 4px;
          background: #f5f7fa;
          border-radius: 3px;
          color: #e83e8c;
        }

        pre {
          padding: 12px;
          background: #f5f7fa;
          border-radius: 4px;
          overflow-x: auto;
        }

        img {
          max-width: 100%;
          height: auto;
          margin: 12px 0;
        }
      }
    }
  }

  // 评价区域
  .evaluate-section {
    background: #fff;
    min-height: 200px;
  }

  // 底部操作栏
  .bottom-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 10px 16px;
    background: #fff;
    box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.06);
    z-index: 999;

    .van-button {
      font-size: 16px;

      .van-icon {
        margin-right: 6px;
      }
    }
  }

  // Tabs样式优化
  :deep(.van-tabs) {
    .van-tabs__nav {
      background: #fff;

      .van-tab {
        color: #666;

        &.van-tab--active {
          color: #1989fa;
        }
      }

      .van-tabs__line {
        background-color: #1989fa;
      }
    }
  }
}

// 响应式适配
@media screen and (max-width: 375px) {
  .doctor-detail-mobile {
    .doctor-card {
      .doctor-header {
        .doctor-info {
          .doctor-name {
            font-size: 16px;

            .doctor-title {
              margin-top: 4px;
              margin-left: 0;
            }
          }
        }
      }
    }
  }
}
</style>
