<template>
  <div class="order-detail-mobile">
    <!-- 顶部导航栏 -->
    <van-nav-bar
      title="订单详情"
      left-arrow
      @click-left="onClickLeft"
      fixed
      placeholder
    />

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <van-loading type="spinner" size="36" color="#1989fa">
        加载中...
      </van-loading>
    </div>

    <template v-else>
      <!-- 订单状态卡片 -->
      <div class="status-card" :class="getStatusClass(orderInfo.status)">
        <div class="status-icon">
          <van-icon :name="getStatusIcon(orderInfo.status)" size="40" />
        </div>
        <div class="status-info">
          <h2 class="status-title">{{ getStatusText(orderInfo.status) }}</h2>
          <p class="status-desc">{{ getStatusDesc(orderInfo.status) }}</p>
        </div>
      </div>

      <!-- 医生信息卡片 -->
      <div class="info-card">
        <div class="card-header">
          <van-icon name="manager-o" />
          <span>医生信息</span>
        </div>
        <div class="doctor-section">
          <van-image
            round
            width="60"
            height="60"
            fit="cover"
            :src="doctorInfo.imageUrl || defaultAvatar"
            class="doctor-avatar"
          >
            <template #error>
              <van-icon name="user-o" size="30" />
            </template>
          </van-image>
          <div class="doctor-info">
            <h3 class="doctor-name">
              {{ doctorInfo.realName || orderInfo.doctorRealName || "医生" }}
            </h3>
            <div class="doctor-tags">
              <van-tag type="primary" plain size="medium">
                {{ doctorInfo.deptName || orderInfo.deptName || "科室" }}
              </van-tag>
              <van-tag
                v-if="doctorInfo.majorInfo"
                type="success"
                plain
                size="small"
              >
                {{ doctorInfo.majorInfo }}
              </van-tag>
            </div>
            <div class="doctor-meta" v-if="doctorInfo.workTime">
              <van-icon name="clock-o" size="12" />
              <span>从业 {{ doctorInfo.workTime }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 订单信息卡片 -->
      <div class="info-card">
        <div class="card-header">
          <van-icon name="orders-o" />
          <span>订单信息</span>
        </div>
        <van-cell-group :border="false" class="order-cells">
          <van-cell title="订单编号">
            <template #value>
              <div class="order-number-cell">
                <span class="order-number">{{ orderInfo.orderNumber }}</span>
                <van-button
                  type="primary"
                  plain
                  size="mini"
                  @click="copyOrderNumber"
                >
                  复制
                </van-button>
              </div>
            </template>
          </van-cell>
          <van-cell title="订单状态">
            <template #value>
              <van-tag :type="getStatusTagType(orderInfo.status)" round>
                {{ getStatusText(orderInfo.status) }}
              </van-tag>
            </template>
          </van-cell>
          <van-cell
            title="咨询日期"
            :value="`${orderInfo.appointDay || '-'} ${orderInfo.weekDay || ''}`"
          />
          <van-cell title="时间段" :value="getTimeText(orderInfo.time)" />
          <van-cell title="创建时间" :value="orderInfo.createTime || '-'" />
          <van-cell
            v-if="orderInfo.updateTime !== orderInfo.createTime"
            title="更新时间"
            :value="orderInfo.updateTime || '-'"
          />
        </van-cell-group>
      </div>

      <!-- 费用信息卡片 -->
      <div class="info-card">
        <div class="card-header">
          <van-icon name="balance-o" />
          <span>费用信息</span>
        </div>
        <div class="price-section">
          <div class="price-row">
            <span class="price-label">咨询费用</span>
            <span class="price-value">
              <span class="currency">¥</span>
              <span class="amount">{{ orderInfo.price || "0.00" }}</span>
            </span>
          </div>
          <div class="price-divider"></div>
          <div class="price-row total">
            <span class="price-label">实付金额</span>
            <span class="price-value highlight">
              <span class="currency">¥</span>
              <span class="amount">{{ orderInfo.price || "0.00" }}</span>
            </span>
          </div>
        </div>
      </div>

      <!-- 订单时间线（已完成订单显示） -->
      <div v-if="orderInfo.status === 3" class="info-card">
        <div class="card-header">
          <van-icon name="clock-o" />
          <span>订单进度</span>
        </div>
        <van-steps
          direction="vertical"
          :active="timeline.length - 1"
          active-color="#1989fa"
          class="order-timeline"
        >
          <van-step v-for="(step, index) in timeline" :key="index">
            <div class="step-content">
              <h4>{{ step.title }}</h4>
              <p>{{ step.time }}</p>
            </div>
          </van-step>
        </van-steps>
      </div>

      <!-- 温馨提示 -->
      <div class="tips-card">
        <van-icon name="info-o" />
        <div class="tips-content">
          <template v-if="orderInfo.status === 1">
            <p>订单创建后30分钟内未支付将自动取消</p>
            <p>支付完成后，医生将尽快与您联系</p>
          </template>
          <template v-else-if="orderInfo.status === 2">
            <p>医生将在24小时内与您联系</p>
            <p>您也可以主动发送消息给医生</p>
          </template>
          <template v-else-if="orderInfo.status === 3">
            <p>感谢您的信任与支持</p>
            <p>如有问题可随时联系客服</p>
          </template>
          <template v-else>
            <p>如有疑问请联系客服</p>
          </template>
        </div>
      </div>

      <!-- 底部操作栏 -->
      <div class="bottom-actions">
        <!-- 待支付状态 -->
        <template v-if="orderInfo.status === 1">
          <van-button round @click="cancelOrder" class="action-btn">
            取消订单
          </van-button>
          <van-button
            type="primary"
            round
            @click="handlePay"
            :loading="payLoading"
            class="action-btn primary"
          >
            <van-icon name="card" />
            立即支付 ¥{{ orderInfo.price || "0.00" }}
          </van-button>
        </template>

        <!-- 待联系状态 -->
        <template v-else-if="orderInfo.status === 2">
          <van-button round @click="cancelOrder" class="action-btn">
            取消订单
          </van-button>
          <van-button
            type="primary"
            round
            @click="handleContact"
            class="action-btn primary"
          >
            <van-icon name="chat-o" />
            联系医生
          </van-button>
        </template>

        <!-- 已完成状态 -->
        <template v-else-if="orderInfo.status === 3">
          <van-button round @click="viewChatHistory" class="action-btn">
            <van-icon name="records" />
            聊天记录
          </van-button>
          <van-button
            type="primary"
            round
            @click="rateDoctor"
            class="action-btn primary"
          >
            <van-icon name="star-o" />
            评价医生
          </van-button>
        </template>

        <!-- 已取消状态 -->
        <template v-else-if="orderInfo.status === 4">
          <van-button round @click="deleteOrder" class="action-btn">
            删除订单
          </van-button>
          <van-button
            type="primary"
            round
            @click="reOrder"
            class="action-btn primary"
          >
            <van-icon name="replay" />
            重新预约
          </van-button>
        </template>
      </div>
    </template>

    <!-- 评价弹窗 -->
    <van-popup
      v-model:show="showEvaluatePopup"
      position="bottom"
      round
      closeable
      :style="{ height: '70%' }"
    >
      <EvaluateMobile
        :doctor-id="orderInfo.doctorUserId"
        @success="onEvaluateSuccess"
      />
    </van-popup>

    <!-- 聊天记录弹窗 -->
    <van-popup
      v-model:show="showHistoryPopup"
      position="bottom"
      round
      closeable
      :style="{ height: '90%' }"
    >
      <ChatHistoryMobile
        :user-id="orderInfo.userId"
        :doctor-id="orderInfo.doctorUserId"
        :order-id="orderInfo.id"
        @close="showHistoryPopup = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  showToast,
  showSuccessToast,
  showFailToast,
  showConfirmDialog,
  showLoadingToast,
  closeToast,
} from "vant";
import { useUserStore } from "@/stores";
import {
  getOrderList,
  payOrderInfo,
  updateOrderStatus,
  delOrderInfo,
} from "@/api/order";
import { getUserList } from "@/api/user";
import { getFriendInfoById, saveFriendInfo } from "@/api/friend";
import { createConnection, doSubscribe } from "@/utils/mqtt";
import EvaluateMobile from "@/components/EvaluateReplay/EvaluateMobile.vue";
import ChatHistoryMobile from "@/components/EvaluateReplay/ChatHistoryMobile.vue";

// 默认头像
import defaultAvatar from "@/assets/image/default1.png";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

// 数据
const loading = ref(false);
const payLoading = ref(false);
const orderInfo = ref({});
const doctorInfo = ref({});

// 弹窗
const showEvaluatePopup = ref(false);
const showHistoryPopup = ref(false);

// 时间线数据
const timeline = computed(() => {
  if (!orderInfo.value.createTime) return [];

  const list = [{ title: "订单创建", time: orderInfo.value.createTime }];

  if (orderInfo.value.status >= 2) {
    list.push({
      title: "支付成功",
      time: orderInfo.value.updateTime || orderInfo.value.createTime,
    });
  }

  if (orderInfo.value.status === 3) {
    list.push({ title: "咨询完成", time: orderInfo.value.updateTime });
  }

  return list;
});

// 生命周期
onMounted(() => {
  getOrderDetail();
});

// 获取订单详情
const getOrderDetail = async () => {
  const orderId = route.query.id;
  if (!orderId) {
    showToast("订单ID不存在");
    router.back();
    return;
  }

  loading.value = true;
  try {
    // 获取订单信息
    const orderRes = await getOrderList({ id: orderId });
    if (orderRes.data && orderRes.data.list && orderRes.data.list.length > 0) {
      orderInfo.value = orderRes.data.list[0];
    } else if (orderRes.data && orderRes.data.id) {
      // 兼容直接返回对象的情况
      orderInfo.value = orderRes.data;
    } else {
      showToast("订单不存在");
      router.back();
      return;
    }

    // 获取医生信息
    if (orderInfo.value.doctorUserId) {
      const doctorRes = await getUserList({ id: orderInfo.value.doctorUserId });
      if (
        doctorRes.data &&
        doctorRes.data.list &&
        doctorRes.data.list.length > 0
      ) {
        doctorInfo.value = doctorRes.data.list[0];
      }
    }
  } catch (error) {
    console.error("获取订单详情失败:", error);
    showFailToast("获取订单详情失败");
  } finally {
    loading.value = false;
  }
};

// 返回
const onClickLeft = () => {
  router.back();
};

// 复制订单号
const copyOrderNumber = async () => {
  const orderNumber = orderInfo.value.orderNumber;
  try {
    await navigator.clipboard.writeText(String(orderNumber));
    showSuccessToast("订单号已复制");
  } catch {
    const input = document.createElement("input");
    input.value = orderNumber;
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    document.body.removeChild(input);
    showSuccessToast("订单号已复制");
  }
};

// 支付订单
const handlePay = async () => {
  try {
    await showConfirmDialog({
      title: "支付确认",
      message: `确定支付 ¥${orderInfo.value.price || 0} 吗？`,
    });

    payLoading.value = true;
    const loadingToast = showLoadingToast({
      message: "支付中...",
      duration: 0,
    });

    await payOrderInfo(orderInfo.value);

    // 检查好友关系
    const friendRes = await getFriendInfoById({
      userId: orderInfo.value.userId,
      friendId: orderInfo.value.doctorUserId,
    });

    if (!friendRes.data) {
      await saveFriendInfo({
        userId: orderInfo.value.userId,
        friendId: orderInfo.value.doctorUserId,
      });
    }

    closeToast();
    showSuccessToast("支付成功");

    // 创建MQTT连接
    createConnection();
    if (
      userStore.userInfo.userType === 3 ||
      userStore.userInfo.userType === 1
    ) {
      const userId = userStore.userInfo.id;
      const readyTopic = `CHAT/READY/${userId}/#`;
      doSubscribe(readyTopic, 0);
    }

    // 刷新订单信息
    getOrderDetail();
  } catch (error) {
    if (error !== "cancel") {
      console.error("支付失败:", error);
      showFailToast("支付失败");
    }
  } finally {
    payLoading.value = false;
  }
};

// 联系医生
const handleContact = async () => {
  try {
    const res = await getFriendInfoById({
      userId: orderInfo.value.userId,
      friendId: orderInfo.value.doctorUserId,
    });

    if (!res.data) {
      await saveFriendInfo({
        userId: orderInfo.value.userId,
        friendId: orderInfo.value.doctorUserId,
      });
      showToast("医生将尽快与您联系");
    } else if (res.data && res.data.status === 1) {
      showToast("等待医生确认中");
    } else {
      router.push({
        path: "/chat",
        query: {
          orderId: orderInfo.value.id,
          userId: orderInfo.value.userId,
          doctorId: orderInfo.value.doctorUserId,
        },
      });
    }
  } catch (error) {
    console.error("联系医生失败:", error);
    showFailToast("操作失败");
  }
};

// 取消订单
const cancelOrder = async () => {
  try {
    await showConfirmDialog({
      title: "取消订单",
      message: "确定要取消该订单吗？",
    });

    await updateOrderStatus({ orderId: orderInfo.value.id, status: 4 });
    showSuccessToast("订单已取消");
    getOrderDetail();
  } catch (error) {
    if (error !== "cancel") {
      showFailToast("取消失败");
    }
  }
};

// 删除订单
const deleteOrder = async () => {
  try {
    await showConfirmDialog({
      title: "删除订单",
      message: "确定要删除该订单吗？删除后无法恢复。",
    });

    await delOrderInfo(orderInfo.value.id);
    showSuccessToast("订单已删除");
    router.back();
  } catch (error) {
    if (error !== "cancel") {
      showFailToast("删除失败");
    }
  }
};

// 查看聊天记录
const viewChatHistory = () => {
  showHistoryPopup.value = true;
};

// 评价医生
const rateDoctor = () => {
  showEvaluatePopup.value = true;
};

// 评价成功
const onEvaluateSuccess = () => {
  showEvaluatePopup.value = false;
  showSuccessToast("评价成功");
};

// 重新预约
const reOrder = () => {
  router.push({
    path: "/doctor/detail",
    query: { id: orderInfo.value.doctorUserId },
  });
};

// 工具方法
const getStatusText = (status) => {
  const map = {
    1: "待支付",
    2: "待联系",
    3: "已完成",
    4: "已取消",
  };
  return map[status] || "未知状态";
};

const getStatusDesc = (status) => {
  const map = {
    1: "请在30分钟内完成支付",
    2: "医生将尽快与您联系",
    3: "感谢您的信任与支持",
    4: "订单已取消",
  };
  return map[status] || "";
};

const getStatusIcon = (status) => {
  const map = {
    1: "clock-o",
    2: "chat-o",
    3: "passed",
    4: "close",
  };
  return map[status] || "info-o";
};

const getStatusClass = (status) => {
  const map = {
    1: "status-pending",
    2: "status-waiting",
    3: "status-completed",
    4: "status-cancelled",
  };
  return map[status] || "";
};

const getStatusTagType = (status) => {
  const map = {
    1: "warning",
    2: "primary",
    3: "success",
    4: "default",
  };
  return map[status] || "default";
};

const getTimeText = (time) => {
  const map = {
    1: "08:00-10:00",
    2: "10:00-12:00",
    3: "14:00-16:00",
    4: "16:00-18:00",
  };
  return map[time] || "全天";
};
</script>

<style lang="scss" scoped>
.order-detail-mobile {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 80px;

  // 加载状态
  .loading-container {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 60vh;
  }

  // 状态卡片
  .status-card {
    display: flex;
    align-items: center;
    padding: 24px 20px;
    color: #fff;

    &.status-pending {
      background: linear-gradient(135deg, #ff9800 0%, #ffb74d 100%);
    }

    &.status-waiting {
      background: linear-gradient(135deg, #1989fa 0%, #5eafe2 100%);
    }

    &.status-completed {
      background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
    }

    &.status-cancelled {
      background: linear-gradient(135deg, #909399 0%, #c0c4cc 100%);
    }

    .status-icon {
      width: 70px;
      height: 70px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
    }

    .status-info {
      flex: 1;

      .status-title {
        font-size: 22px;
        font-weight: 600;
        margin: 0 0 6px;
      }

      .status-desc {
        font-size: 14px;
        opacity: 0.9;
        margin: 0;
      }
    }
  }

  // 信息卡片
  .info-card {
    background: #fff;
    margin: 12px;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 14px 16px;
      font-size: 15px;
      font-weight: 500;
      color: #333;
      border-bottom: 1px solid #f5f5f5;

      .van-icon {
        color: #1989fa;
      }
    }
  }

  // 医生信息
  .doctor-section {
    display: flex;
    padding: 16px;

    .doctor-avatar {
      margin-right: 14px;
      flex-shrink: 0;
      border: 2px solid #f0f0f0;
    }

    .doctor-info {
      flex: 1;

      .doctor-name {
        font-size: 17px;
        font-weight: 600;
        color: #333;
        margin: 0 0 8px;
      }

      .doctor-tags {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
        margin-bottom: 8px;
      }

      .doctor-meta {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: #999;
      }
    }
  }

  // 订单信息单元格
  .order-cells {
    :deep(.van-cell) {
      padding: 12px 16px;

      .van-cell__title {
        color: #666;
        font-size: 14px;
      }

      .van-cell__value {
        color: #333;
        font-size: 14px;
      }
    }

    .order-number-cell {
      display: flex;
      align-items: center;
      gap: 8px;

      .order-number {
        font-family: monospace;
        color: #1989fa;
        font-weight: 500;
      }
    }
  }

  // 费用信息
  .price-section {
    padding: 16px;

    .price-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;

      .price-label {
        font-size: 14px;
        color: #666;
      }

      .price-value {
        font-size: 14px;
        color: #333;

        .currency {
          font-size: 12px;
        }

        .amount {
          font-weight: 500;
        }

        &.highlight {
          color: #ee0a24;
          font-size: 18px;

          .currency {
            font-size: 14px;
          }

          .amount {
            font-size: 22px;
            font-weight: 700;
          }
        }
      }

      &.total {
        padding-top: 12px;
      }
    }

    .price-divider {
      height: 1px;
      background: #f5f5f5;
      margin: 8px 0;
    }
  }

  // 订单时间线
  .order-timeline {
    padding: 16px;

    :deep(.van-step__circle) {
      width: 10px;
      height: 10px;
    }

    .step-content {
      h4 {
        font-size: 14px;
        color: #333;
        margin: 0 0 4px;
        font-weight: 500;
      }

      p {
        font-size: 12px;
        color: #999;
        margin: 0;
      }
    }
  }

  // 提示卡片
  .tips-card {
    display: flex;
    margin: 12px;
    padding: 14px 16px;
    background: #fffbe6;
    border-radius: 8px;
    border: 1px solid #ffe58f;

    .van-icon {
      color: #faad14;
      margin-right: 10px;
      font-size: 18px;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .tips-content {
      flex: 1;

      p {
        font-size: 13px;
        color: #d48806;
        margin: 0 0 4px;
        line-height: 1.5;

        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }

  // 底部操作栏
  .bottom-actions {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    gap: 12px;
    padding: 12px 16px;
    padding-bottom: calc(12px + env(safe-area-inset-bottom));
    background: #fff;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.06);
    z-index: 100;

    .action-btn {
      flex: 1;
      height: 44px;
      font-size: 15px;

      &.primary {
        flex: 1.5;

        .van-icon {
          margin-right: 4px;
        }
      }
    }
  }
}
</style>
