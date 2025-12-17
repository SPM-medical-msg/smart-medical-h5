<template>
  <div class="mobile-login-container">
    <!-- 顶部Logo区域 -->
    <div class="login-header">
      <van-image round width="60" height="60" :src="squareUrl" fit="cover" />
      <h1 class="app-name">医讯通</h1>
      <p class="app-slogan">专业医疗服务平台</p>
    </div>

    <!-- 登录表单区域 -->
    <div class="login-content">
      <!-- Tab切换 -->
      <van-tabs
        v-model:active="loginTypeIndex"
        animated
        swipeable
        color="#4682dc"
        title-active-color="#4682dc"
        @change="onTabChange"
      >
        <van-tab title="账号登录" name="account">
          <!-- 账号密码登录表单 -->
          <van-form ref="accountFormRef" @submit="handleAccountLogin">
            <van-cell-group inset>
              <van-field
                v-model="form.userName"
                name="userName"
                label="账号"
                placeholder="请输入账号"
                :rules="[{ required: true, message: '请输入账号' }]"
              />
              <van-field
                v-model="form.password"
                type="password"
                name="password"
                label="密码"
                placeholder="请输入密码"
                :rules="[
                  { required: true, message: '请输入密码' },
                  { min: 5, max: 16, message: '密码长度5-16位' },
                ]"
              />
            </van-cell-group>

            <div class="submit-btn">
              <van-button
                round
                block
                type="primary"
                native-type="submit"
                :loading="loading"
                loading-text="登录中..."
              >
                登录
              </van-button>
            </div>
          </van-form>
        </van-tab>

        <van-tab title="手机登录" name="phone">
          <!-- 手机验证码登录表单 -->
          <van-form ref="phoneFormRef" @submit="handlePhoneLogin">
            <van-cell-group inset>
              <van-field
                v-model="phoneForm.phone"
                name="phone"
                placeholder="请输入手机号"
                type="tel"
                maxlength="11"
                :rules="[
                  { required: true, message: '请输入手机号' },
                  { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
                ]"
                @update:model-value="handlePhoneInput"
              />
              <van-field
                v-model="phoneForm.code"
                name="code"
                placeholder="请输入验证码"
                maxlength="6"
                :rules="[
                  { required: true, message: '请输入验证码' },
                  { pattern: /^\d{6}$/, message: '验证码为6位数字' },
                ]"
              >
                <template #button>
                  <van-button
                    size="small"
                    type="primary"
                    :disabled="!canSendCode"
                    :loading="sendingCode"
                    @click="handleSendCode"
                  >
                    {{ codeBtnText }}
                  </van-button>
                </template>
              </van-field>

              <!-- 首次登录设置密码 -->
              <van-field
                v-if="isFirstLogin"
                v-model="phoneForm.password"
                type="password"
                name="password"
                label="设置密码"
                placeholder="请设置5-16位密码"
                left-icon="lock"
                :rules="[
                  { required: true, message: '请设置密码' },
                  { min: 5, max: 16, message: '密码长度5-16位' },
                ]"
              />
            </van-cell-group>

            <div class="submit-btn">
              <van-button
                round
                block
                type="primary"
                native-type="submit"
                :loading="loading"
                loading-text="登录中..."
              >
                {{ isFirstLogin ? "注册并登录" : "登录" }}
              </van-button>
            </div>
          </van-form>
        </van-tab>
      </van-tabs>

      <!-- 底部链接 -->
      <div class="login-footer">
        <span>还没有账号？</span>
        <van-button type="primary" size="small" plain @click="toRegister">
          立即注册
        </van-button>
      </div>
    </div>

    <!-- 滑动验证弹窗 -->
    <Vcode
      :show="showVerify"
      @success="onVerifySuccess"
      @close="onVerifyClose"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { showToast, showSuccessToast, showFailToast } from "vant";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores";
import { getUserByPhone, saveUserInfo } from "@/api/user";
import Vcode from "vue3-puzzle-vcode";
import squareUrl from "@/assets/image/icon.png";

const router = useRouter();
const userStore = useUserStore();

// 登录类型
const loginTypeIndex = ref(0);
const loginType = computed(() =>
  loginTypeIndex.value === 0 ? "account" : "phone"
);

// 表单引用
const accountFormRef = ref(null);
const phoneFormRef = ref(null);

// 账号登录表单
const form = ref({
  userName: "",
  password: "",
  userType: 3,
});

// 手机登录表单
const phoneForm = ref({
  phone: "",
  code: "",
  password: "",
  userType: 3,
});

// 状态管理
const loading = ref(false);
const sendingCode = ref(false); // 新增：发送验证码loading状态
const rememberMe = ref(false);
const isFirstLogin = ref(false);
const smsCode = ref("");
const countdown = ref(0);
const showVerify = ref(false);
let countdownTimer = null;
let phoneUser = ref({});

// 验证类型
const VerifyType = {
  LOGIN: "login",
  SEND_CODE: "sendCode",
};
const currentVerifyType = ref(VerifyType.LOGIN);

// 验证码按钮文本
const codeBtnText = computed(() => {
  if (countdown.value > 0) {
    return `${countdown.value}s`;
  }
  return "获取验证码";
});

// 是否可以发送验证码
const canSendCode = computed(() => {
  return (
    countdown.value === 0 &&
    /^1[3-9]\d{9}$/.test(phoneForm.value.phone) &&
    !sendingCode.value
  );
});

// Tab切换
const onTabChange = (index) => {
  loginTypeIndex.value = index;
};

// 账号密码登录
const handleAccountLogin = async () => {
  try {
    await accountFormRef.value.validate();
    currentVerifyType.value = VerifyType.LOGIN;
    showVerify.value = true;
  } catch (error) {
    console.error("表单验证失败:", error);
  }
};

// 手机验证码登录
const handlePhoneLogin = async () => {
  try {
    await phoneFormRef.value.validate();
    loading.value = true;

    // 验证验证码
    if (smsCode.value !== phoneForm.value.code) {
      showFailToast("验证码错误");
      return;
    }

    if (isFirstLogin.value) {
      await registerWithPhone();
    } else {
      await loginWithPhone();
    }
  } catch (error) {
    console.error("登录失败:", error);
    showFailToast(error.message || "登录失败");
  } finally {
    loading.value = false;
  }
};

// 处理手机号输入
const handlePhoneInput = (value) => {
  if (/^1[3-9]\d{9}$/.test(value)) {
    checkPhoneRegistered();
  }
};

// 点击发送验证码按钮
const handleSendCode = () => {
  if (!phoneForm.value.phone) {
    showToast("请输入手机号");
    return;
  }

  if (!/^1[3-9]\d{9}$/.test(phoneForm.value.phone)) {
    showToast("请输入正确的手机号");
    return;
  }

  currentVerifyType.value = VerifyType.SEND_CODE;
  showVerify.value = true;
};

// ============== 核心修改：发送短信验证码 ==============
const sendSmsCode = async () => {
  try {
    sendingCode.value = true;

    // 生成6位随机验证码
    smsCode.value = Math.floor(100000 + Math.random() * 900000).toString();

    const requestBody = {
      name: "推送助手",
      code: smsCode.value,
      targets: phoneForm.value.phone,
    };

    console.log("发送验证码:", smsCode.value, "到手机:", phoneForm.value.phone);

    // 发送请求到推送服务
    const response = await fetch("https://push.spug.cc/send/RNpZOmYvxVj59kPq", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log("发送验证码请求:", requestBody);

    const responseText = await response.text();
    let result;

    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error("响应解析失败:", responseText);
      throw new Error("服务器响应格式错误");
    }

    if (!response.ok) {
      throw new Error(`请求失败: ${response.status}`);
    }

    if (result.code === 200) {
      showSuccessToast("验证码已发送，请查收短信");

      // 开发环境打印验证码方便调试
      if (process.env.NODE_ENV === "development") {
        console.log(`【开发环境】验证码: ${smsCode.value}`);
      }

      // 开始倒计时
      startCountdown();

      // 检查手机号是否已注册
      await checkPhoneRegistered();

      return true;
    } else {
      throw new Error(result.msg || "发送失败");
    }
  } catch (error) {
    console.error("发送验证码失败:", error);
    showFailToast(error.message || "验证码发送失败，请稍后重试");
    return false;
  } finally {
    sendingCode.value = false;
  }
};

// 倒计时
const startCountdown = () => {
  countdown.value = 60;
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
  countdownTimer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  }, 1000);
};

// 检查手机号是否注册
const checkPhoneRegistered = async () => {
  try {
    const res = await getUserByPhone({ phone: phoneForm.value.phone });
    phoneUser.value = res.data;

    if (phoneUser.value && phoneUser.value.id) {
      isFirstLogin.value = false;
      console.log("手机号已注册");
    } else {
      isFirstLogin.value = true;
      console.log("手机号未注册，需要设置密码");
      showToast("手机号未注册，请设置密码");
    }
  } catch (error) {
    console.error("检查手机号失败:", error);
    isFirstLogin.value = true;
  }
};

// 手机号注册
const registerWithPhone = async () => {
  try {
    const registerData = {
      userName: phoneForm.value.phone,
      password: phoneForm.value.password,
      phone: phoneForm.value.phone,
      realName: `手机用户${phoneForm.value.phone.slice(-4)}`,
      userType: 3,
    };

    const res = await saveUserInfo(registerData);
    if (res.code === 1) {
      showSuccessToast("注册成功");
      await doLogin({
        userName: registerData.userName,
        password: registerData.password,
        userType: registerData.userType,
      });
    } else {
      throw new Error(res.message || "注册失败");
    }
  } catch (error) {
    throw error;
  }
};

// 手机号登录
const loginWithPhone = async () => {
  try {
    await doLogin({
      userName: phoneUser.value.user_name,
      password: phoneUser.value.password,
      userType: phoneUser.value.userType || 3,
    });
  } catch (error) {
    throw error;
  }
};

// 滑动验证成功
const onVerifySuccess = async () => {
  onVerifyClose();

  if (currentVerifyType.value === VerifyType.SEND_CODE) {
    await sendSmsCode();
  } else if (currentVerifyType.value === VerifyType.LOGIN) {
    await doLogin(form.value);
  }
};

// 关闭验证
const onVerifyClose = () => {
  showVerify.value = false;
};

// 执行登录
const doLogin = async (loginForm) => {
  try {
    loading.value = true;
    const result = await userStore.webLogin(loginForm);

    if (result.success) {
      sessionStorage.setItem("userType", userStore.userInfo.userType);
      sessionStorage.setItem("userId", userStore.userInfo.id);

      if (rememberMe.value) {
        setCookie(loginForm.userName, loginForm.password, 7);
      }

      showSuccessToast("登录成功");

      setTimeout(() => {
        router.push("/home");
      }, 500);
    }
  } catch (error) {
    throw error;
  } finally {
    loading.value = false;
  }
};

// 跳转注册
const toRegister = () => {
  router.push("/register");
};

// Cookie操作
const setCookie = (userName, password, days) => {
  let date = new Date();
  date.setTime(date.getTime() + 24 * 60 * 60 * 1000 * days);
  document.cookie = `userName=${userName};path=/;expires=${date.toGMTString()}`;
  document.cookie = `password=${password};path=/;expires=${date.toGMTString()}`;
};

const getCookie = () => {
  if (document.cookie.length > 0) {
    let arr = document.cookie.split("; ");
    for (let i = 0; i < arr.length; i++) {
      let arr2 = arr[i].split("=");
      if (arr2[0] === "userName") {
        form.value.userName = arr2[1];
        rememberMe.value = true;
      } else if (arr2[0] === "password") {
        form.value.password = arr2[1];
      }
    }
  }
};

onMounted(() => {
  getCookie();
});

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
});
</script>

<style scoped lang="scss">
.mobile-login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.login-header {
  text-align: center;
  padding: 40px 0 30px;
  color: #fff;

  .app-name {
    font-size: 28px;
    font-weight: bold;
    margin: 12px 0 8px;
  }

  .app-slogan {
    font-size: 14px;
    opacity: 0.9;
  }
}

.login-content {
  flex: 1;
  background: #fff;
  border-radius: 20px 20px 0 0;
  padding: 20px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);

  :deep(.van-tabs__wrap) {
    margin-bottom: 20px;
  }

  :deep(.van-cell-group) {
    margin-bottom: 20px;
  }

  .form-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 16px;
    margin-bottom: 20px;
  }

  .submit-btn {
    padding: 0 16px;

    :deep(.van-button) {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      font-size: 16px;
      height: 44px;
    }
  }
}

.login-footer {
  text-align: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ebedf0;
  color: #969799;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.verify-wrapper {
  padding: 20px;
  text-align: center;

  h3 {
    margin: 0 0 10px;
    color: #323233;
  }

  p {
    color: #969799;
    margin-bottom: 20px;
  }
}
</style>
