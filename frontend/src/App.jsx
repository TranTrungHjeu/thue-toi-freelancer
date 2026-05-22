import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom'
import ClientProviders from './components/ClientProviders'
import ProtectedRoute from './components/auth/ProtectedRoute'
import MainLayout from './components/layout/MainLayout'
import ClientRouteGuard from './components/ClientRouteGuard'

// Pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import VerifyEmailPage from './pages/auth/VerifyEmailPage'
import WorkspacePage from './pages/workspace/WorkspacePage'
import ProjectsPage from './pages/workspace/ProjectsPage'
import ContractsPage from './pages/workspace/ContractsPage'
import ProfilePage from './pages/workspace/ProfilePage'
import NotificationsPage from './pages/workspace/NotificationsPage'
import AdminPage from './pages/workspace/AdminPage'
import NotFoundPage from './pages/NotFoundPage'
import WalletPage from './views/WalletPage'
import BankAccountsPage from './views/BankAccountsPage'

// Admin Views
import AdminUsersPage from './views/admin/AdminUsersPage'
import AdminProjectsPage from './views/admin/AdminProjectsPage'
import AdminKycPage from './views/admin/AdminKycPage'
import AdminReportsPage from './views/admin/AdminReportsPage'
import AdminFinancePage from './views/admin/AdminFinancePage'
import AdminWithdrawalsPage from './views/admin/AdminWithdrawalsPage'
import AdminBroadcastPage from './views/admin/AdminBroadcastPage'
import AdminSkillsPage from './views/admin/AdminSkillsPage'
import AdminSettingsPage from './views/admin/AdminSettingsPage'
import AdminActivityLogPage from './views/admin/AdminActivityLogPage'
import AdminSupportPage from './views/admin/AdminSupportPage'

// Layout wrappers
const WorkspaceLayout = () => {
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  )
}

const AdminLayout = () => {
  return (
    <ClientRouteGuard adminOnly={true}>
      <Outlet />
    </ClientRouteGuard>
  )
}

export default function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ClientProviders>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/admin/support" element={<ProtectedRoute><MainLayout><AdminSupportPage /></MainLayout></ProtectedRoute>} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/auth/verify-email" element={<VerifyEmailPage />} />

          {/* Protected workspace routes */}
          <Route element={<ProtectedRoute><WorkspaceLayout /></ProtectedRoute>}>
            <Route path="/workspace" element={<WorkspacePage />} />
            <Route path="/workspace/projects" element={<ProjectsPage />} />
            <Route path="/workspace/contracts" element={<ContractsPage />} />
            <Route path="/workspace/profile" element={<ProfilePage />} />
            <Route path="/workspace/notifications" element={<NotificationsPage />} />
            <Route path="/workspace/wallet" element={<WalletPage />} />
            <Route path="/workspace/wallet/bank-accounts" element={<BankAccountsPage />} />

            {/* Admin nested routes */}
            <Route element={<AdminLayout />}>
              <Route path="/workspace/admin" element={<AdminPage />} />
              <Route path="/workspace/admin/dashboard" element={<AdminPage />} />
              <Route path="/workspace/admin/users" element={<AdminUsersPage />} />
              <Route path="/workspace/admin/projects" element={<AdminProjectsPage />} />
              <Route path="/workspace/admin/kyc" element={<AdminKycPage />} />
              <Route path="/workspace/admin/reports" element={<AdminReportsPage />} />
              <Route path="/workspace/admin/finance" element={<AdminFinancePage />} />
              <Route path="/workspace/admin/withdrawals" element={<AdminWithdrawalsPage />} />
              <Route path="/workspace/admin/broadcast" element={<AdminBroadcastPage />} />
              <Route path="/workspace/admin/skills" element={<AdminSkillsPage />} />
              <Route path="/workspace/admin/settings" element={<AdminSettingsPage />} />
              <Route path="/workspace/admin/logs" element={<AdminActivityLogPage />} />
              <Route path="/workspace/admin/support" element={<AdminSupportPage />} />
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ClientProviders>
    </Router>
  )
}
