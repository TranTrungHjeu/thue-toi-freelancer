import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

import LoadingOverlay from '../common/LoadingOverlay'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="relative flex items-center justify-center min-h-screen bg-slate-950/20">
        <LoadingOverlay isActive={true} spinnerSize="lg" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to='/auth/login' replace />
  }

  return children
}
