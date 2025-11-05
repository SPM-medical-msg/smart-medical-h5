import { createRouter, createWebHistory } from "vue-router";
import { useUserStore } from "../stores/index";

const routes = [
  {
    path: "/",
    redirect: "/home",
  },
  {
    path: "/home",
    name: "Home",
    component: () => import("@/views/index.vue"),
    meta: { title: "首页" },
  },
  {
    path: "/login",
    component: () =>
      import(/* webpackChunkName: "login" */ "@/views/Login.vue"),
    meta: { title: "登录" },
  },
  {
    path: "/register",
    component: () =>
      import(/* webpackChunkName: "login" */ "@/views/Register.vue"),
    meta: { title: "注册" },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 路由守卫 - 设置页面标题
router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = to.meta.title;
  }

  if (
    to.path === "/login" ||
    to.path === "/register" ||
    to.path === "/home" ||
    to.path === "/detail"
  ) {
    next();
  } else {
    const userStore = useUserStore();
    const token = userStore.userInfo;
    if (!token) {
      next("/home");
    } else {
      next();
    }
  }
});

export default router;
