import { Routes, Route } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import AuthImageLayout from '../components/layout/AuthImageLayout';
import ComponentGallery from '../pages/ComponentGallery';
import ApiTest from '../pages/ApiTest';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import VerifyEmailPage from '../pages/VerifyEmailPage';
import WorkspaceDashboardPage from '../pages/WorkspaceDashboardPage';
import ProjectsPage from '../pages/ProjectsPage';
import ContractsPage from '../pages/ContractsPage';
import NotificationsPage from '../pages/NotificationsPage';
import ProfilePage from '../pages/ProfilePage';
import NotFoundPage from '../pages/NotFoundPage';
import ProtectedRoute from './ProtectedRoute';
import GuestRoute from './GuestRoute';

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
