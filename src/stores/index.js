// stores/modules/user.js 或 stores/user.js
import { defineStore } from "pinia";
import { ref } from "vue";
import { Login, getUserInfo } from "@/api/user";
import { showToast, showDialog, showLoadingToast, closeToast } from "vant";

export const useUserStore = defineStore(
  "user",
  () => {
    const userInfo = ref(null);
    const client = ref({});
    const isLoading = ref(false);

    /**
     * 登录获取信息，循环迭代userType
     * @param {Object} form - 登录表单 { userName, password }
     * @returns {Promise}
     */
    const webLogin = async (form) => {
      // 定义三种用户类型
      const userTypes = [
        { type: "3", name: "患者" },
        { type: "1", name: "管理员" },
        { type: "2", name: "医生" },
      ];

      // 显示loading
      const toast = showLoadingToast({
        message: "登录中...",
        forbidClick: true,
        duration: 0,
      });

      isLoading.value = true;
      let lastError = null;

      try {
        // 循环尝试每种用户类型
        for (const userType of userTypes) {
          try {
            const loginForm = {
              userName: form.userName,
              password: form.password,
              userType: userType.type,
            };

            const res = await Login(loginForm);
            console.log("登录返回结果:", res);

            // 根据API响应格式判断登录成功
            if (res?.data && res.code === 1) {
              userInfo.value = res.data;
              userInfo.value.userTypeName = userType.name;

              // 存储token
              if (res.data.token) {
                sessionStorage.setItem("Authorization", res.data.token);
                localStorage.setItem("Authorization", res.data.token);
              }

              closeToast();
              isLoading.value = false;

              // 显示成功提示
              showToast({
                type: "success",
                message: `欢迎回来，${userType.name}`,
                duration: 2000,
              });

              return {
                success: true,
                userType: userType.name,
                data: res.data,
              };
            }
          } catch (error) {
            lastError = error;
            // 记录尝试失败，但不中断循环
            continue;
          }
        }

        // 所有类型都尝试失败
        closeToast();
        isLoading.value = false;

        showToast({
          type: "fail",
          message: "登录失败，请检查用户名和密码",
          duration: 2000,
        });

        throw lastError || new Error("登录失败，请检查用户名和密码");
      } catch (error) {
        closeToast();
        isLoading.value = false;

        // 处理网络错误等异常
        if (error.message?.includes("Network Error")) {
          showToast({
            type: "fail",
            message: "网络连接失败，请检查网络",
          });
        } else if (error.message?.includes("timeout")) {
          showToast({
            type: "fail",
            message: "请求超时，请稍后重试",
          });
        }

        throw error;
      }
    };

    /**
     * 获取个人信息
     * @param {string|number} id - 用户ID
     */
    const webGetUserInfo = async (id) => {
      try {
        const res = await getUserInfo(id);
        if (res?.code === 1 && res.data) {
          userInfo.value = res.data;
          return res.data;
        } else {
          showToast({
            type: "fail",
            message: "获取用户信息失败",
          });
        }
      } catch (error) {
        console.error("获取用户信息失败:", error);
        showToast({
          type: "fail",
          message: "获取用户信息失败",
        });
        throw error;
      }
    };

    /**
     * 设置MQTT客户端
     * @param {Object} mqttClient - MQTT客户端实例
     */
    const setMqttClient = (mqttClient) => {
      client.value = mqttClient;
    };

    /**
     * 清除用户信息（退出登录）
     */
    const clearUserInfo = () => {
      // 清除用户数据
      userInfo.value = null;

      // 清除token
      sessionStorage.removeItem("Authorization");
      localStorage.removeItem("Authorization");

      // 清除MQTT客户端
      if (client.value?.end) {
        client.value.end();
      }
      client.value = {};
    };

    /**
     * 退出登录（带确认）
     */
    const logout = async () => {
      try {
        await showDialog({
          title: "退出登录",
          message: "确定要退出登录吗？",
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          showCancelButton: true,
        });

        clearUserInfo();

        showToast({
          type: "success",
          message: "已退出登录",
        });

        return true;
      } catch (error) {
        // 用户取消
        return false;
      }
    };

    /**
     * 检查是否已登录
     */
    const checkLogin = () => {
      const hasToken =
        sessionStorage.getItem("userId") || localStorage.getItem("userId");
      return !!(userInfo.value && hasToken);
    };

    /**
     * 更新用户信息（部分更新）
     */
    const updateUserInfo = (data) => {
      if (userInfo.value) {
        userInfo.value = {
          ...userInfo.value,
          ...data,
        };
      }
    };

    return {
      // 状态
      userInfo,
      client,
      isLoading,

      // 方法
      webLogin,
      webGetUserInfo,
      setMqttClient,
      clearUserInfo,
      logout,
      checkLogin,
      updateUserInfo,
    };
  },
  {
    persist: {
      key: "user-store",
      storage: localStorage, // 移动端使用localStorage持久化
      paths: ["userInfo"], // 只持久化userInfo
    },
  }
);
