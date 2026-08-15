/**
 * token 过期场景自测：
 * 场景 A：accessToken 失效 + refreshToken 有效 → 应自动刷新并正常渲染页面
 * 场景 B：双 token 均失效 → 应被踢回登录页
 */
import { chromium } from 'playwright'

const BASE = process.env.SMOKE_BASE ?? 'http://localhost:5173'

async function getRealTokens() {
  const resp = await fetch(`${BASE}/api/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'superadmin', password: '123456' }),
  })
  const body = await resp.json()
  if (!body.result) throw new Error(`登录失败: ${resp.status} ${JSON.stringify(body).slice(0, 200)}`)
  return body.result
}

async function scenario(name, { accessToken, refreshToken }) {
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('response', (r) => {
    if (r.url().includes('/api/login/refresh')) {
      errors.push(`refresh -> ${r.status()}`)
    }
  })

  // 预置 localStorage 再打开页面（先访问一次拿到 origin）
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.evaluate(
    ([at, rt]) => {
      localStorage.clear()
      localStorage.setItem('react-admin-auth', JSON.stringify({
        state: { accessToken: at, refreshToken: rt, user: null, buttons: [], columns: [] },
        version: 0,
      }))
    },
    [accessToken, refreshToken],
  )

  await page.goto(`${BASE}/system/user`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)

  const url = page.url()
  const text = (await page.locator('body').innerText().catch(() => '')) || ''
  const recovered = text.includes('用户名') && text.includes('superadmin')
  console.log(`[${name}] 最终 URL: ${url}`)
  console.log(`[${name}] 页面恢复渲染: ${recovered}`)
  console.log(`[${name}] 关键请求: ${errors.length ? errors.join(', ') : '(无)'}`)
  await browser.close()
  return recovered
}

const real = await getRealTokens()

// 场景 A：真 refreshToken + 坏 accessToken（模拟过期）
await scenario('A: 过期accessToken+有效refreshToken', {
  accessToken: 'eyJhbGciOiJIUzI1NiJ9.broken.broken',
  refreshToken: real.refreshToken,
})

// 场景 B：两个都坏（模拟全过期）
await scenario('B: 双token失效', {
  accessToken: 'eyJhbGciOiJIUzI1NiJ9.broken.broken',
  refreshToken: 'broken-refresh-token',
})
