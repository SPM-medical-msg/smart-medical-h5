<template>
  <div class="drug-detail">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <van-loading size="24px" vertical>加载中...</van-loading>
    </div>

    <!-- 主体内容区域 -->
    <template v-else-if="drugInfo">
      <!-- 药品基本信息头部 -->
      <div class="drug-header-card">
        <div class="drug-header">
          <div class="drug-icon">
            <van-icon name="medel" size="28" />
          </div>
          <div class="drug-info">
            <h1 class="drug-name">{{ drugInfo.drugName }}</h1>
            <div class="drug-meta">
              <van-tag
                v-if="drugInfo.sortName"
                type="success"
                plain
                size="medium"
                class="sort-tag"
              >
                <van-icon name="label-o" />
                {{ drugInfo.sortName }}
              </van-tag>
              <span class="drug-time" v-if="drugInfo.createTime">
                <van-icon name="clock-o" />
                {{ drugInfo.createTime }}
              </span>
            </div>
            <p class="drug-desc" v-if="drugInfo.desc">{{ drugInfo.desc }}</p>
          </div>
        </div>
      </div>

      <!-- 药品详情内容 -->
      <div class="content-card">
        <v-md-preview
          v-highlight
          class="drug-content"
          :text="drugInfo.content"
          ref="preview"
        />
      </div>
    </template>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <van-empty description="药品知识库内容不存在">
        <van-button type="primary" size="small" round @click="goBack">
          返回列表
        </van-button>
      </van-empty>
    </div>

    <!-- 回到顶部 -->
    <van-back-top right="16" bottom="80" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { showToast } from "vant";
import { getDrugList } from "@/api/drug";

const route = useRoute();
const router = useRouter();

const drugInfo = ref(null);
const loading = ref(false);
const preview = ref(null);

onMounted(() => {
  getData();
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

// 获取药品详情
const getData = async () => {
  loading.value = true;
  try {
    const res = await getDrugList({ id: route.query.id });
    drugInfo.value = res.data.list[0];
  } catch (error) {
    console.error("获取药品详情失败:", error);
    showToast("获取详情失败");
  } finally {
    loading.value = false;
  }
};

// 返回列表
const goBack = () => {
  router.push("/mobile/drug");
};
</script>

<style scoped>
.drug-detail {
  min-height: 100vh;
  background: #f5f5f5;
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

/* 药品头部卡片 */
.drug-header-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.drug-header {
  display: flex;
  gap: 14px;
}

.drug-icon {
  width: 56px;
  height: 56px;
  background: #e8f5e9;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #43a047;
  flex-shrink: 0;
}

.drug-info {
  flex: 1;
  min-width: 0;
}

.drug-name {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #333;
  font-weight: 600;
  line-height: 1.4;
  word-break: break-all;
}

.drug-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.sort-tag {
  display: flex;
  align-items: center;
  gap: 3px;
}

.drug-time {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #999;
  font-size: 12px;
}

.drug-desc {
  margin: 0;
  color: #666;
  font-size: 13px;
  line-height: 1.6;
}

/* 内容卡片 */
.content-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  animation: fadeIn 0.5s ease-out;
}

/* ============== 药品内容样式（移动端适配） ============== */
:deep(.github-markdown-body) {
  color: #333;
  font-size: 14px;
  line-height: 1.8;
  padding: 16px;
}
:deep(.github-markdown-body) ul {
  padding-left: 4px !important;
}

/* 药品标签样式 */
:deep(.github-markdown-body) [class*="drug-labels"],
:deep(.github-markdown-body) [class*="drug_labels"] {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

:deep(.github-markdown-body) [class*="drug-type"],
:deep(.github-markdown-body) [class*="DrugTypes"] {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
}

:deep(.github-markdown-body) [class*="green"] {
  background: #e8f5e9;
  color: #43a047;
}

:deep(.github-markdown-body) [class*="gray"] {
  background: #f5f5f5;
  color: #999;
}

/* 药品标题样式 */
:deep(.github-markdown-body) [class*="drug-title"],
:deep(.github-markdown-body) [class*="drug_title"] {
  font-size: 17px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e0e0e0;
}

/* 药品英文名 */
:deep(.github-markdown-body) [class*="drug-en"],
:deep(.github-markdown-body) [class*="drug_en"] {
  color: #999;
  font-size: 12px;
  font-style: italic;
  margin-bottom: 6px;
}

/* 药品提示信息 */
:deep(.github-markdown-body) [class*="drug-info"],
:deep(.github-markdown-body) [class*="drug_info"] {
  color: #e6a23c;
  font-size: 12px;
  margin: 10px 0;
}

/* 药品日期 */
:deep(.github-markdown-body) [class*="drug-date"],
:deep(.github-markdown-body) [class*="drug_date"] {
  color: #999;
  font-size: 11px;
  margin-bottom: 12px;
}

/* 章节容器 */
:deep(.github-markdown-body) [class*="page_item"],
:deep(.github-markdown-body) [class*="detail"] > div[class*="item"] {
  padding: 12px 0;
  border-bottom: 1px dashed #e0e0e0;
}

:deep(.github-markdown-body) [class*="page_item"]:last-child,
:deep(.github-markdown-body) [class*="detail"] > div[class*="item"]:last-child {
  border-bottom: none;
}

/* 章节标题样式 - 使用【】格式 */
:deep(.github-markdown-body) [class*="page_name"] {
  font-size: 15px;
  font-weight: 600;
  line-height: 24px;
  color: #333;
  margin-bottom: 10px;
}

:deep(.github-markdown-body) [class*="page_name"] span::before {
  content: "【";
  color: #333;
}

:deep(.github-markdown-body) [class*="page_name"] span::after {
  content: "】";
  color: #333;
}

/* 章节内容 */
:deep(.github-markdown-body) [class*="page_content"],
:deep(.github-markdown-body) [class*="content"] {
  color: #555;
  font-size: 13px;
  line-height: 1.8;
}

:deep(.github-markdown-body) .ck-content {
  color: #555;
  font-size: 13px;
  line-height: 1.8;
}

/* 列表样式 */
:deep(.github-markdown-body) ol {
  padding-left: 18px;
  margin: 6px 0;
}

:deep(.github-markdown-body) ol > li {
  margin-bottom: 6px;
  line-height: 1.7;
  color: #555;
}

:deep(.github-markdown-body) ul {
  padding-left: 18px;
  margin: 6px 0;
}

:deep(.github-markdown-body) ul > li {
  margin-bottom: 5px;
  line-height: 1.7;
  color: #555;
}

/* 段落样式 */
:deep(.github-markdown-body) p {
  margin: 6px 0;
  color: #555;
}

:deep(.github-markdown-body) div > div {
  margin: 3px 0;
}

/* 加粗文字 */
:deep(.github-markdown-body) strong,
:deep(.github-markdown-body) b {
  color: #333;
  font-weight: 600;
}

/* 表格样式 - 移动端适配 */
:deep(.github-markdown-body) table {
  width: 100%;
  border-collapse: collapse;
  margin: 10px 0;
  font-size: 12px;
  display: block;
  overflow-x: auto;
}

:deep(.github-markdown-body) th {
  padding: 8px 10px;
  text-align: left;
  font-weight: 600;
  color: #333;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  white-space: nowrap;
}

:deep(.github-markdown-body) td {
  padding: 8px 10px;
  border: 1px solid #e0e0e0;
  color: #555;
}

/* 链接样式 */
:deep(.github-markdown-body) a {
  color: #43a047;
  text-decoration: none;
}

/* 图片样式 */
:deep(.github-markdown-body) img {
  max-width: 100%;
  height: auto;
  margin: 10px 0;
  display: block;
  border-radius: 6px;
}

/* 折叠组件样式 */
:deep(.github-markdown-body) [class*="Ellipsis"] {
  position: relative;
}

:deep(.github-markdown-body) [class*="ellipsis"] {
  overflow: hidden;
}

/* 组件容器 */
:deep(.github-markdown-body) [class*="Component_container"],
:deep(.github-markdown-body) [class*="component_container"] {
  padding: 0;
}

/* 隐藏固定定位元素 */
:deep(.github-markdown-body) [class*="ant-affix"] {
  position: relative !important;
  top: auto !important;
}

/* 空状态 */
.empty-state {
  padding: 60px 20px;
  background: #fff;
  border-radius: 12px;
  margin-top: 20px;
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
