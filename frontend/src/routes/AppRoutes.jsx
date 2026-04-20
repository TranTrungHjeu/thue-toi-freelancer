import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import GuestRoute from './GuestRoute';
import AuthRouteBridge from './AuthRouteBridge';
import LandingPage from '../pages/LandingPage.tsx';

const MainLayout = lazy(() => import('../components/layout/MainLayout'));
const ComponentGallery = lazy(() => import('../pages/ComponentGallery'));
const ApiTest = lazy(() => import('../pages/ApiTest'));
const WorkspaceDashboardPage = lazy(() => import('../pages/WorkspaceDashboardPage'));
const ProjectsPage = lazy(() => import('../pages/ProjectsPage'));
const ContractsPage = lazy(() => import('../pages/ContractsPage'));
const NotificationsPage = lazy(() => import('../pages/NotificationsPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const AdminDashboardPage = lazy(() => import('../pages/admin/AdminDashboardPage'));
const AdminUsersPage = lazy(() => import('../pages/admin/AdminUsersPage'));
const AdminProjectsPage = lazy(() => import('../pages/admin/AdminProjectsPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/gallery" element={<ComponentGallery />} />
    <Route path="/api-lab" element={<ApiTest />} />

    <Route element={<GuestRoute />}>
      <Route path="/auth/login" element={<AuthRouteBridge mode="login" />} />
      <Route path="/auth/register" element={<AuthRouteBridge mode="register" />} />
      <Route path="/auth/verify-email" element={<AuthRouteBridge mode="verify" />} />
    </Route>

    <Route element={<ProtectedRoute />}>
      <Route element={<MainLayout />}>
        <Route path="/workspace" element={<WorkspaceDashboardPage />} />
        <Route path="/workspace/projects" element={<ProjectsPage />} />
        <Route path="/workspace/contracts" element={<ContractsPage />} />
        <Route path="/workspace/notifications" element={<NotificationsPage />} />
        <Route path="/workspace/profile" element={<ProfilePage />} />
        
        {/* Admin Routes */}
        <Route path="/workspace/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/workspace/admin/users" element={<AdminUsersPage />} />
        <Route path="/workspace/admin/projects" element={<AdminProjectsPage />} />
      </Route>
    </Route>

    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

export default AppRoutes;
