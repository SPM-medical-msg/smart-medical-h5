import axios from 'axios'
import { showToast, showDialog } from 'vant'
import router from '@/router'

const service = axios.create({
  baseURL: 'http://127.0.0.1:9001',
  timeout: 50000
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 从 localStorage 获取 token（移动端建议用 localStorage）
    const token = localStorage.getItem('Authorization')
    if (token) {
      config.headers.Authorization = token
    }
    return config
  },
  error => {
    console.log('请求错误：', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data
    
    // 成功响应
    if (res.code === 1) {
      return res
    } 
    // 权限不足
    else if (res.code === 401) {
      showToast({
        message: res.msg || '登录已过期，请重新登录',
        position: 'top'
      })
      localStorage.removeItem('Authorization')
      // 跳转到登录页（后续开发）
      // router.push('/login')
      return Promise.reject(new Error(res.msg || '未授权'))
    } 
    // 特殊业务码
    else if (res.code === 402) {
      return res
    } 
    // 文件下载
    else if (response.request.responseType === 'blob') {
      return response.data
    } 
    // 业务错误
    else if (res.code === -1) {
      showToast({
        message: res.msg || '操作失败',
        position: 'top'
      })
      return Promise.reject(new Error(res.msg || '操作失败'))
    } 
    // 其他情况
    else {
      return res
    }
  },
  error => {
    console.log('响应错误：', error)
    
    // 网络错误处理
    if (error.message.includes('timeout')) {
      showToast('请求超时，请稍后重试')
    } else if (error.message.includes('Network Error')) {
      showToast('网络连接失败，请检查网络')
    } else {
      showToast(error.message || '请求失败')
    }
    
    return Promise.reject(error)
  }
)

export default service