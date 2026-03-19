import React, { useState, useEffect } from 'react';
import ApiTest from './pages/ApiTest';
import ComponentGallery from './pages/ComponentGallery';
import { ToastProvider } from './components/common/Toast';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Simple hash-based "routing" for demo purposes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'gallery') setCurrentPage('gallery');
      else setCurrentPage('dashboard');
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Initial check

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <ToastProvider>
      {currentPage === 'gallery' ? <ComponentGallery /> : <ApiTest />}
    </ToastProvider>
  );
}

export default App;
