import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogOut, User, Store, Menu } from 'lucide-react';
import NotificationCenter from './notifications/NotificationCenter';

interface NavbarProps {
  onMenuClick?: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 h-16 flex items-center safe-area-inset-top">
      <div className="flex-1 flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Toggle */}
          <button 
            onClick={onMenuClick} 
            className="lg:hidden text-gray-600 hover:text-gray-900"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex items-center group cursor-pointer">
            {/* Icon Container */}
            <div className="relative flex-shrink-0">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-11 w-11 bg-blue-500/20 rounded-full blur-lg group-hover:bg-blue-500/30 transition-all duration-300" />
              <div className="relative p-1.5">
                <Store className="h-9 w-9 text-blue-600 transform group-hover:-rotate-12 transition-all duration-300" />
              </div>
            </div>

            {/* Text Container */}
            <div className="ml-3 flex flex-col -space-y-1">
              <div className="relative">
                <div className="absolute -inset-2.5 bg-blue-500/10 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-all duration-300" />
                <span className="relative text-base font-semibold bg-gradient-to-r from-gray-900 via-blue-600 to-gray-900 bg-clip-text text-transparent">
                  {import.meta.env.VITE_APP_NAME}
                </span>
              </div>
              <span className="text-[10px] font-medium text-gray-500 tracking-wider uppercase">
                Affiliate
              </span>
            </div>
          </div>

          {/* Slogan - Hidden on small screens */}
          <div className="hidden lg:flex flex-col ml-16">
            <h2 className="text-base font-medium text-gray-800">
              Transform Your Links into Revenue
            </h2>
            <p className="text-sm text-gray-500">
              Create, Share, and Earn with Smart Affiliate Marketing
            </p>
          </div>
        </div>
        
        {user && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <NotificationCenter />
              <div className="ml-4">
                <User className="h-5 w-5 text-gray-600 flex-shrink-0" />
                <span className="text-sm text-gray-600 truncate max-w-[120px] hidden lg:inline">
                  {user.email}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center text-gray-600 hover:text-gray-900"
                title="Sign Out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}