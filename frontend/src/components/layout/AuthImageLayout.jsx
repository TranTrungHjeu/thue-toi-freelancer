import React from 'react';
import { Outlet } from 'react-router-dom';
import bgImage from '../../assets/pexels-luna-lovegood-4087177.webp';

// Preload ảnh vào memory cache của browser ngay khi module được nạp.
// Mọi lần render sau đó dùng lại từ cache — không có network request.
const _preload = new window.Image();
_preload.src = bgImage;

const AuthImageLayout = () => (
  <>
    <div
      className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${bgImage})` }}
    />
    <div className="pointer-events-none fixed inset-0 -z-10 bg-slate-900/60" />
    <Outlet />
  </>
);

export default AuthImageLayout;
