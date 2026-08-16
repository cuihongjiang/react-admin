/**
 * 导航自测：菜单切换全场景（含历史冻结复现序列）+ 深链
 * 冻结根因：Vite HMR 模块缓存被污染时 React.lazy 挂起导致 transition 卡死，
 * 若本脚本失败，先重启 Vite 开发服务器再复测（生成器批量写文件后需重启）。
 */
import { chromium } from 'playwright'
const BASE = process.env.SMOKE_BASE ?? 'http://localhost:5173'
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(1500)
if (page.url().includes('/login')) {
  await page.getByPlaceholder('superadmin').fill('superadmin')
  await page.getByPlaceholder('••••••').fill('123456')
  await page.getByRole('button', { name: /登/ }).click()
  await page.waitForTimeout(2500)
}
const click = async (n) => { await page.getByRole('link', { name: n }).click(); await page.waitForTimeout(600) }
const content = async () => (await page.locator('main button').first().innerText().catch(()=> '?')).trim()
let pass = 0, fail = 0
async function check(label, expected) {
  const c = await content()
  const ok = c.includes(expected)
  ok ? pass++ : fail++
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}: 期望含[${expected}] 实际[${c}]`)
}
await click('菜单管理'); await check('菜单1', '菜单')
await click('角色管理'); await check('角色', '角色')
await click('菜单管理'); await check('菜单2', '菜单')
await click('用户管理'); await check('用户', '用户')
await click('岗位管理'); await click('岗位管理'); await check('岗位双击', '岗位')
await click('权限标识'); await check('权限标识', '权限')
await click('部门管理'); await check('部门', '部门')
await page.goto(BASE + '/system/role', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(1500)
await check('深链角色', '角色')
console.log(`\n结果: ${pass} 通过 / ${fail} 失败`)
console.log('错误:', errors.length ? errors.join('\n') : '(无)')
await browser.close()
process.exit(fail ? 1 : 0)
