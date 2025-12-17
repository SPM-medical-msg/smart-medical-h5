import axios from "axios";
import { showToast, showDialog, showLoadingToast, closeToast } from "vant";
import router from "@/router";

// 根据环境变量设置baseURL
// const baseURL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:9001";
// 动态获取baseURL
const getBaseURL = () => {
  if (import.meta.env.DEV) {
    // 开发环境
    return `http://${window.location.hostname}:9001`;
  }
  // 生产环境 - 使用相对路径
  return "";
};
const service = axios.create({
  baseURL: getBaseURL(),
  timeout: 50000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求计数器（用于控制loading） Vant的showToast和showDialog
let loadingCount = 0;
let loadingToast = null;

// 显示loading
const showLoading = () => {
  if (loadingCount === 0) {
    loadingToast = showLoadingToast({
      message: "加载中...",
      forbidClick: true,
      duration: 0, // 持续展示
    });
  }
  loadingCount++;
};

// 隐藏loading
const hideLoading = () => {
  loadingCount--;
  if (loadingCount <= 0) {
    loadingCount = 0;
    if (loadingToast) {
      loadingToast.close();
      loadingToast = null;
    }
  }
};

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 显示loading（可选，根据需要配置）
    if (config.showLoading !== false) {
      showLoading();
    }

    // 添加token
    const token =
      sessionStorage.getItem("Authorization") ||
      localStorage.getItem("Authorization");
    if (token) {
      config.headers.Authorization = token;
    }

    return config;
  },
  (error) => {
    hideLoading();
    console.error("请求错误：", error);
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    hideLoading();

    // 处理blob类型响应（文件下载等）
    if (response.request.responseType === "blob") {
      return response.data;
    }

    const res = response.data;

    // 根据业务状态码处理
    switch (res.code) {
      case 1:
        // 成功
        return res;

      case 401:
        // 权限不足/未登录
        showDialog({
          title: "提示",
          message: res.msg || "登录已过期，请重新登录",
          confirmButtonText: "去登录",
        }).then(() => {
          // 清除token
          sessionStorage.removeItem("Authorization");
          localStorage.removeItem("Authorization");
          // 跳转登录页
          router.push("/login");
        });
        return Promise.reject(new Error(res.msg || "未授权"));

      case 402:
        // 特殊业务码
        return res;

      case -1:
        // 业务错误
        if (response.config.url === "/common/user/login") {
          // 登录接口特殊处理
          console.log("登录轮询触发", response.config.url);
          return res;
        }

        // 显示错误提示
        showToast({
          message: res.msg || "操作失败",
          type: "fail",
          duration: 2000,
        });
        return Promise.reject(new Error(res.msg || "业务错误"));

      default:
        // 其他情况
        return res;
    }
  },
  (error) => {
    hideLoading();

    // 网络错误处理
    if (error.message.includes("timeout")) {
      showToast({
        message: "请求超时，请稍后重试",
        type: "fail",
      });
    } else if (error.message.includes("Network Error")) {
      showToast({
        message: "网络错误，请检查网络连接",
        type: "fail",
      });
    } else {
      const status = error.response?.status;
      switch (status) {
        case 404:
          showToast({ message: "请求资源不存在", type: "fail" });
          break;
        case 500:
          showToast({ message: "服务器错误", type: "fail" });
          break;
        case 503:
          showToast({ message: "服务不可用", type: "fail" });
          break;
        default:
          showToast({
            message: error.response?.data?.msg || "请求失败",
            type: "fail",
          });
      }
    }

    console.error("响应错误：", error);
    return Promise.reject(error);
  }
);

// 导出请求方法
export default service;

// 便捷方法导出
export const request = {
  get(url, params, config = {}) {
    return service.get(url, { params, ...config });
  },
  post(url, data, config = {}) {
    return service.post(url, data, config);
  },
  put(url, data, config = {}) {
    return service.put(url, data, config);
  },
  delete(url, params, config = {}) {
    return service.delete(url, { params, ...config });
  },
};
