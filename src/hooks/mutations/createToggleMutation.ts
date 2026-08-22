import { useEffect, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface UpdateRecord {
  name?: string
  code?: string
  status: boolean
}

interface ToggleParams {
  id: number
  value: UpdateRecord
}

interface CreateToggleMutationOptions<TData = unknown> {
  updateFn: (id: number, value: UpdateRecord) => Promise<TData>
  queryKey: string[]
  dataField?: string
  successMessage?: string
  errorMessage?: string
  updateData?: (old: any, id: number | string, status: boolean) => any
  optimistic?: boolean
  /** 防抖毫秒数，0 = 不防抖立即提交 */
  debounceMs?: number
  onSuccessCallback?: (data: TData, params: ToggleParams) => void
  onErrorCallback?: (error: Error, params: ToggleParams) => void
}

export function createToggleMutation<TData = unknown>({
  updateFn,
  queryKey,
  dataField = 'data',
  successMessage = '状态已更新',
  errorMessage = '状态更新失败',
  updateData,
  optimistic = true,
  debounceMs = 500,
  onSuccessCallback,
  onErrorCallback,
}: CreateToggleMutationOptions<TData>) {

  // ✅ 工厂作用域的纯函数：唯一一份缓存更新逻辑
  const applyStatusToCache = (old: any, id: number, status: boolean): any => {
    if (!old) return old

    if (updateData) {
      return updateData(old, id, status)
    }

    if (Array.isArray(old)) {
      return old.map((item: any) =>
        item.id === id ? { ...item, status } : item
      )
    }

    if (old[dataField] && Array.isArray(old[dataField])) {
      return {
        ...old,
        [dataField]: old[dataField].map((item: any) =>
          item.id === id ? { ...item, status } : item
        ),
      }
    }

    return old
  }

  // 返回的仍是一个标准的自定义 Hook
  return function useToggleMutation() {
    const queryClient = useQueryClient()

    // 每个组件实例独立的：按行 id 防抖
    const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())
    const latest = useRef<Map<number, UpdateRecord>>(new Map())

    // 卸载时清理
    useEffect(() => {
      const map = timers.current
      return () => {
        map.forEach((t) => clearTimeout(t))
        map.clear()
        latest.current.clear()
      }
    }, [])

    const mutation = useMutation({
      mutationFn: (params: ToggleParams) => updateFn(params.id, { ...params.value }),

      onMutate: async (params) => {
        if (!optimistic) return

        await queryClient.cancelQueries({ queryKey })

        const previousData = queryClient.getQueryData(queryKey)

        queryClient.setQueryData(queryKey, (old: any) =>
          applyStatusToCache(old, params.id, params.value.status)
        )

        return { previousData }
      },

      onSuccess: (data, params) => {
        toast.success(successMessage)
        onSuccessCallback?.(data, params)
      },

      onError: (error, params) => {
        // ✅ 防抖场景：连点多次只发一次请求，此时 previousData
        // 已经包含乐观更新的中间状态，回滚会滚错
        // 直接 invalidate 以服务器数据为准，最可靠
        queryClient.invalidateQueries({ queryKey })
        toast.error(errorMessage)
        onErrorCallback?.(error, params)
      },

      onSettled: () => {
        queryClient.invalidateQueries({ queryKey })
      },
    })

    /**
     * 页面入口：立即乐观更新 UI，防抖后提交最终值
     */
    const toggle = (params: ToggleParams) => {
      // 1. 立即更新缓存（UI 零延迟、无闪烁）
      if (optimistic) {
        queryClient.setQueryData(queryKey, (old: any) =>
          applyStatusToCache(old, params.id, params.value.status)
        )
      }

      // 2. 不防抖：直接提交
      if (debounceMs <= 0) {
        mutation.mutate(params)
        return
      }

      // 3. 防抖：记录最新值，重置该行定时器
      latest.current.set(params.id, params.value)

      const prev = timers.current.get(params.id)
      if (prev) clearTimeout(prev)

      timers.current.set(
        params.id,
        setTimeout(() => {
          const finalValue = latest.current.get(params.id)
          latest.current.delete(params.id)
          timers.current.delete(params.id)
          if (finalValue) {
            mutation.mutate({ id: params.id, value: finalValue })
          }
        }, debounceMs)
      )
    }

    return { ...mutation, toggle }
  }
}
