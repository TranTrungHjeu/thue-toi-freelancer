"use client";

import { ToastProvider } from '../components/common/Toast';
import { AuthProvider } from '../contexts/AuthContext';
import { I18nProvider } from '../contexts/I18nContext';
import { NotificationProvider } from '../contexts/NotificationContext';

export default function ClientProviders({ children }) {
  return (
    <I18nProvider>
      <ToastProvider>
        <AuthProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </AuthProvider>
      </ToastProvider>
    </I18nProvider>
  );
}
