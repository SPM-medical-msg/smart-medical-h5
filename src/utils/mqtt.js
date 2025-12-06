// mqtt.js - 移动端适配版本（动态IP优化版）
import * as mqtt from "mqtt/dist/mqtt.min";
import { ref, reactive } from "vue";
import emitter from "@/utils/eventBus";
import { showToast, showNotify } from "vant";

// ----------------------------------------------------------------
// 🛠️ 核心优化：动态获取 Broker IP
// ----------------------------------------------------------------
const getBrokerHost = () => {
  try {
    // 获取当前浏览器地址栏的域名/IP
    const hostname = window.location.hostname;

    // 如果是本地开发环境 (localhost) 或者文件协议 (App打包情况)，可能需要回退
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      // 如果是在电脑模拟器里跑，返回 127.0.0.1 没问题
      // 如果是手机 App 打包运行 (file://)，这里可能需要你手动指定默认 IP
      return "127.0.0.1";
    }

    // 手机通过局域网访问时（例如 http://192.168.43.100:5173）
    // hostname 自动就是 192.168.43.100，直接用它作为 MQTT 地址
    return hostname;
  } catch (e) {
    console.warn("获取Host失败，使用默认回退地址");
    return "127.0.0.1";
  }
};

// 连接配置
const connection = reactive({
  protocol: "ws", // 注意：移动端浏览器必须用 ws/wss，不能用 tcp
  host: getBrokerHost(), // 🔥 这里调用动态获取方法
  port: 8083, // EMQX WebSocket 默认端口
  clientId: "mobile_" + Math.random().toString(16).substring(2, 8),
  username: "server",
  password: "password",
  clean: true,
  connectTimeout: 10 * 1000, // 缩短超时时间，移动端反应要快
  reconnectPeriod: 0, // 关闭库自带重连，使用我们要手写的智能重连
  keepalive: 60,
});

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
const BASE_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 10000; // 移动端重连间隔最大10秒足够了

// 重连定时器
let reconnectTimer = null;

// 客户端实例
let client = ref(null);

// 检查客户端是否有效
const isClientValid = () => {
  return (
    client.value &&
    typeof client.value.subscribe === "function" &&
    typeof client.value.unsubscribe === "function" &&
    typeof client.value.publish === "function"
  );
};

// 检查客户端是否已连接
const isClientConnected = () => {
  return isClientValid() && client.value.connected;
};

// 计算指数退避延迟
const getReconnectDelay = (retryCount) => {
  return Math.min(
    BASE_RECONNECT_DELAY * Math.pow(2, retryCount),
    MAX_RECONNECT_DELAY
  );
};

// 创建连接
const createConnection = async () => {
  try {
    if (isClientConnected()) {
      console.log("已存在活跃连接，跳过创建");
      return;
    }

    // 🔥 每次连接前，重新动态获取一次 IP（防止网络环境切换）
    connection.host = getBrokerHost();

    const { protocol, host, port, ...options } = connection;
    const connectUrl = `${protocol}://${host}:${port}/mqtt`;

    console.log(`🚀 正在连接 MQTT: ${connectUrl}`);

    // 重新生成 clientId
    options.clientId = "mobile_" + Math.random().toString(16).substring(2, 8);

    client.value = mqtt.connect(connectUrl, options);

    if (client.value && client.value.on) {
      client.value.on("connect", handleConnect);
      client.value.on("reconnect", handleOnReConnect);
      client.value.on("error", handleError);
      client.value.on("close", handleClose);
      client.value.on("offline", handleOffline);
      client.value.on("message", handleMessage);
    }
  } catch (error) {
    console.error("MQTT连接创建失败:", error);
    scheduleReconnect();
  }
};

// 处理连接成功
const handleConnect = () => {
  console.log(`✅ MQTT连接成功 (${connection.host})`);
  connectionState.value.connected = true;
  connectionState.value.reconnecting = false;
  connectionState.value.lastConnectTime = new Date();
  retryTimes.value = 0;

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  emitter.emit("mqtt:connected");

  // 仅在首次连接显示 Toast，避免重连时一直弹窗干扰用户
  if (retryTimes.value === 0) {
    showToast({ type: "success", message: "服务已连接", duration: 1500 });
  }
};

// 处理错误
const handleError = (error) => {
  console.error("❌ MQTT连接错误:", error);
  // 不在这里设置 connected = false，依靠 close 事件处理
  // 这里可以处理特定的鉴权错误等
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
};

// 处理消息
const handleMessage = (topic, message) => {
  try {
    // 尝试转字符串再解析，增加鲁棒性
    const msgStr = message.toString();
    const parse = JSON.parse(msgStr);

    const info = {
      receiveMessage: parse,
      topic,
    };

    emitter.emit("message", info);
    console.log(`📨 收到消息 [${topic}]:`, parse);

    // 提取消息内容的辅助函数
    const getMsgContent = (data) =>
      data.msg || data.content || data.message || "收到新消息";

    // 业务逻辑判断
    if (topic.includes("APPLY") || topic.includes("CHAT")) {
      // 使用 Vant 的 Notify 组件展示重要通知
      showNotification(getMsgContent(parse));
    }
  } catch (error) {
    console.error("消息解析失败，原始消息:", message.toString());
  }
};

// 触发重连
const handleOnReConnect = () => {
  // MQTT.js 内部也会尝试重连，但我们接管控制权
  console.log("🔄 正在重连...");
};

// 计划重连逻辑
const scheduleReconnect = () => {
  if (
    connectionState.value.reconnecting ||
    connectionState.value.manualDisconnect
  ) {
    return;
  }

  if (retryTimes.value >= MAX_RETRY_TIMES) {
    console.error("❌ 达到最大重连次数");
    showNotify({ type: "warning", message: "连接断开，请刷新页面" });
    return;
  }

  connectionState.value.reconnecting = true;
  retryTimes.value += 1;

  const delay = getReconnectDelay(retryTimes.value - 1);
  console.log(`⏳ ${delay / 1000}秒后尝试第 ${retryTimes.value} 次重连...`);

  if (reconnectTimer) clearTimeout(reconnectTimer);

  reconnectTimer = setTimeout(() => {
    // 销毁旧实例确保干净重连
    if (client.value) {
      try {
        client.value.end(true);
      } catch (e) {}
      client.value = null;
    }
    createConnection();
  }, delay);
};

// 订阅
const doSubscribe = (topic, qos = 0) => {
  if (!isClientConnected()) return false;
  try {
    client.value.subscribe(topic, { qos }, (err) => {
      if (err) console.error(`订阅失败 [${topic}]:`, err);
      else console.log(`订阅成功 [${topic}]`);
    });
    return true;
  } catch (e) {
    return false;
  }
};

// 取消订阅
const doUnSubscribe = (topic) => {
  if (!isClientConnected()) return;
  try {
    client.value.unsubscribe(topic, (err) => {
      if (!err) console.log(`取消订阅 [${topic}]`);
    });
  } catch (e) {}
};

// 发布消息
const doPublish = (topic, payload, qos = 0) => {
  if (!isClientConnected()) {
    showToast("网络未连接");
    return false;
  }

  // 自动将对象转为 JSON 字符串
  let finalPayload = payload;
  if (typeof payload === "object") {
    finalPayload = JSON.stringify(payload);
  }

  try {
    client.value.publish(topic, finalPayload, { qos }, (error) => {
      if (error) {
        console.error("发布失败:", error);
      } else {
        console.log(`📤 发送成功 [${topic}]`);
      }
    });
    return true;
  } catch (error) {
    return false;
  }
};

// 主动断开
const destroyConnection = () => {
  console.log("🛑 主动断开连接");
  connectionState.value.manualDisconnect = true;
  if (reconnectTimer) clearTimeout(reconnectTimer);

  if (client.value) {
    try {
      client.value.end(); // 优雅断开
    } catch (e) {}
    client.value = null;
  }
  connectionState.value.connected = false;
};

// 手动重连（对外暴露）
const resetConnection = () => {
  destroyConnection();
  connectionState.value.manualDisconnect = false;
  retryTimes.value = 0;
  setTimeout(createConnection, 500);
};

// 显示通知
const showNotification = (msg) => {
  showNotify({ type: "primary", message: msg, duration: 3000 });
};

export {
  createConnection,
  client,
  doPublish,
  doUnSubscribe,
  doSubscribe,
  destroyConnection,
  resetConnection,
  connectionState,
};
