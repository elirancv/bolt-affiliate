import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import MainMenu from './ui/MainMenu';
import { Menu as MenuIcon } from 'lucide-react';
import UserMenu from './UserMenu';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);
  const openMobileMenu = () => setMobileMenuOpen(true);

  return (
    <div className="relative min-h-screen">
      {/* Desktop Sidebar - Fixed Position */}
      <div className="hidden lg:block fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-100">
        <MainMenu />
      </div>

      {/* Mobile Menu */}
      <MainMenu.Mobile isOpen={mobileMenuOpen} onClose={closeMobileMenu} />

      {/* Main Content */}
      <div className={cn(
        "lg:pl-64 flex flex-col min-h-screen",
        mobileMenuOpen && "overflow-hidden h-screen"
      )}>
        {/* Top Navigation */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
          <div className="flex h-14 items-center justify-between px-4">
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <button
                type="button"
                onClick={openMobileMenu}
                className="lg:hidden -ml-1.5 p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <MenuIcon className="w-5 h-5" />
                <span className="sr-only">Open menu</span>
              </button>

              {/* Header Slogan */}
              <div className="hidden sm:block relative cursor-pointer">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur" />
                <p className="relative text-[13px] tracking-wide font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent transition-opacity duration-200 hover:opacity-80">
                  Transform Clicks into Profit • Maximize Your Revenue
                </p>
              </div>
            </div>

            {/* Right-aligned items */}
            <div className="flex items-center ml-auto">
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 px-4 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}