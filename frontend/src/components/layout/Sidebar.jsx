import React from 'react';
import { Home, Suitcase, Notes, Bell, Settings, LogOut, Package, Database, Key, StatsUpSquare, User } from 'iconoir-react';
import AnimatedIcon from '../common/AnimatedIcon';
import NavGroup from './NavGroup';

/**
 * Standard Sidebar component following "Strict Sharpness".
 * Fixed width, sharp borders.
 */
const Sidebar = () => {
  return (
    <aside className="w-64 h-full bg-white border-r border-slate-200 flex flex-col py-6 overflow-y-auto">
      <nav className="flex-1 flex flex-col gap-1 px-3">
        <a href="#" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-secondary-900 transition-colors">
          <AnimatedIcon icon={Home} animation="float" />
          Dashboard
        </a>
        <a href="#gallery" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-primary-700 bg-primary-50 border-r-4 border-primary-500 transition-colors">
          <AnimatedIcon icon={Package} animation="scale" />
          UI Gallery
        </a>

        <div className="my-2 border-t border-slate-100" />

        <NavGroup 
          icon={Suitcase} 
          label="Dự án & Việc làm" 
          items={[
            { label: 'Tất cả dự án', path: '#projects' },
            { label: 'Việc của tôi', path: '#my-jobs' },
            { label: 'Hợp đồng', path: '#contracts' },
          ]}
        />

        <NavGroup 
          icon={Database} 
          label="Hệ thống & API" 
          items={[
            { label: 'API Testing', path: '#api-test' },
            { label: 'Webhooks', path: '#webhooks' },
            { label: 'Tài liệu Dev', path: '#docs' },
          ]}
        />

        <NavGroup 
          icon={StatsUpSquare} 
          label="Báo cáo & Tài chính" 
          items={[
            { label: 'Doanh thu', path: '#revenue' },
            { label: 'Thuế & Phí', path: '#tax' },
          ]}
        />

        <a href="#settings" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-secondary-900 transition-colors">
          <AnimatedIcon icon={Settings} animation="rotate" />
          Cài đặt hệ thống
        </a>
      </nav>
      
      <div className="px-3">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
          <AnimatedIcon icon={LogOut} animation="scale" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
