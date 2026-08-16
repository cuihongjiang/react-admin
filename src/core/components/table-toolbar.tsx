/**
 * 列表页工具栏：与表格同卡片顶部的筛选/操作行
 * 各低代码列表页共用，搜索框 / 新增按钮 / 计数徽章的样式统一在此维护
 */
import { Search, X } from 'lucide-react'
import type { ChangeEvent, ComponentProps } from 'react'

import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

function TableToolbar({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="table-toolbar"
      className={cn(
        'flex flex-wrap items-center gap-2.5 border-b px-4 py-3',
        className,
      )}
      {...props}
    />
  )
}

function SearchInput({ className, value, onChange, ...props }: ComponentProps<'input'>) {
  function clear() {
    // 合成空值事件复用页面传入的 onChange，清空时同样触发重置页码
    const event = { target: { value: '' }, currentTarget: { value: '' } } as ChangeEvent<HTMLInputElement>
    onChange?.(event)
  }

  return (
    <div className={cn('relative w-56', className)}>
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input className="pr-8 pl-8" value={value} onChange={onChange} {...props} />
      {value ? (
        <button
          type="button"
          aria-label="清空搜索"
          onClick={clear}
          className="absolute top-1/2 right-2 flex size-5 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  )
}

function ToolbarCount({ total, className }: { total: number; className?: string }) {
  return (
    <Badge
      variant="secondary"
      className={cn('ml-auto font-normal text-muted-foreground', className)}
    >
      共 {total} 条
    </Badge>
  )
}

export { SearchInput, TableToolbar, ToolbarCount }
