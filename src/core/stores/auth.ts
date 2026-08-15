/**
 * 认证状态：token / 用户 / 权限码，localStorage 持久化
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { CurrentUser, UserPermissions } from '../types'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: CurrentUser | null
  buttons: string[]
  columns: string[]
  setTokens: (accessToken: string, refreshToken: string) => void
  setAuth: (payload: {
    accessToken: string
    refreshToken: string
    user: CurrentUser
  }) => void
  setPermissions: (permissions: UserPermissions) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      buttons: [],
      columns: [],
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setAuth: (payload) => set(payload),
      setPermissions: (permissions) =>
        set({ buttons: permissions.buttons, columns: permissions.columns }),
      clear: () =>
        set({ accessToken: null, refreshToken: null, user: null, buttons: [], columns: [] }),
    }),
    { name: 'react-admin-auth' },
  ),
)
