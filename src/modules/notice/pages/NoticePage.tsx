/**
 * 公告管理管理页：搜索 + TanStack Table 分页列表 + 新增/编辑弹窗 + 删除
 * 由低代码生成器生成，可在此基础上精修
 */
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Auth } from '@/core/components/auth'

import { TableToolbar, ToolbarCount } from '@/core/components/table-toolbar'


import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

import { Input } from '@/components/ui/input'



import { Switch } from '@/components/ui/switch'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { NoticeApi, type NoticeRecord } from '../api'

const formSchema = z.object({

  title: z.string().optional(),

  content: z.string().optional(),

  status: z.boolean(),

  sort: z.coerce.number().optional(),

})

type FormValues = z.infer<typeof formSchema>

export default function NoticePage() {
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [editing, setEditing] = useState<NoticeRecord | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState<NoticeRecord | null>(null)



  // 字典 label 列依赖组件内的 useDict，故列定义置于组件内
  const columnsDef: ColumnDef<NoticeRecord>[] = [


    { accessorKey: 'title', header: '标题' },



    { accessorKey: 'content', header: '内容' },



    { accessorKey: 'status', header: '状态' },



    { accessorKey: 'sort', header: '排序' },


  ]

  const params: Record<string, unknown> = { page, page_size: pageSize }

  const listQuery = useQuery({
    queryKey: ['notice-list', params],
    queryFn: () => NoticeApi.list(params),
  })

  const table = useReactTable({
    data: listQuery.data?.items ?? [],
    columns: columnsDef,
    getCoreRowModel: getCoreRowModel(),
  })

  const form = useForm<FormValues>({
    // zod coerce 输入输出类型不一致，这里做一次断言抹平
    resolver: zodResolver(formSchema) as unknown as Resolver<FormValues>,
    defaultValues: {title: '', content: '', status: false, sort: 0},
  })

  function openCreate() {
    setEditing(null)
    form.reset({title: '', content: '', status: false, sort: 0})
    setDialogOpen(true)
  }

  function openEdit(row: NoticeRecord) {
    setEditing(row)
    form.reset({title: row.title ?? '', content: row.content ?? '', status: row.status ?? false, sort: row.sort ?? 0 })
    setDialogOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) =>
      editing ? NoticeApi.update(editing.id, values) : NoticeApi.create(values),
    onSuccess: () => {
      toast.success(editing ? '修改成功' : '新增成功')
      setDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['notice-list'] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => NoticeApi.remove(id),
    onSuccess: () => {
      toast.success('删除成功')
      setDeleting(null)
      queryClient.invalidateQueries({ queryKey: ['notice-list'] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const total = listQuery.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="space-y-4">
      <Card className="gap-0 py-0">
        <TableToolbar>

          <Auth code="notice:add">
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              新增
            </Button>
          </Auth>
          <ToolbarCount total={total} />
        </TableToolbar>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {table.getHeaderGroups()[0]?.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
                <TableHead className="w-32 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={columnsDef.length + 1} className="h-24 text-center">
                    加载中...
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columnsDef.length + 1} className="h-24 text-center">
                    暂无数据
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.original.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell ?? null, cell.getContext())}
                      </TableCell>
                    ))}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Auth code="notice:update">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(row.original)}>
                            <Pencil className="size-4" />
                          </Button>
                        </Auth>
                        <Auth code="notice:delete">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleting(row.original)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </Auth>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          上一页
        </Button>
        <span className="text-sm text-muted-foreground">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          下一页
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? '编辑公告管理' : '新增公告管理'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
              className="space-y-4"
            >

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>标题</FormLabel>
                    <FormControl>

                      <Input placeholder="请输入标题" {...field} />

                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>内容</FormLabel>
                    <FormControl>

                      <Input placeholder="请输入内容" {...field} />

                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>状态</FormLabel>
                    <FormControl>

                      <Switch
                        checked={Boolean(field.value)}
                        onCheckedChange={field.onChange}
                      />

                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sort"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>排序</FormLabel>
                    <FormControl>

                      <Input type="number" placeholder="请输入排序" {...field} />

                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? '保存中...' : '确定'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            确定删除该公告管理记录吗？此操作不可恢复。
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              取消
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleting && deleteMutation.mutate(deleting.id)}
            >
              {deleteMutation.isPending ? '删除中...' : '删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
