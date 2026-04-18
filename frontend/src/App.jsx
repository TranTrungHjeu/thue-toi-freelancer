import { Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { ToastProvider } from './components/common/Toast';
import { AuthProvider } from './contexts/AuthContext';
import { I18nProvider } from './contexts/I18nContext';
import Spinner from './components/common/Spinner';

const AppRouteFallback = () => {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <Spinner size="md" />
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
