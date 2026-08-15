/**
 * 系统管理模块接口
 */
import { request } from '@/core/request'
import type { Paginated } from '@/core/types'

export interface SystemUser {
  id: number
  username: string
  email: string | null
  mobile: string | null
  dept_id: number | null
  post: number[]
  role: number[]
}

export interface UserInput {
  username: string
  password?: string
  email?: string | null
  mobile?: string | null
  dept_id?: number | null
  post?: number[]
  role?: number[]
}

export const userApi = {
  list: (params: Record<string, unknown>) =>
    request.get<Paginated<SystemUser>>('/user/', { params }),
  create: (data: UserInput) => request.post<SystemUser>('/user/', data),
  update: (id: number, data: UserInput) =>
    request.put<SystemUser>(`/user/${id}/`, data),
  remove: (id: number) => request.delete<null>(`/user/${id}/`),
  setStatus: (id: number, status: boolean) =>
    request.put<null>(`/user/${id}/set_status/`, { status }),
}
