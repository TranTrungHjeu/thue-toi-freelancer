import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import ApiTest from './pages/ApiTest';

function App() {
  return (
    <div>
      <ApiTest />
    </div>
  );
}

export default App;
