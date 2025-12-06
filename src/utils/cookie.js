// 密码编码解码工具函数
const encodeData = (str) => {
  // 简单的Base64编码 + 混淆
  const mixed = str
    .split("")
    .map((char, index) => String.fromCharCode(char.charCodeAt(0) + (index % 5)))
    .join("");
  return btoa(encodeURIComponent(mixed));
};

const decodeData = (str) => {
  try {
    const mixed = decodeURIComponent(atob(str));
    return mixed
      .split("")
      .map((char, index) =>
        String.fromCharCode(char.charCodeAt(0) - (index % 5))
      )
      .join("");
  } catch (e) {
    return "";
  }
};
// Cookie相关函数 - 修改为使用编码
const setCookie = (userName, password, days) => {
  let date = new Date();
  date.setTime(date.getTime() + 24 * 60 * 60 * 1000 * days);
  // 使用不同的字段名和编码后的值
  window.document.cookie =
    "demoUser" +
    "=" +
    encodeData(userName) +
    ";path=/;expires=" +
    date.toGMTString();
  window.document.cookie =
    "demoAuth" +
    "=" +
    encodeData(password) +
    ";path=/;expires=" +
    date.toGMTString();
};

export function getCookie() {
  if (document.cookie.length > 0) {
    let arr = document.cookie.split("; ");
    for (let i = 0; i < arr.length; i++) {
      let arr2 = arr[i].split("=");
      if (arr2[0] === "demoUser") {
        form.value.userName = decodeData(arr2[1]);
      } else if (arr2[0] === "demoAuth") {
        form.value.password = decodeData(arr2[1]);
      }
    }
  }
}
