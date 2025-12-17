import { createRouter, createWebHistory } from "vue-router";
import { useUserStore } from "../stores/index";
import Layout from "@/layout/index.vue";

const routes = [
  {
    path: "/",
    redirect: "/home",
  },
  {
    path: "/login",
    component: () => import("@/views/Login.vue"),
    meta: { title: "登录" },
  },
  {
    path: "/register",
    component: () => import("@/views/Register.vue"),
    meta: { title: "注册" },
  },
  // 使用Layout布局的页面
  {
    path: "/",
    component: Layout,
    children: [
      {
        path: "/home",
        name: "Home",
        component: () => import("@/views/index.vue"),
        meta: { title: "首页" },
      },
      {
        path: "/doctor-detail",
        component: () => import("@/views/DoctorDetail.vue"),
        meta: { title: "医生详情" },
      },
      // {
      //   path: "/doctor-list",
      //   component: () => import("@/views/DoctorList.vue"),
      //   meta: { title: "医生列表" },
      // },
      // {
      //   path: "/consult",
      //   component: () => import("@/views/Consult.vue"),
      //   meta: { title: "在线咨询" },
      // },
      // {
      //   path: "/knowledge",
      //   component: () => import("@/views/Knowledge.vue"),
      //   meta: { title: "健康知识" },
      // },
      {
        path: "/person",
        component: () => import("@/views/user/UserCenter.vue"),
        meta: { title: "我的" },
      },
      {
        path: "/index-order",
        name: "OrderManagement",
        component: () => import("@/views/order/OrderManagement.vue"),
        meta: { title: "咨询管理", requireAuth: true },
      },
      {
        path: "/index-notice",
        name: "NoticeList",
        component: () => import("@/views/list/NoticeList.vue"),
        meta: { title: "疾病知识", requireAuth: true },
      },
      {
        path: "/notice-detail",
        name: "NoticeDetail",
        component: () => import("@/views/list/NoticeDetail.vue"),
        meta: { title: "疾病详情", requireAuth: true },
      },
      {
        path: "/index-mediciation",
        name: "mediciationList",
        component: () => import("@/views/list/DrugList.vue"),
        meta: { title: "疾病知识", requireAuth: true },
      },
      {
        path: "/mediciation-detail",
        name: "DrugDetail",
        component: () => import("@/views/list/DrugDetail.vue"),
        meta: { title: "疾病详情", requireAuth: true },
      },
      // 聊天页面
      {
        path: "/chat",
        name: "Chat",
        component: () => import("@/views/chat/UserSingleChat.vue"),
        meta: { title: "在线咨询", requireAuth: true },
      },
      {
        path: "/index-order/detail",
        name: "OrderDetail",
        component: () => import("@/views/order/OrderDetail.vue"),
        meta: { title: "订单详情", requireAuth: true },
      },
      // {
      //   path: "/profile",
      //   component: () => import("@/views/Profile.vue"),
      //   meta: { title: "个人中心" },
      // },
      // {
      //   path: "/my-consult",
      //   component: () => import("@/views/MyConsult.vue"),
      //   meta: { title: "我的咨询" },
      // },
      // {
      //   path: "/history",
      //   component: () => import("@/views/History.vue"),
      //   meta: { title: "浏览记录" },
      // },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title + " - 医讯通";
  }

  // 公开页面，无需登录
  const publicPages = ["/login", "/register", "/home", "/doctor-detail"];

  if (publicPages.includes(to.path)) {
    next();
  } else {
    // 需要登录的页面
    const userStore = useUserStore();

    if (!userStore.checkLogin()) {
      // 未登录，跳转到登录页
      next("/login");
    } else {
      next();
    }
  }
});

export default router;
