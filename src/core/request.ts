/**
 * axios 请求封装
 *
 * - 统一拆 {code, result, message} 信封：业务成功 resolve result，失败 reject ApiError
 * - 401 自动用 refreshToken 续期（单飞，防并发重复刷新），续期失败跳登录
 * - blob 请求（文件下载）原样放行
 */
import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios'

import type { ApiEnvelope } from './types'

export class ApiError extends Error {
  code: number
  constructor(message: string, code: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? '/api',
  timeout: 30_000,
})

/** 刷新 token 用独立实例，避免 401 拦截递归 */
const refreshInstance = axios.create({
  baseURL: instance.defaults.baseURL,
  timeout: 30_000,
})

// ---- token 读写桥（注入避免与 store 循环依赖）----
let getRefreshToken: () => string | null = () => null
let onRefreshed: (accessToken: string, refreshToken: string) => void = () => {}
let onAuthExpired: () => void = () => {}

export function bindAuthBridge(handlers: {
  getRefreshToken: () => string | null
  onRefreshed: (accessToken: string, refreshToken: string) => void
  onAuthExpired: () => void
}) {
  getRefreshToken = handlers.getRefreshToken
  onRefreshed = handlers.onRefreshed
  onAuthExpired = handlers.onAuthExpired
}

// ---- 单飞刷新 ----
let refreshing: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) throw new ApiError('未登录', 401)

  const resp = await refreshInstance.post<ApiEnvelope<{ accessToken: string; refreshToken: string }>>(
    '/login/refresh/',
    { refreshToken },
  )
  const body = resp.data
  if (body.code !== 2000) throw new ApiError(body.message || '刷新失败', body.code)

  onRefreshed(body.result.accessToken, body.result.refreshToken)
  return body.result.accessToken
}

instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // token 由调用方通过 Authorization 注入器补齐（见 attachTokenProvider）
  return config
})

// ---- token 注入 ----
let getAccessToken: () => string | null = () => null
export function attachTokenProvider(fn: () => string | null) {
  getAccessToken = fn
}
instance.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

instance.interceptors.response.use(
  // 返回值即业务 result（非 AxiosResponse），用 any 绕过拦截器泛型约束
  (response): any => {
    // 文件流原样返回
    if (response.config.responseType === 'blob') return response

    const body = response.data as ApiEnvelope
    if (body && typeof body.code === 'number') {
      if (body.code === 2000) return body.result
      return Promise.reject(new ApiError(body.message || '请求失败', body.code))
    }
    return body
  },
  async (error: AxiosError<ApiEnvelope>) => {
    const config = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined
    const status = error.response?.status

    // 401：尝试刷新后重放一次
    if (status === 401 && config && !config._retried) {
      config._retried = true
      try {
        refreshing ??= refreshAccessToken().finally(() => (refreshing = null))
        await refreshing
        return instance.request(config)
      } catch {
        onAuthExpired()
        return Promise.reject(new ApiError('登录已过期', 401))
      }
    }

    const body = error.response?.data
    const message =
      (body && typeof body === 'object' && 'message' in body && String(body.message)) ||
      error.message ||
      '网络异常'
    return Promise.reject(new ApiError(message, status ?? -1))
  },
)

/** 类型化请求方法：resolve 值即后端 result */
export const request = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig) =>
    instance.get<never, T>(url, config),
  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    instance.post<never, T>(url, data, config),
  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    instance.put<never, T>(url, data, config),
  delete: <T = unknown>(url: string, config?: AxiosRequestConfig) =>
    instance.delete<never, T>(url, config),
}
