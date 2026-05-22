import { useCallback, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { useWebSocket } from '../../hooks/useWebSocket';

/**
 * AdminRealtimeListener
 * -----------------------------------------------------------------------------
 * Headless component. Mount một lần ở cấp App để admin nhận realtime alert
 * trên MỌI trang (không chỉ trang duyệt rút tiền).
 *
 * - Chỉ kích hoạt khi user.role === 'admin'.
 * - Subscribe vào các topic dành riêng cho admin (hiện tại: yêu cầu rút tiền).
 * - Khi nhận sự kiện: hiển thị toast + phát CustomEvent
 *   (`admin-withdrawals-update`) để các trang đang mở có thể refetch dữ liệu
 *   mà không cần tự subscribe socket lần nữa.
 */
const ADMIN_WITHDRAWAL_EVENT = 'admin-withdrawals-update';

const AdminRealtimeListener = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const isAdmin = user?.role?.toLowerCase() === 'admin';

  const topics = useMemo(
    () => (isAdmin ? ['/topic/withdrawals/admin'] : []),
    [isAdmin]
  );

  const handleMessage = useCallback(
    ({ topic, payload }) => {
      if (!payload || typeof payload !== 'object') return;
      const type = payload.type;
      if (!type) return;

      if (topic === '/topic/withdrawals/admin') {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent(ADMIN_WITHDRAWAL_EVENT, { detail: payload })
          );
        }

        switch (type) {
          case 'created':
            addToast('Có yêu cầu rút tiền mới — kiểm tra trang Duyệt rút tiền', 'info');
            break;
          case 'completed':
            addToast('Một yêu cầu rút tiền đã hoàn tất', 'success');
            break;
          case 'rejected':
            addToast('Một yêu cầu rút tiền đã bị từ chối', 'warning');
            break;
          case 'cancelled':
            addToast('Một yêu cầu rút tiền đã bị huỷ bởi người dùng', 'info');
            break;
          default:
            break;
        }
      }
    },
    [addToast]
  );

  useWebSocket(handleMessage, topics);

  return null;
};

export { ADMIN_WITHDRAWAL_EVENT };
export default AdminRealtimeListener;
