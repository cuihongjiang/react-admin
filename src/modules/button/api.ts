/**
 * 权限标识接口（由低代码生成器生成）
 */
import { request } from '@/core/request'
import type { Paginated } from '@/core/types'

/** 实体类型命名加 Record 后缀，避免与 UI 组件（Button/Card 等）重名 */
export interface ButtonRecord {
  id: number

  name: string

  code: string

  status: boolean

}

export interface ButtonInput {

  name?: string

  code?: string

  status?: boolean

}

export const ButtonApi = {
  list: (params: Record<string, unknown>) =>
    request.get<Paginated<ButtonRecord>>('/button/', { params }),
  create: (data: ButtonInput) => request.post<ButtonRecord>('/button/', data),
  update: (id: number, data: ButtonInput) =>
    request.put<ButtonRecord>(`/button/${id}/`, data),
  remove: (id: number) => request.delete<null>(`/button/${id}/`),
}
