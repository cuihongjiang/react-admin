/**
 * 按钮级权限：后端 MenuButton 的 code（如 "user:add"）
 *
 * <Auth code="user:add"><Button>新增</Button></Auth>
 * hasAuth('user:add') 可用于列级/逻辑判断
 */
import type { ReactNode } from 'react'

import { useAuthStore } from '../stores/auth'

export function hasAuth(code: string): boolean {
  const buttons = useAuthStore.getState().buttons
  // 超管/未加载权限时放行由后端兜底；此处仅控制 UI 显隐
  return buttons.length === 0 || buttons.includes(code)
}

export function useAuth(): (code: string) => boolean {
  const buttons = useAuthStore((s) => s.buttons)
  return (code: string) => buttons.length === 0 || buttons.includes(code)
}

/** 列级权限：MenuColumnField code */
export function useColumnAuth(): (code: string) => boolean {
  const columns = useAuthStore((s) => s.columns)
  return (code: string) => columns.length === 0 || columns.includes(code)
}

export function Auth({ code, children }: { code: string; children: ReactNode }) {
  const check = useAuth()
  if (!check(code)) return null
  return <>{children}</>
}
