/**
 * 字典 hook：按编码取启用字典项（下拉/标签映射）
 */
import { useQuery } from '@tanstack/react-query'

import { request } from '../request'
import type { DictItem } from '../types'

export function useDict(code: string) {
  return useQuery({
    queryKey: ['dict', code],
    queryFn: () => request.get<DictItem[]>('/dictitem/by/code/', { params: { code } }),
    staleTime: 5 * 60 * 1000,
    enabled: !!code,
  })
}

/** 字典 value -> label 映射（渲染表格列常用） */
export function useDictLabel(code: string) {
  const { data } = useDict(code)
  const map = new Map((data ?? []).map((item) => [item.value, item.label]))
  return (value: unknown) => map.get(String(value)) ?? String(value ?? '-')
}
