import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import GuestRoute from './GuestRoute';

const MainLayout = lazy(() => import('../components/layout/MainLayout'));
const AuthImageLayout = lazy(() => import('../components/layout/AuthImageLayout'));
const ComponentGallery = lazy(() => import('../pages/ComponentGallery'));
const ApiTest = lazy(() => import('../pages/ApiTest'));
const LandingPage = lazy(() => import('../pages/LandingPage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const VerifyEmailPage = lazy(() => import('../pages/VerifyEmailPage'));
const WorkspaceDashboardPage = lazy(() => import('../pages/WorkspaceDashboardPage'));
const ProjectsPage = lazy(() => import('../pages/ProjectsPage'));
const ContractsPage = lazy(() => import('../pages/ContractsPage'));
const NotificationsPage = lazy(() => import('../pages/NotificationsPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/gallery" element={<ComponentGallery />} />
    <Route path="/api-lab" element={<ApiTest />} />

    <Route element={<GuestRoute />}>
      <Route element={<AuthImageLayout />}>
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
      </Route>
    </Route>

    <Route element={<ProtectedRoute />}>
      <Route element={<MainLayout />}>
        <Route path="/workspace" element={<WorkspaceDashboardPage />} />
        <Route path="/workspace/projects" element={<ProjectsPage />} />
        <Route path="/workspace/contracts" element={<ContractsPage />} />
        <Route path="/workspace/notifications" element={<NotificationsPage />} />
        <Route path="/workspace/profile" element={<ProfilePage />} />
      </Route>
    </Route>

    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

export default AppRoutes;
