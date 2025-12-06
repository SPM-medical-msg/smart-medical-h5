<template>
  <van-popup
    v-model:show="visible"
    position="bottom"
    round
    closeable
    close-icon-position="top-left"
    :style="{ height: '90%' }"
    :close-on-click-overlay="false"
    @close="handleClose"
  >
    <div class="payment-dialog">
      <!-- 步骤1: 待支付状态 -->
      <div v-if="currentStep === 'payment'" class="payment-content">
        <!-- 头部成功提示 -->
        <div class="dialog-header">
          <div class="header-icon">
            <van-icon name="checked" size="40" color="#67c23a" />
          </div>
          <h2 class="header-title">订单创建成功</h2>
          <p class="header-desc">请尽快完成支付，以便医生及时为您提供服务</p>
        </div>

        <!-- 订单信息卡片 -->
        <div class="order-info-card">
          <!-- 订单编号 -->
          <div class="order-number-section">
            <span class="label">订单编号</span>
            <span class="order-number">{{
              orderInfo.orderNumber || orderInfo.id
            }}</span>
            <van-button
              type="primary"
              plain
              size="mini"
              icon="description"
              @click="copyOrderNumber"
            >
              复制
            </van-button>
          </div>

          <!-- 医生信息 -->
          <div class="detail-section">
            <div class="section-header">
              <van-icon name="manager" />
              <span>医生信息</span>
            </div>
            <div class="doctor-info">
              <van-image
                round
                width="50"
                height="50"
                fit="cover"
                :src="orderInfo.doctorAvatar || '/default-avatar.png'"
              />
              <div class="doctor-details">
                <h3>{{ orderInfo.doctorRealName }}</h3>
                <p>
                  <van-tag type="primary" size="small">{{
                    orderInfo.deptName
                  }}</van-tag>
                  <span class="major">{{ orderInfo.majorInfo }}</span>
                </p>
              </div>
            </div>
          </div>

          <!-- 咨询信息 -->
          <div class="detail-section">
            <div class="section-header">
              <van-icon name="calendar-o" />
              <span>咨询信息</span>
            </div>
            <van-cell-group :border="false" class="consult-info">
              <van-cell
                title="咨询日期"
                :value="
                  orderInfo.createTime
                    ? orderInfo.createTime.split(' ')[0]
                    : '-'
                "
              />
              <van-cell title="时间段" :value="getTimeText(orderInfo.time)" />
              <van-cell title="创建时间" :value="orderInfo.createTime || '-'" />
            </van-cell-group>
          </div>

          <!-- 支付金额 -->
          <div class="payment-amount-section">
            <span class="label">应付金额</span>
            <span class="amount">
              <span class="currency">¥</span>
              <span class="price">{{ orderInfo.price || "20.00" }}</span>
            </span>
          </div>
        </div>

        <!-- 支付方式选择 -->
        <div class="payment-methods">
          <div class="methods-title">选择支付方式</div>
          <van-radio-group v-model="selectedPayment">
            <van-cell-group inset>
              <van-cell clickable @click="selectedPayment = 'wechat'">
                <template #title>
                  <div class="method-item">
                    <van-icon name="wechat" color="#07c160" size="24" />
                    <div class="method-info">
                      <span class="method-name">微信支付</span>
                      <span class="method-desc">推荐使用微信快捷支付</span>
                    </div>
                  </div>
                </template>
                <template #right-icon>
                  <van-radio name="wechat" />
                </template>
              </van-cell>
              <van-cell clickable @click="selectedPayment = 'alipay'">
                <template #title>
                  <div class="method-item">
                    <van-icon name="alipay" color="#1677ff" size="24" />
                    <div class="method-info">
                      <span class="method-name">支付宝支付</span>
                      <span class="method-desc">使用支付宝安全支付</span>
                    </div>
                  </div>
                </template>
                <template #right-icon>
                  <van-radio name="alipay" />
                </template>
              </van-cell>
            </van-cell-group>
          </van-radio-group>
        </div>

        <!-- 温馨提示 -->
        <div class="tips">
          <van-icon name="info-o" />
          <span>订单创建后30分钟内未支付将自动取消</span>
        </div>

        <!-- 底部操作按钮 -->
        <div class="dialog-footer">
          <van-button round class="cancel-btn" @click="handleWaitPay">
            稍后支付
          </van-button>
          <van-button
            type="primary"
            round
            class="pay-btn"
            :loading="paying"
            loading-text="支付中..."
            @click="handlePayment"
          >
            <van-icon name="card" />
            立即支付 ¥{{ orderInfo.price || "20.00" }}
          </van-button>
        </div>
      </div>

      <!-- 步骤2: 支付成功 - 病情描述页面 -->
      <div v-else-if="currentStep === 'waiting'" class="waiting-content">
        <!-- 成功动画 -->
        <div class="success-animation">
          <div class="success-icon-wrapper">
            <van-icon
              name="checked"
              size="60"
              color="#67c23a"
              class="success-icon"
            />
            <div class="ripple"></div>
            <div class="ripple delay-1"></div>
          </div>
          <h2 class="waiting-title">支付成功！</h2>
          <p class="waiting-desc">请填写病情描述，帮助医生更好地了解您的情况</p>
        </div>

        <!-- 病情描述表单 -->
        <div class="medical-record-container">
          <div class="medical-record-header">
            <van-icon name="description" size="24" color="#1989fa" />
            <div class="header-text">
              <h3>病情描述</h3>
              <p>请详细描述您的病情，以便医生更好地为您诊断</p>
            </div>
          </div>

          <div class="medical-record-form">
            <!-- 病情描述文本 -->
            <van-field
              v-model="medicalRecordForm.description"
              type="textarea"
              placeholder="请详细描述您的症状、发病时间、病史等信息..."
              :rows="5"
              maxlength="1000"
              show-word-limit
              class="description-field"
            />

            <!-- 病情图片上传 - 使用您的 upload 组件 -->
            <div class="upload-section">
              <div class="upload-label">
                <van-icon name="photo-o" />
                <span>病情图片（可选）</span>
              </div>
              <div class="upload-content">
                <SingleUpload
                  v-model="medicalRecordForm.imageUrl"
                  :width="80"
                  :height="80"
                  upload-text="上传图片"
                  upload-icon="photograph"
                  @change="handleImageChange"
                />
              </div>
              <div class="upload-tips">
                <van-icon name="info-o" size="12" />
                <span>支持上传检查报告、化验单等图片，便于医生诊断</span>
              </div>
            </div>
          </div>

          <!-- 医生信息提示 -->
          <div class="doctor-info-tip">
            <van-icon name="user-o" />
            <span
              >病情描述将发送给：<strong>{{ orderInfo.doctorRealName }}</strong>
              医生</span
            >
          </div>
        </div>

        <!-- 底部按钮 -->
        <div class="waiting-footer">
          <van-button round icon="chat-o" @click="skipAndGoToChat">
            跳过，直接聊天
          </van-button>
          <van-button
            type="primary"
            round
            icon="success"
            :loading="submitLoading"
            loading-text="发送中..."
            @click="submitAndGoToChat"
          >
            发送并进入聊天
          </van-button>
        </div>

        <!-- 提示信息 -->
        <div class="waiting-tips">
          <van-icon name="bullhorn-o" color="#1989fa" />
          <span>填写病情描述后，医生可以更快速地了解您的情况</span>
        </div>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { showToast, showSuccessToast, showFailToast } from "vant";
import { useUserStore } from "@/stores";
import { payOrderInfo } from "@/api/order";
import { getFriendInfoById } from "@/api/friend";
import { createConnection, doPublish } from "@/utils/mqtt";
import SingleUpload from "@/components/upload/Upload.vue";

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  orderInfo: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(["update:show", "payment-success"]);

// 控制弹窗显示
const visible = computed({
  get: () => props.show,
  set: (val) => emit("update:show", val),
});

// 步骤控制
const currentStep = ref("payment"); // payment | waiting

// 支付相关
const paying = ref(false);
const selectedPayment = ref("wechat");

// 病情描述相关
const submitLoading = ref(false);
const medicalRecordForm = ref({
  description: "",
  imageUrl: "",
});

// 获取时间段文字
const getTimeText = (time) => {
  const timeMap = {
    1: "08:00-10:00",
    2: "10:00-12:00",
    3: "14:00-16:00",
    4: "16:00-18:00",
  };
  return timeMap[time] || "全天";
};

// 复制订单号
const copyOrderNumber = async () => {
  const orderNumber = props.orderInfo.orderNumber || props.orderInfo.id;
  try {
    await navigator.clipboard.writeText(String(orderNumber));
    showSuccessToast("订单号已复制");
  } catch {
    // 降级方案
    const input = document.createElement("input");
    input.value = orderNumber;
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    document.body.removeChild(input);
    showSuccessToast("订单号已复制");
  }
};

// 图片上传成功回调
const handleImageChange = (url) => {
  console.log("图片上传成功:", url);
  medicalRecordForm.value.imageUrl = url;
};

// 处理支付
const handlePayment = async () => {
  paying.value = true;

  try {
    // 调用支付接口
    await payOrderInfo(props.orderInfo);

    const cartInfo = {
      friendId: route.query.id,
      userId: userStore.userInfo.id,
    };

    const res = await getFriendInfoById(cartInfo);

    if (!res.data) {
      emit("payment-success");
      visible.value = false;
      return;
    }

    showSuccessToast("支付成功");

    // 切换到病情描述页面
    currentStep.value = "waiting";

    // 创建MQTT连接
    createConnection();

    // 通知父组件
    emit("payment-success");
  } catch (error) {
    console.error("支付错误:", error);
    showFailToast("支付失败，请重试");
  } finally {
    paying.value = false;
  }
};

// 稍后支付
const handleWaitPay = () => {
  visible.value = false;
  showToast("您可以在咨询管理页面继续支付");
};

// 关闭弹窗
const handleClose = () => {
  // 延迟重置状态
  setTimeout(() => {
    currentStep.value = "payment";
    medicalRecordForm.value = {
      description: "",
      imageUrl: "",
    };
  }, 300);
};

// 跳过病情描述，直接进入聊天
const skipAndGoToChat = async () => {
  try {
    const cartInfo = {
      friendId: route.query.id,
      userId: userStore.userInfo.id,
    };

    const res = await getFriendInfoById(cartInfo);

    if (res.data && res.data.status === 1) {
      showToast("等待医生确认中，请稍后...");
      return;
    }

    visible.value = false;

    // ⚠️ 请根据您的实际路由修改
    router.push({
      path: "/chat",
      query: {
        orderId: props.orderInfo.id,
        odirectoryId: userStore.userInfo.id,
        doctorId: route.query.id,
      },
    });
  } catch (error) {
    console.error("跳转失败:", error);
    showFailToast("操作失败，请重试");
  }
};

// 提交病情描述并进入聊天
const submitAndGoToChat = async () => {
  // 如果没有填写任何内容，直接跳转
  if (
    !medicalRecordForm.value.description &&
    !medicalRecordForm.value.imageUrl
  ) {
    skipAndGoToChat();
    return;
  }

  // 验证描述长度
  if (
    medicalRecordForm.value.description &&
    medicalRecordForm.value.description.length < 10
  ) {
    showToast("病情描述至少需要10个字符");
    return;
  }

  submitLoading.value = true;

  try {
    const patientId = userStore.userInfo.id;
    const doctorId = route.query.id;
    const timestamp = new Date().getTime();

    // 构建聊天主题
    const chatTopic = `CHAT/SRV000/${doctorId}/${patientId}`;

    // 发送病情描述文字消息
    if (medicalRecordForm.value.description) {
      const textMessage = {
        type: 1,
        msgType: "medical_record",
        content: `【病情描述】\n${medicalRecordForm.value.description}`,
        sendUserId: Number(patientId),
        receiveUserId: Number(doctorId),
        strategyId: props.orderInfo.id,
        timestamp: timestamp,
        senderName: userStore.userInfo.realName || userStore.userInfo.userName,
      };

      doPublish(chatTopic, JSON.stringify(textMessage), 0);
      console.log("发送病历文字消息:", textMessage);
    }

    // 发送图片消息
    if (medicalRecordForm.value.imageUrl) {
      const imageMessage = {
        type: 2,
        msgType: "medical_record",
        content: medicalRecordForm.value.imageUrl,
        sendUserId: Number(patientId),
        receiveUserId: Number(doctorId),
        strategyId: props.orderInfo.id,
        timestamp: timestamp + 1,
        senderName: userStore.userInfo.realName || userStore.userInfo.userName,
      };

      doPublish(chatTopic, JSON.stringify(imageMessage), 0);
      console.log("发送病历图片消息:", imageMessage);
    }

    showSuccessToast("病情描述已发送");

    // 跳转到聊天室
    const cartInfo = {
      friendId: route.query.id,
      userId: userStore.userInfo.id,
    };

    const res = await getFriendInfoById(cartInfo);

    if (res.data && res.data.status === 1) {
      showToast("等待医生确认中，请稍后...");
      submitLoading.value = false;
      return;
    }

    visible.value = false;

    // ⚠️ 请根据您的实际路由修改
    router.push({
      path: "/chat",
      query: {
        orderId: props.orderInfo.id,
        userId: userStore.userInfo.id,
        doctorId: route.query.id,
      },
    });
  } catch (error) {
    console.error("发送病历失败:", error);
    showFailToast("发送失败，请稍后重试");
  } finally {
    submitLoading.value = false;
  }
};

// 监听弹窗关闭，重置状态
watch(visible, (val) => {
  if (!val) {
    handleClose();
  }
});
</script>

<style lang="scss" scoped>
.payment-dialog {
  height: 100%;
  overflow-y: auto;
  padding-bottom: env(safe-area-inset-bottom);

  // ==================== 步骤1: 支付页面 ====================
  .payment-content {
    padding: 20px 16px;

    // 头部
    .dialog-header {
      text-align: center;
      padding: 16px 0 24px;

      .header-icon {
        width: 70px;
        height: 70px;
        margin: 0 auto 16px;
        background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: scaleIn 0.5s ease;
      }

      .header-title {
        font-size: 20px;
        color: #333;
        margin: 0 0 8px;
        font-weight: 600;
      }

      .header-desc {
        font-size: 13px;
        color: #969799;
        margin: 0;
      }
    }

    // 订单信息卡片
    .order-info-card {
      background: linear-gradient(135deg, #f8fafc 0%, #eef3ff 100%);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;
      border: 1px solid #e6ecf2;

      .order-number-section {
        display: flex;
        align-items: center;
        gap: 8px;
        padding-bottom: 12px;
        border-bottom: 1px dashed #d4e0f4;
        margin-bottom: 12px;

        .label {
          font-size: 13px;
          color: #969799;
        }

        .order-number {
          flex: 1;
          font-size: 14px;
          font-weight: 600;
          color: #1989fa;
          font-family: monospace;
        }
      }

      .detail-section {
        margin-bottom: 12px;

        .section-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          font-weight: 500;
          color: #1989fa;
          margin-bottom: 10px;
        }

        .doctor-info {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #fff;
          border-radius: 8px;

          .doctor-details {
            flex: 1;

            h3 {
              margin: 0 0 6px;
              font-size: 15px;
              color: #333;
            }

            p {
              margin: 0;
              display: flex;
              align-items: center;
              gap: 6px;
              font-size: 12px;

              .major {
                color: #969799;
              }
            }
          }
        }

        .consult-info {
          background: #fff;
          border-radius: 8px;
          overflow: hidden;

          :deep(.van-cell) {
            padding: 10px 12px;
            font-size: 13px;

            &::after {
              display: none;
            }

            .van-cell__title {
              color: #969799;
            }

            .van-cell__value {
              color: #333;
            }
          }
        }
      }

      .payment-amount-section {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        background: linear-gradient(135deg, #1989fa 0%, #5eafe2 100%);
        border-radius: 8px;
        margin-top: 12px;

        .label {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.9);
        }

        .amount {
          .currency {
            font-size: 14px;
            color: #fff;
          }

          .price {
            font-size: 26px;
            font-weight: 700;
            color: #fff;
          }
        }
      }
    }

    // 支付方式
    .payment-methods {
      margin-bottom: 12px;

      .methods-title {
        font-size: 14px;
        font-weight: 500;
        color: #333;
        margin-bottom: 12px;
        padding-left: 4px;
      }

      .method-item {
        display: flex;
        align-items: center;
        gap: 12px;

        .method-info {
          display: flex;
          flex-direction: column;
          gap: 2px;

          .method-name {
            font-size: 14px;
            color: #333;
            font-weight: 500;
          }

          .method-desc {
            font-size: 11px;
            color: #969799;
          }
        }
      }

      :deep(.van-cell-group--inset) {
        margin: 0;
      }

      :deep(.van-cell) {
        padding: 14px 16px;
      }
    }

    // 提示
    .tips {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px;
      background: #fff7e6;
      border-radius: 6px;
      font-size: 12px;
      color: #fa8c16;
      margin-bottom: 16px;
    }

    // 底部按钮
    .dialog-footer {
      display: flex;
      gap: 12px;

      .cancel-btn {
        flex: 1;
      }

      .pay-btn {
        flex: 2;

        .van-icon {
          margin-right: 4px;
        }
      }
    }
  }

  // ==================== 步骤2: 等待页面 ====================
  .waiting-content {
    padding: 20px 16px;

    // 成功动画
    .success-animation {
      text-align: center;
      padding: 16px 0;

      .success-icon-wrapper {
        position: relative;
        width: 80px;
        height: 80px;
        margin: 0 auto 16px;

        .success-icon {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 2;
        }

        .ripple {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(103, 194, 58, 0.3) 0%,
            transparent 70%
          );
          animation: ripple 2s infinite;

          &.delay-1 {
            animation-delay: 0.5s;
          }
        }
      }

      .waiting-title {
        font-size: 22px;
        font-weight: 600;
        color: #333;
        margin: 0 0 8px;
      }

      .waiting-desc {
        font-size: 13px;
        color: #969799;
        margin: 0;
      }
    }

    // 病情描述容器
    .medical-record-container {
      background: #fff;
      border-radius: 12px;
      border: 1px solid #ebedf0;
      overflow: hidden;
      margin: 16px 0;

      .medical-record-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 16px;
        background: linear-gradient(135deg, #f0f7ff 0%, #e8f4fd 100%);
        border-bottom: 1px solid #ebedf0;

        .header-text {
          h3 {
            margin: 0 0 4px;
            font-size: 15px;
            color: #333;
          }

          p {
            margin: 0;
            font-size: 12px;
            color: #969799;
          }
        }
      }

      .medical-record-form {
        padding: 16px;

        .description-field {
          margin-bottom: 16px;

          :deep(.van-field__control) {
            font-size: 14px;
            line-height: 1.6;
          }
        }

        .upload-section {
          .upload-label {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 14px;
            color: #333;
            margin-bottom: 12px;
          }

          .upload-content {
            margin-bottom: 8px;
          }

          .upload-tips {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            color: #969799;
          }
        }
      }

      .doctor-info-tip {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 10px 16px;
        background: #fffbe6;
        border-top: 1px solid #ffe58f;
        font-size: 13px;
        color: #d48806;

        strong {
          color: #333;
        }
      }
    }

    // 底部按钮
    .waiting-footer {
      display: flex;
      gap: 12px;
      margin-bottom: 12px;

      .van-button {
        flex: 1;
        font-size: 14px;
      }
    }

    // 提示
    .waiting-tips {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px;
      background: #f5f7fa;
      border-radius: 6px;
      font-size: 12px;
      color: #606266;
    }
  }
}

// 动画
@keyframes scaleIn {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}

@keyframes ripple {
  0% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0;
  }
}
</style>
