<template>
  <div class="order-management-mobile">
    <!-- 顶部导航栏 -->
    <van-nav-bar
      title="咨询管理"
      left-text="返回"
      left-arrow
      @click-left="onClickLeft"
      fixed
    >
      <template #right>
        <van-icon name="search" size="20" @click="showSearchPopup = true" />
      </template>
    </van-nav-bar>

    <!-- 筛选标签页 -->
    <van-tabs
      v-model:active="activeTab"
      sticky
      offset-top="46"
      @change="onTabChange"
      class="filter-tabs"
    >
      <van-tab
        v-for="tab in filterTabs"
        :key="tab.key"
        :title="tab.label"
        :badge="tab.count > 0 ? tab.count : ''"
        :name="tab.key"
      />
    </van-tabs>

    <!-- 下拉刷新 + 订单列表 -->
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="onLoad"
        class="order-list"
      >
        <!-- 订单卡片 -->
        <div
          v-for="order in displayOrders"
          :key="order.id"
          class="order-card"
          @click="viewDetails(order)"
        >
          <!-- 卡片头部 -->
          <div class="order-header">
            <div class="order-info">
              <span class="order-number">{{ order.orderNumber }}</span>
              <van-tag :type="getStatusType(order.status)" size="medium" round>
                {{ getStatusText(order.status) }}
              </van-tag>
            </div>
            <div class="order-time">{{ formatDate(order.createTime) }}</div>
          </div>

          <!-- 医生信息 -->
          <div class="doctor-section">
            <van-image
              round
              width="50"
              height="50"
              fit="cover"
              :src="order.doctorAvatar || defaultAvatar"
              class="doctor-avatar"
            />
            <div class="doctor-info">
              <div class="doctor-name">{{ order.doctorRealName }}</div>
              <div class="doctor-dept">
                <van-tag type="primary" plain size="small">
                  {{ order.deptName }}
                </van-tag>
              </div>
            </div>
            <!-- <div class="order-price">
              <span class="price-label">咨询费</span>
              <span class="price-value">¥{{ order.price || "20" }}</span>
            </div> -->
          </div>

          <!-- 订单详情 -->
          <div class="order-details">
            <div class="detail-item">
              <van-icon name="calendar-o" />
              <span>{{ order.appointDay || "待定" }}</span>
            </div>
            <div class="detail-item">
              <van-icon name="clock-o" />
              <span>{{ getTimeText(order.time) }}</span>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="order-actions" @click.stop>
            <!-- 待支付状态 -->
            <template v-if="order.status === 1">
              <van-button
                type="primary"
                size="small"
                round
                @click="handlePay(order)"
              >
                立即支付
              </van-button>
              <van-button
                type="default"
                size="small"
                round
                @click="cancelOrder(order)"
              >
                取消
              </van-button>
            </template>

            <!-- 待联系状态 -->
            <template v-else-if="order.status === 2">
              <van-button
                type="warning"
                size="small"
                round
                plain
                @click="handleContact(order)"
              >
                联系医生
              </van-button>
              <van-button
                type="primary"
                size="small"
                round
                plain
                @click="openMedicalRecord(order)"
              >
                病情描述
              </van-button>
            </template>

            <!-- 已完成状态 -->
            <template v-else-if="order.status === 3">
              <van-button
                type="success"
                size="small"
                round
                plain
                @click="viewChatHistory(order)"
              >
                聊天记录
              </van-button>
              <van-button
                type="primary"
                size="small"
                round
                plain
                @click="rateDoctor(order)"
              >
                评价医生
              </van-button>
            </template>

            <!-- 已取消状态 -->
            <template v-else-if="order.status === 4">
              <van-button
                type="default"
                size="small"
                round
                @click="deleteOrder(order)"
              >
                删除
              </van-button>
            </template>
          </div>
        </div>

        <!-- 空状态 -->
        <van-empty
          v-if="!loading && displayOrders.length === 0"
          description="暂无咨询记录"
          image="default"
        >
          <van-button type="primary" round @click="goToFindDoctor">
            去找医生咨询
          </van-button>
        </van-empty>
      </van-list>
    </van-pull-refresh>

    <!-- 搜索弹窗 -->
    <van-popup
      v-model:show="showSearchPopup"
      position="top"
      :style="{ height: 'auto' }"
      round
    >
      <div class="search-popup">
        <van-search
          v-model="searchText"
          placeholder="搜索医生、科室或订单号"
          show-action
          @search="onSearch"
          @cancel="showSearchPopup = false"
        />
        <div class="search-filters">
          <van-field
            v-model="selectedDeptName"
            is-link
            readonly
            label="科室"
            placeholder="选择科室"
            @click="showDeptPicker = true"
          />
        </div>
      </div>
    </van-popup>

    <!-- 科室选择器 -->
    <van-popup v-model:show="showDeptPicker" position="bottom" round>
      <van-picker
        :columns="deptColumns"
        @confirm="onDeptConfirm"
        @cancel="showDeptPicker = false"
        show-toolbar
        title="选择科室"
      />
    </van-popup>

    <!-- 评价弹窗 -->
    <van-popup
      v-model:show="showEvaluatePopup"
      position="bottom"
      round
      closeable
      :style="{ height: '70%' }"
    >
      <EvaluateMobile
        :doctor-id="currentDoctorId"
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
        :user-id="currentUserId"
        :doctor-id="currentDoctorId"
        :order-id="currentOrderId"
        @close="showHistoryPopup = false"
      />
    </van-popup>

    <!-- 病情描述弹窗 -->
    <van-popup
      v-model:show="showMedicalPopup"
      position="bottom"
      round
      closeable
      :style="{ height: '70%' }"
    >
      <MedicalRecordMobile
        :order="currentOrder"
        @success="onMedicalSuccess"
        @close="showMedicalPopup = false"
      />
    </van-popup>

    <!-- 操作菜单 -->
    <van-action-sheet
      v-model:show="showActionSheet"
      :actions="actionSheetActions"
      @select="onActionSelect"
      cancel-text="取消"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  showToast,
  showSuccessToast,
  showFailToast,
  showConfirmDialog,
  showLoadingToast,
  closeToast,
} from "vant";
import { useUserStore } from "@/stores";
import { getDeptList } from "@/api/dept";
import {
  getOrderList,
  payOrderInfo,
  delOrderInfo,
  getOrderInfo,
  updateOrderStatus,
} from "@/api/order";
import { getUserList } from "@/api/user";
import { saveFriendInfo, getFriendInfoById } from "@/api/friend";
import { createConnection, doSubscribe } from "@/utils/mqtt";
import EvaluateMobile from "@/components/EvaluateReplay/EvaluateMobile.vue";
import ChatHistoryMobile from "@/components/EvaluateReplay/ChatHistoryMobile.vue";
import MedicalRecordMobile from "@/components/MedicalRecord/MedicalRecordMobile.vue";

// 默认头像
import defaultAvatar from "@/assets/image/default1.png";

const router = useRouter();
const userStore = useUserStore();

// 列表相关
const loading = ref(false);
const finished = ref(false);
const refreshing = ref(false);
const orders = ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 筛选相关
const activeTab = ref("all");
const searchText = ref("");
const selectedDept = ref("");
const selectedDeptName = ref("");
const showSearchPopup = ref(false);
const showDeptPicker = ref(false);
const deptOptions = ref([]);

// 弹窗相关
const showEvaluatePopup = ref(false);
const showHistoryPopup = ref(false);
const showMedicalPopup = ref(false);
const showActionSheet = ref(false);
const currentOrder = ref(null);
const currentDoctorId = ref("");
const currentUserId = ref("");
const currentOrderId = ref("");

// 筛选标签
const filterTabs = ref([
  { key: "all", label: "全部", count: 0 },
  { key: "pay", label: "待支付", count: 0 },
  { key: "waiting", label: "待联系", count: 0 },
  { key: "completed", label: "已完成", count: 0 },
  { key: "cancelled", label: "已取消", count: 0 },
]);

// 操作菜单
const actionSheetActions = [
  { name: "取消订单", value: "cancel" },
  { name: "删除订单", value: "delete", color: "#ee0a24" },
];

// 科室选择列
const deptColumns = computed(() => {
  return [
    { text: "全部科室", value: "" },
    ...deptOptions.value.map((item) => ({
      text: item.deptName,
      value: item.deptName,
    })),
  ];
});

// 过滤后的订单列表
const displayOrders = computed(() => {
  let result = [...orders.value];

  // 按标签筛选
  if (activeTab.value !== "all") {
    result = result.filter((order) => {
      if (activeTab.value === "pay") return order.status === 1;
      if (activeTab.value === "waiting") return order.status === 2;
      if (activeTab.value === "completed") return order.status === 3;
      if (activeTab.value === "cancelled") return order.status === 4;
      return true;
    });
  }

  // 搜索筛选
  if (searchText.value) {
    const keyword = searchText.value.toLowerCase();
    result = result.filter(
      (order) =>
        order.orderNumber?.toLowerCase().includes(keyword) ||
        order.doctorRealName?.toLowerCase().includes(keyword) ||
        order.deptName?.toLowerCase().includes(keyword)
    );
  }

  // 科室筛选
  if (selectedDept.value) {
    result = result.filter((order) => order.deptName === selectedDept.value);
  }

  return result;
});

// 生命周期
onMounted(() => {
  getDeptData();
});

// 获取科室数据
const getDeptData = async () => {
  try {
    const res = await getDeptList({ pageSize: 100 });
    deptOptions.value = res.data.list || [];
  } catch (error) {
    console.error("获取科室失败:", error);
  }
};

// 获取订单数据
const fetchOrders = async (isRefresh = false) => {
  if (isRefresh) {
    currentPage.value = 1;
    finished.value = false;
  }

  try {
    const params = {
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      userId: userStore.userInfo.id,
    };

    const doctorQuery = {
      pageNum: 1,
      pageSize: 100,
      userType: 2,
      status: 2,
    };

    const [orderRes, doctorRes] = await Promise.all([
      getOrderList(params),
      getUserList(doctorQuery),
    ]);

    const doctorList = doctorRes.data.list || [];
    const newOrders = (orderRes.data.list || []).map((order) => ({
      ...order,
      doctorAvatar:
        doctorList.find((doc) => doc.id === order.doctorUserId)?.imageUrl || "",
    }));

    if (isRefresh) {
      orders.value = newOrders;
    } else {
      orders.value.push(...newOrders);
    }

    total.value = orderRes.data.total || 0;

    // 判断是否加载完成
    if (orders.value.length >= total.value) {
      finished.value = true;
    }

    // 更新标签数量
    updateTabCounts();
  } catch (error) {
    console.error("获取订单失败:", error);
    showFailToast("获取订单失败");
  }
};

// 更新标签数量
const updateTabCounts = () => {
  filterTabs.value[0].count = orders.value.length;
  filterTabs.value[1].count = orders.value.filter((o) => o.status === 1).length;
  filterTabs.value[2].count = orders.value.filter((o) => o.status === 2).length;
  filterTabs.value[3].count = orders.value.filter((o) => o.status === 3).length;
  filterTabs.value[4].count = orders.value.filter((o) => o.status === 4).length;
};

// 下拉刷新
const onRefresh = async () => {
  await fetchOrders(true);
  refreshing.value = false;
  showSuccessToast("刷新成功");
};

// 加载更多
const onLoad = async () => {
  if (currentPage.value === 1) {
    await fetchOrders();
  } else {
    currentPage.value++;
    await fetchOrders();
  }
  loading.value = false;
};

// 切换标签
const onTabChange = () => {
  // 标签切换时不需要重新请求，因为是前端过滤
};

// 搜索
const onSearch = () => {
  showSearchPopup.value = false;
};

// 科室选择确认
const onDeptConfirm = ({ selectedOptions }) => {
  const selected = selectedOptions[0];
  selectedDept.value = selected.value;
  selectedDeptName.value = selected.text === "全部科室" ? "" : selected.text;
  showDeptPicker.value = false;
};

// 返回
const onClickLeft = () => {
  router.back();
};

// 去找医生
const goToFindDoctor = () => {
  router.push("/home");
};

// 查看详情
const viewDetails = (order) => {
  currentOrder.value = order;
  showActionSheet.value = true;
};

// 操作菜单选择
const onActionSelect = (action) => {
  if (action.value === "detail") {
    showToast("页面开发中");
    // router.push({
    //   path: "/index-order/detail",
    //   query: { id: currentOrder.value.id },
    // });
    // getOrderInfo({ id: currentOrder.value.id }).then((res) => {
    //   console.log("订单数据", res);
    // });
  } else if (action.value === "delete") {
    deleteOrder(currentOrder.value);
  } else if (action.value === "cancel") {
    cancelOrder(currentOrder.value);
  }
};

// 支付订单
const handlePay = async (order) => {
  try {
    await showConfirmDialog({
      title: "支付确认",
      message: `确定支付 ¥${order.price || 20} 吗？`,
    });

    const loadingToast = showLoadingToast({
      message: "支付中...",
      forbidClick: true,
      duration: 0,
    });

    await payOrderInfo(order);

    // 检查好友关系
    const friendRes = await getFriendInfoById({
      userId: order.userId,
      friendId: order.doctorUserId,
    });

    if (!friendRes.data) {
      await saveFriendInfo({
        userId: order.userId,
        friendId: order.doctorUserId,
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

    // 刷新列表
    onRefresh();
  } catch (error) {
    if (error !== "cancel") {
      console.error("支付失败:", error);
      showFailToast("支付失败");
    }
  }
};

// 联系医生
const handleContact = async (order) => {
  try {
    const res = await getFriendInfoById({
      userId: order.userId,
      friendId: order.doctorUserId,
    });

    if (!res.data) {
      await saveFriendInfo({
        userId: order.userId,
        friendId: order.doctorUserId,
      });
      showToast("医生将尽快与您联系");
    } else if (res.data && res.data.status === 1) {
      showToast("等待医生确认中");
    } else {
      // 跳转到聊天页面
      router.push({
        path: "/chat",
        query: {
          orderId: order.id,
          userId: order.userId,
          doctorId: order.doctorUserId,
        },
      });
    }
  } catch (error) {
    console.error("联系医生失败:", error);
    showFailToast("操作失败");
  }
};

// 打开病情描述
const openMedicalRecord = (order) => {
  currentOrder.value = order;
  showMedicalPopup.value = true;
};

// 病情描述成功
const onMedicalSuccess = () => {
  showMedicalPopup.value = false;
  showSuccessToast("发送成功");
};

// 查看聊天记录
const viewChatHistory = (order) => {
  currentUserId.value = order.userId;
  currentDoctorId.value = order.doctorUserId;
  currentOrderId.value = order.id;
  showHistoryPopup.value = true;
};

// 评价医生
const rateDoctor = (order) => {
  currentDoctorId.value = order.doctorUserId;
  showEvaluatePopup.value = true;
};

// 评价成功
const onEvaluateSuccess = () => {
  showEvaluatePopup.value = false;
  showSuccessToast("评价成功");
};

// 取消订单
const cancelOrder = async (order) => {
  try {
    await showConfirmDialog({
      title: "取消订单",
      message: "确定要取消该订单吗？",
    });

    await updateOrderStatus({ orderId: order.id, status: 4 });
    showSuccessToast("已取消");
    onRefresh();
  } catch (error) {
    if (error !== "cancel") {
      showFailToast("取消失败");
    }
  }
};

// 删除订单
const deleteOrder = async (order) => {
  try {
    await showConfirmDialog({
      title: "删除订单",
      message: "确定要删除该订单吗？",
    });

    await delOrderInfo(order.id);
    showSuccessToast("已删除");
    onRefresh();
  } catch (error) {
    if (error !== "cancel") {
      showFailToast("删除失败");
    }
  }
};

// 工具方法
const getStatusText = (status) => {
  const map = {
    1: "待支付",
    2: "待联系",
    3: "已完成",
    4: "已取消",
  };
  return map[status] || "未知";
};

const getStatusType = (status) => {
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

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${month}-${day} ${hours}:${minutes}`;
};
</script>

<style lang="scss" scoped>
.order-management-mobile {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 20px;

  // 筛选标签
  .filter-tabs {
    :deep(.van-tabs__nav) {
      background: #fff;
    }

    :deep(.van-tab) {
      font-size: 14px;
    }

    :deep(.van-tab--active) {
      font-weight: 600;
    }
  }

  // 订单列表
  .order-list {
    padding: 12px;
  }

  // 订单卡片
  .order-card {
    background: #fff;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

    // 头部
    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid #f5f5f5;

      .order-info {
        display: flex;
        align-items: center;
        gap: 8px;

        .order-number {
          font-size: 12px;
          color: #909399;
          font-family: monospace;
        }
      }

      .order-time {
        font-size: 12px;
        color: #c0c4cc;
      }
    }

    // 医生信息
    .doctor-section {
      display: flex;
      align-items: center;
      margin-bottom: 12px;

      .doctor-avatar {
        margin-right: 12px;
        border: 2px solid #f5f5f5;
      }

      .doctor-info {
        flex: 1;

        .doctor-name {
          font-size: 16px;
          font-weight: 600;
          color: #333;
          margin-bottom: 4px;
        }

        .doctor-dept {
          display: flex;
          align-items: center;
        }
      }

      .order-price {
        text-align: right;

        .price-label {
          font-size: 12px;
          color: #909399;
          display: block;
        }

        .price-value {
          font-size: 18px;
          font-weight: 700;
          color: #ee0a24;
        }
      }
    }

    // 订单详情
    .order-details {
      display: flex;
      gap: 16px;
      padding: 10px 12px;
      background: #f8f9fa;
      border-radius: 8px;
      margin-bottom: 12px;

      .detail-item {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 13px;
        color: #666;

        .van-icon {
          color: #1989fa;
        }
      }
    }

    // 操作按钮
    .order-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;

      .van-button {
        min-width: 80px;
      }
    }
  }

  // 搜索弹窗
  .search-popup {
    padding-bottom: 16px;

    .search-filters {
      padding: 0 16px;
    }
  }
}
</style>
