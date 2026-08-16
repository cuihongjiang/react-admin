/**
 * 拉取生成器产出的 react 模块文件，落地到 src/modules/<code>/
 * 用法：node scripts/apply-generated.mjs [code]（默认 loginlog）
 * 注意：新增模块目录需重启 Vite 开发服务器，import.meta.glob 才能识别
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const CODE = process.argv[2] ?? 'loginlog'
const BASE = 'http://127.0.0.1:8000/api'
const login = await fetch(`${BASE}/login/`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'superadmin', password: '123456' }),
}).then((r) => r.json())
const auth = { Authorization: `Bearer ${login.result.accessToken}` }

const list = await fetch(`${BASE}/generator/?code=${CODE}`, { headers: auth }).then((r) => r.json())
const tpl = (list.result.items ?? list.result ?? [])[0]
if (!tpl) throw new Error(`找不到 ${CODE} 模板`)

const files = await fetch(`${BASE}/generator/${tpl.id}/code/preview/?frontend=react`, {
  method: 'POST',
  headers: auth,
}).then((r) => r.json())

for (const file of files.result ?? []) {
  if (!file.path.startsWith('frontend/')) continue
  const rel = file.path.replace(/^frontend\/[^/]+\//, '')
  const out = join('src/modules', CODE, rel)
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, file.content, 'utf8')
  console.log('写入', out)
}
