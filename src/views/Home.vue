<template>
  <div class="home-page">
    <!-- 顶部导航栏 -->
    <van-nav-bar
      title="智能医疗服务平台"
      fixed
      placeholder
    />

    <!-- 页面内容 -->
    <div class="content">
      <!-- 欢迎卡片 -->
      <van-cell-group inset class="welcome-card">
        <van-cell center>
          <template #title>
            <div class="welcome-title">
              <van-icon name="smile-o" size="24" color="#1989fa" />
              <span>欢迎使用</span>
            </div>
          </template>
          <template #label>
            <div class="welcome-desc">智能医疗，健康相伴</div>
          </template>
        </van-cell>
      </van-cell-group>

      <!-- 功能模块入口 -->
      <van-cell-group inset class="function-group">
        <van-cell title="医患通讯" is-link icon="chat-o" @click="showToast('功能开发中')" />
        <van-cell title="健康知识" is-link icon="bookmark-o" @click="showToast('功能开发中')" />
        <van-cell title="健康管理" is-link icon="records" @click="showToast('功能开发中')" />
      </van-cell-group>

      <!-- 占位提示 -->
      <div class="placeholder-text">
        更多功能持续开发中...
      </div>
    </div>
  </div>
</template>

<script setup>
import { showToast } from 'vant'
// import request from '@/utils/request' // 需要时引入

// 页面逻辑将在后续开发
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.content {
  padding: 16px 0;
}

.welcome-card {
  margin-bottom: 16px;
}

.welcome-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #323233;
}

.welcome-desc {
  margin-top: 8px;
  font-size: 14px;
  color: #969799;
}

.function-group {
  margin-bottom: 16px;
}

.placeholder-text {
  text-align: center;
  padding: 40px 0;
  font-size: 14px;
  color: #969799;
}
</style>