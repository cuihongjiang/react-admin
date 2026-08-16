/**
 * 冻结现场 Fiber 取证：找出 pending lanes 与 suspend 的 thenable
 */
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
await click('菜单管理')
await click('角色管理')
await click('菜单管理')
await click('用户管理')
await page.waitForTimeout(1500)
const content = (await page.locator('main button').first().innerText().catch(() => '?')).trim()
console.log('冻结确认（内容应为菜单页）:', content)

const report = await page.evaluate(() => {
  const rootEl = document.getElementById('root')
  let current = null
  const dbg = {}
  for (const k of Object.keys(rootEl)) {
    if (k.startsWith('__reactContainer')) {
      const v = rootEl[k]
      dbg.containerType = typeof v
      dbg.containerKeys = v && typeof v === 'object' ? Object.keys(v).slice(0, 12) : String(v).slice(0, 50)
      if (v && v.current) { current = v.current; dbg.found = 'via .current' }
      else if (v && v.stateNode && v.stateNode.current) { current = v.stateNode.current; dbg.found = 'via .stateNode.current' }
    }
  }
  if (!current) return { error: 'fiber root not found', dbg }

  const laneNames = (n) => {
    const names = []
    for (let i = 0; i < 32; i++) if (n & (1 << i)) names.push('L' + i)
    return names.join(',') || 'none'
  }

  const out = {
    rootLanes: laneNames(current.lanes ?? 0),
    suspended: [],
  }

  const seen = new Set()
  let count = 0
  const compName = (f) => {
    if (!f.type) return '?'
    if (typeof f.type === 'string') return f.type
    if (f.type.displayName) return f.type.displayName
    if (f.type.name) return f.type.name
    if (f.type._init) return 'lazy(' + String(f.tag) + ')'
    return 'obj'
  }
  const walk = (f, depth) => {
    if (!f || seen.has(f) || count++ > 20000 || depth > 80) return
    seen.add(f)
    try {
      let ms = f.memoizedState
      let idx = 0
      while (ms && idx < 30) {
        if (typeof ms === 'object' && ms !== null && typeof ms.then === 'function') {
          out.suspended.push({ comp: compName(f), tag: f.tag, depth, lanes: laneNames(f.lanes ?? 0) })
          break
        }
        ms = ms.next
        idx++
      }
    } catch {}
    walk(f.child, depth + 1)
    walk(f.sibling, depth)
  }
  walk(current, 0)
  out.suspended = out.suspended.slice(0, 15)
  return out
})
console.log(JSON.stringify(report, null, 2))
await browser.close()
