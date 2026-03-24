import { Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { ToastProvider } from './components/common/Toast';
import { AuthProvider } from './contexts/AuthContext';
import { I18nProvider } from './contexts/I18nContext';
import { useI18n } from './hooks/useI18n';

const AppRouteFallback = () => {
  const { t } = useI18n();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="border-2 border-slate-200 bg-white px-6 py-5 text-center">
        <div className="text-[11px] font-black uppercase tracking-[0.18em] text-primary-700">
          {t('app.brand')}
        </div>
        <div className="mt-3 text-lg font-bold text-secondary-900">
          {t('app.loadingWorkspace')}
        </div>
      </div>
    </div>
  );
};

const AppShell = () => (
  <BrowserRouter>
    <ToastProvider>
      <AuthProvider>
        <Suspense fallback={<AppRouteFallback />}>
          <AppRoutes />
        </Suspense>
      </AuthProvider>
    </ToastProvider>
  </BrowserRouter>
);

function App() {
  return (
    <I18nProvider>
      <AppShell />
    </I18nProvider>
  );
}

export default App;
