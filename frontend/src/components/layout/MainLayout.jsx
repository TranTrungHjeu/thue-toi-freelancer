import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileDrawer from './MobileDrawer';
import BottomNav from './BottomNav';
import { Home, Suitcase, ChatBubble, Settings, User } from 'iconoir-react';

/**
 * MainLayout following "Strict Sharpness" architectural layout.
 * Optimized for mobile with Drawer and BottomNav.
 */
const MainLayout = ({ children, user }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const navigation = [
    {
      title: "Ứng dụng",
      icon: Home,
      items: [
        { label: "Bảng điều khiển", icon: null },
        { label: "Dự án của tôi", icon: null },
        { label: "Tin nhắn", icon: null, badge: "3" },
      ]
    },
    {
      title: "Thị trường",
      icon: Suitcase,
      items: [
        { label: "Tìm việc làm", icon: null },
        { label: "Tìm Freelancer", icon: null },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header user={user} onOpenMenu={() => setIsDrawerOpen(true)} />
      
      <MobileDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        navigation={navigation}
      />

      <div className="flex flex-1 pt-16 pb-16 lg:pb-0">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <main className="flex-1 p-4 md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-300 overflow-x-hidden">
          <div className="max-w-6xl mx-auto flex flex-col gap-8">
            {children}
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
};

export default MainLayout;
