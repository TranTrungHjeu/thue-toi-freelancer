import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AdminRoute = () => {
  const { role } = useAuth();

  if ((role || '').toLowerCase() !== 'admin') {
    return <Navigate to="/workspace" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
