import { Navigate, Route, Routes } from 'react-router'

import { useAuthStore } from '@/core/stores/auth'
import AdminLayout from '@/layouts/AdminLayout'
import LoginPage from '@/pages/LoginPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  if (!accessToken) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
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
  )
}
