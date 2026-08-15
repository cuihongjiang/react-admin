/**
 * 交互自测：登录 → 侧边栏点击导航 → 新增弹窗 → 提交 → 验证列表出现新行 → 删除清理
 */
import { chromium } from 'playwright'

const BASE = process.env.SMOKE_BASE ?? 'http://localhost:5173'

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

const errors = []
page.on('pageerror', (err) => errors.push(`[pageerror] ${err.message}`))
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`[console.error] ${msg.text()}`)
})
page.on('response', async (resp) => {
  if (resp.url().includes('/api/position') && resp.request().method() === 'POST') {
    console.log('POST /api/position ->', resp.status(), await resp.text().catch(() => ''))
  }
})

await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(1500)

// 登录
if (page.url().includes('/login')) {
  await page.getByPlaceholder('superadmin').fill('superadmin')
  await page.getByPlaceholder('••••••').fill('123456')
  await page.getByRole('button', { name: /登/ }).click()
  await page.waitForTimeout(2500)
}

// 侧边栏点击导航到 岗位管理
console.log('当前 URL:', page.url())
console.log('页面文本片段:', (await page.locator('body').innerText()).slice(0, 200).replace(/\n/g, ' | '))
await page.getByRole('link', { name: '岗位管理' }).click()
await page.waitForTimeout(1200)
console.log('点击导航后 URL:', page.url())

// 新增岗位
await page.getByRole('button', { name: /新增/ }).click()
await page.waitForTimeout(500)
await page.getByPlaceholder('请输入岗位名称').fill('自测岗位')
await page.getByPlaceholder('请输入岗位编码').fill('SMOKE_TEST')
await page.getByRole('combobox').click()
await page.waitForTimeout(300)
await page.getByRole('option', { name: '在职' }).click()
await page.getByRole('button', { name: '确定' }).click()
await page.waitForTimeout(1500)

const rowVisible = await page.getByText('SMOKE_TEST').first().isVisible().catch(() => false)
console.log('新增后表格出现新行:', rowVisible)

// 删除清理
await page.locator('tr', { hasText: 'SMOKE_TEST' }).getByRole('button').last().click()
await page.waitForTimeout(500)
await page.getByRole('button', { name: '删除', exact: true }).click()
await page.waitForTimeout(1500)
const stillThere = await page.getByText('SMOKE_TEST').isVisible().catch(() => false)
console.log('删除后行已消失:', !stillThere)

console.log('\n错误汇总:')
console.log(errors.length ? errors.join('\n') : '(无)')

await page.screenshot({ path: 'scripts/out/smoke-interact.png' })
await browser.close()
