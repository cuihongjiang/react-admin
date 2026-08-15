/**
 * 菜单管理接口（由低代码生成器生成）
 */
import { request } from '@/core/request'
import type { Paginated } from '@/core/types'

/** 实体类型命名加 Record 后缀，避免与 UI 组件（Button/Card 等）重名 */
export interface MenuRecord {
  id: number

  title: string

  type: string

  path: string

  component: string

  icon: string

  name: string

  sort: number

  status: boolean

}

export interface MenuInput {

  title?: string

  type?: string

  path?: string

  component?: string

  name?: string

  icon?: string

  sort?: number

  status?: boolean

}

export const MenuApi = {
  list: (params: Record<string, unknown>) =>
    request.get<Paginated<MenuRecord>>('/menu/', { params }),
  create: (data: MenuInput) => request.post<MenuRecord>('/menu/', data),
  update: (id: number, data: MenuInput) =>
    request.put<MenuRecord>(`/menu/${id}/`, data),
  remove: (id: number) => request.delete<null>(`/menu/${id}/`),
}
