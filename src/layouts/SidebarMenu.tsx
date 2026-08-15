/**
 * 侧边栏菜单：渲染后端菜单树
 * - 目录(type=0) → 可折叠分组
 * - 菜单(type=1) → 路由跳转；外链 → 新窗口打开
 * - hideMenu 的菜单不显示
 */
import { Icon } from '@iconify/react'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router'

import { cn } from '@/lib/utils'
import type { MenuItem } from '@/core/types'

function MenuIcon({ name }: { name?: string | null }) {
  if (!name) return null
  return <Icon icon={name} className="size-4 shrink-0" />
}

function isActive(pathname: string, target: string): boolean {
  return pathname === target || pathname.startsWith(`${target}/`)
}

function MenuLeaf({ item, fullPath }: { item: MenuItem; fullPath: string }) {
  const { pathname } = useLocation()
  const active = isActive(pathname, fullPath)

  if (item.is_ext) {
    return (
      <a
        href={item.path}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent"
      >
        <MenuIcon name={item.meta?.icon} />
        {item.meta?.title}
      </a>
    )
  }

  return (
    <Link
      to={fullPath}
      className={cn(
        'flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent',
        active && 'bg-sidebar-accent font-medium text-sidebar-accent-foreground',
      )}
    >
      <MenuIcon name={item.meta?.icon} />
      {item.meta?.title}
    </Link>
  )
}

function MenuGroup({ item, fullPath }: { item: MenuItem; fullPath: string }) {
  const { pathname } = useLocation()
  const containsActive = (() => {
    const walk = (nodes: MenuItem[]): boolean =>
      nodes.some(
        (n) =>
          (n.type === 1 && !n.is_ext && isActive(pathname, joinPath(fullPath, n.path))) ||
          (n.children?.length ? walk(n.children) : false),
      )
    return item.children?.length ? walk(item.children) : false
  })()
  const [open, setOpen] = useState(containsActive)

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent"
      >
        <MenuIcon name={item.meta?.icon} />
        <span className="flex-1 text-left">{item.meta?.title}</span>
        <ChevronDown
          className={cn('size-4 transition-transform', !open && '-rotate-90')}
        />
      </button>
      {open && item.children?.length ? (
        <div className="ml-4 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-2">
          <MenuNodes nodes={item.children} parentPath={fullPath} />
        </div>
      ) : null}
    </div>
  )
}

function joinPath(parent: string, child: string): string {
  if (child.startsWith('/')) return child
  return `${parent.replace(/\/$/, '')}/${child}`
}

function MenuNodes({ nodes, parentPath }: { nodes: MenuItem[]; parentPath: string }) {
  const sorted = [...nodes].sort(
    (a, b) => (a.meta?.orderNo ?? 0) - (b.meta?.orderNo ?? 0),
  )
  return (
    <>
      {sorted
        .filter((n) => !n.meta?.hideMenu)
        .map((node) => {
          const fullPath = joinPath(parentPath, node.path || '')
          return node.type === 0 ? (
            <MenuGroup key={node.id} item={node} fullPath={fullPath} />
          ) : (
            <MenuLeaf key={node.id} item={node} fullPath={fullPath} />
          )
        })}
    </>
  )
}

export function SidebarMenu({ tree }: { tree: MenuItem[] }) {
  return (
    <nav className="space-y-0.5 px-2 py-2">
      <MenuNodes nodes={tree} parentPath="" />
    </nav>
  )
}
