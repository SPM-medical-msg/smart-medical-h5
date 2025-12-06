<template>
  <div class="user-center-mobile">
    <!-- 顶部导航栏 -->
    <van-nav-bar
      title="个人中心"
      left-text="返回"
      left-arrow
      @click-left="onClickLeft"
      fixed
      placeholder
    />

    <!-- 头像区域 -->
    <div class="avatar-section">
      <div class="avatar-wrapper">
        <van-image
          round
          width="100"
          height="100"
          fit="cover"
          :src="userInfo.imageUrl || defaultAvatar"
          class="user-avatar"
          @click="previewAvatar"
        >
          <template #error>
            <div class="avatar-error">
              <van-icon name="user-o" size="50" color="#c8c9cc" />
            </div>
          </template>
        </van-image>
        <div class="avatar-tips">
          <van-icon name="photograph" size="14" />
          <span>点击下方上传更换头像</span>
        </div>
      </div>
    </div>

    <!-- 表单区域 -->
    <div class="form-section">
      <div class="section-header">
        <h3 class="section-title">个人信息</h3>
        <p class="section-desc">完善您的个人资料</p>
      </div>

      <van-form @submit="onSubmit" ref="formRef">
        <!-- 用户名 -->
        <van-field
          v-model="userInfo.userName"
          name="userName"
          label="用户名"
          placeholder="请输入用户名"
          :rules="[{ required: true, message: '请输入用户名' }]"
          left-icon="user-o"
        />

        <!-- 姓名 -->
        <van-field
          v-model="userInfo.realName"
          name="realName"
          label="姓名"
          placeholder="请输入真实姓名"
          :rules="[{ required: true, message: '请输入真实姓名' }]"
          left-icon="contact"
        />

        <!-- 性别 -->
        <van-field name="sex" label="性别" left-icon="friends-o">
          <template #input>
            <van-radio-group v-model="userInfo.sex" direction="horizontal">
              <van-radio :name="1" icon-size="18">
                <template #icon="props">
                  <div
                    class="custom-radio-icon"
                    :class="{ active: props.checked }"
                  >
                    <van-icon name="man" />
                  </div>
                </template>
                男
              </van-radio>
              <van-radio :name="2" icon-size="18">
                <template #icon="props">
                  <div
                    class="custom-radio-icon female"
                    :class="{ active: props.checked }"
                  >
                    <van-icon name="woman" />
                  </div>
                </template>
                女
              </van-radio>
            </van-radio-group>
          </template>
        </van-field>

        <!-- 手机号 -->
        <van-field
          v-model="userInfo.phone"
          name="phone"
          label="手机号"
          placeholder="请输入手机号"
          type="tel"
          maxlength="11"
          :rules="phoneRules"
          left-icon="phone-o"
        />

        <!-- 头像上传 -->
        <van-field name="imageUrl" label="头像" left-icon="photo-o">
          <template #input>
            <SingleUpload
              v-model="userInfo.imageUrl"
              :width="70"
              :height="70"
              :round="true"
              upload-text="上传"
              @change="onAvatarChange"
            />
          </template>
        </van-field>

        <!-- 提交按钮 -->
        <div class="form-actions">
          <van-button
            type="primary"
            block
            round
            native-type="submit"
            :loading="submitLoading"
            loading-text="保存中..."
            class="submit-btn"
          >
            <van-icon name="success" />
            保存修改
          </van-button>
          <van-button
            type="warning"
            block
            round
            @click="openPasswordDialog"
            class="password-btn"
          >
            <van-icon name="lock" />
            修改密码
          </van-button>
        </div>
      </van-form>
    </div>

    <!-- 修改密码弹窗 -->
    <van-popup
      v-model:show="passwordDialogVisible"
      position="bottom"
      round
      closeable
      :style="{ height: '50%' }"
    >
      <div class="password-dialog">
        <div class="dialog-header">
          <h3>修改密码</h3>
        </div>

        <van-form @submit="onPasswordSubmit" ref="passwordFormRef">
          <van-field
            v-model="passwordForm.password"
            type="password"
            name="password"
            label="新密码"
            placeholder="请输入新密码"
            :rules="passwordRules"
            left-icon="lock"
          />
          <van-field
            v-model="passwordForm.confirmPassword"
            type="password"
            name="confirmPassword"
            label="确认密码"
            placeholder="请再次输入密码"
            :rules="confirmPasswordRules"
            left-icon="lock"
          />

          <div class="dialog-footer">
            <van-button
              type="default"
              round
              @click="passwordDialogVisible = false"
            >
              取消
            </van-button>
            <van-button
              type="primary"
              round
              native-type="submit"
              :loading="passwordLoading"
              loading-text="提交中..."
            >
              确认修改
            </van-button>
          </div>
        </van-form>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  showToast,
  showSuccessToast,
  showFailToast,
  showImagePreview,
  showLoadingToast,
} from "vant";
import { useUserStore } from "@/stores";
import { getUserInfo, updateUserInfo, updatePassword } from "@/api/user";
import SingleUpload from "@/components/upload/Upload.vue";

// 默认头像
import defaultAvatar from "@/assets/image/default2.png";

const router = useRouter();
const userStore = useUserStore();

// 表单引用
const formRef = ref(null);
const passwordFormRef = ref(null);

// 用户信息
const userInfo = ref({
  userName: "",
  realName: "",
  sex: 1,
  phone: "",
  imageUrl: "",
});

// 密码表单
const passwordForm = ref({
  password: "",
  confirmPassword: "",
});

// 状态
const submitLoading = ref(false);
const passwordLoading = ref(false);
const passwordDialogVisible = ref(false);

// 手机号验证规则
const phoneRules = [
  {
    pattern: /^1[3-9]\d{9}$/,
    message: "请输入正确的手机号",
    trigger: "onBlur",
  },
];

// 密码验证规则
const passwordRules = [
  { required: true, message: "请输入新密码" },
  {
    validator: (value) => value.length >= 5 && value.length <= 16,
    message: "密码长度在5到16个字符",
  },
];

// 确认密码验证规则
const confirmPasswordRules = [
  { required: true, message: "请确认密码" },
  {
    validator: (value) => value === passwordForm.value.password,
    message: "两次输入密码不一致",
  },
];

// 生命周期
onMounted(() => {
  getData();
});

// 获取用户信息
const getData = async () => {
  try {
    const res = await getUserInfo({ id: userStore.userInfo.id });
    if (res.data) {
      userInfo.value = { ...res.data };
      // 同步更新 store
      userStore.updateUserInfo(res.data);
    }
  } catch (error) {
    console.error("获取用户信息失败:", error);
    showFailToast("获取用户信息失败");
  }
};

// 返回上一页
const onClickLeft = () => {
  router.back();
};

// 预览头像
const previewAvatar = () => {
  if (userInfo.value.imageUrl) {
    showImagePreview({
      images: [userInfo.value.imageUrl],
      showIndex: false,
    });
  }
};

// 头像更新回调
const onAvatarChange = (url) => {
  userInfo.value.imageUrl = url;
};

// 提交表单
const onSubmit = async () => {
  submitLoading.value = true;

  try {
    await updateUserInfo(userInfo.value);
    showSuccessToast("修改成功");
    // 重新获取用户信息
    getData();
  } catch (error) {
    console.error("修改失败:", error);
    showFailToast("修改失败，请重试");
  } finally {
    submitLoading.value = false;
  }
};

// 打开密码弹窗
const openPasswordDialog = () => {
  passwordForm.value = {
    password: "",
    confirmPassword: "",
  };
  passwordDialogVisible.value = true;
};

// 提交密码修改
const onPasswordSubmit = async () => {
  passwordLoading.value = true;

  try {
    await updatePassword({
      id: userStore.userInfo.id,
      password: passwordForm.value.password,
    });

    showSuccessToast("密码修改成功");
    passwordDialogVisible.value = false;
  } catch (error) {
    console.error("密码修改失败:", error);
    showFailToast("密码修改失败");
  } finally {
    passwordLoading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.user-center-mobile {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 30px;

  // 头像区域
  .avatar-section {
    background: linear-gradient(135deg, #1989fa 0%, #4db8ff 100%);
    padding: 30px 20px;
    text-align: center;

    .avatar-wrapper {
      .user-avatar {
        border: 3px solid #fff;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      }

      .avatar-error {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f5f7fa;
      }

      .avatar-tips {
        margin-top: 12px;
        color: rgba(255, 255, 255, 0.9);
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
      }
    }
  }

  // 表单区域
  .form-section {
    margin: -20px 16px 0;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    overflow: hidden;

    .section-header {
      padding: 20px 16px 12px;
      border-bottom: 1px solid #f5f5f5;

      .section-title {
        font-size: 17px;
        font-weight: 600;
        color: #333;
        margin: 0 0 4px;
      }

      .section-desc {
        font-size: 13px;
        color: #969799;
        margin: 0;
      }
    }

    // 自定义单选框图标
    .custom-radio-icon {
      width: 20px;
      height: 20px;
      border: 1px solid #dcdee0;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 4px;
      transition: all 0.2s;

      &.active {
        border-color: #1989fa;
        background: #1989fa;
        color: #fff;
      }

      &.female.active {
        border-color: #ee0a24;
        background: #ee0a24;
      }
    }

    // 表单操作按钮
    .form-actions {
      padding: 20px 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;

      .van-button {
        height: 44px;
        font-size: 15px;

        .van-icon {
          margin-right: 4px;
        }
      }

      .submit-btn {
        background: linear-gradient(135deg, #1989fa 0%, #4db8ff 100%);
        border: none;
      }

      .password-btn {
        background: linear-gradient(135deg, #ff976a 0%, #ffb347 100%);
        border: none;
      }
    }
  }

  // 密码弹窗
  .password-dialog {
    padding: 20px 16px;

    .dialog-header {
      text-align: center;
      margin-bottom: 20px;

      h3 {
        font-size: 18px;
        font-weight: 600;
        color: #333;
        margin: 0;
      }
    }

    .dialog-footer {
      display: flex;
      gap: 12px;
      padding: 20px 0 0;

      .van-button {
        flex: 1;
        height: 44px;
      }
    }
  }

  // 覆盖 Vant 样式
  :deep(.van-field__left-icon) {
    color: #1989fa;
  }

  :deep(.van-cell) {
    padding: 14px 16px;
  }

  :deep(.van-radio-group--horizontal) {
    gap: 24px;
  }

  :deep(.van-radio__label) {
    margin-left: 4px;
    font-size: 14px;
  }
}
</style>
