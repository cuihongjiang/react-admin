import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface ToggleParams {
  id: number
  value:Record
}

interface Record {
  name?: string
  code?:string
  status: boolean
}

interface CreateToggleMutationOptions<TData = unknown> {
  updateFn: (id: number, value:Record) => Promise<TData>
  queryKey: string[]
  dataField?: string
  successMessage?: string
  errorMessage?: string
  /** 自定义数据更新逻辑 */
  updateData?: (old: any, id: number | string, status: boolean) => any
  /** 是否启用乐观更新 */
  optimistic?: boolean
  /** 成功后的回调 */
  onSuccessCallback?: (data: TData, params: ToggleParams) => void
  /** 错误后的回调 */
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
  onSuccessCallback,
  onErrorCallback,
}: CreateToggleMutationOptions<TData>) {
  return function useToggleMutation() {
    const queryClient = useQueryClient()

    return useMutation({
      mutationFn: (params: ToggleParams) => updateFn(params.id, {...params.value}),

      onMutate: async (params) => {
        if (!optimistic) return

        await queryClient.cancelQueries({ queryKey })

        const previousData = queryClient.getQueryData(queryKey)

        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old) return old

          // 如果有自定义更新函数，使用它
          if (updateData) {
            return updateData(old, params.id, params.value.status)
          }

          // 否则使用默认更新逻辑
          if (Array.isArray(old)) {
            return old.map((item: any) =>
              item.id === params.id ? { ...item, status: params.value.status } : item
            )
          }

          if (old[dataField] && Array.isArray(old[dataField])) {
            return {
              ...old,
              [dataField]: old[dataField].map((item: any) =>
                item.id === params.id ? { ...item, status: params.value.status } : item
              ),
            }
          }

          return old
        })

        return { previousData }
      },

      onSuccess: (data, params) => {
        toast.success(successMessage)
        onSuccessCallback?.(data, params)
      },

      onError: (error, params, context) => {
        if (optimistic) {
          queryClient.setQueryData(queryKey, context?.previousData)
        }
        toast.error(errorMessage)
        onErrorCallback?.(error, params)
      },

      onSettled: () => {
        queryClient.invalidateQueries({ queryKey })
      },
    })
  }
}