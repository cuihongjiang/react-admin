/**
 * 公告管理接口（由低代码生成器生成）
 */
import { request } from '@/core/request'
import type { Paginated } from '@/core/types'

/** 实体类型命名加 Record 后缀，避免与 UI 组件（Button/Card 等）重名 */
export interface NoticeRecord {
  id: number

  title: string

  content: string

  status: boolean

  sort: number

}

export interface NoticeInput {

  title?: string

  content?: string

  status?: boolean

  sort?: number

}

export const NoticeApi = {
  list: (params: Record<string, unknown>) =>
    request.get<Paginated<NoticeRecord>>('/notice/', { params }),
  create: (data: NoticeInput) => request.post<NoticeRecord>('/notice/', data),
  update: (id: number, data: NoticeInput) =>
    request.put<NoticeRecord>(`/notice/${id}/`, data),
  remove: (id: number) => request.delete<null>(`/notice/${id}/`),
}
