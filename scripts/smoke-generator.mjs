/**
 * 代码生成器 E2E 自测（幂等，可重复运行）：
 * 预清理历史 loginlog 模板 → 登录 → 打开代码生成器
 * → 新增配置（选 LoginLog 表）→ 保存 → 预览 React 代码（验证新工具栏模板）
 * → 生成菜单（挂系统管理）→ 校验菜单树出现新节点
 */
import { chromium } from 'playwright'

const BASE = process.env.SMOKE_BASE ?? 'http://localhost:5173'
const API = 'http://127.0.0.1:8000/api'

// ---- 预清理：删除历史 loginlog 模板，保证每次运行从干净状态开始 ----
{
  const login = await fetch(`${API}/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'superadmin', password: '123456' }),
  }).then((r) => r.json())
  const auth = { Authorization: `Bearer ${login.result.accessToken}` }
  const list = await fetch(`${API}/generator/?code=loginlog`, { headers: auth }).then((r) => r.json())
  for (const t of list.result.items ?? []) {
    await fetch(`${API}/generator/${t.id}/`, { method: 'DELETE', headers: auth })
  }
}

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

const errors = []
page.on('pageerror', (err) => errors.push(`[pageerror] ${err.message}`))
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`[console.error] ${msg.text()}`)
})
let pass = 0
let fail = 0
const check = (label, ok) => {
  ok ? pass++ : fail++
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
}

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

// 1. 打开新增配置弹窗
await page.getByRole('button', { name: '新增' }).click()
await page.waitForTimeout(500)
check('新增配置弹窗打开', await page.getByText('新增生成配置').isVisible().catch(() => false))

// 2. 选择数据表 log.LoginLog
await page.getByRole('combobox').first().click()
await page.waitForTimeout(500)
await page.getByRole('option', { name: /登录日志/ }).click()
await page.waitForTimeout(500)
const nameVal = await page.getByPlaceholder('如：操作日志').inputValue()
const codeVal = await page.getByPlaceholder('如：operationlog').inputValue()
check('选表后自动填充模板名称', nameVal === '登录日志')
check('选表后自动填充模板编码', codeVal === 'loginlog')

// 3. 字段配置行已生成（LoginLog 含全部模型字段）
const fieldRows = await page.locator('table code').count()
check(`字段配置行已生成（${fieldRows} 行）`, fieldRows > 10)

// 3.1 勾选 username 作为搜索列，验证搜索框生成链路
await page.locator('input[aria-label="username is_search"]').check()

// 4. 保存
await page.getByRole('button', { name: '保存', exact: true }).click()
await page.waitForTimeout(1500)
check(
  '保存后列表出现登录日志行',
  await page.locator('tr', { hasText: 'loginlog' }).first().isVisible().catch(() => false),
)

// 5. 预览 React 代码
await page.locator('tr', { hasText: 'loginlog' }).getByTitle('预览代码').first().click()
await page.waitForTimeout(1500)
const previewText = await page.locator('pre').innerText().catch(() => '')
check('预览弹窗打开并渲染代码', previewText.includes('import'))
// 切到页面文件验证新版单卡片工具栏模板
const pageFileBtn = page.locator('button', { hasText: 'LoginlogPage.tsx' }).first()
if (await pageFileBtn.isVisible().catch(() => false)) {
  await pageFileBtn.click()
  await page.waitForTimeout(300)
}
const pageCode = await page.locator('pre').innerText().catch(() => '')
check('生成的页面使用新版 TableToolbar 工具栏', pageCode.includes('TableToolbar'))
check('生成的页面使用 SearchInput 搜索框', pageCode.includes('SearchInput'))
await page.keyboard.press('Escape')
await page.waitForTimeout(500)

// 6. 生成菜单（挂到系统管理）
await page.locator('tr', { hasText: 'loginlog' }).getByTitle('生成菜单和按钮权限').first().click()
await page.waitForTimeout(800)
await page.getByRole('combobox').click()
await page.waitForTimeout(500)
await page.getByRole('option', { name: /系统管理/ }).click()
await page.getByRole('button', { name: '生成', exact: true }).click()
await page.waitForTimeout(1500)
check(
  '生成菜单后行状态显示菜单徽章',
  await page
    .locator('tr', { hasText: 'loginlog' })
    .getByText('菜单', { exact: true })
    .first()
    .isVisible()
    .catch(() => false),
)

// 7. 侧边栏刷新后出现登录日志入口
await page.waitForTimeout(1500)
check(
  '侧边栏出现登录日志入口',
  await page.getByRole('link', { name: '登录日志' }).isVisible().catch(() => false),
)

await page.screenshot({ path: 'scripts/out/smoke-generator.png', fullPage: false })
console.log(`\n结果: ${pass} 通过 / ${fail} 失败`)
console.log('错误汇总:')
console.log(errors.length ? errors.join('\n') : '(无)')
await browser.close()
process.exit(fail || errors.length ? 1 : 0)
