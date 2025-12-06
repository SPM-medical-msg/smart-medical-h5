<template>
  <div class="medical-record-mobile">
    <div class="popup-header">
      <h3>病情描述</h3>
      <p>请详细描述您的病情，以便医生更好地为您诊断</p>
    </div>

    <div class="form-content">
      <!-- 病情描述 -->
      <van-field
        v-model="form.description"
        type="textarea"
        placeholder="请详细描述您的症状、发病时间、病史等信息..."
        :rows="6"
        maxlength="1000"
        show-word-limit
        class="description-field"
      />

      <!-- 图片上传 -->
      <div class="upload-section">
        <div class="upload-label">
          <van-icon name="photo-o" />
          <span>病情图片（可选）</span>
        </div>
        <SingleUpload
          v-model="form.imageUrl"
          :width="80"
          :height="80"
          upload-text="上传"
        />
        <div class="upload-tips">
          <van-icon name="info-o" size="12" />
          <span>支持上传检查报告、化验单等图片</span>
        </div>
      </div>

      <!-- 医生提示 -->
      <div class="doctor-tip" v-if="order">
        <van-icon name="user-o" />
        <span
          >发送给：<strong>{{ order.doctorRealName }}</strong> 医生</span
        >
      </div>

      <!-- 提交按钮 -->
      <van-button
        type="primary"
        block
        round
        :loading="submitting"
        :disabled="!form.description.trim()"
        @click="submitMedicalRecord"
        class="submit-btn"
      >
        发送给医生
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { showToast, showSuccessToast } from "vant";
import { useUserStore } from "@/stores";
import { doPublish } from "@/utils/mqtt";
import SingleUpload from "@/components/upload/Upload.vue";

const props = defineProps({
  order: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["success", "close"]);

const userStore = useUserStore();

const form = ref({
  description: "",
  imageUrl: "",
});
const submitting = ref(false);

const submitMedicalRecord = async () => {
  if (!form.value.description.trim()) {
    showToast("请输入病情描述");
    return;
  }

  if (form.value.description.length < 10) {
    showToast("病情描述至少10个字符");
    return;
  }

  submitting.value = true;

  try {
    const patientId = props.order.userId;
    const doctorId = props.order.doctorUserId;
    const timestamp = new Date().getTime();
    const chatTopic = `CHAT/SRV000/${doctorId}/${patientId}`;

    // 发送文字消息
    const textMessage = {
      type: 1,
      msgType: "medical_record",
      content: `【病情描述】\n${form.value.description}`,
      sendUserId: Number(patientId),
      receiveUserId: Number(doctorId),
      strategyId: props.order.id,
      timestamp: timestamp,
      senderName: userStore.userInfo.realName || userStore.userInfo.userName,
    };

    doPublish(chatTopic, JSON.stringify(textMessage), 0);

    // 如果有图片，发送图片消息
    if (form.value.imageUrl) {
      const imageMessage = {
        type: 2,
        msgType: "medical_record",
        content: form.value.imageUrl,
        sendUserId: Number(patientId),
        receiveUserId: Number(doctorId),
        strategyId: props.order.id,
        timestamp: timestamp + 1,
        senderName: userStore.userInfo.realName || userStore.userInfo.userName,
      };

      doPublish(chatTopic, JSON.stringify(imageMessage), 0);
    }

    showSuccessToast("发送成功");
    emit("success");

    // 重置表单
    form.value = {
      description: "",
      imageUrl: "",
    };
  } catch (error) {
    console.error("发送失败:", error);
    showToast("发送失败，请重试");
  } finally {
    submitting.value = false;
  }
};
</script>

<style lang="scss" scoped>
.medical-record-mobile {
  padding: 20px 16px;

  .popup-header {
    text-align: center;
    margin-bottom: 20px;

    h3 {
      font-size: 18px;
      font-weight: 600;
      color: #333;
      margin: 0 0 8px;
    }

    p {
      font-size: 13px;
      color: #909399;
      margin: 0;
    }
  }

  .form-content {
    .description-field {
      margin-bottom: 16px;

      :deep(.van-field__control) {
        font-size: 14px;
        line-height: 1.6;
      }
    }

    .upload-section {
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
      margin-bottom: 16px;

      .upload-label {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
        color: #333;
        margin-bottom: 12px;
      }

      .upload-tips {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: #909399;
        margin-top: 8px;
      }
    }

    .doctor-tip {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 12px;
      background: #fffbe6;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 13px;
      color: #d48806;

      strong {
        color: #333;
      }
    }

    .submit-btn {
      height: 44px;
      font-size: 16px;
    }
  }
}
</style>
