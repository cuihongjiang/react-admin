/**
 * 认证相关接口
 */
import { attachTokenProvider, bindAuthBridge, request } from '../request'
import { useAuthStore } from '../stores/auth'
import type { LoginResult, MenuItem, UserPermissions } from '../types'

export function login(username: string, password: string) {
  return request.post<LoginResult>('/login/', { username, password })
}

export function logout(refreshToken: string) {
  return request.post<never>('/login/logout/', { refreshToken })
}

export function fetchRouteTree() {
  return request.get<MenuItem[]>('/menu/route/tree/')
}

export function fetchPermissions() {
  return request.get<UserPermissions>('/user/permissions/')
}

// ---- 请求层与 auth store 桥接（单例绑定一次） ----
const store = useAuthStore
bindAuthBridge({
  getRefreshToken: () => store.getState().refreshToken,
  onRefreshed: (accessToken, refreshToken) => store.getState().setTokens(accessToken, refreshToken),
  onAuthExpired: () => store.getState().clear(),
})
attachTokenProvider(() => store.getState().accessToken)
