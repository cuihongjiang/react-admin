/**
 * 无头浏览器自测脚本：访问页面，收集控制台报错 / 页面错误 / 最终渲染内容 + 截图
 * 用法：node scripts/smoke.mjs [url] [用户名] [密码]
 */
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'

const BASE = process.env.SMOKE_BASE ?? 'http://localhost:5173'
const url = process.argv[2] ?? BASE
const username = process.argv[3] ?? 'superadmin'
const password = process.argv[4] ?? '123456'

mkdirSync('scripts/out', { recursive: true })

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

const consoleMessages = []
const pageErrors = []
const failedRequests = []

page.on('console', (msg) => {
  if (msg.type() === 'error' || msg.type() === 'warning') {
    consoleMessages.push(`[console.${msg.type()}] ${msg.text()}`)
  }
})
page.on('pageerror', (err) => pageErrors.push(`[pageerror] ${err.message}\n${err.stack ?? ''}`))
page.on('requestfailed', (req) =>
  failedRequests.push(`[requestfailed] ${req.method()} ${req.url()} -> ${req.failure()?.errorText}`),
)
page.on('response', (resp) => {
  if (resp.status() >= 400) {
    failedRequests.push(`[http${resp.status()}] ${resp.request().method()} ${resp.url()}`)
  }
})

console.log(`访问 ${url} ...`)
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(1500)

// 若在登录页则执行登录
if (page.url().includes('/login')) {
  console.log('检测到登录页，执行登录 ...')
  await page.getByPlaceholder('superadmin').fill(username)
  await page.getByPlaceholder('••••••').fill(password)
  await page.getByRole('button', { name: /登/ }).click()
  await page.waitForTimeout(2500)
  // 登录默认跳首页，深链自测需要回到目标地址
  if (url !== BASE) {
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1500)
  }
}

console.log('当前 URL:', page.url())
await page.waitForTimeout(1500)

const bodyText = (await page.locator('body').innerText().catch(() => '(无法获取 body)')) || '(body 为空)'
console.log('--- 页面文本（前 600 字）---')
console.log(bodyText.slice(0, 600))

await page.screenshot({ path: 'scripts/out/smoke.png', fullPage: false })
console.log('截图: scripts/out/smoke.png')

console.log('\n--- 页面错误 ---')
console.log(pageErrors.length ? pageErrors.join('\n') : '(无)')
console.log('\n--- 控制台 error/warning ---')
console.log(consoleMessages.length ? consoleMessages.join('\n') : '(无)')
console.log('\n--- 失败请求 ---')
console.log(failedRequests.length ? failedRequests.join('\n') : '(无)')

writeFileSync(
  'scripts/out/report.txt',
  [pageErrors.join('\n'), consoleMessages.join('\n'), failedRequests.join('\n')].join('\n\n'),
)
await browser.close()
