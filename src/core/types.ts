/**
 * 后端数据类型定义（与 django-admin 后端对齐）
 */

/** 统一响应信封 */
export interface ApiEnvelope<T = unknown> {
  code: number
  result: T
  message: string
  success: boolean
}

/** 分页列表响应 */
export interface Paginated<T> {
  items: T[]
  total: number
}

/** 登录返回 */
export interface LoginResult {
  accessToken: string
  refreshToken: string
  user: CurrentUser
}

export interface CurrentUser {
  id: number
  username: string
  email: string | null
  mobile: string | null
  dept_id: number | null
  post: number[]
  role: number[]
}

/** 当前用户按钮/列权限 */
export interface UserPermissions {
  buttons: string[]
  columns: string[]
}

/** 后端菜单树节点（/api/menu/route/tree/ 返回） */
export interface MenuItem {
  id: number
  parent_id: number | null
  name: string | null
  path: string
  redirect: string | null
  component: string | null
  type: 0 | 1 // 0=目录 1=菜单
  is_ext: boolean
  status: boolean
  sort: number
  meta: {
    title: string
    icon: string | null
    ignoreKeepAlive: boolean
    orderNo: number | null
    hideMenu: boolean
  }
  children?: MenuItem[]
}

/** 字典项 */
export interface DictItem {
  id: number
  label: string
  value: string
  status: boolean
}
