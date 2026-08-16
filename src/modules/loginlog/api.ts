/**
 * 登录日志接口（由低代码生成器生成）
 */
import { request } from '@/core/request'
import type { Paginated } from '@/core/types'

/** 实体类型命名加 Record 后缀，避免与 UI 组件（Button/Card 等）重名 */
export interface LoginlogRecord {
  id: number

  sort: string

  username: string

  ip: string

  agent: string

  browser: string

  os: string

  continent: string

  country: string

  province: string

  city: string

  district: string

  isp: string

  area_code: string

  country_english: string

  country_code: string

  longitude: string

  latitude: string

  login_type: string

}

export interface LoginlogInput {

  sort?: string

  username?: string

  ip?: string

  agent?: string

  browser?: string

  os?: string

  continent?: string

  country?: string

  province?: string

  city?: string

  district?: string

  isp?: string

  area_code?: string

  country_english?: string

  country_code?: string

  longitude?: string

  latitude?: string

  login_type?: string

}

export const LoginlogApi = {
  list: (params: Record<string, unknown>) =>
    request.get<Paginated<LoginlogRecord>>('/loginlog/', { params }),
  create: (data: LoginlogInput) => request.post<LoginlogRecord>('/loginlog/', data),
  update: (id: number, data: LoginlogInput) =>
    request.put<LoginlogRecord>(`/loginlog/${id}/`, data),
  remove: (id: number) => request.delete<null>(`/loginlog/${id}/`),
}
