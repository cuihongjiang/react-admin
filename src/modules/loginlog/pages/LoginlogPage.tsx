/**
 * 登录日志管理页：搜索 + TanStack Table 分页列表 + 新增/编辑弹窗 + 删除
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

import { SearchInput } from '@/core/components/table-toolbar'

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



import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { LoginlogApi, type LoginlogRecord } from '../api'

const formSchema = z.object({

  sort: z.string().optional(),

  username: z.string().optional(),

  ip: z.string().optional(),

  agent: z.string().optional(),

  browser: z.string().optional(),

  os: z.string().optional(),

  continent: z.string().optional(),

  country: z.string().optional(),

  province: z.string().optional(),

  city: z.string().optional(),

  district: z.string().optional(),

  isp: z.string().optional(),

  area_code: z.string().optional(),

  country_english: z.string().optional(),

  country_code: z.string().optional(),

  longitude: z.string().optional(),

  latitude: z.string().optional(),

  login_type: z.string().optional(),

})

type FormValues = z.infer<typeof formSchema>

export default function LoginlogPage() {
  const queryClient = useQueryClient()

  const [search, setSearch] = useState<Record<string, string>>({})

  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [editing, setEditing] = useState<LoginlogRecord | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState<LoginlogRecord | null>(null)



  // 字典 label 列依赖组件内的 useDict，故列定义置于组件内
  const columnsDef: ColumnDef<LoginlogRecord>[] = [


    { accessorKey: 'sort', header: '显示排序' },



    { accessorKey: 'username', header: '登录用户名' },



    { accessorKey: 'ip', header: '登录ip' },



    { accessorKey: 'agent', header: 'agent信息' },



    { accessorKey: 'browser', header: '浏览器名' },



    { accessorKey: 'os', header: '操作系统' },



    { accessorKey: 'continent', header: '州' },



    { accessorKey: 'country', header: '国家' },



    { accessorKey: 'province', header: '省份' },



    { accessorKey: 'city', header: '城市' },



    { accessorKey: 'district', header: '县区' },



    { accessorKey: 'isp', header: '运营商' },



    { accessorKey: 'area_code', header: '区域代码' },



    { accessorKey: 'country_english', header: '英文全称' },



    { accessorKey: 'country_code', header: '简称' },



    { accessorKey: 'longitude', header: '经度' },



    { accessorKey: 'latitude', header: '纬度' },



    { accessorKey: 'login_type', header: '登录类型' },


  ]

  const params: Record<string, unknown> = { page, page_size: pageSize, ...search }

  const listQuery = useQuery({
    queryKey: ['loginlog-list', params],
    queryFn: () => LoginlogApi.list(params),
  })

  const table = useReactTable({
    data: listQuery.data?.items ?? [],
    columns: columnsDef,
    getCoreRowModel: getCoreRowModel(),
  })

  const form = useForm<FormValues>({
    // zod coerce 输入输出类型不一致，这里做一次断言抹平
    resolver: zodResolver(formSchema) as unknown as Resolver<FormValues>,
    defaultValues: {sort: '', username: '', ip: '', agent: '', browser: '', os: '', continent: '', country: '', province: '', city: '', district: '', isp: '', area_code: '', country_english: '', country_code: '', longitude: '', latitude: '', login_type: ''},
  })

  function openCreate() {
    setEditing(null)
    form.reset({sort: '', username: '', ip: '', agent: '', browser: '', os: '', continent: '', country: '', province: '', city: '', district: '', isp: '', area_code: '', country_english: '', country_code: '', longitude: '', latitude: '', login_type: ''})
    setDialogOpen(true)
  }

  function openEdit(row: LoginlogRecord) {
    setEditing(row)
    form.reset({sort: row.sort ?? '', username: row.username ?? '', ip: row.ip ?? '', agent: row.agent ?? '', browser: row.browser ?? '', os: row.os ?? '', continent: row.continent ?? '', country: row.country ?? '', province: row.province ?? '', city: row.city ?? '', district: row.district ?? '', isp: row.isp ?? '', area_code: row.area_code ?? '', country_english: row.country_english ?? '', country_code: row.country_code ?? '', longitude: row.longitude ?? '', latitude: row.latitude ?? '', login_type: row.login_type ?? '' })
    setDialogOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) =>
      editing ? LoginlogApi.update(editing.id, values) : LoginlogApi.create(values),
    onSuccess: () => {
      toast.success(editing ? '修改成功' : '新增成功')
      setDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['loginlog-list'] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => LoginlogApi.remove(id),
    onSuccess: () => {
      toast.success('删除成功')
      setDeleting(null)
      queryClient.invalidateQueries({ queryKey: ['loginlog-list'] })
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
            placeholder="按登录用户名搜索"
            value={search['username'] ?? ''}
            onChange={(e) => {
              setSearch((s) => ({ ...s, username: e.target.value }))
              setPage(1)
            }}
          />

          <Auth code="loginlog:add">
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
                        <Auth code="loginlog:update">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(row.original)}>
                            <Pencil className="size-4" />
                          </Button>
                        </Auth>
                        <Auth code="loginlog:delete">
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
            <DialogTitle>{editing ? '编辑登录日志' : '新增登录日志'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
              className="space-y-4"
            >

              <FormField
                control={form.control}
                name="sort"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>显示排序</FormLabel>
                    <FormControl>

                      <Input placeholder="请输入显示排序" {...field} />

                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>登录用户名</FormLabel>
                    <FormControl>

                      <Input placeholder="请输入登录用户名" {...field} />

                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>登录ip</FormLabel>
                    <FormControl>

                      <Input placeholder="请输入登录ip" {...field} />

                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="agent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>agent信息</FormLabel>
                    <FormControl>

                      <Input placeholder="请输入agent信息" {...field} />

                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="browser"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>浏览器名</FormLabel>
                    <FormControl>

                      <Input placeholder="请输入浏览器名" {...field} />

                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="os"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>操作系统</FormLabel>
                    <FormControl>

                      <Input placeholder="请输入操作系统" {...field} />

                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="continent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>州</FormLabel>
                    <FormControl>

                      <Input placeholder="请输入州" {...field} />

                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>国家</FormLabel>
                    <FormControl>

                      <Input placeholder="请输入国家" {...field} />

                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="province"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>省份</FormLabel>
                    <FormControl>

                      <Input placeholder="请输入省份" {...field} />

                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>城市</FormLabel>
                    <FormControl>

                      <Input placeholder="请输入城市" {...field} />

                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>县区</FormLabel>
                    <FormControl>

                      <Input placeholder="请输入县区" {...field} />

                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>运营商</FormLabel>
                    <FormControl>

                      <Input placeholder="请输入运营商" {...field} />

                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="area_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>区域代码</FormLabel>
                    <FormControl>

                      <Input placeholder="请输入区域代码" {...field} />

                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country_english"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>英文全称</FormLabel>
                    <FormControl>

                      <Input placeholder="请输入英文全称" {...field} />

                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>简称</FormLabel>
                    <FormControl>

                      <Input placeholder="请输入简称" {...field} />

                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>经度</FormLabel>
                    <FormControl>

                      <Input placeholder="请输入经度" {...field} />

                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>纬度</FormLabel>
                    <FormControl>

                      <Input placeholder="请输入纬度" {...field} />

                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="login_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>登录类型</FormLabel>
                    <FormControl>

                      <Input placeholder="请输入登录类型" {...field} />

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
            确定删除该登录日志记录吗？此操作不可恢复。
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
