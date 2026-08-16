import { chromium } from 'playwright'
const BASE = 'http://localhost:5173'
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(1500)
if (page.url().includes('/login')) {
  await page.getByPlaceholder('superadmin').fill('superadmin')
  await page.getByPlaceholder('••••••').fill('123456')
  await page.getByRole('button', { name: /登/ }).click()
  await page.waitForTimeout(2500)
}
const click = async (n) => { await page.getByRole('link', { name: n }).click(); await page.waitForTimeout(700) }
await click('菜单管理'); await click('角色管理'); await click('菜单管理'); await click('用户管理')
await page.waitForTimeout(1500)
const info = await page.evaluate(() => {
  const mains = document.querySelectorAll('main')
  const buttons = [...document.querySelectorAll('main button')].map(b => b.innerText.trim())
  const tables = document.querySelectorAll('main table').length
  const cards = document.querySelectorAll('main .proCard, main [class*=card]').length
  return {
    mainCount: mains.length,
    mainButtons: buttons.slice(0, 8),
    visibleText: mains[0]?.innerText?.slice(0, 80),
    tableCount: tables,
  }
})
console.log('URL:', page.url())
console.log(JSON.stringify(info, null, 2))
await browser.close()
