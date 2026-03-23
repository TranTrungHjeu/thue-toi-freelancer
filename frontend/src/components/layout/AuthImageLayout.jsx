import React from 'react';
import { Outlet } from 'react-router-dom';
import bgImage from '../../assets/pexels-luna-lovegood-4087177.webp';

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
