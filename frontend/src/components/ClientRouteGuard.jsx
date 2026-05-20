import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingOverlay from './common/LoadingOverlay';

/**
 * Component bảo vệ Route phía Client (Client-side Route Guard).
 * Hỗ trợ cơ chế phân quyền RBAC động, lọc chuyển trang login nếu phiên làm việc hết hạn
 * hoặc người dùng hiện tại không có thẩm quyền Admin khi truy cập khu vực nhạy cảm.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children Các node con kế thừa giao diện bảo vệ
 * @param {boolean} [props.adminOnly=false] Bật cờ kiểm duyệt bắt buộc có vai trò Admin
 * @returns {React.ReactNode} Giao diện được cấp phép truy cập hoặc Spinner chờ tải
 */
export default function ClientRouteGuard({ children, adminOnly = false }) {
  const { isAuthenticated, loading, user } = useAuth();
  const isAuthLoaded = !loading;
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    if (!isAuthLoaded) return;

    if (!isAuthenticated) {
      const qs = searchParams.toString();
      const currentPath = encodeURIComponent(`${location.pathname}${qs ? `?${qs}` : ''}`);
      navigate(`/?auth=login&redirect=${currentPath}`, { replace: true });
      return;
    }

    if (adminOnly && user?.role?.toLowerCase() !== 'admin') {
      navigate('/workspace', { replace: true });
      return;
    }

    setIsAllowed(true);
  }, [isAuthenticated, isAuthLoaded, adminOnly, user, navigate, location.pathname, searchParams]);

  if (!isAuthLoaded || !isAllowed) {
    return <LoadingOverlay isActive={true} />;
  }

  return children;
}

