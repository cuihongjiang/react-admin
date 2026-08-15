/**
 * 岗位管理接口（由低代码生成器生成）
 */
import { request } from '@/core/request'
import type { Paginated } from '@/core/types'

/** 实体类型命名加 Record 后缀，避免与 UI 组件（Button/Card 等）重名 */
export interface PositionRecord {
  id: number

  name: string

  code: string

  status: boolean

  sort: number

}

export interface PositionInput {

  name?: string

  code?: string

  status?: boolean

  sort?: number

}

export const PositionApi = {
  list: (params: Record<string, unknown>) =>
    request.get<Paginated<PositionRecord>>('/position/', { params }),
  create: (data: PositionInput) => request.post<PositionRecord>('/position/', data),
  update: (id: number, data: PositionInput) =>
    request.put<PositionRecord>(`/position/${id}/`, data),
  remove: (id: number) => request.delete<null>(`/position/${id}/`),
}
