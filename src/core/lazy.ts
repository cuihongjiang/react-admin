/**
 * 带超时的路由级懒加载
 *
 * 背景：Vite HMR 模块图异常（Windows 下批量写文件后的边缘情况）时，
 * React.lazy 的 import() 可能永不 resolve，React 的并发 transition 会无限挂起——
 * 表现为 URL 已变化但 DOM 不更新（无声冻结）。
 * 这里给加载加超时：超时后 reject，让 ErrorBoundary 显示明确的错误提示
 * 和刷新按钮，而不是页面卡死。
 */
import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

const LOAD_TIMEOUT_MS = 10_000

export function lazyPage<T extends ComponentType<unknown>>(
  load: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(() =>
    Promise.race([
      load(),
      new Promise<never>((_, reject) => {
        setTimeout(
          () =>
            reject(
              new Error(
                '页面模块加载超时（10 秒）。通常是开发服务器模块缓存异常：请先刷新页面，若反复出现请重启前端服务（start_frontend.bat）。',
              ),
            ),
          LOAD_TIMEOUT_MS,
        )
      }),
    ]),
  )
}
