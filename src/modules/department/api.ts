/**
 * 部门管理接口（由低代码生成器生成）
 */
import { request } from '@/core/request'
import type { Paginated } from '@/core/types'

/** 实体类型命名加 Record 后缀，避免与 UI 组件（Button/Card 等）重名 */
export interface DepartmentRecord {
  id: number

  name: string

  owner: string

  phone: string

  status: boolean

}

export interface DepartmentInput {

  name?: string

  owner?: string

  phone?: string

  status?: boolean

}

export const DepartmentApi = {
  list: (params: Record<string, unknown>) =>
    request.get<Paginated<DepartmentRecord>>('/department/', { params }),
  create: (data: DepartmentInput) => request.post<DepartmentRecord>('/department/', data),
  update: (id: number, data: DepartmentInput) =>
    request.put<DepartmentRecord>(`/department/${id}/`, data),
  remove: (id: number) => request.delete<null>(`/department/${id}/`),
}
