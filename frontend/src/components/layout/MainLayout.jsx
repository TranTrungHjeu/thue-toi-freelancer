import { Outlet, Link } from 'react-router-dom';

const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-primary-600">Thuê Tôi</Link>
          <nav className="space-x-6">
            <Link to="/services" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">Tìm Dịch Vụ</Link>
            <Link to="/freelancers" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">Tìm Freelancer</Link>
          </nav>
          <div className="space-x-4 flex items-center">
            <Link to="/login" className="text-gray-600 hover:text-primary-600 font-medium">Đăng nhập</Link>
            <Link to="/register" className="bg-primary-600 text-white px-5 py-2.5 rounded-lg shadow-md hover:bg-primary-700 transition-all font-medium">Đăng ký</Link>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet /> 
      </main>

      <footer className="bg-secondary-900 justify-self-end w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row justify-between items-center text-gray-400">
           <div>
               <div className="text-2xl font-bold text-white mb-2">Thuê Tôi</div>
               <p className="text-sm">Nền tảng việc làm tự do số 1 sinh viên</p>
           </div>
           <div className="text-sm mt-4 md:mt-0">
               &copy; 2026 Thuê Tôi Platform. All rights reserved.
           </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
