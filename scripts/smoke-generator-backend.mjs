/**
 * 低代码「新建数据表」全链路 E2E（幂等，可重复运行）：
 * 新建模板（不依赖已有表，自定义字段）→ 保存 → 生成后端（建表+接口，等待 dev 自动重载）
 * → API 直接 CRUD 验证 → 生成菜单 → 侧边栏出现入口
 *
 * 前端模块落地与页面验证见 scripts/apply-generated.mjs + smoke.mjs（需重启 Vite）
 */
import { chromium } from 'playwright'

const BASE = process.env.SMOKE_BASE ?? 'http://localhost:5173'
const API = 'http://127.0.0.1:8000/api'

// ---- API 登录（预清理 + 后续 CRUD 验证共用） ----
const login = await fetch(`${API}/login/`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'superadmin', password: '123456' }),
}).then((r) => r.json())
const token = login.result.accessToken
const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

// 预清理历史 notice 模板
{
  const list = await fetch(`${API}/generator/?code=notice`, { headers: auth }).then((r) => r.json())
  for (const t of list.result.items ?? []) {
    await fetch(`${API}/generator/${t.id}/`, { method: 'DELETE', headers: auth })
  }
}

let pass = 0
let fail = 0
const check = (label, ok) => {
  ok ? pass++ : fail++
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
}

/** 等待后端接口可用（生成后端写文件后 dev 服务器会自动重载，期间连接会短暂失败） */
async function waitApi(path, timeoutMs = 40000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(`${API}${path}`, { headers: auth })
      if (r.ok) return true
    } catch {
      /* 重载中，重试 */
    }
    await new Promise((res) => setTimeout(res, 1000))
  }
  return false
}

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('pageerror', (err) => errors.push(`[pageerror] ${err.message}`))
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`[console.error] ${msg.text()}`)
})

await page.goto(`${BASE}/system/generator`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(1500)
if (page.url().includes('/login')) {
  await page.getByPlaceholder('superadmin').fill('superadmin')
  await page.getByPlaceholder('••••••').fill('123456')
  await page.getByRole('button', { name: /登/ }).click()
  await page.waitForTimeout(2500)
  await page.goto(`${BASE}/system/generator`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
}

// 1. 新增配置（新建数据表模式）
await page.getByRole('button', { name: '新增' }).click()
await page.waitForTimeout(500)
await page.getByRole('button', { name: '新建数据表' }).click()
await page.getByPlaceholder('如：操作日志').fill('公告管理')
await page.getByPlaceholder('如：operationlog').fill('notice')
check('新表模式显示表名预览', await page.getByText('system_notice').isVisible().catch(() => false))

// 2. 添加 4 个字段：标题/内容/状态/排序
await page.getByRole('button', { name: '添加字段' }).click()
const fieldDefs = [
  ['title', '标题', null],
  ['content', '内容', '文本域'],
  ['status', '状态', '开关'],
  ['sort', '排序', '数字'],
]
for (let i = 0; i < fieldDefs.length - 1; i++) {
  await page.getByRole('button', { name: '添加字段' }).click()
}
const tbody = page.getByRole('dialog').locator('tbody')
for (let i = 0; i < fieldDefs.length; i++) {
  const row = tbody.locator('tr').nth(i)
  await row.locator('input').nth(0).fill(fieldDefs[i][0])
  await row.locator('input').nth(1).fill(fieldDefs[i][1])
  if (fieldDefs[i][2]) {
    await row.getByRole('combobox').click()
    await page.waitForTimeout(300)
    await page.getByRole('option', { name: fieldDefs[i][2] }).click()
  }
}
check('字段行已配置 4 个', (await tbody.locator('tr').count()) === 4)

// 3. 保存
await page.getByRole('button', { name: '保存', exact: true }).click()
await page.waitForTimeout(1500)
check('保存后列表出现公告管理行', await page.locator('tr', { hasText: 'notice' }).first().isVisible().catch(() => false))

// 4. 生成后端
await page.locator('tr', { hasText: 'notice' }).getByTitle('生成后端（建表+接口，幂等）').first().click()
const backendDialog = page.getByRole('dialog')
await backendDialog.getByText('路由注册').waitFor({ timeout: 30000 }).catch(() => {})
const reportVisible = await backendDialog.getByText('数据表', { exact: true }).isVisible().catch(() => false)
check('生成后端报告展示', reportVisible)
if (reportVisible) {
  const reportText = await backendDialog.innerText()
  check('报告含路由注册', reportText.includes('路由注册'))
}
await backendDialog.getByRole('button', { name: '关闭' }).click()
await page.waitForTimeout(500)

// 5. 等待后端重载后 /api/notice/ 可用，直接 CRUD 验证
check('后端接口 /api/notice/ 已生效（dev 自动重载）', await waitApi('/notice/?page=1&page_size=10'))
const created = await fetch(`${API}/notice/`, {
  method: 'POST',
  headers: auth,
  body: JSON.stringify({ title: 'E2E公告', content: '低代码全链路验证', status: true, sort: 1 }),
}).then((r) => r.json())
check('API 新增公告成功', created.code === 2000)
const listed = await fetch(`${API}/notice/?page=1&page_size=50`, { headers: auth }).then((r) => r.json())
const raw = listed.result
const items = Array.isArray(raw) ? raw : (raw?.items ?? [])
check('API 列表可查到新公告', items.some((it) => it.title === 'E2E公告' || it.title === 'E2E公告改'))
const rowId = items[0]?.id
if (rowId) {
  const updated = await fetch(`${API}/notice/${rowId}/`, {
    method: 'PUT',
    headers: auth,
    body: JSON.stringify({ title: 'E2E公告改', content: '改', status: false, sort: 2 }),
  }).then((r) => r.json())
  check('API 修改公告成功', updated.code === 2000)
}

// 6. 生成菜单（挂系统管理）
await page.locator('tr', { hasText: 'notice' }).getByTitle('生成菜单和按钮权限').first().click()
await page.waitForTimeout(800)
await page.getByRole('combobox').click()
await page.waitForTimeout(500)
await page.getByRole('option', { name: /系统管理/ }).click()
await page.getByRole('button', { name: '生成', exact: true }).click()
await page.waitForTimeout(2000)
check('侧边栏出现公告管理入口', await page.getByRole('link', { name: '公告管理' }).isVisible().catch(() => false))

await page.screenshot({ path: 'scripts/out/smoke-generator-backend.png', fullPage: false })
console.log(`\n结果: ${pass} 通过 / ${fail} 失败`)
console.log('错误汇总:')
console.log(errors.length ? errors.join('\n') : '(无)')
await browser.close()
process.exit(fail || errors.length ? 1 : 0)
