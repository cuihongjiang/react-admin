/**
 * 角色管理管理页：搜索 + TanStack Table 分页列表 + 新增/编辑弹窗 + 删除
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
import { SearchInput, TableToolbar, ToolbarCount } from '@/core/components/table-toolbar'

import { useDict } from '@/core/hooks/use-dict'


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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'


import { Switch } from '@/components/ui/switch'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { RoleApi, type RoleRecord } from '../api'

import { createToggleMutation } from '@/hooks/mutations'

const formSchema = z.object({

  name: z.string().min(1, '请输入角色名称'),

  code: z.string().min(1, '请输入角色编码'),

  status: z.boolean(),

  data_range: z.string().min(1, '请选择数据权限范围'),

})

type FormValues = z.infer<typeof formSchema>

/**
 * 切换角色状态
 */
const useToggleRoleStatus = createToggleMutation({
  updateFn: (id, value) => RoleApi.update(id, value),
  queryKey: ['role-list'],
  dataField: 'data',  // 如果数据在 old.data 中
  successMessage: '角色状态已更新',
  errorMessage: '角色状态更新失败',
})

export default function RolePage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState<Record<string, string>>({})
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [editing, setEditing] = useState<RoleRecord | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState<RoleRecord | null>(null)

  const toggleStatusMutation = useToggleRoleStatus()

  const { data: dictDataRange } = useDict('data_range')
  const dictLabelDataRange = (v: unknown) =>
    dictDataRange?.find((i) => i.value === String(v))?.label ?? String(v ?? '-')


  // 字典 label 列依赖组件内的 useDict，故列定义置于组件内
  const columnsDef: ColumnDef<RoleRecord>[] = [


    { accessorKey: 'name', header: '角色名称' },



    { accessorKey: 'code', header: '角色编码' },



    { accessorKey: 'status', header: '状态',
      cell: ({ row }) => {
        const isActive = row.getValue("status")  // 获取 true/false 值
        return (
          <Switch
            checked={Boolean(isActive)}
            onCheckedChange={() => {
              toggleStatusMutation.mutate({id:row.original.id, value:{code:row.original.code, name:row.original.name, status:!isActive}})
            }}
            disabled={toggleStatusMutation.isPending}
          />
        )
      },
    },



    {
      accessorKey: 'data_range',
      header: '数据权限',
      cell: ({ row }) => dictLabelDataRange(row.original.data_range),
    },


  ]

  const params: Record<string, unknown> = { page, page_size: pageSize, ...search }

  const listQuery = useQuery({
    queryKey: ['role-list', params],
    queryFn: () => RoleApi.list(params),
  })

  const table = useReactTable({
    data: listQuery.data?.items ?? [],
    columns: columnsDef,
    getCoreRowModel: getCoreRowModel(),
  })

  const form = useForm<FormValues>({
    // zod coerce 输入输出类型不一致，这里做一次断言抹平
    resolver: zodResolver(formSchema) as unknown as Resolver<FormValues>,
    defaultValues: {name: '', code: '', status: false, data_range: ''},
  })

  function openCreate() {
    setEditing(null)
    form.reset({name: '', code: '', status: false, data_range: ''})
    setDialogOpen(true)
  }

  function openEdit(row: RoleRecord) {
    setEditing(row)
    form.reset({name: row.name ?? '', code: row.code ?? '', status: row.status ?? false, data_range: row.data_range ?? '' })
    setDialogOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) =>
      editing ? RoleApi.update(editing.id, values) : RoleApi.create(values),
    onSuccess: () => {
      toast.success(editing ? '修改成功' : '新增成功')
      setDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['role-list'] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => RoleApi.remove(id),
    onSuccess: () => {
      toast.success('删除成功')
      setDeleting(null)
      queryClient.invalidateQueries({ queryKey: ['role-list'] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const total = listQuery.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="space-y-4">
      <Card className="gap-0 py-0">
        <TableToolbar>
          <SearchInput
            placeholder="按角色名称搜索"
            value={search['name'] ?? ''}
            onChange={(e) => {
              setSearch((s) => ({ ...s, name: e.target.value }))
              setPage(1)
            }}
          />
          <Auth code="role:add">
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
                        <Auth code="role:update">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(row.original)}>
                            <Pencil className="size-4" />
                          </Button>
                        </Auth>
                        <Auth code="role:delete">
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
            <DialogTitle>{editing ? '编辑角色管理' : '新增角色管理'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
              className="space-y-4"
            >

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>角色名称<span className="text-destructive">*</span></FormLabel>
                    <FormControl>

                      <Input placeholder="请输入角色名称" {...field} />

                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>角色编码<span className="text-destructive">*</span></FormLabel>
                    <FormControl>

                      <Input placeholder="请输入角色编码" {...field} />

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
                name="data_range"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>数据权限范围<span className="text-destructive">*</span></FormLabel>
                    <FormControl>

                      <Select onValueChange={field.onChange} value={String(field.value ?? '')}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="请选择数据权限范围" />
                        </SelectTrigger>
                        <SelectContent>
                          {(dictDataRange ?? []).map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

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
            确定删除该角色管理记录吗？此操作不可恢复。
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
