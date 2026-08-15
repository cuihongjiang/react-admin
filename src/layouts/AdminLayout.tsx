/**
 * 管理端布局：登录后加载菜单树 + 权限码，构建动态路由
 */
import { useQuery } from '@tanstack/react-query'
import { Icon } from '@iconify/react'
import { LogOut, UserRound } from 'lucide-react'
import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router'
import { toast } from 'sonner'

import { fetchPermissions, fetchRouteTree, logout } from '@/core/api/auth'
import { buildRoutes, firstMenuPath } from '@/core/router/build-routes'
import { useAuthStore } from '@/core/stores/auth'
import { SidebarMenu } from '@/layouts/SidebarMenu'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'

function Loading() {
  return (
    <div className="flex h-full items-center justify-center gap-3 text-muted-foreground">
      <Skeleton className="size-6 rounded-full" />
      正在加载菜单与权限...
    </div>
  )
}

export default function AdminLayout() {
  const location = useLocation()
  const { user, refreshToken, setPermissions, clear } = useAuthStore()

  const menuQuery = useQuery({
    queryKey: ['route-tree'],
    queryFn: fetchRouteTree,
  })

  const permQuery = useQuery({
    queryKey: ['permissions'],
    queryFn: fetchPermissions,
  })

  // 权限码加载后写入全局 store（<Auth> 组件消费）
  useEffect(() => {
    if (permQuery.data) setPermissions(permQuery.data)
  }, [permQuery.data, setPermissions])

  const routes = menuQuery.data ? buildRoutes(menuQuery.data) : []
  const homePath = menuQuery.data ? firstMenuPath(menuQuery.data) : '/'
  const loading = menuQuery.isLoading || permQuery.isLoading

  async function handleLogout() {
    try {
      if (refreshToken) await logout(refreshToken)
    } finally {
      clear()
      toast.success('已退出登录')
    }
  }

  return (
    <div className="flex h-screen">
      <aside className="flex w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4 font-semibold">
          <Icon icon="ant-design:control-filled" className="size-5 text-sidebar-primary" />
          后台管理系统
        </div>
        {menuQuery.data ? <SidebarMenu tree={menuQuery.data} /> : null}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-end border-b px-6">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent">
              <UserRound className="size-4" />
              {user?.username ?? '未登录'}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user?.email || user?.username}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="size-4" />
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="min-h-0 flex-1 overflow-auto bg-muted/30 p-4">
          {loading ? (
            <Loading />
          ) : (
            <Routes>
              {routes.map((route) => (
                <Route key={route.path} path={route.path} element={route.element} />
              ))}
              <Route
                path="/"
                element={<Navigate to={homePath} replace />}
              />
              <Route
                path="*"
                element={
                  <div className="flex h-full min-h-60 flex-col items-center justify-center gap-2 text-muted-foreground">
                    <p className="text-lg font-medium">404</p>
                    <p className="text-sm">
                      路由 <code className="font-mono">{location.pathname}</code> 不存在或未授权
                    </p>
                  </div>
                }
              />
            </Routes>
          )}
        </main>
      </div>
    </div>
  )
}
