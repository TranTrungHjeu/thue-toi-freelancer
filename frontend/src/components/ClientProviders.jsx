import { ToastProvider } from '../components/common/Toast'
import { AuthProvider } from '../contexts/AuthContext'
import { I18nProvider } from '../contexts/I18nContext'
import { NotificationProvider } from '../contexts/NotificationContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AdminRealtimeListener from './admin/AdminRealtimeListener'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export default function ClientProviders({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <ToastProvider>
          <AuthProvider>
            <NotificationProvider>
              {/* Headless realtime listener for admin-wide events.
                  Mounted globally so admins receive toasts on every page. */}
              <AdminRealtimeListener />
              {children}
            </NotificationProvider>
          </AuthProvider>
        </ToastProvider>
      </I18nProvider>
    </QueryClientProvider>
  )
}

