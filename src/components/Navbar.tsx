import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogOut, Settings, User } from 'lucide-react';

export default function Navbar() {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="Linkxstore Logo" className="h-8 w-8" />
              <span className="text-xl font-bold text-blue-600">{import.meta.env.VITE_APP_NAME}</span>
            </div>
          </div>
          
          {user && (
            <div className="flex items-center space-x-4">
              <button
                className="flex items-center text-gray-600 hover:text-gray-900"
                onClick={() => navigate('/settings')}
              >
                <Settings className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-600" />
                <span className="text-sm text-gray-600">{user.email}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}