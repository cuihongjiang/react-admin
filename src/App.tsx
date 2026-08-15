import { Component, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { Toaster } from 'sonner'

import { useAuthStore } from '@/core/stores/auth'
import AdminLayout from '@/layouts/AdminLayout'
import LoginPage from '@/pages/LoginPage'

function RequireAuth({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  if (!accessToken) return <Navigate to="/login" replace />
  return <>{children}</>
}

/** 运行时错误兜底：展示报错信息而不是白屏 */
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary]', error)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-muted-foreground">
          <p className="text-lg font-medium text-foreground">页面出错了</p>
          <pre className="max-w-xl overflow-auto rounded bg-muted p-3 text-xs whitespace-pre-wrap">
            {this.state.error.message}
          </pre>
          <button
            type="button"
            className="text-sm underline underline-offset-4"
            onClick={() => window.location.reload()}
          >
            刷新重试
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        />
      </Routes>
      <Toaster richColors position="top-center" />
    </ErrorBoundary>
  )
}
