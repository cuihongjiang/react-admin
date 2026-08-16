/**
 * 低代码生成器接口
 *
 * 流程：tables 选表 → 保存配置（table_info / form_info）
 *      → 预览 / 下载代码 → 一键生成菜单 + 按钮权限
 */
import type { AxiosResponse } from 'axios'

import { request } from '@/core/request'
import type { Paginated } from '@/core/types'

/** 组件类型：输入框 / 数字 / 下拉(字典) / 开关 / 文本域 */
export type FieldComponent = 'input' | 'number' | 'select' | 'switch' | 'textarea'

/** 表格列配置（is_search / is_list 参与生成筛选栏与表格列） */
export interface TableFieldConfig {
  field: string
  title: string
  is_search?: boolean
  is_list?: boolean
}

/** 表单字段配置 */
export interface FormFieldConfig {
  field: string
  title: string
  component?: FieldComponent
  required?: boolean
  /** component 为 select 时引用的数据字典编码 */
  dict_code?: string
}

export interface GeneratorTemplateRecord {
  id: number
  name: string
  code: string
  app_label: string | null
  model_name: string | null
  table_info: TableFieldConfig[]
  form_info: FormFieldConfig[]
  /** 新建数据表模式：不依赖已有模型，按字段配置直接建表 */
  is_new_table: boolean
  has_menu: boolean
  has_backend: boolean
  create_datetime?: string
}

export interface GeneratorTemplateInput {
  name: string
  code: string
  app_label?: string
  model_name?: string
  table_info: TableFieldConfig[]
  form_info: FormFieldConfig[]
  is_new_table?: boolean
}

/** /generator/tables/ 返回的可生成模型表 */
export interface GeneratorTable {
  model: string
  app_label: string
  table_name: string
  title: string
  fields: { field: string; title: string }[]
}

export interface GeneratedFile {
  path: string
  content: string
}

export interface MenuCreateResult {
  menu_id: number
  button_ids: number[]
  created: boolean
}

/** backend/create 返回的各资源状态：created=本次创建 / exists=复用已有 / skipped=跳过 */
export type BackendCreateReport = Record<string, 'created' | 'exists' | 'skipped'>

/** 生成菜单对话框用的菜单 / 角色选项 */
export interface MenuOption {
  id: number
  title: string
  type: 0 | 1
  parent_id: number | null
  path: string
  status: boolean
}

export interface RoleOption {
  id: number
  name: string
  code?: string
}

export const GeneratorApi = {
  list: (params: Record<string, unknown>) =>
    request.get<Paginated<GeneratorTemplateRecord>>('/generator/', { params }),
  create: (data: GeneratorTemplateInput) =>
    request.post<GeneratorTemplateRecord>('/generator/', data),
  update: (id: number, data: GeneratorTemplateInput) =>
    request.put<GeneratorTemplateRecord>(`/generator/${id}/`, data),
  remove: (id: number) => request.delete<null>(`/generator/${id}/`),

  tables: () => request.get<GeneratorTable[]>('/generator/tables/'),
  preview: (id: number, frontend: 'react' | 'vue' = 'react') =>
    request.post<GeneratedFile[]>(`/generator/${id}/code/preview/`, undefined, {
      params: { frontend },
    }),
  /** blob 响应拦截器原样放行 AxiosResponse，取 data 即 zip 字节流 */
  download: (id: number, frontend: 'react' | 'vue' = 'react') =>
    request.get<AxiosResponse<Blob>>(`/generator/${id}/code/download/`, {
      params: { frontend },
      responseType: 'blob',
    }),
  menuCreate: (id: number, data: { parent_id?: number; role_ids?: number[] }) =>
    request.post<MenuCreateResult>(`/generator/${id}/menu/create/`, data),
  backendCreate: (id: number) =>
    request.post<BackendCreateReport>(`/generator/${id}/backend/create/`),

  menuOptions: () => request.get<MenuOption[]>('/menu/all/list/'),
  roleOptions: () => request.get<RoleOption[]>('/role/all/list/'),
}
