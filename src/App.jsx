import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import Layout from '@/components/layout/Layout'
import Dashboard from '@/pages/Dashboard'
import TemplateNew from '@/pages/TemplateNew'
import TemplateDetail from '@/pages/TemplateDetail'
import TemplateEdit from '@/pages/TemplateEdit'
import TemplatePreview from '@/pages/TemplatePreview'
import PublicFormPage from '@/pages/PublicFormPage'
import AdminUserManagement from '@/pages/AdminUserManagement'
import ResetPassword from '@/pages/ResetPassword'
import NotFound from '@/pages/NotFound'
import Spinner from '@/components/ui/Spinner'
import Toast from '@/components/ui/Toast'

export default function App() {
  const { init, user, loading } = useAuthStore()

  useEffect(() => {
    init()
  }, [init])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <>
      <Toast />
      <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/templates" element={user ? <Dashboard /> : <Navigate to="/" replace />} />
        <Route path="/templates/new" element={user ? <TemplateNew /> : <Navigate to="/" replace />} />
        <Route path="/templates/:id" element={user ? <TemplateDetail /> : <Navigate to="/" replace />} />
        <Route path="/templates/:id/edit" element={user ? <TemplateEdit /> : <Navigate to="/" replace />} />
        <Route path="/templates/:id/preview" element={user ? <TemplatePreview /> : <Navigate to="/" replace />} />
        <Route path="/admin" element={user ? <AdminUserManagement /> : <Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="/f/:shareToken" element={<PublicFormPage />} />
      <Route path="/reset-password" element={<ResetPassword />} />
    </Routes>
    </>
  )
}
