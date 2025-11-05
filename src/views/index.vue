<template>
  <div class="mobile-doctor-home">
    <!-- 顶部科室筛选 - 吸顶效果 -->
    <van-sticky>
      <div class="dept-filter-wrapper">
        <div class="filter-header">
          <span class="filter-label">科室筛选</span>
          <span class="doctor-count">共{{ total }}位医生</span>
        </div>
        <van-tabs
          v-model:active="currentKey"
          @click-tab="onClickDept"
          color="#4682dc"
          title-active-color="#4682dc"
          swipeable
          animated
          shrink
        >
          <van-tab v-for="(item, index) in deptList" :key="index" :name="index">
            <template #title>
              <div class="tab-title">
                <span>{{ item.deptName }}</span>
                <span
                  v-if="currentKey === index && filteredData.length > 0"
                  class="tab-badge"
                >
                  {{ filteredData.length }}
                </span>
              </div>
            </template>
          </van-tab>
        </van-tabs>
      </div>
    </van-sticky>

    <!-- 医生列表 -->
    <div class="doctor-list-container">
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-list
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多医生了"
          @load="onLoad"
          :immediate-check="false"
        >
          <!-- 医生列表项 -->
          <div
            v-for="doctor in displayedDoctors"
            :key="doctor.id"
            class="doctor-list-item"
            @click="toDetail(doctor)"
          >
            <!-- 左侧头像 -->
            <div class="item-avatar">
              <van-image
                round
                width="70"
                height="70"
                fit="cover"
                :src="doctor.imageUrl || defaultAvatar"
                @error="handleImageError"
              >
                <template v-slot:loading>
                  <van-loading type="spinner" size="20" />
                </template>
              </van-image>
            </div>

            <!-- 中间信息 -->
            <div class="item-info">
              <!-- 姓名和职称 -->
              <div class="info-header">
                <h3 class="doctor-name">{{ doctor.realName }}</h3>
                <span class="doctor-badge">{{ getDoctorTitle(doctor) }}</span>
              </div>

              <!-- 科室和专业 -->
              <div class="info-dept">
                <van-icon name="location-o" color="#4682dc" />
                <span>{{ doctor.deptName }}</span>
                <span class="separator">|</span>
                <span class="major-text">{{ doctor.majorInfo || "暂无" }}</span>
              </div>

              <!-- 评分 -->
              <div class="info-rating">
                <van-rate
                  v-if="doctor.HalveScore"
                  v-model="doctor.HalveScore"
                  :size="14"
                  color="#ff9500"
                  void-icon="star"
                  void-color="#eee"
                  readonly
                  allow-half
                />
                <span v-if="doctor.HalveScore" class="rating-score">
                  {{ doctor.HalveScore }}分
                </span>
                <span v-else class="no-rating">暂无评分</span>
              </div>
            </div>

            <!-- 右侧按钮 -->
            <div class="item-action">
              <van-button
                type="primary"
                size="small"
                round
                @click.stop="toDetail(doctor)"
              >
                查看详情
              </van-button>
            </div>
          </div>

          <!-- 空状态 -->
          <van-empty
            v-if="displayedDoctors.length === 0 && !loading"
            description="暂无医生信息"
            image="search"
          >
            <van-button
              round
              type="primary"
              class="empty-button"
              @click="resetFilter"
            >
              重置筛选
            </van-button>
          </van-empty>
        </van-list>
      </van-pull-refresh>
    </div>

    <!-- 回到顶部 -->
    <van-back-top right="16px" bottom="80px" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { showToast, showDialog } from "vant";
import { useUserStore } from "@/stores";
import { useRouter } from "vue-router";
import { getUserList } from "@/api/user";
import { getDeptList } from "@/api/dept";
import defaultAvatar from "@/assets/image/default1.png";

const router = useRouter();
const userStore = useUserStore();

// 数据相关
const query = ref({
  pageNum: 1,
  pageSize: 100,
  userType: 2,
  status: 2,
  deptId: null,
});

const tableData = ref([]);
const deptList = ref([]);
const currentKey = ref(0);
const total = ref(0);
const loading = ref(false);
const refreshing = ref(false);
const finished = ref(false);
const displayCount = ref(10); // 移动端初始显示10条

// 计算属性 - 过滤后的数据
const filteredData = computed(() => {
  return tableData.value;
});

// 显示的医生列表
const displayedDoctors = computed(() => {
  return filteredData.value.slice(0, displayCount.value);
});

// 是否还有更多数据
const hasMore = computed(() => {
  return displayCount.value < filteredData.value.length;
});

// 生命周期
onMounted(() => {
  getData();
  getDeptData();
});

// 获取数据
const getData = async () => {
  loading.value = true;
  try {
    const res = await getUserList(query.value);
    tableData.value = res.data.list;
    total.value = res.data.total;
    getRating(tableData.value);
  } catch (error) {
    showToast("获取医生列表失败");
    console.error("获取医生列表失败:", error);
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
};

// 获取科室数据
const getDeptData = async () => {
  try {
    const res = await getDeptList();
    deptList.value = res.data.list;
    deptList.value.unshift({
      id: 0,
      deptName: "全部",
    });
  } catch (error) {
    console.error("获取科室列表失败:", error);
  }
};

// 科室切换
const onClickDept = ({ name }) => {
  const item = deptList.value[name];
  query.value.deptId = item.id !== 0 ? item.id : null;
  displayCount.value = 10; // 重置显示数量
  finished.value = false;
  getData();
};

// 下拉刷新
const onRefresh = () => {
  displayCount.value = 10;
  finished.value = false;
  getData();
};

// 加载更多
const onLoad = () => {
  if (hasMore.value) {
    displayCount.value += 10;
    loading.value = false;
  } else {
    finished.value = true;
  }
};

// 重置筛选
const resetFilter = () => {
  currentKey.value = 0;
  query.value.deptId = null;
  displayCount.value = 10;
  finished.value = false;
  getData();
};

// 跳转详情
const toDetail = (item) => {
  if (!userStore.userInfo) {
    showDialog({
      title: "温馨提示",
      message: "请先登录后再查看医生详情",
      confirmButtonText: "去登录",
      cancelButtonText: "暂不登录",
      showCancelButton: true,
    }).then(() => {
      router.push("/login");
    });
    return;
  }
  router.push({
    path: "/doctor-detail",
    query: { id: item.id },
  });
};

// 处理评分
const getRating = (list) => {
  for (const doctor of list) {
    const factor = Math.pow(10, 1);
    doctor.HalveScore = Math.round((doctor.score / 2) * factor) / factor;
  }
};

// 辅助函数
const getDoctorTitle = (doctor) => {
  const titles = ["主任医师", "副主任医师", "主治医师", "住院医师"];
  return titles[doctor.id % 4] || "主治医师";
};

const handleImageError = (e) => {
  e.target.src = defaultAvatar;
};
</script>

<style scoped lang="scss">
.mobile-doctor-home {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
  padding-bottom: 20px;
}

/* 科室筛选区域 */
.dept-filter-wrapper {
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

  .filter-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px 8px;

    .filter-label {
      font-size: 15px;
      color: #323233;
      font-weight: 600;
    }

    .doctor-count {
      font-size: 13px;
      color: #969799;
    }
  }

  :deep(.van-tabs) {
    .van-tabs__wrap {
      padding: 0 8px 10px;
    }

    .van-tab {
      padding: 0 12px;
      font-size: 14px;
    }

    .van-tabs__line {
      width: 24px;
      height: 3px;
      border-radius: 3px;
      background: linear-gradient(135deg, #4682dc 0%, #5ba3f5 100%);
    }
  }

  .tab-title {
    display: flex;
    align-items: center;
    gap: 4px;

    .tab-badge {
      display: inline-block;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      background: linear-gradient(135deg, #4682dc 0%, #5ba3f5 100%);
      color: #fff;
      font-size: 11px;
      line-height: 18px;
      text-align: center;
      border-radius: 9px;
      transform: scale(0.9);
      font-weight: 500;
    }
  }
}

/* 医生列表容器 */
.doctor-list-container {
  padding: 12px;
}

/* 医生列表项 */
.doctor-list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  margin-bottom: 12px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  // 添加渐变装饰线
  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: linear-gradient(135deg, #4682dc 0%, #5ba3f5 100%);
    opacity: 0;
    transition: opacity 0.3s;
  }

  &:active {
    transform: scale(0.98);
  }

  &:active::before {
    opacity: 1;
  }

  // 头像区域
  .item-avatar {
    flex-shrink: 0;

    :deep(.van-image) {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  }

  // 信息区域
  .item-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;

    .info-header {
      display: flex;
      align-items: center;
      gap: 8px;

      .doctor-name {
        font-size: 16px;
        font-weight: 600;
        color: #1a3052;
        margin: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .doctor-badge {
        flex-shrink: 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #fff;
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 11px;
        font-weight: 500;
        white-space: nowrap;
      }
    }

    .info-dept {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: #646566;
      line-height: 1.4;

      :deep(.van-icon) {
        font-size: 14px;
        flex-shrink: 0;
      }

      .separator {
        margin: 0 4px;
        color: #dcdee0;
      }

      .major-text {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: #969799;
      }
    }

    .info-rating {
      display: flex;
      align-items: center;
      gap: 6px;

      .rating-score {
        color: #ff9500;
        font-size: 13px;
        font-weight: 600;
      }

      .no-rating {
        color: #c8c9cc;
        font-size: 12px;
      }
    }
  }

  // 按钮区域
  .item-action {
    flex-shrink: 0;

    :deep(.van-button) {
      height: 32px;
      padding: 0 16px;
      font-size: 13px;
      background: linear-gradient(135deg, #4682dc 0%, #5ba3f5 100%);
      border: none;
      box-shadow: 0 2px 8px rgba(70, 130, 220, 0.3);

      &:active {
        opacity: 0.8;
      }
    }
  }
}

/* 空状态 */
:deep(.van-empty) {
  padding: 80px 0;

  .empty-button {
    width: 160px;
    margin-top: 16px;
    background: linear-gradient(135deg, #4682dc 0%, #5ba3f5 100%);
    border: none;
  }
}

/* 下拉刷新和加载样式 */
:deep(.van-pull-refresh) {
  min-height: calc(100vh - 200px);
}

:deep(.van-list__finished-text) {
  padding: 20px 0;
  color: #969799;
  font-size: 13px;
}

:deep(.van-list__loading) {
  padding: 20px 0;
}

/* 回到顶部 */
:deep(.van-back-top) {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #4682dc 0%, #5ba3f5 100%);
  box-shadow: 0 4px 12px rgba(70, 130, 220, 0.4);

  .van-icon {
    color: #fff;
    font-size: 20px;
  }
}

/* 加载动画 */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.doctor-list-item {
  animation: slideIn 0.3s ease;
}

/* 响应式优化 */
@media (max-width: 360px) {
  .doctor-list-item {
    padding: 12px;

    .item-avatar {
      :deep(.van-image) {
        width: 60px !important;
        height: 60px !important;
      }
    }

    .item-info {
      .info-header {
        .doctor-name {
          font-size: 15px;
        }

        .doctor-badge {
          font-size: 10px;
          padding: 2px 6px;
        }
      }

      .info-dept {
        font-size: 12px;
      }
    }

    .item-action {
      :deep(.van-button) {
        padding: 0 12px;
        font-size: 12px;
      }
    }
  }
}
</style>
