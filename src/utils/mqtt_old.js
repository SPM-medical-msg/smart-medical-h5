// mqtt.js - 移动端适配版本（修复版）
import * as mqtt from "mqtt/dist/mqtt.min";
import { ref, reactive } from "vue";
import emitter from "@/utils/eventBus";
import { showToast, showNotify } from "vant";

// 连接状态管理
const connectionState = ref({
  connected: false,
  reconnecting: false,
  lastConnectTime: null,
  retryCount: 0,
  manualDisconnect: false,
});

// 重连配置
const retryTimes = ref(0);
const MAX_RETRY_TIMES = 10;
const BASE_RECONNECT_DELAY = 2000;
const MAX_RECONNECT_DELAY = 30000;

// 重连定时器
let reconnectTimer = null;

const connection = reactive({
  protocol: "ws",
  host: "10.81.1.87",
  port: 8083,
  clientId: "emqx_vue3_mobile_" + Math.random().toString(16).substring(2, 8),
  username: "server",
  password: "password",
  clean: true,
  connectTimeout: 30 * 1000,
  reconnectPeriod: 0,
  keepalive: 60,
});

// 🔥 修复：初始值设为 null，而不是普通对象
let client = ref(null);

// 🔥 新增：检查客户端是否有效
const isClientValid = () => {
  return (
    client.value &&
    typeof client.value.subscribe === "function" &&
    typeof client.value.unsubscribe === "function" &&
    typeof client.value.publish === "function"
  );
};

// 🔥 新增：检查客户端是否已连接
const isClientConnected = () => {
  return isClientValid() && client.value.connected;
};

// 计算指数退避延迟
const getReconnectDelay = (retryCount) => {
  const delay = Math.min(
    BASE_RECONNECT_DELAY * Math.pow(2, retryCount),
    MAX_RECONNECT_DELAY
  );
  return delay;
};

// 创建连接
const createConnection = async () => {
  try {
    // 如果已经有连接，先清理
    if (isClientConnected()) {
      console.log("已存在活跃连接，跳过创建");
      return;
    }

    const { protocol, host, port, ...options } = connection;
    const connectUrl = `${protocol}://${host}:${port}/mqtt`;

    console.log("正在创建MQTT连接...", connectUrl);

    // 重新生成 clientId 避免重复
    options.clientId =
      "emqx_vue3_mobile_" + Math.random().toString(16).substring(2, 8);

    client.value = mqtt.connect(connectUrl, options);

    if (client.value && client.value.on) {
      // 连接成功
      client.value.on("connect", handleConnect);

      // 重连事件
      client.value.on("reconnect", handleOnReConnect);

      // 连接错误
      client.value.on("error", handleError);

      // 连接断开
      client.value.on("close", handleClose);

      // 离线
      client.value.on("offline", handleOffline);

      // 接收消息
      client.value.on("message", handleMessage);
    }
  } catch (error) {
    console.error("MQTT连接创建失败:", error);
    scheduleReconnect();
  }
};

// 处理连接成功
const handleConnect = () => {
  console.log("✅ MQTT连接成功");
  connectionState.value.connected = true;
  connectionState.value.reconnecting = false;
  connectionState.value.lastConnectTime = new Date();

  // 重置重连计数
  retryTimes.value = 0;

  // 清除重连定时器
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  // 通知应用连接成功
  emitter.emit("mqtt:connected");

  showToast({
    type: "success",
    message: "消息服务已连接",
    duration: 2000,
  });
};

// 处理错误
const handleError = (error) => {
  console.error("❌ MQTT连接错误:", error);
  connectionState.value.connected = false;

  if (error && error.code === "ECONNREFUSED") {
    showNotify({
      type: "danger",
      message: "无法连接到服务器，请检查网络",
      duration: 3000,
    });
  }
};

// 处理连接关闭
const handleClose = () => {
  console.log("🔌 MQTT连接已关闭");
  connectionState.value.connected = false;

  if (!connectionState.value.manualDisconnect) {
    scheduleReconnect();
  }
};

// 处理离线
const handleOffline = () => {
  console.log("📴 MQTT离线");
  connectionState.value.connected = false;
  emitter.emit("mqtt:offline");
};

// 处理消息
const handleMessage = (topic, message) => {
  try {
    let parse = JSON.parse(`${message}`);
    const info = {
      receiveMessage: parse,
      topic,
    };
    emitter.emit("message", info);
    console.log(`📨 收到消息: ${message} from ${topic}`);

    // 特殊消息通知
    if (
      topic.startsWith("PASS/APPLY") ||
      topic.startsWith("ADD/APPLY") ||
      topic.startsWith("OUT") ||
      topic.startsWith("ADD") ||
      topic.startsWith("ENTER") ||
      topic.startsWith("CHAT/END") ||
      topic.startsWith("CHAT/READY")
    ) {
      showNotification(parse.msg || parse.content);
    }
  } catch (error) {
    console.error("消息解析失败:", error);
  }
};

// 智能重连
const handleOnReConnect = () => {
  console.log("🔄 触发重连...");
  scheduleReconnect();
};

// 计划重连
const scheduleReconnect = () => {
  if (connectionState.value.reconnecting) {
    return;
  }

  if (retryTimes.value >= MAX_RETRY_TIMES) {
    console.error("❌ 达到最大重连次数，停止重连");
    showNotify({
      type: "danger",
      message: "无法连接到服务器，请刷新页面重试",
      duration: 0,
    });
    return;
  }

  connectionState.value.reconnecting = true;
  retryTimes.value += 1;

  const delay = getReconnectDelay(retryTimes.value - 1);
  console.log(`⏳ 第${retryTimes.value}次重连，${delay / 1000}秒后尝试...`);

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
  }

  reconnectTimer = setTimeout(() => {
    console.log("开始重连...");

    // 断开旧连接
    if (isClientValid()) {
      try {
        client.value.end(true);
      } catch (e) {
        console.error("断开旧连接失败:", e);
      }
    }

    // 重置客户端
    client.value = null;

    // 创建新连接
    createConnection();
  }, delay);
};

// 🔥 修复：订阅主题
const doSubscribe = (topic, qos = 0) => {
  if (!isClientConnected()) {
    console.warn(" MQTT未连接，无法订阅:", topic);
    return false;
  }

  try {
    client.value.subscribe(topic, { qos }, (error, granted) => {
      if (error) {
        console.error("订阅失败:", topic, error);
        return;
      }
      console.log("订阅成功:", granted);
    });
    return true;
  } catch (error) {
    console.error("订阅异常:", error);
    return false;
  }
};

// 🔥 修复：取消订阅
const doUnSubscribe = (topic, qos = 0) => {
  // 更严格的检查
  if (!isClientValid()) {
    console.warn(" MQTT客户端未就绪，跳过取消订阅:", topic);
    return;
  }

  // 检查是否已连接
  if (!client.value.connected) {
    console.warn("MQTT未连接，跳过取消订阅:", topic);
    return;
  }

  try {
    client.value.unsubscribe(topic, { qos }, (error) => {
      if (error) {
        console.error("取消订阅失败:", topic, error);
        return;
      }
      console.log("取消订阅成功:", topic);
    });
  } catch (error) {
    console.error(" 取消订阅异常:", error);
  }
};

// 🔥 修复：发布消息
const doPublish = (topic, payload, qos = 0) => {
  if (!isClientConnected()) {
    console.error("MQTT未连接，消息发送失败");
    showToast({
      type: "fail",
      message: "网络未连接，消息发送失败",
    });
    return false;
  }

  try {
    client.value.publish(topic, payload, { qos }, (error) => {
      if (error) {
        console.error("发布消息失败:", error);
        showToast({
          type: "fail",
          message: "消息发送失败",
        });
        return;
      }
      const logPayload =
        payload.length > 50 ? payload.substring(0, 50) + "..." : payload;
      console.log(`发布消息成功: ${logPayload}`);
    });
    return true;
  } catch (error) {
    console.error("发布消息异常:", error);
    showToast({
      type: "fail",
      message: "消息发送失败",
    });
    return false;
  }
};

// 🔥 修复：主动断开连接
const destroyConnection = () => {
  console.log("🔌 主动断开MQTT连接");
  connectionState.value.manualDisconnect = true;

  // 清除重连定时器
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  if (isClientValid() && client.value.connected) {
    try {
      client.value.end(false, () => {
        console.log(" 断开连接成功");
        connectionState.value.connected = false;
        client.value = null;
      });
    } catch (error) {
      console.error("断开连接失败:", error);
      client.value = null;
    }
  } else {
    client.value = null;
  }
};

// 检查连接状态
const checkConnection = () => {
  return isClientConnected();
};

// 重置连接（用于手动重连）
const resetConnection = () => {
  retryTimes.value = 0;
  connectionState.value.manualDisconnect = false;
  connectionState.value.reconnecting = false;

  destroyConnection();

  setTimeout(() => {
    createConnection();
  }, 1000);
};

// 显示通知
const showNotification = (message) => {
  showNotify({
    type: "primary",
    message: message || "您有新消息",
    duration: 8000,
  });
};

export {
  createConnection,
  client,
  doPublish,
  doUnSubscribe,
  doSubscribe,
  destroyConnection,
  checkConnection,
  resetConnection,
  connectionState,
};
