/**
 * 后端菜单树 → React Router 路由配置
 *
 * - 目录(type=0)仅作侧边栏分组，不产生路由
 * - 外链菜单(is_ext)不产生路由，侧边栏渲染为 <a>
 * - 叶子菜单(type=1)按 component 字符串从模块注册表取页面组件，
 *   未注册的显示占位页（便于发现菜单与模块 key 不匹配的问题）
 */
import type { ReactNode } from 'react'

import { componentRegistry } from '../registry'
import type { MenuItem } from '../types'

export interface FlatRoute {
  path: string
  label: string
  element: ReactNode
}

/** 拼接父子 path（子以 / 开头则视为绝对路径） */
function joinPath(parent: string, child: string): string {
  if (child.startsWith('/')) return child
  return `${parent.replace(/\/$/, '')}/${child}`
}

function walk(
  nodes: MenuItem[],
  parentPath: string,
  out: FlatRoute[],
): void {
  for (const node of [...nodes].sort((a, b) => (a.meta?.orderNo ?? 0) - (b.meta?.orderNo ?? 0))) {
    if (node.status === false) continue
    const fullPath = joinPath(parentPath, node.path || '')

    if (node.type === 1 && !node.is_ext) {
      const Page = node.component ? componentRegistry.get(node.component) : undefined
      out.push({
        path: fullPath,
        label: node.meta?.title ?? node.name ?? fullPath,
        element: Page ? (
          <Page />
        ) : (
          <Unregistered component={node.component} title={node.meta?.title} path={fullPath} />
        ),
      })
    }
    if (node.children?.length) walk(node.children, fullPath, out)
  }
}

export function buildRoutes(tree: MenuItem[]): FlatRoute[] {
  const out: FlatRoute[] = []
  walk(tree, '', out)
  return out
}

/** 菜单树里第一个可导航路径，用作登录后默认跳转 */
export function firstMenuPath(tree: MenuItem[]): string {
  const routes = buildRoutes(tree)
  return routes[0]?.path ?? '/'
}

function Unregistered({ component, title, path }: { component: string | null; title?: string; path: string }) {
  return (
    <div className="flex h-full min-h-60 flex-col items-center justify-center gap-2 text-muted-foreground">
      <p className="text-lg font-medium">{title ?? '页面'}</p>
      <p className="text-sm">
        组件 <code className="rounded bg-muted px-1.5 py-0.5 font-mono">{component ?? '(空)'}</code>
        未在前端模块注册，路由 <code className="font-mono">{path}</code>
      </p>
      <p className="text-xs">
        在 src/modules/&lt;模块&gt;/index.ts 的 routes 中登记该 component，或修正后端菜单配置
      </p>
    </div>
  )
}
