<template>
  <div class="notice-detail">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <van-loading size="24px" vertical>加载中...</van-loading>
    </div>

    <!-- 主体内容区域 -->
    <template v-else-if="info">
      <!-- 内容区域 -->
      <div class="content-area">
        <div class="content-card">
          <v-md-preview
            v-highlight
            class="notice-content"
            :text="info.content"
            ref="preview"
            @change="handleContentChange"
          />
        </div>
      </div>

      <!-- 目录浮动按钮 -->
      <div
        class="catalog-fab"
        :class="{ active: showCatalog }"
        @click="toggleCatalog"
      >
        <van-icon :name="showCatalog ? 'cross' : 'bars'" size="20" />
      </div>

      <!-- 目录弹出层 -->
      <van-popup
        v-model:show="showCatalog"
        position="bottom"
        :style="{ maxHeight: '60vh' }"
        round
      >
        <div class="catalog-popup">
          <div class="catalog-header">
            <span class="catalog-title">
              <van-icon name="bars" />
              目录导航
            </span>
            <span class="catalog-count">共 {{ catalogList.length }} 章节</span>
          </div>
          <div class="catalog-list">
            <div
              v-for="(item, index) in catalogList"
              :key="index"
              class="catalog-item"
              :class="{ active: activeIndex === index }"
              @click="scrollToSection(index)"
            >
              <span class="catalog-index">{{ index + 1 }}</span>
              <span class="catalog-text">{{ item.title }}</span>
              <van-icon name="arrow" class="catalog-arrow" />
            </div>
          </div>
        </div>
      </van-popup>
    </template>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <van-empty description="知识库内容不存在">
        <van-button type="primary" size="small" round @click="goBack">
          返回列表
        </van-button>
      </van-empty>
    </div>

    <!-- 回到顶部 -->
    <van-back-top right="16" bottom="140" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { showToast } from "vant";
import { getNoticeInfo } from "@/api/notice";

const route = useRoute();
const router = useRouter();

const info = ref(null);
const loading = ref(false);
const preview = ref(null);
const catalogList = ref([]);
const activeIndex = ref(0);
const showCatalog = ref(false);
const sectionOffsets = ref([]);

// 导航栏高度常量（移动端通常是46px或自定义）
const NAV_HEIGHT = 46;
const EXTRA_OFFSET = 20;

onMounted(() => {
  getData();
  window.addEventListener("scroll", handleScroll);
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});

// 监听路由变化
watch(
  () => route.query.id,
  (newId) => {
    if (newId) {
      getData();
    }
  }
);

// 获取知识库详情
const getData = async () => {
  loading.value = true;
  catalogList.value = [];
  activeIndex.value = 0;
  try {
    const res = await getNoticeInfo({ id: route.query.id });
    info.value = res.data;
    nextTick(() => {
      setTimeout(() => {
        parseCatalog();
      }, 500);
    });
  } catch (error) {
    console.error("获取知识库详情失败:", error);
    showToast("获取详情失败");
  } finally {
    loading.value = false;
  }
};

// 解析目录
const parseCatalog = () => {
  const contentEl = document.querySelector(".notice-content");
  if (!contentEl) return;

  const titleElements = contentEl.querySelectorAll(
    ".disease-detail-card-title"
  );
  const catalog = [];
  const offsets = [];

  titleElements.forEach((el, index) => {
    const id = `section-${index}`;
    el.setAttribute("id", id);

    catalog.push({
      title: el.textContent.trim(),
      id: id,
    });

    const rect = el.getBoundingClientRect();
    const offsetTop = rect.top + window.pageYOffset;
    offsets.push(offsetTop);
  });

  catalogList.value = catalog;
  sectionOffsets.value = offsets;
};

// 切换目录显示
const toggleCatalog = () => {
  showCatalog.value = !showCatalog.value;
};

// 滚动到指定章节
const scrollToSection = (index) => {
  const item = catalogList.value[index];
  if (!item) return;

  const element = document.getElementById(item.id);
  if (element) {
    const rect = element.getBoundingClientRect();
    const offsetTop = rect.top + window.pageYOffset;
    window.scrollTo({
      top: offsetTop - NAV_HEIGHT - EXTRA_OFFSET,
      behavior: "smooth",
    });
    activeIndex.value = index;
    showCatalog.value = false;
  }
};

// 处理滚动事件
const handleScroll = () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

  if (sectionOffsets.value.length > 0) {
    const viewportTop = scrollTop + NAV_HEIGHT + EXTRA_OFFSET + 50;

    let currentIndex = 0;
    for (let i = sectionOffsets.value.length - 1; i >= 0; i--) {
      if (viewportTop >= sectionOffsets.value[i]) {
        currentIndex = i;
        break;
      }
    }
    activeIndex.value = currentIndex;
  }
};

// 内容变化时重新解析目录
const handleContentChange = () => {
  nextTick(() => {
    setTimeout(() => {
      parseCatalog();
    }, 300);
  });
};

// 返回列表
const goBack = () => {
  router.push("/mobile/notice");
};
</script>

<style scoped>
.notice-detail {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
  padding: 12px;
  padding-bottom: 80px;
}

/* 加载状态 */
.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

/* 内容区域 */
.content-area {
  animation: fadeIn 0.5s ease-out;
}

.content-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

/* 目录浮动按钮 */
.catalog-fab {
  position: fixed;
  right: 16px;
  bottom: 200px;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #4682dc 0%, #5ba3f5 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 4px 12px rgba(70, 130, 220, 0.4);
  z-index: 100;
  transition: all 0.3s;
}

.catalog-fab:active {
  transform: scale(0.9);
}

.catalog-fab.active {
  background: #666;
}

/* 目录弹出层 */
.catalog-popup {
  padding: 0;
}

.catalog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #4682dc 0%, #5ba3f5 100%);
  color: #fff;
}

.catalog-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
}

.catalog-count {
  font-size: 13px;
  opacity: 0.9;
}

.catalog-list {
  max-height: calc(60vh - 60px);
  overflow-y: auto;
}

.catalog-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid #f5f5f5;
  transition: all 0.2s;
}

.catalog-item:active {
  background: #f8f9fa;
}

.catalog-item.active {
  background: linear-gradient(90deg, #e8f4ff 0%, #fff 100%);
}

.catalog-item.active .catalog-index {
  background: linear-gradient(135deg, #4682dc 0%, #5ba3f5 100%);
  color: #fff;
}

.catalog-item.active .catalog-text {
  color: #4682dc;
  font-weight: 600;
}

.catalog-index {
  width: 24px;
  height: 24px;
  background: #f0f0f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #666;
  flex-shrink: 0;
}

.catalog-text {
  flex: 1;
  font-size: 14px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.catalog-arrow {
  color: #ccc;
  font-size: 12px;
}

/* 空状态 */
.empty-state {
  padding: 60px 20px;
  background: #fff;
  border-radius: 12px;
  margin-top: 20px;
}

/* ============== Markdown 内容样式（移动端适配） ============== */

:deep(.github-markdown-body) {
  color: #333;
  font-size: 14px;
  line-height: 1.8;
  padding: 16px;
}
:deep(.github-markdown-body) ul {
  padding-left: 4px !important;
}
/* 主标题样式 */
:deep(.github-markdown-body) .tag-content .tag-content-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a3052;
  padding: 12px 14px;
  margin-bottom: 16px;
  border-bottom: 2px solid #4682dc;
  background: linear-gradient(90deg, #4682dc20 0%, transparent 100%);
  border-radius: 8px 8px 0 0;
  word-break: break-all;
}

/* 科室信息样式 */
:deep(.github-markdown-body) .tag-content-section {
  font-size: 14px;
  font-weight: 500;
  line-height: 24px;
  color: #4682dc;
  padding: 10px 14px;
  background: #f0f7ff;
  border-radius: 8px;
  margin: 12px 0;
  display: inline-block;
}

/* 发布时间样式 */
:deep(.github-markdown-body) .tag-content-time {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 10px 0;
  margin: 12px 0;
  border-bottom: 1px dashed #e8e9eb;
}

:deep(.github-markdown-body) .tag-content-time p {
  margin: 0;
  color: #999;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

:deep(.github-markdown-body) .tag-content-time p::before {
  content: "";
  width: 5px;
  height: 5px;
  background: #4682dc;
  border-radius: 50%;
}

/* 摘要/要点样式 */
:deep(.github-markdown-body) .tag-content-detail {
  background: linear-gradient(135deg, #667eea10 0%, #764ba210 100%);
  padding: 14px 16px;
  border-radius: 10px;
  border-left: 3px solid #4682dc;
  margin: 16px 0 24px;
  font-size: 14px;
  line-height: 1.8;
  color: #555;
}

/* 章节标题样式 */
:deep(.github-markdown-body) .disease-detail-card-title {
  font-size: 18px;
  font-weight: 600;
  line-height: 28px;
  color: #1a3052;
  padding: 16px 0 12px;
  margin-top: 28px;
  margin-bottom: 14px;
  border-bottom: 2px solid transparent;
  border-image: linear-gradient(90deg, #4682dc, transparent) 1;
  position: relative;
  scroll-margin-top: 80px;
}

:deep(.github-markdown-body) .disease-detail-card-title::before {
  /* content: "";
  position: absolute;
  left: -12px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background: linear-gradient(135deg, #4682dc 0%, #5ba3f5 100%);
  border-radius: 2px; */
}

/* 参考资料标题样式 */
:deep(.github-markdown-body) .reference-material-title {
  font-size: 17px;
  font-weight: 600;
  line-height: 28px;
  color: #1a3052;
  padding-top: 20px;
  margin-top: 28px;
  border-top: 2px solid #e8e9eb;
}

/* 参考资料内容样式 */
:deep(.github-markdown-body) .reference-material-content {
  background: #f8fafb;
  padding: 14px 16px;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.8;
  color: #666;
  margin-top: 12px;
}

/* 二级标题样式 */
:deep(.github-markdown-body) h2 {
  font-size: 16px;
  font-weight: 600;
  color: #1a3052;
  margin: 20px 0 12px;
  padding-left: 10px;
  border-left: 3px solid #4682dc;
  line-height: 1.5;
}

/* 段落样式 */
:deep(.github-markdown-body) p {
  margin: 12px 0;
  text-align: justify;
}

/* 列表样式 */
:deep(.github-markdown-body) ul,
:deep(.github-markdown-body) ol {
  padding-left: 20px;
  margin: 12px 0;
}

:deep(.github-markdown-body) li {
  margin-bottom: 8px;
  line-height: 1.7;
}

:deep(.github-markdown-body) li::marker {
  color: #4682dc;
}

/* 加粗文字样式 */
:deep(.github-markdown-body) strong {
  color: #1a3052;
  font-weight: 600;
}

/* 表格样式 */
:deep(.github-markdown-body) table {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  font-size: 13px;
  display: block;
  overflow-x: auto;
}

:deep(.github-markdown-body) thead {
  background: linear-gradient(135deg, #4682dc 0%, #5ba3f5 100%);
}

:deep(.github-markdown-body) th {
  padding: 10px 12px;
  text-align: left;
  font-weight: 600;
  color: #fff;
  font-size: 13px;
  white-space: nowrap;
}

:deep(.github-markdown-body) td {
  padding: 10px 12px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
  color: #333;
}

:deep(.github-markdown-body) tbody tr:nth-child(even) {
  background: #f8fafb;
}

/* 图片样式 */
:deep(.github-markdown-body) img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin: 16px auto;
  display: block;
}

/* 图片说明样式 */
:deep(.github-markdown-body) center {
  color: #999;
  font-size: 12px;
  margin-top: -8px;
  margin-bottom: 16px;
}

/* 上标样式 */
:deep(.github-markdown-body) sup {
  color: #4682dc;
  font-size: 11px;
}

/* 链接样式 */
:deep(.github-markdown-body) a {
  color: #4682dc;
  text-decoration: none;
}

/* 引用样式 */
:deep(.github-markdown-body) blockquote {
  margin: 16px 0;
  padding: 12px 16px;
  background: #f8fafb;
  border-left: 3px solid #4682dc;
  border-radius: 0 8px 8px 0;
  color: #666;
  font-size: 13px;
}

/* 代码样式 */
:deep(.github-markdown-body) code {
  background: #f0f7ff;
  padding: 2px 6px;
  border-radius: 4px;
  color: #4682dc;
  font-size: 13px;
}

:deep(.github-markdown-body) pre {
  background: #f8fafb;
  padding: 14px;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 13px;
}

/* 疾病详情卡片样式 */
:deep(.github-markdown-body) .disease-detail-card {
  margin-bottom: 16px;
}

:deep(.github-markdown-body) .html-parse {
  padding: 0 2px;
}

/* 隐藏广告图片 */
:deep(.github-markdown-body) img[data-type="commonlyDrug"] {
  display: none !important;
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 滚动条样式 */
.catalog-list::-webkit-scrollbar {
  width: 3px;
}

.catalog-list::-webkit-scrollbar-track {
  background: #f0f0f0;
}

.catalog-list::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 2px;
}
</style>
