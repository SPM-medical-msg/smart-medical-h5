<template>
  <div class="drug-home">
    <!-- 顶部筛选区域 -->
    <div class="filter-container">
      <!-- 搜索框 -->
      <div class="search-wrapper">
        <van-search
          v-model="query.drugName"
          placeholder="请输入药品名称搜索"
          show-action
          shape="round"
          @search="handleSearch"
          @clear="handleClear"
        >
          <template #action>
            <div class="search-actions">
              <van-button
                type="primary"
                size="small"
                round
                @click="handleSearch"
              >
                搜索
              </van-button>
              <van-button size="small" round @click="reset"> 重置 </van-button>
            </div>
          </template>
        </van-search>
      </div>

      <!-- 分类筛选标签 -->
      <div class="sort-filter">
        <div class="filter-header">
          <span class="filter-label">药品分类</span>
          <span
            v-if="sortedSortList.length > maxDisplayCount"
            class="expand-btn"
            @click="toggleExpand"
          >
            {{ isExpanded ? "收起" : "展开全部" }}
            <van-icon :name="isExpanded ? 'arrow-up' : 'arrow-down'" />
          </span>
        </div>
        <div class="filter-tags" :class="{ expanded: isExpanded }">
          <div
            v-for="item in displayedSortList"
            :key="item.id"
            class="sort-tag"
            :class="{ active: currentSortId === item.id }"
            @click="clickSort(item)"
          >
            <span class="tag-text">{{ item.sortName }}</span>
            <span v-if="item.count > 0" class="tag-count">{{
              item.count
            }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 药品列表区域 -->
    <div class="drug-section">
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <div class="drug-list">
          <!-- 初始加载状态 -->
          <div
            v-if="loading && !refreshing && displayedList.length === 0"
            class="loading-state"
          >
            <van-loading size="24px" vertical>加载中...</van-loading>
          </div>

          <template v-else>
            <transition-group name="fade-slide">
              <div
                v-for="item in displayedList"
                :key="item.id"
                class="drug-item"
                @click="toDetail(item)"
              >
                <div class="drug-content">
                  <div class="drug-header">
                    <div class="title-wrapper">
                      <div class="drug-icon">
                        <van-icon name="medel" size="18" />
                      </div>
                      <h3 class="drug-title">{{ item.drugName }}</h3>
                    </div>
                  </div>

                  <van-tag
                    :type="item.sortName ? 'success' : 'default'"
                    plain
                    size="medium"
                    class="sort-badge"
                  >
                    {{ item.sortName || "未分类" }}
                  </van-tag>

                  <p class="drug-desc">{{ item.desc || "暂无简介" }}</p>

                  <div class="drug-footer">
                    <div class="footer-left">
                      <span class="drug-time">
                        <van-icon name="clock-o" />
                        {{ item.createTime }}
                      </span>
                      <span v-if="item.manufacturer" class="drug-manufacturer">
                        <van-icon name="shop-o" />
                        {{ item.manufacturer }}
                      </span>
                    </div>
                    <span class="read-more">
                      查看详情
                      <van-icon name="arrow" />
                    </span>
                  </div>
                </div>
              </div>
            </transition-group>

            <!-- 加载更多状态 -->
            <div v-if="loadingMore" class="loading-more">
              <van-loading size="20px">加载中...</van-loading>
            </div>

            <!-- 没有更多数据 -->
            <div
              v-if="!hasMore && displayedList.length > 0 && !loading"
              class="no-more"
            >
              <span>—— 已经到底啦 ——</span>
            </div>

            <!-- 空状态 -->
            <div
              v-if="displayedList.length === 0 && !loading"
              class="empty-state"
            >
              <van-empty description="暂无药品知识库内容">
                <van-button type="primary" size="small" round @click="reset">
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
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { showToast } from "vant";
import { getSortList } from "@/api/sort";
import { getDrugList } from "@/api/drug";

const router = useRouter();

// ==================== 常量 ====================
const PAGE_SIZE = 10;
const MAX_DISPLAY_COUNT = 6; // 移动端显示更少

// ==================== 数据定义 ====================

// 查询条件
const query = ref({
  drugName: null,
  sortId: null,
});

// 分页相关
const pageNum = ref(1);
const total = ref(0);

// 药品数据
const list = ref([]);
const allSearchData = ref([]);
const filteredList = ref([]);

// 分类数据
const sortList = ref([]);
const sortCountMap = ref({});
const currentSortId = ref(0);

// 模式标识
const isSearchMode = ref(false);

// 加载状态
const loading = ref(false);
const loadingMore = ref(false);
const refreshing = ref(false);

// 展开/收起
const isExpanded = ref(false);
const maxDisplayCount = MAX_DISPLAY_COUNT;

// 搜索模式下的显示数量
const displayCount = ref(PAGE_SIZE);

// ==================== 计算属性 ====================

// 排序后的分类列表
const sortedSortList = computed(() => {
  if (sortList.value.length === 0) return [];

  const sortsWithCount = sortList.value.map((sort) => {
    let count;
    if (sort.id === 0) {
      count = isSearchMode.value ? allSearchData.value.length : total.value;
    } else {
      count = isSearchMode.value
        ? sortCountMap.value[sort.id] || 0
        : sort.drugCount || 0;
    }
    return { ...sort, count };
  });

  const allSort = sortsWithCount.find((s) => s.id === 0);
  const otherSorts = sortsWithCount
    .filter((s) => s.id !== 0)
    .sort((a, b) => b.count - a.count);

  return allSort ? [allSort, ...otherSorts] : otherSorts;
});

// 显示的分类列表
const displayedSortList = computed(() => {
  return isExpanded.value
    ? sortedSortList.value
    : sortedSortList.value.slice(0, maxDisplayCount);
});

// 显示的药品列表
const displayedList = computed(() => {
  if (isSearchMode.value) {
    return filteredList.value.slice(0, displayCount.value);
  } else {
    return list.value;
  }
});

// 是否还有更多
const hasMore = computed(() => {
  if (isSearchMode.value) {
    return displayCount.value < filteredList.value.length;
  } else {
    return list.value.length < total.value;
  }
});

// ==================== 生命周期 ====================

onMounted(() => {
  initData();
  setupScrollListener();
});

onUnmounted(() => {
  removeScrollListener();
});

// ==================== 初始化 ====================

const initData = async () => {
  loading.value = true;
  try {
    const [drugRes, sortRes] = await Promise.all([
      getDrugList({ pageNum: 1, pageSize: PAGE_SIZE, status: 1 }),
      getSortList({ pageNum: 1, pageSize: 100 }),
    ]);

    list.value = drugRes.data.list;
    total.value = drugRes.data.total;
    pageNum.value = 1;

    sortList.value = sortRes.data.list;
    sortList.value.unshift({
      id: 0,
      sortName: "全部",
      drugCount: drugRes.data.total,
    });
  } catch (error) {
    console.error("初始化数据失败:", error);
    showToast("加载失败");
  } finally {
    loading.value = false;
  }
};

// ==================== 下拉刷新 ====================

const onRefresh = async () => {
  try {
    if (isSearchMode.value) {
      await handleSearch();
    } else {
      pageNum.value = 1;
      const params = {
        pageNum: 1,
        pageSize: PAGE_SIZE,
        status: 1,
      };
      if (query.value.sortId) {
        params.sortId = query.value.sortId;
      }
      const res = await getDrugList(params);
      list.value = res.data.list;
      total.value = res.data.total;
    }
    showToast("刷新成功");
  } catch (error) {
    showToast("刷新失败");
  } finally {
    refreshing.value = false;
  }
};

// ==================== 滚动懒加载 ====================

let scrollTimer = null;

const setupScrollListener = () => {
  window.addEventListener("scroll", handleScroll, { passive: true });
};

const removeScrollListener = () => {
  window.removeEventListener("scroll", handleScroll);
  if (scrollTimer) clearTimeout(scrollTimer);
};

const handleScroll = () => {
  if (scrollTimer) clearTimeout(scrollTimer);

  scrollTimer = setTimeout(() => {
    if (loadingMore.value || loading.value || !hasMore.value) return;

    const scrollTop =
      document.documentElement.scrollTop || document.body.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // 移动端触发距离可以小一些
    if (scrollTop + windowHeight >= documentHeight - 80) {
      loadMore();
    }
  }, 100);
};

// 加载更多
const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return;

  loadingMore.value = true;

  try {
    if (isSearchMode.value) {
      // 搜索模式：前端分页
      await new Promise((resolve) => setTimeout(resolve, 200));
      displayCount.value += PAGE_SIZE;
    } else {
      // 正常模式：接口分页
      pageNum.value++;
      const params = {
        pageNum: pageNum.value,
        pageSize: PAGE_SIZE,
        status: 1,
      };

      if (query.value.sortId) {
        params.sortId = query.value.sortId;
      }

      const res = await getDrugList(params);
      list.value = [...list.value, ...res.data.list];
      total.value = res.data.total;
    }
  } catch (error) {
    console.error("加载更多失败:", error);
    pageNum.value--;
    showToast("加载失败");
  } finally {
    loadingMore.value = false;
  }
};

// ==================== 搜索操作 ====================

const handleSearch = async () => {
  const keyword = query.value.drugName?.trim();

  if (!keyword) {
    await resetToNormalMode();
    return;
  }

  loading.value = true;
  isSearchMode.value = true;
  currentSortId.value = 0;
  query.value.sortId = null;

  try {
    const res = await getDrugList({
      pageNum: 1,
      pageSize: 9999,
      status: 1,
      drugName: keyword,
    });

    allSearchData.value = res.data.list;
    filteredList.value = [...allSearchData.value];
    displayCount.value = PAGE_SIZE;

    calculateSortCount();
  } catch (error) {
    console.error("搜索失败:", error);
    showToast("搜索失败");
  } finally {
    loading.value = false;
  }
};

const handleClear = () => {
  resetToNormalMode();
};

const calculateSortCount = () => {
  const countMap = {};
  allSearchData.value.forEach((drug) => {
    const sortId = drug.sortId || 0;
    countMap[sortId] = (countMap[sortId] || 0) + 1;
  });
  sortCountMap.value = countMap;
};

// ==================== 分类筛选 ====================

const clickSort = async (item) => {
  currentSortId.value = item.id;
  query.value.sortId = item.id !== 0 ? item.id : null;

  if (isSearchMode.value) {
    if (item.id === 0) {
      filteredList.value = [...allSearchData.value];
    } else {
      filteredList.value = allSearchData.value.filter(
        (drug) => drug.sortId === item.id
      );
    }
    displayCount.value = PAGE_SIZE;
  } else {
    loading.value = true;
    pageNum.value = 1;

    try {
      const params = {
        pageNum: 1,
        pageSize: PAGE_SIZE,
        status: 1,
      };

      if (item.id !== 0) {
        params.sortId = item.id;
      }

      const res = await getDrugList(params);
      list.value = res.data.list;
      total.value = res.data.total;
    } catch (error) {
      console.error("分类筛选失败:", error);
      showToast("筛选失败");
    } finally {
      loading.value = false;
    }
  }
};

// ==================== 重置操作 ====================

const resetToNormalMode = async () => {
  loading.value = true;
  isSearchMode.value = false;
  currentSortId.value = 0;
  query.value.drugName = null;
  query.value.sortId = null;
  allSearchData.value = [];
  filteredList.value = [];
  sortCountMap.value = {};
  displayCount.value = PAGE_SIZE;
  pageNum.value = 1;

  try {
    const res = await getDrugList({
      pageNum: 1,
      pageSize: PAGE_SIZE,
      status: 1,
    });
    list.value = res.data.list;
    total.value = res.data.total;
  } catch (error) {
    console.error("重置失败:", error);
  } finally {
    loading.value = false;
  }
};

const reset = () => {
  isExpanded.value = false;
  resetToNormalMode();
};

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
};

const toDetail = (item) => {
  router.push({
    path: "/mediciation-detail",
    query: { id: item.id },
  });
};
</script>

<style scoped>
.drug-home {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
  padding-bottom: 60px;
}

/* 筛选容器 */
.filter-container {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 100;
}

/* 搜索框 */
.search-wrapper {
  padding: 8px 12px;
  border-bottom: 1px solid #f5f5f5;
}

:deep(.van-search) {
  padding: 0;
}

:deep(.van-search__content) {
  background: #f5f7fa;
}

.search-actions {
  display: flex;
  gap: 8px;
}

:deep(.search-actions .van-button) {
  padding: 0 12px;
  height: 28px;
}

/* 分类筛选 */
.sort-filter {
  padding: 12px;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
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
  color: #43a047;
}

/* 筛选标签 */
.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 72px;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.filter-tags.expanded {
  max-height: 500px;
}

.sort-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: #e8f5e9;
  border-radius: 16px;
  font-size: 13px;
  color: #666;
  transition: all 0.2s;
  flex-shrink: 0;
}

.sort-tag.active {
  background: linear-gradient(135deg, #43a047 0%, #66bb6a 100%);
  color: #fff;
}

.tag-count {
  background: rgba(76, 175, 80, 0.15);
  padding: 1px 6px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: bold;
  color: #43a047;
}

.sort-tag.active .tag-count {
  background: rgba(255, 255, 255, 0.3);
  color: #fff;
}

/* 药品列表区域 */
.drug-section {
  padding: 12px;
}

.drug-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 200px;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

/* 药品卡片 */
.drug-item {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.drug-item:active {
  transform: scale(0.98);
  border-left-color: #43a047;
}

.drug-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.drug-header {
  display: flex;
  align-items: flex-start;
}

.title-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex: 1;
}

.drug-icon {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #43a047;
  flex-shrink: 0;
}

.drug-title {
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

.sort-badge {
  align-self: flex-start;
  margin-left: 46px;
}

.drug-desc {
  margin: 0;
  color: #666;
  font-size: 13px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-left: 46px;
}

.drug-footer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 12px;
  margin-left: 46px;
  border-top: 1px solid #f5f5f5;
}

.footer-left {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.drug-time,
.drug-manufacturer {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #999;
  font-size: 12px;
}

.drug-manufacturer {
  color: #43a047;
}

.read-more {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;
  color: #43a047;
  font-size: 13px;
  font-weight: 500;
}

/* 加载更多 */
.loading-more {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.no-more {
  text-align: center;
  padding: 20px 0;
  color: #999;
  font-size: 13px;
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
