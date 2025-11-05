<template>
  <div class="mobile-register-container">
    <!-- 顶部导航 -->
    <van-nav-bar
      title="账户注册"
      left-text="返回"
      left-arrow
      @click-left="onClickLeft"
    />

    <!-- 注册表单 -->
    <van-form ref="registerFormRef" @submit="handleRegister">
      <!-- 头像上传 -->
      <div class="avatar-section">
        <div class="avatar-label">上传头像</div>
        <single-upload
          v-model="form.imageUrl"
          :width="100"
          :height="100"
        ></single-upload>
      </div>

      <van-cell-group inset>
        <!-- 账号 -->
        <van-field
          v-model="form.userName"
          name="userName"
          label="账号"
          placeholder="请输入账号"
          left-icon="user-o"
          :rules="[{ required: true, message: '请输入账号' }]"
        />

        <!-- 密码 -->
        <van-field
          v-model="form.password"
          type="password"
          name="password"
          label="密码"
          placeholder="请设置5-16位密码"
          left-icon="lock"
          :rules="[
            { required: true, message: '请输入密码' },
            { min: 5, max: 16, message: '密码长度5-16位' },
          ]"
        />

        <!-- 确认密码 -->
        <van-field
          v-model="form.confirmPassword"
          type="password"
          name="confirmPassword"
          label="确认密码"
          placeholder="请再次输入密码"
          left-icon="lock"
          :rules="[
            { required: true, message: '请确认密码' },
            { validator: validateConfirmPassword, message: '两次密码不一致' },
          ]"
        />

        <!-- 姓名 -->
        <van-field
          v-model="form.realName"
          name="realName"
          label="姓名"
          placeholder="请输入真实姓名"
          left-icon="contact"
          :rules="[{ required: true, message: '请输入姓名' }]"
        />

        <!-- 手机号 -->
        <van-field
          v-model="form.phone"
          type="tel"
          name="phone"
          label="手机号"
          placeholder="请输入手机号"
          maxlength="11"
          left-icon="phone-o"
          :rules="[
            { required: true, message: '请输入手机号' },
            { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
          ]"
        />

        <!-- 性别 -->
        <van-field name="sex" label="性别">
          <template #input>
            <van-radio-group v-model="form.sex" direction="horizontal">
              <van-radio name="1" icon-size="18px">男</van-radio>
              <van-radio name="2" icon-size="18px">女</van-radio>
            </van-radio-group>
          </template>
        </van-field>
      </van-cell-group>

      <!-- 提交按钮 -->
      <div class="submit-section">
        <van-button
          round
          block
          type="primary"
          native-type="submit"
          :loading="loading"
          loading-text="注册中..."
        >
          立即注册
        </van-button>

        <div class="login-link">
          <span>已有账号？</span>
          <van-button type="primary" size="small" plain @click="toLogin">
            去登录
          </van-button>
        </div>
      </div>
    </van-form>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { showToast, showLoadingToast, closeToast } from "vant";
import { useRouter } from "vue-router";
import { saveUserInfo } from "@/api/user";
import SingleUpload from "@/components/upload/Upload.vue";
const router = useRouter();

// 表单数据
const form = ref({
  userName: "",
  password: "",
  confirmPassword: "",
  realName: "",
  phone: "",
  sex: "1",
  imageUrl: "",
  userType: 3,
});

// 文件列表
const fileList = ref([]);
const loading = ref(false);
const registerFormRef = ref(null);

// 返回上一页
const onClickLeft = () => {
  router.back();
};

// 验证确认密码
const validateConfirmPassword = (val) => {
  return val === form.value.password;
};

// 图片上传后处理
const afterRead = (file) => {
  // 这里需要上传到服务器，获取图片URL
  // 临时使用base64
  const reader = new FileReader();
  reader.onload = (e) => {
    form.value.imageUrl = e.target.result;
  };
  reader.readAsDataURL(file.file);

  // 实际项目中应该上传到服务器
  // uploadImage(file.file).then(url => {
  //   form.value.imageUrl = url;
  // });
};

// 删除图片前
const beforeDelete = () => {
  form.value.imageUrl = "";
  return true;
};

// 提交注册
const handleRegister = async () => {
  try {
    await registerFormRef.value.validate();

    loading.value = true;
    const toast = showLoadingToast({
      message: "注册中...",
      forbidClick: true,
      duration: 0,
    });

    const res = await saveUserInfo(form.value);

    if (res.code === 1) {
      closeToast();

      // 保存到Cookie
      setCookie(form.value.userName, form.value.password, 7);

      showToast({
        type: "success",
        message: "注册成功，即将跳转登录",
      });

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } else {
      showToast({
        type: "fail",
        message: res.msg || "注册失败",
      });
    }
  } catch (error) {
    console.error("注册失败:", error);
    showToast({
      type: "fail",
      message: "注册失败，请重试",
    });
  } finally {
    loading.value = false;
  }
};

// 跳转登录
const toLogin = () => {
  router.push("/login");
};

// Cookie操作
const setCookie = (userName, password, days) => {
  let date = new Date();
  date.setTime(date.getTime() + 24 * 60 * 60 * 1000 * days);
  document.cookie = `userName=${userName};path=/;expires=${date.toGMTString()}`;
  document.cookie = `password=${password};path=/;expires=${date.toGMTString()}`;
};
</script>

<style scoped lang="scss">
.mobile-register-container {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 20px;
}

// 头像上传区域
.avatar-section {
  padding: 20px;
  background: #fff;
  margin-bottom: 12px;

  .avatar-label {
    font-size: 14px;
    color: #646566;
    margin-bottom: 12px;
  }

  .avatar-upload {
    width: 80px;
    height: 80px;

    .upload-placeholder {
      width: 80px;
      height: 80px;
      border: 1px dashed #dcdee0;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #f7f8fa;

      span {
        font-size: 12px;
        color: #969799;
        margin-top: 4px;
      }
    }
  }
}

// 提交区域
.submit-section {
  padding: 20px 16px;

  :deep(.van-button--primary) {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    font-size: 16px;
    height: 44px;
  }

  .login-link {
    text-align: center;
    margin-top: 20px;
    color: #969799;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }
}

// 单选框样式
:deep(.van-radio-group) {
  display: flex;
  gap: 20px;
}

// 表单样式优化
:deep(.van-cell-group) {
  .van-field__label {
    width: 70px;
  }
}
</style>
