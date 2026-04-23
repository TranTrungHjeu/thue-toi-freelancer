import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check } from 'iconoir-react';
import { useNavigate, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useNotifications } from '../../hooks/useNotifications';
import { useI18n } from '../../hooks/useI18n';

const NotificationBell = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    loading,
    reloadNotifications
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef(null);
  const buttonRef = useRef(null);

  const badge = unreadCount > 0 
    ? (unreadCount > 99 ? '99+' : String(unreadCount)) 
    : null;

  const recentNotifications = notifications.slice(0, 6);

  const formatTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const diff = Math.floor((now - new Date(date)) / 60000);
    if (diff < 1) return 'vừa xong';
    if (diff < 60) return `${diff} phút trước`;
    return `${Math.floor(diff / 60)} giờ trước`;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBellClick = () => {
    const willOpen = !isOpen;
    setIsOpen(willOpen);
    if (willOpen) {
      reloadNotifications({ silent: true });
    }
  };

  const handleMarkRead = async (id) => {
    await markAsRead(id);
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    setIsOpen(false);
  };

  const handleItemClick = (noti) => {
    if (!noti.isRead) handleMarkRead(noti.id);
    setIsOpen(false);
    if (noti.link) navigate(noti.link);
    else navigate('/workspace/notifications');
  };

  const panelVariants = {
    hidden: { opacity: 0, y: -8, scale: 0.98 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        type: "spring", 
        stiffness: 380, 
        damping: 30 
      } 
    },
    exit: { opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.18 } }
  };

  const itemVariants = {
    hidden: { opacity: 0 },
    visible: (i) => ({
      opacity: 1,
      transition: { delay: Math.min(i * 0.02, 0.1), duration: 0.15 }
    })
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleBellClick}
        className="relative p-2.5 text-secondary-900 hover:bg-slate-100 rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        title={`${t('layout.navigation.notifications')}${badge ? ` (${badge})` : ''}`}
        aria-label={t('layout.navigation.notifications')}
      >
        <Bell className="h-5 w-5 text-slate-900" />
        {badge && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white shadow-sm ring-2 ring-white">
            {badge}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden will-change-transform"
            style={{ maxHeight: '420px' }}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-white sticky top-0 z-10">
              <div className="font-semibold text-secondary-900">Thông báo</div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 transition-colors"
                >
                  <Check className="h-3.5 w-3.5" />
                  Đánh dấu tất cả đã đọc
                </button>
              )}
            </div>

            <div className="max-h-[340px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
              {loading ? (
                <div className="p-8 text-center text-slate-400">Đang tải...</div>
              ) : recentNotifications.length === 0 ? (
                <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                  <Bell className="h-10 w-10 mb-3 opacity-40" />
                  Chưa có thông báo nào
                </div>
              ) : (
                recentNotifications.map((noti, index) => (
                  <motion.div
                    key={noti.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    custom={index}
                    layout
                    onClick={() => handleItemClick(noti)}
                    className={`group px-5 py-4 cursor-pointer border-b border-slate-100 last:border-0 transition-all hover:bg-slate-50 ${!noti.isRead ? 'bg-slate-50/80 border-l-3 border-primary-500' : ''}`}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <div className={`font-serif text-sm leading-tight flex-1 pr-2 transition-colors duration-200 ${!noti.isRead ? 'font-bold text-secondary-900' : 'font-medium text-slate-700'}`}>{noti.title}</div>
                      <div className={`text-[10px] tabular-nums whitespace-nowrap transition-colors duration-200 ${!noti.isRead ? 'text-primary-600' : 'text-slate-400'}`}>{formatTime(noti.createdAt)}</div>
                    </div>
                    <div className={`text-xs leading-relaxed line-clamp-2 mt-2 transition-colors duration-200 ${!noti.isRead ? 'text-slate-600' : 'text-slate-500'}`}>{noti.content}</div>
                  </motion.div>
                ))
              )}
            </div>

            <div className="border-t border-slate-100 p-3 bg-white sticky bottom-0 z-10">
              <Link
                to="/workspace/notifications"
                onClick={() => setIsOpen(false)}
                className="block w-full rounded-xl bg-slate-50 py-2.5 text-center text-sm font-medium text-primary-600 hover:bg-slate-100 active:bg-slate-200 transition-all"
              >
                Xem tất cả thông báo
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
