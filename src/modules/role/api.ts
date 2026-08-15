/**
 * 角色管理接口（由低代码生成器生成）
 */
import { request } from '@/core/request'
import type { Paginated } from '@/core/types'

/** 实体类型命名加 Record 后缀，避免与 UI 组件（Button/Card 等）重名 */
export interface RoleRecord {
  id: number

  name: string

  code: string

  status: boolean

  data_range: string

}

export interface RoleInput {

  name?: string

  code?: string

  status?: boolean

  data_range?: string

}

export const RoleApi = {
  list: (params: Record<string, unknown>) =>
    request.get<Paginated<RoleRecord>>('/role/', { params }),
  create: (data: RoleInput) => request.post<RoleRecord>('/role/', data),
  update: (id: number, data: RoleInput) =>
    request.put<RoleRecord>(`/role/${id}/`, data),
  remove: (id: number) => request.delete<null>(`/role/${id}/`),
}
