import { Routes, Route } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import ApiTest from '../pages/ApiTest';

// Các component giả lập giữ chỗ (placeholder) trước khi code màn hình thật
const HomePage = () => <div className="text-center py-20"><h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl mb-6">Nền tảng kết nối <span className="text-primary-600">Freelancer</span> & Khách hàng</h1></div>;
const LoginPage = () => <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-lg shadow-md text-center">Form Đăng nhập</div>;
const RegisterPage = () => <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-lg shadow-md text-center">Form Đăng ký</div>;
const ServicesPage = () => <div className="mt-10">Danh sách Dịch vụ/Gigs</div>;

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/api-test" element={<ApiTest />} />
      </Route>

      {/*
        Sau này sẽ bổ sung các Protected Routes tại đây:
        <Route element={<ProtectedRoute role="ADMIN" />}>
           <Route path="/admin" element={<AdminLayout />}>...</Route>
        </Route>
      */}
    </Routes>
  );
};
export default AppRoutes;
