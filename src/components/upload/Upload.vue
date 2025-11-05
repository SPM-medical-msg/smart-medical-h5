<template>
  <div class="mobile-upload-container">
    <!-- 标签（可选） -->
    <div v-if="label" class="upload-label">{{ label }}</div>

    <!-- Vant上传组件 -->
    <van-uploader
      v-model="fileList"
      :max-count="1"
      :after-read="afterRead"
      :before-delete="beforeDelete"
      :deletable="showDelete"
    >
      <div class="upload-wrapper" :style="wrapperStyle">
        <!-- 已上传显示图片 -->
        <van-image
          v-if="imageUrl"
          :width="imageSize"
          :height="imageSize"
          :round="round"
          fit="cover"
          :src="imageUrl"
          @click="handlePreview"
        />

        <!-- 未上传显示占位 -->
        <div v-else class="upload-placeholder" :style="placeholderStyle">
          <van-icon :name="uploadIcon" :size="iconSize" color="#dcdee0" />
          <span class="upload-text">{{ uploadText }}</span>
        </div>
      </div>
    </van-uploader>

    <!-- 文件名显示（可选） -->
    <div
      v-if="showFileName && fileName"
      class="file-name"
      :style="fileNameStyle"
    >
      {{ displayFileName }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import {
  showImagePreview,
  showConfirmDialog,
  showLoadingToast,
  showSuccessToast,
  showFailToast,
  closeToast,
} from "vant";
import { getUUID, policy } from "@/api/policy";
import axios from "axios";

const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  // 尺寸配置
  width: {
    type: [Number, String],
    default: 80,
  },
  height: {
    type: [Number, String],
    default: 80,
  },
  // 是否圆形
  round: {
    type: Boolean,
    default: false,
  },
  // 标签文字
  label: {
    type: String,
    default: "",
  },
  // 上传按钮文字
  uploadText: {
    type: String,
    default: "点击上传",
  },
  // 上传图标
  uploadIcon: {
    type: String,
    default: "photograph",
  },
  // 是否显示删除按钮
  showDelete: {
    type: Boolean,
    default: true,
  },
  // 是否显示文件名
  showFileName: {
    type: Boolean,
    default: false,
  },
  // 文件名最大长度
  maxNameLength: {
    type: Number,
    default: 15,
  },
});

const emit = defineEmits(["update:modelValue", "change"]);

// 响应式数据
const fileList = ref([]);
const imageUrl = ref("");
const fileName = ref("");

// 计算属性
const imageSize = computed(() => {
  return typeof props.width === "number" ? props.width : parseInt(props.width);
});

const iconSize = computed(() => {
  return Math.floor(imageSize.value * 0.375); // 图标大小为容器的37.5%
});

const wrapperStyle = computed(() => ({
  width: typeof props.width === "number" ? `${props.width}px` : props.width,
  height: typeof props.height === "number" ? `${props.height}px` : props.height,
}));

const placeholderStyle = computed(() => ({
  width: typeof props.width === "number" ? `${props.width}px` : props.width,
  height: typeof props.height === "number" ? `${props.height}px` : props.height,
  borderRadius: props.round ? "50%" : "8px",
}));

const fileNameStyle = computed(() => ({
  width: typeof props.width === "number" ? `${props.width}px` : props.width,
}));

// 计算显示的文件名
const displayFileName = computed(() => {
  if (!fileName.value) return "";

  const name = fileName.value;
  const maxLength = props.maxNameLength;

  if (name.length <= maxLength) {
    return name;
  }

  const lastDotIndex = name.lastIndexOf(".");
  const extension = lastDotIndex !== -1 ? name.substring(lastDotIndex) : "";
  const nameWithoutExt =
    lastDotIndex !== -1 ? name.substring(0, lastDotIndex) : name;
  const availableLength = maxLength - extension.length - 3;

  if (availableLength > 0) {
    return nameWithoutExt.substring(0, availableLength) + "..." + extension;
  } else {
    return name.substring(0, maxLength - 3) + "...";
  }
});

// 监听父组件传入的值
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      imageUrl.value = newValue;
      // 从URL中提取文件名
      const urlParts = newValue.split("/");
      const fullName = urlParts[urlParts.length - 1];
      const underscoreIndex = fullName.indexOf("_");
      fileName.value =
        underscoreIndex !== -1
          ? fullName.substring(underscoreIndex + 1)
          : fullName;

      // 同步到fileList
      fileList.value = [
        {
          url: newValue,
          name: fileName.value,
        },
      ];
    } else {
      imageUrl.value = "";
      fileName.value = "";
      fileList.value = [];
    }
  },
  { immediate: true }
);

// 文件读取后的处理
const afterRead = async (file) => {
  console.log("开始上传文件:", file);

  // 显示加载提示
  const loadingToast = showLoadingToast({
    message: "上传中...",
    forbidClick: true,
    duration: 0,
  });

  try {
    // 获取上传策略
    console.log("正在获取上传策略...");
    const res = await policy();
    console.log("获取上传策略成功:", res);

    const uploadInfo = {
      policy: res.policy,
      signature: res.signature,
      ossaccessKeyId: res.accessid,
      key: res.dir + "/" + getUUID() + "_${filename}",
      dir: res.dir,
      host: res.host,
    };

    // 构建表单数据
    const formData = new FormData();
    formData.append("policy", uploadInfo.policy);
    formData.append("signature", uploadInfo.signature);
    formData.append("key", uploadInfo.key);
    formData.append("ossaccessKeyId", uploadInfo.ossaccessKeyId);
    formData.append("dir", uploadInfo.dir);
    formData.append("host", uploadInfo.host);
    formData.append("file", file.file);

    console.log("准备上传到阿里云，参数:", uploadInfo);

    // 上传到阿里云
    await axios.post(
      "http://gulimall-psw.oss-cn-hangzhou.aliyuncs.com",
      formData
    );

    // 构建图片URL
    const uploadedUrl =
      uploadInfo.host +
      "/" +
      uploadInfo.key.replace("${filename}", file.file.name);

    console.log("上传成功，图片URL:", uploadedUrl);

    // 更新数据
    imageUrl.value = uploadedUrl;
    fileName.value = file.file.name;

    // 更新fileList以显示图片
    fileList.value = [
      {
        url: uploadedUrl,
        name: file.file.name,
      },
    ];

    // 通知父组件
    emit("update:modelValue", uploadedUrl);
    emit("change", uploadedUrl);

    // 关闭加载提示并显示成功
    loadingToast.close();
    showSuccessToast("上传成功");
  } catch (error) {
    console.error("上传失败，错误详情:", error);

    // 关闭加载提示
    if (loadingToast) {
      loadingToast.close();
    }

    // 显示错误提示
    showFailToast("上传失败，请重试");

    // 清空fileList
    fileList.value = [];
  }
};

// 删除前的确认
const beforeDelete = () => {
  return new Promise((resolve) => {
    showConfirmDialog({
      title: "提示",
      message: "确定要删除该图片吗？",
    })
      .then(() => {
        // 清空数据
        imageUrl.value = "";
        fileName.value = "";
        fileList.value = [];
        emit("update:modelValue", "");
        emit("change", "");
        showSuccessToast("删除成功");
        resolve(true);
      })
      .catch(() => {
        resolve(false);
      });
  });
};

// 预览图片
const handlePreview = () => {
  if (imageUrl.value) {
    showImagePreview({
      images: [imageUrl.value],
      showIndex: false,
    });
  }
};
</script>

<style lang="scss" scoped>
.mobile-upload-container {
  display: inline-block;

  .upload-label {
    font-size: 14px;
    color: #646566;
    margin-bottom: 12px;
  }

  .upload-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;

    .upload-placeholder {
      border: 1px dashed #dcdee0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #f7f8fa;

      .upload-text {
        font-size: 12px;
        color: #969799;
        margin-top: 4px;
      }
    }
  }

  .file-name {
    margin-top: 8px;
    font-size: 12px;
    color: #666;
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  // 覆盖vant默认样式
  :deep(.van-uploader__upload) {
    margin: 0;
  }

  :deep(.van-uploader__preview) {
    margin: 0;
  }
}
</style>
