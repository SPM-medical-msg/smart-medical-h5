<template>
  <div class="notice-home">
    <!-- 顶部筛选区域 -->
    <div class="filter-container">
      <div class="filter-header">
        <span class="filter-label">疾病筛选</span>
        <span
          v-if="sortedDeptList.length > maxDisplayCount"
          class="expand-btn"
          @click="toggleExpand"
        >
          {{ isExpanded ? "收起" : "展开全部" }}
          <van-icon :name="isExpanded ? 'arrow-up' : 'arrow-down'" />
        </span>
      </div>
      <div class="filter-tags" :class="{ expanded: isExpanded }">
        <div
          v-for="item in displayedDeptList"
          :key="item.id"
          class="dept-tag"
          :class="{ active: currentDeptId === item.id }"
          @click="clickDept(item)"
        >
          <span class="tag-text">{{ item.deptName }}</span>
          <span v-if="item.count > 0" class="tag-count">{{ item.count }}</span>
        </div>
      </div>
    </div>

    <!-- 知识库列表区域 -->
    <div class="notice-section">
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <div class="notice-list">
          <!-- 加载状态 -->
          <div v-if="loading && !refreshing" class="loading-state">
            <van-loading size="24px" vertical>加载中...</van-loading>
          </div>

          <template v-else>
            <transition-group name="fade-slide">
              <div
                v-for="item in tableData"
                :key="item.id"
                class="notice-item"
                @click="toDetail(item)"
              >
                <div class="notice-content">
                  <div class="notice-header">
                    <div class="title-wrapper">
                      <div class="notice-icon">
                        <van-icon name="description" size="18" />
                      </div>
                      <h3 class="notice-title">{{ item.title }}</h3>
                    </div>
                  </div>

                  <van-tag
                    :type="item.deptName ? 'primary' : 'default'"
                    plain
                    size="medium"
                    class="dept-badge"
                  >
                    {{ item.deptName || "未分类" }}
                  </van-tag>

                  <p class="notice-desc">{{ item.desc || "暂无简介" }}</p>

                  <div class="notice-footer">
                    <span class="notice-time">
                      <van-icon name="clock-o" />
                      {{ item.createTime }}
                    </span>
                    <span class="read-more">
                      阅读详情
                      <van-icon name="arrow" />
                    </span>
                  </div>
                </div>
              </div>
            </transition-group>

            <!-- 空状态 -->
            <div v-if="tableData.length === 0 && !loading" class="empty-state">
              <van-empty description="暂无知识库内容">
                <van-button
                  type="primary"
                  size="small"
                  round
                  @click="resetFilter"
                >
                  重置筛选
                </van-button>
              </van-empty>
            </div>
          </template>
        </div>
      </van-pull-refresh>
    </div>

    <!-- 回到顶部 -->
    <van-back-top right="16" bottom="80" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { showToast } from "vant";
import { getNoticeListWithDept } from "@/api/notice";
import { getDeptList } from "@/api/dept";

const router = useRouter();

// 数据相关
const query = ref({
  pageNum: 1,
  pageSize: 999,
  title: null,
  deptId: null,
});

const tableData = ref([]);
const allNoticeData = ref([]);
const deptList = ref([]);
const currentDeptId = ref(0);
const loading = ref(false);
const refreshing = ref(false);

// 展开/收起相关
const isExpanded = ref(false);
const maxDisplayCount = 6; // 移动端默认显示数量减少

// 计算属性 - 按知识库数量排序的科室列表
const sortedDeptList = computed(() => {
  if (deptList.value.length === 0) return [];

  const deptCountMap = {};
  allNoticeData.value.forEach((notice) => {
    const deptId = notice.deptId || 0;
    deptCountMap[deptId] = (deptCountMap[deptId] || 0) + 1;
  });

  const deptsWithCount = deptList.value.map((dept) => ({
    ...dept,
    count:
      dept.id === 0 ? allNoticeData.value.length : deptCountMap[dept.id] || 0,
  }));

  const allDept = deptsWithCount.find((d) => d.id === 0);
  const otherDepts = deptsWithCount
    .filter((d) => d.id !== 0)
    .sort((a, b) => b.count - a.count);

  return allDept ? [allDept, ...otherDepts] : otherDepts;
});

// 计算属性 - 当前显示的科室列表
const displayedDeptList = computed(() => {
  if (isExpanded.value) {
    return sortedDeptList.value;
  }
  return sortedDeptList.value.slice(0, maxDisplayCount);
});

// 生命周期
onMounted(() => {
  getAllNoticeData();
  getDeptData();
});

// 下拉刷新
const onRefresh = async () => {
  try {
    await getAllNoticeData();
    showToast("刷新成功");
  } catch (error) {
    showToast("刷新失败");
  } finally {
    refreshing.value = false;
  }
};

// 获取所有知识库数据
const getAllNoticeData = async () => {
  try {
    const res = await getNoticeListWithDept({
      pageNum: 1,
      pageSize: 9999,
    });
    allNoticeData.value = res.data.list;
    getData();
  } catch (error) {
    console.error("获取知识库列表失败:", error);
  }
};

// 获取知识库数据
const getData = async () => {
  loading.value = true;
  try {
    const res = await getNoticeListWithDept(query.value);
    tableData.value = res.data.list;
  } catch (error) {
    console.error("获取知识库列表失败:", error);
  } finally {
    loading.value = false;
  }
};

// 获取科室数据
const getDeptData = async () => {
  try {
    const res = await getDeptList({ pageNum: 1, pageSize: 999 });
    deptList.value = res.data.list;
    deptList.value.unshift({
      id: 0,
      deptName: "全部",
    });
  } catch (error) {
    console.error("获取科室列表失败:", error);
  }
};

// 展开/收起切换
const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
};

// 科室筛选
const clickDept = (item) => {
  currentDeptId.value = item.id;
  query.value.deptId = item.id !== 0 ? item.id : null;
  getData();
};

// 重置筛选
const resetFilter = () => {
  currentDeptId.value = 0;
  query.value.deptId = null;
  isExpanded.value = false;
  getData();
};

// 跳转详情
const toDetail = (item) => {
  router.push({
    path: "/notice-detail",
    query: { id: item.id },
  });
};
</script>

<style scoped>
.notice-home {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
  padding-bottom: 60px;
}

/* 筛选容器 */
.filter-container {
  background: #fff;
  padding: 12px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 100;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.filter-label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.expand-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #4682dc;
}

/* 筛选标签 */
.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 80px;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.filter-tags.expanded {
  max-height: 500px;
}

.dept-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: #f0f7ff;
  border-radius: 16px;
  font-size: 13px;
  color: #666;
  transition: all 0.2s;
  flex-shrink: 0;
}

.dept-tag.active {
  background: linear-gradient(135deg, #4682dc 0%, #5ba3f5 100%);
  color: #fff;
}

.tag-count {
  background: rgba(70, 130, 220, 0.15);
  padding: 1px 6px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: bold;
  color: #4682dc;
}

.dept-tag.active .tag-count {
  background: rgba(255, 255, 255, 0.3);
  color: #fff;
}

/* 知识库列表区域 */
.notice-section {
  padding: 12px;
}

.notice-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

/* 知识库卡片 */
.notice-item {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.notice-item:active {
  transform: scale(0.98);
  border-left-color: #4682dc;
}

.notice-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.notice-header {
  display: flex;
  align-items: flex-start;
}

.title-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex: 1;
}

.notice-icon {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4682dc;
  flex-shrink: 0;
}

.notice-title {
  margin: 0;
  font-size: 15px;
  color: #1a3052;
  font-weight: 600;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dept-badge {
  align-self: flex-start;
  margin-left: 42px;
}

.notice-desc {
  margin: 0;
  color: #666;
  font-size: 13px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-left: 42px;
}

.notice-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  margin-left: 42px;
  border-top: 1px solid #f5f5f5;
}

.notice-time {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #999;
  font-size: 12px;
}

.read-more {
  display: flex;
  align-items: center;
  gap: 2px;
  color: #4682dc;
  font-size: 13px;
  font-weight: 500;
}

/* 空状态 */
.empty-state {
  padding: 40px 20px;
  background: #fff;
  border-radius: 12px;
}

/* 动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
