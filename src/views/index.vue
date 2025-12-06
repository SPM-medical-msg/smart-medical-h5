<template>
  <div class="mobile-doctor-home">
    <!-- 顶部科室筛选 - 吸顶效果 -->
    <van-sticky :offset-top="46">
      <div class="dept-filter-wrapper">
        <div class="filter-header">
          <span class="filter-label">
            <van-icon name="apps-o" size="16" />
            科室筛选
          </span>
          <!-- 这里的总数使用后端返回的total或者allDoctorData的长度 -->
          <span class="doctor-count">共 {{ total }} 位医生</span>
        </div>
        <!-- 修改：使用 deptId 作为 name，避免排序后 index 错乱 -->
        <van-tabs
          v-model:active="currentDeptId"
          @click-tab="onClickDept"
          color="#4682dc"
          title-active-color="#4682dc"
          swipeable
          animated
          shrink
        >
          <van-tab
            v-for="item in sortedDeptList"
            :key="item.id"
            :name="item.id"
          >
            <template #title>
              <div class="tab-title">
                <span>{{ item.deptName }}</span>
                <span
                  v-if="item.count > 0"
                  class="tab-badge"
                  :class="{ active: currentDeptId === item.id }"
                >
                  {{ item.count }}
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
            v-for="(doctor, idx) in displayedDoctors"
            :key="doctor.id"
            class="doctor-list-item"
            :style="{ animationDelay: `${idx * 0.05}s` }"
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
              >
              </van-image>
            </div>

            <!-- 中间信息 -->
            <div class="item-info">
              <!-- 姓名和职称 -->
              <div class="info-header">
                <h3 class="doctor-name">{{ doctor.realName }}</h3>
              </div>

              <!-- 科室和专业 -->
              <div class="info-dept">
                <van-icon name="location-o" color="#4682dc" />
                <span>{{ doctor.deptName }}</span>
                <span class="separator">|</span>
                <span class="major-text">{{ doctor.majorInfo || "全科" }}</span>
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
                  {{ doctor.HalveScore }}
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
                icon="arrow"
                @click.stop="toDetail(doctor)"
              >
                详情
              </van-button>
            </div>
          </div>

          <!-- 空状态 -->
          <van-empty
            v-if="displayedDoctors.length === 0 && !loading"
            description="该科室暂无医生"
            image="search"
          >
            <van-button
              round
              type="primary"
              class="empty-button"
              @click="resetFilter"
            >
              查看全部医生
            </van-button>
          </van-empty>
        </van-list>
      </van-pull-refresh>
    </div>

    <!-- 回到顶部 -->
    <van-back-top right="16px" bottom="70px" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { showToast, showDialog, showLoadingToast, closeToast } from "vant";
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
const allDoctorData = ref([]); // 存储所有医生数据用于统计
const deptList = ref([]);
const currentDeptId = ref(0); // 修改：绑定的是 ID 而不是 index
const total = ref(0);
const loading = ref(false);
const refreshing = ref(false);
const finished = ref(false);
const displayCount = ref(10);

// 计算属性 - 按医生数量排序的科室列表
const sortedDeptList = computed(() => {
  if (deptList.value.length === 0) return [];

  // 如果没有统计数据，直接返回原始列表（带上All）
  if (allDoctorData.value.length === 0) {
    return deptList.value.map((dept) => ({ ...dept, count: 0 }));
  }

  // 1. 统计每个科室的医生数量
  const deptCountMap = {};
  allDoctorData.value.forEach((doctor) => {
    // 强制转换为 String 进行匹配，防止 ID 类型不一致（String vs Number）导致匹配失败
    const deptId = String(doctor.deptId || 0);
    deptCountMap[deptId] = (deptCountMap[deptId] || 0) + 1;
  });

  // 2. 为每个科室添加 count 属性
  const deptsWithCount = deptList.value.map((dept) => {
    const safeId = String(dept.id);
    let count = 0;
    if (dept.id === 0) {
      count = allDoctorData.value.length; // 全部
    } else {
      count = deptCountMap[safeId] || 0;
    }
    return {
      ...dept,
      count: count,
    };
  });

  // 3. 排序："全部"置顶，其他按数量降序，数量相同按ID默认排序（保持稳定）
  const allDept = deptsWithCount.find((d) => d.id === 0);
  const otherDepts = deptsWithCount
    .filter((d) => d.id !== 0)
    .sort((a, b) => {
      if (b.count === a.count) return 0; // 数量相同时保持 API 顺序
      return b.count - a.count;
    });

  return allDept ? [allDept, ...otherDepts] : otherDepts;
});

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
onMounted(async () => {
  // 修改：并行请求，互不阻塞，确保页面加载速度
  getData();
  await getAllDoctorData();
  getDeptData();
});

// 获取所有医生数据（仅用于统计科室医生数量）
const getAllDoctorData = async () => {
  try {
    const res = await getUserList({
      pageNum: 1,
      pageSize: 9999,
      userType: 2,
      status: 2,
    });

    if (res?.code === 1 && res.data) {
      allDoctorData.value = res.data.list || [];
      // 注意：这里不再调用 getData，getData 独立负责列表展示
    }
  } catch (error) {
    console.error("获取统计数据失败:", error);
  }
};

// 获取数据（用于展示列表）
const getData = async () => {
  if (loading.value) return; // 防止重复加载

  // 只有第一次加载显示loading，后续静默更新或下拉刷新控制
  if (!refreshing.value && tableData.value.length === 0) {
    showLoadingToast({
      message: "加载中...",
      forbidClick: true,
      duration: 0,
    });
  }

  try {
    const res = await getUserList(query.value);

    if (res?.code === 1 && res.data) {
      tableData.value = res.data.list || [];
      total.value = res.data.total || 0;
      getRating(tableData.value);
    } else {
      showToast("获取医生列表失败");
    }
  } catch (error) {
    showToast("网络请求失败");
    console.error("获取医生列表失败:", error);
  } finally {
    closeToast();
    loading.value = false;
    refreshing.value = false;
  }
};

// 获取科室数据
const getDeptData = async () => {
  try {
    const res = await getDeptList({ pageNum: 1, pageSize: 999 });

    if (res?.code === 1 && res.data) {
      const list = res.data.list || [];
      // 在最前面添加"全部"选项
      list.unshift({
        id: 0,
        deptName: "全部",
      });
      deptList.value = list;
    }
  } catch (error) {
    console.error("获取科室列表失败:", error);
  }
};

// 科室切换
// 修改：val 直接是 name (即 item.id)
const onClickDept = ({ name }) => {
  currentDeptId.value = name; // 更新高亮
  query.value.deptId = name !== 0 ? name : null;
  displayCount.value = 10;
  finished.value = false;
  getData();
};

// 下拉刷新
const onRefresh = () => {
  displayCount.value = 10;
  finished.value = false;
  currentDeptId.value = 0; // 重置选中
  query.value.deptId = null;

  // 刷新时三个接口都重新调用，确保数据最新
  Promise.all([getData(), getAllDoctorData(), getDeptData()]).finally(() => {
    refreshing.value = false;
  });
};

// 加载更多
const onLoad = () => {
  if (hasMore.value) {
    setTimeout(() => {
      displayCount.value += 10;
      loading.value = false;
    }, 300);
  } else {
    finished.value = true;
  }
};

// 重置筛选
const resetFilter = () => {
  currentDeptId.value = 0;
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
      cancelButtonText: "稍后再说",
      showCancelButton: true,
    })
      .then(() => {
        router.push("/login");
      })
      .catch(() => {
        // 用户取消
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
    // 容错处理
    const score = Number(doctor.score) || 0;
    const factor = Math.pow(10, 1);
    doctor.HalveScore = Math.round((score / 2) * factor) / factor;
  }
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
  position: relative;
  z-index: 10;

  .filter-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px 8px;
    background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);

    .filter-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 15px;
      color: #323233;
      font-weight: 600;

      :deep(.van-icon) {
        color: #4682dc;
      }
    }

    .doctor-count {
      font-size: 13px;
      color: #969799;
      background: #f2f3f5;
      padding: 2px 10px;
      border-radius: 10px;
    }
  }

  :deep(.van-tabs) {
    .van-tabs__wrap {
      padding: 0 8px 10px;
    }

    .van-tab {
      padding: 0 12px;
      font-size: 14px;
      font-weight: 500;
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
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      background: rgba(70, 130, 220, 0.15);
      color: #4682dc;
      font-size: 11px;
      border-radius: 9px;
      transform: scale(0.9);
      font-weight: 600;
      transition: all 0.3s;

      // 选中状态
      &.active {
        background: linear-gradient(135deg, #4682dc 0%, #5ba3f5 100%);
        color: #fff;
      }
    }
  }
}

/* 医生列表容器 */
.doctor-list-container {
  padding: 12px;
  min-height: calc(100vh - 200px);
}

/* 医生列表项 */
.doctor-list-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  margin-bottom: 12px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  animation: slideIn 0.4s ease both;

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
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &:active::before {
    opacity: 1;
  }

  .item-avatar {
    flex-shrink: 0;
    position: relative;

    :deep(.van-image) {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .online-status {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #c8c9cc;
      border: 2px solid #fff;
      box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);

      &.online {
        background: #07c160;
        animation: pulse 2s ease infinite;
      }
    }
  }

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
        max-width: 120px;
      }

      .doctor-badge {
        flex-shrink: 0;
        font-size: 11px;
        font-weight: 500;
        padding: 2px 8px;
        border-radius: 10px;
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

  .item-action {
    flex-shrink: 0;
    display: flex;
    align-items: center;

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

:deep(.van-pull-refresh) {
  min-height: calc(100vh - 160px);
}

:deep(.van-list__finished-text) {
  padding: 20px 0;
  color: #969799;
  font-size: 13px;
}

:deep(.van-list__loading) {
  padding: 20px 0;
}

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

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%,
  100% {
    box-shadow: 0 0 4px rgba(7, 193, 96, 0.4);
  }
  50% {
    box-shadow: 0 0 8px rgba(7, 193, 96, 0.8);
  }
}

@media (max-width: 360px) {
  .doctor-list-item {
    padding: 12px;
    gap: 10px;

    .item-avatar {
      :deep(.van-image) {
        width: 60px !important;
        height: 60px !important;
      }

      .online-status {
        width: 12px;
        height: 12px;
      }
    }

    .item-info {
      gap: 6px;

      .info-header {
        .doctor-name {
          font-size: 15px;
          max-width: 100px;
        }

        .doctor-badge {
          font-size: 10px;
          padding: 2px 6px;
        }
      }

      .info-dept {
        font-size: 12px;
      }

      .info-rating {
        :deep(.van-rate) {
          font-size: 12px;
        }
      }
    }

    .item-action {
      :deep(.van-button) {
        padding: 0 12px;
        font-size: 12px;
        height: 28px;
      }
    }
  }
}
</style>
