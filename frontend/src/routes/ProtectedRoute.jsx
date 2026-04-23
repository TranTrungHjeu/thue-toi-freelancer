import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    const redirectTo = encodeURIComponent(`${location.pathname}${location.search}${location.hash}`);
    return <Navigate to={`/?auth=login&redirect=${redirectTo}`} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
