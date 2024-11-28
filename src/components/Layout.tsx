import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { cn } from '../lib/utils';

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex min-h-screen safe-area-inset-top">
      {/* Mobile Sidebar - Overlay */}
      <div 
        className={cn(
          'fixed inset-0 z-40 lg:hidden',
          'transition-opacity duration-300 ease-in-out',
          isSidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        )}
        onClick={toggleSidebar}
      >
        <div 
          className={cn(
            'absolute inset-0 bg-black/50 backdrop-blur-sm',
            isSidebarOpen ? 'opacity-100' : 'opacity-0'
          )}
        />
      </div>

      {/* Sidebar - Mobile and Desktop */}
      <div 
        className={cn(
          'fixed top-0 left-0 bottom-0 z-50 lg:static lg:block',
          'w-56 transform transition-all duration-300 ease-in-out',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        <Navbar onMenuClick={toggleSidebar} />
        
        {/* Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-gray-50 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}