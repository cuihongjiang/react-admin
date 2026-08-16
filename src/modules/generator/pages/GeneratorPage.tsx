/**
 * 低代码生成器页：选择数据表 → 配置字段 → 保存模板
 * → 预览 / 下载生成的 React 模块代码 → 一键生成菜单 + 按钮权限
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
import { Code2, Copy, Download, ListPlus, Pencil, Plus, Server, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Auth } from '@/core/components/auth'
import { SearchInput, TableToolbar, ToolbarCount } from '@/core/components/table-toolbar'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import {
  GeneratorApi,
  type FieldComponent,
  type FormFieldConfig,
  type GeneratorTable,
  type GeneratorTemplateInput,
  type GeneratorTemplateRecord,
  type TableFieldConfig,
} from '../api'

const FIELD_NAME_RE = /^[a-z][a-z0-9_]*$/

/** 编辑态字段行：表格列配置与表单配置合并到一张表里编辑 */
interface FieldRow {
  field: string
  title: string
  is_list: boolean
  is_search: boolean
  is_form: boolean
  required: boolean
  component: FieldComponent
  dict_code: string
}

const COMPONENT_OPTIONS: { value: FieldComponent; label: string }[] = [
  { value: 'input', label: '输入框' },
  { value: 'number', label: '数字' },
  { value: 'select', label: '下拉' },
  { value: 'switch', label: '开关' },
  { value: 'textarea', label: '文本域' },
]

/** 审计字段默认不勾选列表 / 表单（仍可手动勾选） */
const AUDIT_FIELDS = new Set([
  'id',
  'creator',
  'creator_name',
  'modifier',
  'modifier_name',
  'belong_dept',
  'create_datetime',
  'update_datetime',
  'description',
  'remark',
])

function toFieldRows(fields: { field: string; title: string }[]): FieldRow[] {
  return fields.map((f) => {
    const audited = AUDIT_FIELDS.has(f.field)
    return {
      field: f.field,
      title: f.title,
      is_list: !audited,
      is_search: false,
      is_form: !audited,
      required: false,
      component: 'input' as FieldComponent,
      dict_code: '',
    }
  })
}

/** 编辑已有模板：table_info ∪ form_info 按字段名合并还原编辑行 */
function mergeConfigRows(record: GeneratorTemplateRecord): FieldRow[] {
  const byField = new Map<string, FieldRow>()
  for (const c of record.table_info ?? []) {
    byField.set(c.field, {
      field: c.field,
      title: c.title,
      is_list: Boolean(c.is_list),
      is_search: Boolean(c.is_search),
      is_form: false,
      required: false,
      component: 'input',
      dict_code: '',
    })
  }
  for (const f of record.form_info ?? []) {
    const row = byField.get(f.field) ?? {
      field: f.field,
      title: f.title,
      is_list: false,
      is_search: false,
      is_form: false,
      required: false,
      component: 'input' as FieldComponent,
      dict_code: '',
    }
    byField.set(f.field, {
      ...row,
      is_form: true,
      required: Boolean(f.required),
      component: (f.component ?? 'input') as FieldComponent,
      dict_code: f.dict_code ?? '',
    })
  }
  return [...byField.values()]
}

function formatDatetime(value?: string) {
  return value ? value.slice(0, 16).replace('T', ' ') : '-'
}

export default function GeneratorPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState<Record<string, string>>({})
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)

  // ---- 配置编辑弹窗 ----
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<GeneratorTemplateRecord | null>(null)
  const [form, setForm] = useState({
    name: '',
    code: '',
    app_label: '',
    model_name: '',
    tableKey: '',
    isNewTable: false,
  })
  const [rows, setRows] = useState<FieldRow[]>([])

  const [previewing, setPreviewing] = useState<GeneratorTemplateRecord | null>(null)
  const [menuTarget, setMenuTarget] = useState<GeneratorTemplateRecord | null>(null)
  const [backendTarget, setBackendTarget] = useState<GeneratorTemplateRecord | null>(null)
  const [deleting, setDeleting] = useState<GeneratorTemplateRecord | null>(null)

  const params: Record<string, unknown> = { page, page_size: pageSize, ...search }
  const listQuery = useQuery({
    queryKey: ['generator-list', params],
    queryFn: () => GeneratorApi.list(params),
  })

  const tablesQuery = useQuery({
    queryKey: ['generator-tables'],
    queryFn: GeneratorApi.tables,
  })
  const tables: GeneratorTable[] = tablesQuery.data ?? []
  const tableKey = (t: GeneratorTable) => `${t.app_label}.${t.model}`

  const columnsDef: ColumnDef<GeneratorTemplateRecord>[] = [
    { accessorKey: 'name', header: '模板名称' },
    {
      accessorKey: 'code',
      header: '模板编码',
      cell: ({ row }) => <code className="text-xs">{row.original.code}</code>,
    },
    {
      id: 'table',
      header: '数据表',
      cell: ({ row }) =>
        row.original.app_label && row.original.model_name ? (
          <span className="text-muted-foreground">
            {row.original.app_label}.{row.original.model_name}
          </span>
        ) : (
          '-'
        ),
    },
    {
      id: 'status',
      header: '状态',
      cell: ({ row }) => (
        <div className="flex gap-1">
          {row.original.has_backend ? <Badge>后端</Badge> : null}
          {row.original.has_menu ? <Badge variant="secondary">菜单</Badge> : null}
          {!row.original.has_backend && !row.original.has_menu ? (
            <Badge variant="outline" className="text-muted-foreground">
              未生成
            </Badge>
          ) : null}
        </div>
      ),
    },
    {
      accessorKey: 'create_datetime',
      header: '创建时间',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{formatDatetime(row.original.create_datetime)}</span>
      ),
    },
  ]

  const table = useReactTable({
    data: listQuery.data?.items ?? [],
    columns: columnsDef,
    getCoreRowModel: getCoreRowModel(),
  })

  function openCreate() {
    setEditing(null)
    setForm({ name: '', code: '', app_label: '', model_name: '', tableKey: '', isNewTable: false })
    setRows([])
    setDialogOpen(true)
  }

  function openEdit(record: GeneratorTemplateRecord) {
    setEditing(record)
    setForm({
      name: record.name ?? '',
      code: record.code ?? '',
      app_label: record.app_label ?? '',
      model_name: record.model_name ?? '',
      tableKey: record.app_label && record.model_name ? `${record.app_label}.${record.model_name}` : '',
      isNewTable: Boolean(record.is_new_table),
    })
    setRows(mergeConfigRows(record))
    setDialogOpen(true)
  }

  /** 切换「选择已有表 / 新建数据表」模式，字段行重置 */
  function switchMode(isNewTable: boolean) {
    setForm((f) => ({
      ...f,
      isNewTable,
      tableKey: '',
      app_label: isNewTable ? 'system' : '',
      model_name: isNewTable ? '' : f.model_name,
    }))
    setRows([])
  }

  function onTableChange(key: string) {
    const t = tables.find((item) => tableKey(item) === key)
    if (!t) return
    setForm({
      name: t.title || t.model,
      // 后端路由前缀用模型名小写（如 OperationLog → operationlog）
      code: t.model.toLowerCase(),
      app_label: t.app_label,
      model_name: t.model,
      tableKey: key,
      isNewTable: false,
    })
    setRows(toFieldRows(t.fields))
  }

  const saveMutation = useMutation({
    mutationFn: (values: GeneratorTemplateInput) =>
      editing ? GeneratorApi.update(editing.id, values) : GeneratorApi.create(values),
    onSuccess: () => {
      toast.success(editing ? '配置已更新' : '配置已保存，可预览代码或生成菜单')
      setDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['generator-list'] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  function saveConfig() {
    if (!form.name.trim()) return toast.error('请输入模板名称')
    if (!form.code.trim()) return toast.error('请输入模板编码')
    if (!rows.length) return toast.error(form.isNewTable ? '请先添加字段' : '请先选择数据表')
    if (form.isNewTable) {
      const seen = new Set<string>()
      for (const r of rows) {
        if (!FIELD_NAME_RE.test(r.field))
          return toast.error(`字段名「${r.field || '（空）'}」不合法：小写字母开头，仅字母/数字/下划线`)
        if (seen.has(r.field)) return toast.error(`字段名重复：${r.field}`)
        seen.add(r.field)
        if (!r.title.trim()) return toast.error(`请为字段 ${r.field} 填写标题`)
      }
      if (!rows.some((r) => r.is_form))
        return toast.error('新建数据表至少需要一个表单字段（字段即表列）')
    }
    const table_info: TableFieldConfig[] = rows
      .filter((r) => r.is_list || r.is_search)
      .map(({ field, title, is_list, is_search }) => ({ field, title, is_list, is_search }))
    const form_info: FormFieldConfig[] = rows
      .filter((r) => r.is_form)
      .map(({ field, title, component, required, dict_code }) => ({
        field,
        title,
        component,
        required,
        dict_code: dict_code || undefined,
      }))
    saveMutation.mutate({
      name: form.name.trim(),
      code: form.code.trim(),
      app_label: form.isNewTable ? 'system' : form.app_label || undefined,
      model_name: form.isNewTable ? undefined : form.model_name || undefined,
      table_info,
      form_info,
      is_new_table: form.isNewTable,
    })
  }

  async function downloadZip(record: GeneratorTemplateRecord) {
    try {
      const resp = await GeneratorApi.download(record.id, 'react')
      const url = URL.createObjectURL(resp.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `${record.code}.zip`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('代码包已下载')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '下载失败')
    }
  }

  const deleteMutation = useMutation({
    mutationFn: (id: number) => GeneratorApi.remove(id),
    onSuccess: () => {
      toast.success('删除成功')
      setDeleting(null)
      queryClient.invalidateQueries({ queryKey: ['generator-list'] })
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
            placeholder="按模板名称搜索"
            value={search['name'] ?? ''}
            onChange={(e) => {
              setSearch((s) => ({ ...s, name: e.target.value }))
              setPage(1)
            }}
          />
          <Auth code="generator:add">
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
                <TableHead className="w-72 text-right">操作</TableHead>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          title="预览代码"
                          onClick={() => setPreviewing(row.original)}
                        >
                          <Code2 className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="下载代码包"
                          onClick={() => downloadZip(row.original)}
                        >
                          <Download className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="生成后端（建表+接口，幂等）"
                          onClick={() => setBackendTarget(row.original)}
                        >
                          <Server className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="生成菜单和按钮权限"
                          onClick={() => setMenuTarget(row.original)}
                        >
                          <ListPlus className="size-4" />
                        </Button>
                        <Auth code="generator:update">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(row.original)}>
                            <Pencil className="size-4" />
                          </Button>
                        </Auth>
                        <Auth code="generator:delete">
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

      {/* 新增 / 编辑配置 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? '编辑生成配置' : '新增生成配置'}</DialogTitle>
            <DialogDescription>
              选择数据表并配置字段，保存后可预览 / 下载代码并一键生成菜单
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              {(
                [
                  [false, '选择已有表'],
                  [true, '新建数据表'],
                ] as const
              ).map(([mode, label]) => (
                <Button
                  key={label}
                  size="sm"
                  variant={form.isNewTable === mode ? 'default' : 'outline'}
                  onClick={() => switchMode(mode)}
                >
                  {label}
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {form.isNewTable ? (
                <p className="col-span-2 text-sm text-muted-foreground">
                  数据表 <code className="text-xs">system_{form.code || '{编码}'}</code> · 接口前缀{' '}
                  <code className="text-xs">/api/{form.code || '{编码}'}/</code>{' '}
                  · 点击「生成后端」时自动建表并注册接口
                </p>
              ) : (
                <div className="col-span-2 grid gap-1.5">
                  <span className="text-sm font-medium">数据表</span>
                  <Select value={form.tableKey} onValueChange={onTableChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="请选择要生成的模型表" />
                    </SelectTrigger>
                    <SelectContent>
                      {tables.map((t) => (
                        <SelectItem key={tableKey(t)} value={tableKey(t)}>
                          {t.title || t.model}（{tableKey(t)}）
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid gap-1.5">
                <span className="text-sm font-medium">模板名称</span>
                <Input
                  placeholder="如：操作日志"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="grid gap-1.5">
                <span className="text-sm font-medium">模板编码</span>
                <Input
                  placeholder="如：operationlog"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                />
              </div>
              {!form.isNewTable ? (
                <p className="col-span-2 text-xs text-muted-foreground">
                  {form.app_label && form.model_name
                    ? `来源：应用 ${form.app_label} · 模型 ${form.model_name} · 接口前缀 /api/${form.code}/`
                    : '选择数据表后自动填充名称 / 编码 / 应用 / 模型'}
                </p>
              ) : null}
            </div>

            <div className="grid gap-1.5">
              <span className="text-sm font-medium">字段配置</span>
              <FieldConfigTable rows={rows} onChange={setRows} editable={form.isNewTable} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={saveConfig} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 预览代码 */}
      <PreviewDialog template={previewing} onClose={() => setPreviewing(null)} />

      {/* 生成后端 */}
      <BackendCreateDialog template={backendTarget} onClose={() => setBackendTarget(null)} />

      {/* 生成菜单 */}
      <MenuCreateDialog template={menuTarget} onClose={() => setMenuTarget(null)} />

      {/* 删除确认 */}
      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            确定删除配置「{deleting?.name}」吗？已生成的菜单不受影响。
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

/** 字段配置表格：列表列 / 搜索项 / 表单项 / 必填 / 组件 / 字典编码
 *  editable（新建数据表模式）时字段名可编辑、支持增删行，组件类型即表列类型 */
function FieldConfigTable({
  rows,
  onChange,
  editable = false,
}: {
  rows: FieldRow[]
  onChange: (rows: FieldRow[]) => void
  editable?: boolean
}) {
  function update(index: number, patch: Partial<FieldRow>) {
    onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  function addRow() {
    onChange([
      ...rows,
      {
        field: '',
        title: '',
        is_list: true,
        is_search: false,
        is_form: true,
        required: false,
        component: 'input',
        dict_code: '',
      },
    ])
  }

  if (!rows.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed py-6 text-sm text-muted-foreground">
        {editable ? '尚无字段，点击下方按钮添加' : '请先选择数据表'}
        {editable ? (
          <Button variant="outline" size="sm" onClick={addRow}>
            <Plus className="size-4" />
            添加字段
          </Button>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="max-h-72 overflow-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur">
            <tr className="[&>th]:h-9 [&>th]:px-2 [&>th]:text-left [&>th]:text-xs [&>th]:font-medium">
              <th className={editable ? 'w-32' : ''}>字段</th>
              <th className="w-36">标题</th>
              <th className="w-14 text-center">列表</th>
              <th className="w-14 text-center">搜索</th>
              <th className="w-14 text-center">表单</th>
              <th className="w-14 text-center">必填</th>
              <th className="w-24">{editable ? '类型' : '组件'}</th>
              <th className="w-28">字典编码</th>
              {editable ? <th className="w-10" /> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.field || i} className="border-t [&>td]:px-2 [&>td]:py-1.5">
                <td>
                  {editable ? (
                    <Input
                      className="h-8 font-mono text-xs"
                      placeholder="field_name"
                      value={row.field}
                      onChange={(e) => update(i, { field: e.target.value })}
                    />
                  ) : (
                    <code className="text-xs">{row.field}</code>
                  )}
                </td>
                <td>
                  <Input
                    className="h-8"
                    value={row.title}
                    onChange={(e) => update(i, { title: e.target.value })}
                  />
                </td>
                {(
                  [
                    ['is_list', '列表'],
                    ['is_search', '搜索'],
                    ['is_form', '表单'],
                    ['required', '必填'],
                  ] as const
                ).map(([key]) => (
                  <td key={key} className="text-center">
                    <input
                      type="checkbox"
                      aria-label={`${row.field || i} ${key}`}
                      className="size-4 accent-primary"
                      checked={row[key]}
                      disabled={key === 'required' && !row.is_form}
                      onChange={(e) => update(i, { [key]: e.target.checked } as Partial<FieldRow>)}
                    />
                  </td>
                ))}
                <td>
                  <Select
                    value={row.component}
                    onValueChange={(v) => update(i, { component: v as FieldComponent })}
                    disabled={!editable && !row.is_form}
                  >
                    <SelectTrigger className="h-8 w-full text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPONENT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td>
                  <Input
                    className="h-8 text-xs"
                    placeholder="下拉时填写"
                    value={row.dict_code}
                    disabled={row.component !== 'select'}
                    onChange={(e) => update(i, { dict_code: e.target.value })}
                  />
                </td>
                {editable ? (
                  <td>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive"
                      aria-label="删除字段"
                      onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editable ? (
        <Button variant="outline" size="sm" onClick={addRow}>
          <Plus className="size-4" />
          添加字段
        </Button>
      ) : null}
    </div>
  )
}

/** 代码预览弹窗：技术栈切换 + 文件列表 + 内容查看 */
function PreviewDialog({
  template,
  onClose,
}: {
  template: GeneratorTemplateRecord | null
  onClose: () => void
}) {
  const [frontend, setFrontend] = useState<'react' | 'vue'>('react')
  const [active, setActive] = useState(0)

  const query = useQuery({
    queryKey: ['generator-preview', template?.id, frontend],
    queryFn: () => GeneratorApi.preview(template!.id, frontend),
    enabled: !!template,
  })
  const files = query.data ?? []
  const current = files[Math.min(active, files.length - 1)]

  async function copyCurrent() {
    if (!current) return
    await navigator.clipboard.writeText(current.content)
    toast.success('已复制到剪贴板')
  }

  return (
    <Dialog open={!!template} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-3 sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>代码预览 · {template?.name}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2">
          {(['react', 'vue'] as const).map((fw) => (
            <Button
              key={fw}
              size="sm"
              variant={frontend === fw ? 'default' : 'outline'}
              onClick={() => {
                setFrontend(fw)
                setActive(0)
              }}
            >
              {fw === 'react' ? 'React' : 'Vue'}
            </Button>
          ))}
          <Button size="sm" variant="ghost" className="ml-auto" onClick={copyCurrent}>
            <Copy className="size-4" />
            复制
          </Button>
        </div>
        <div className="flex min-h-0 flex-1 gap-3">
          <div className="w-56 shrink-0 overflow-auto rounded-md border p-1">
            {query.isLoading ? (
              <p className="p-2 text-sm text-muted-foreground">生成中...</p>
            ) : (
              files.map((file, i) => (
                <button
                  key={file.path}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`flex w-full items-center gap-1.5 rounded-sm px-2 py-1.5 text-left text-xs ${
                    current?.path === file.path
                      ? 'bg-accent font-medium'
                      : 'text-muted-foreground hover:bg-accent/50'
                  }`}
                >
                  <Code2 className="size-3.5 shrink-0" />
                  <span className="truncate">{file.path}</span>
                </button>
              ))
            )}
          </div>
          <pre className="min-w-0 flex-1 overflow-auto rounded-md bg-muted/50 p-3 font-mono text-xs leading-relaxed whitespace-pre">
            {current?.content ?? ''}
          </pre>
        </div>
        {query.isError ? (
          <p className="text-sm text-destructive">{(query.error as Error)?.message ?? '预览失败'}</p>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

/** 生成后端弹窗：幂等落地数据表 + 接口，打开即执行并展示各资源 created/exists 报告 */
function BackendCreateDialog({
  template,
  onClose,
}: {
  template: GeneratorTemplateRecord | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['generator-backend-create', template?.id],
    queryFn: () => GeneratorApi.backendCreate(template!.id),
    enabled: !!template,
    retry: false,
  })

  // 落地成功后刷新列表徽章（接口幂等，重复执行无副作用）
  useEffect(() => {
    if (query.isSuccess) queryClient.invalidateQueries({ queryKey: ['generator-list'] })
  }, [query.isSuccess, query.data, queryClient])

  const REPORT_LABELS: Record<string, string> = {
    table: '数据表',
    model: '模型文件',
    model_export: '模型导出',
    serializer: '序列化器',
    viewset: '视图集',
    router: '路由注册',
  }
  const report = query.data ?? {}

  return (
    <Dialog open={!!template} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>生成后端 · {template?.name}</DialogTitle>
          <DialogDescription>
            {template?.is_new_table
              ? '自动创建数据表并写入接口代码，全部幂等：已存在的资源直接复用'
              : '已有模型的接口天然存在，仅确认模型与路由可用'}
          </DialogDescription>
        </DialogHeader>
        {query.isPending ? (
          <p className="py-4 text-center text-sm text-muted-foreground">正在落地面...</p>
        ) : query.isError ? (
          <p className="text-sm text-destructive">
            {(query.error as Error)?.message ?? '落地失败'}
          </p>
        ) : (
          <div className="space-y-2">
            {Object.entries(report).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between text-sm">
                <span>{REPORT_LABELS[key] ?? key}</span>
                {value === 'created' ? (
                  <Badge>已创建</Badge>
                ) : value === 'exists' ? (
                  <Badge variant="secondary">复用已有</Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    跳过
                  </Badge>
                )}
              </div>
            ))}
            <p className="pt-1 text-xs text-muted-foreground">
              文件写入后开发服务器自动重载生效；生产环境需重启后端服务。
            </p>
          </div>
        )}
        <DialogFooter>
          {query.isError ? (
            <Button variant="outline" onClick={() => query.refetch()}>
              重试
            </Button>
          ) : null}
          <Button variant={query.isSuccess ? 'outline' : 'default'} onClick={onClose}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** 生成菜单弹窗：选择上级菜单 + 授权角色 */
function MenuCreateDialog({
  template,
  onClose,
}: {
  template: GeneratorTemplateRecord | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [parentKey, setParentKey] = useState('root')
  const [roleIds, setRoleIds] = useState<number[]>([])

  const menusQuery = useQuery({
    queryKey: ['generator-menu-options'],
    queryFn: GeneratorApi.menuOptions,
    enabled: !!template,
  })
  const rolesQuery = useQuery({
    queryKey: ['generator-role-options'],
    queryFn: GeneratorApi.roleOptions,
    enabled: !!template,
  })

  const directories = (menusQuery.data ?? []).filter((m) => m.type === 0 && m.status !== false)
  const roles = rolesQuery.data ?? []

  const createMutation = useMutation({
    mutationFn: () =>
      GeneratorApi.menuCreate(template!.id, {
        parent_id: parentKey === 'root' ? undefined : Number(parentKey),
        role_ids: roleIds,
      }),
    onSuccess: (result) => {
      toast.success(result.created ? '菜单已生成，刷新侧边栏可见' : '菜单已存在，按钮权限已补全')
      onClose()
      setParentKey('root')
      setRoleIds([])
      queryClient.invalidateQueries({ queryKey: ['generator-list'] })
      // 菜单树 / 权限变更后刷新侧边栏与按钮权限
      queryClient.invalidateQueries({ queryKey: ['route-tree'] })
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <Dialog open={!!template} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>生成菜单 · {template?.name}</DialogTitle>
          <DialogDescription>
            为「/{template?.code}/index」创建菜单和增删改查按钮权限，重复执行不会重复创建
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-1.5">
            <span className="text-sm font-medium">上级菜单</span>
            <Select value={parentKey} onValueChange={setParentKey}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">顶级菜单</SelectItem>
                {directories.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>
                    {m.title}（{m.path}）
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <span className="text-sm font-medium">授权角色（可选）</span>
            {roles.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无可授权角色</p>
            ) : (
              <div className="max-h-40 space-y-1 overflow-auto rounded-md border p-3">
                {roles.map((role) => (
                  <label key={role.id} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="size-4 accent-primary"
                      checked={roleIds.includes(role.id)}
                      onChange={(e) =>
                        setRoleIds((ids) =>
                          e.target.checked ? [...ids, role.id] : ids.filter((id) => id !== role.id),
                        )
                      }
                    />
                    {role.name}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
            {createMutation.isPending ? '生成中...' : '生成'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
