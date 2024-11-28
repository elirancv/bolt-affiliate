import { NavLink } from 'react-router-dom';
import {
  Store,
  LayoutDashboard,
  ShoppingBag,
  Settings,
  Shield,
  FileText,
  BarChart,
  ArrowLeft,
} from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/Tooltip';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import React from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';

export default function Sidebar() {
  const { isAdmin } = useAdmin();
  const location = useLocation();
  const { storeId } = useParams();
  const navigate = useNavigate();

  const getNavigation = () => {
    if (storeId) {
      // Store-specific navigation, sorted alphabetically (except "Back to Stores" which should stay first)
      return [
        { name: 'Back to Stores', href: '/stores', icon: ArrowLeft },
        { name: 'Analytics', href: `/stores/${storeId}/analytics`, icon: BarChart },
        { name: 'Pages', href: `/stores/${storeId}/pages`, icon: FileText },
        { name: 'Products', href: `/stores/${storeId}/products`, icon: ShoppingBag },
        { name: 'Settings', href: `/stores/${storeId}/settings`, icon: Settings },
      ];
    }

    // Main navigation in specific order
    const mainNav = [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Stores', href: '/stores', icon: Store },
      { name: 'Products', href: '/products', icon: ShoppingBag },
    ];

    // Add admin option if user is admin (at the top)
    if (isAdmin) {
      mainNav.unshift({ name: 'Admin', href: '/admin', icon: Shield });
    }

    return mainNav;
  };

  const navigation = getNavigation();

  return (
    <aside className="flex flex-col min-h-screen w-56 bg-white border-r border-gray-200">
      {/* Main Navigation */}
      <nav className="flex-1 px-2 py-4">
        <div className="space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`
              }
            >
              <item.icon className="flex-shrink-0 w-5 h-5 mr-3 transition-colors" />
              <span className="truncate">{item.name}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Footer with Settings and Version */}
      <div className="sticky bottom-0 mt-auto border-t border-gray-200 bg-white">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <Settings className="h-5 w-5" />
            <span className="text-sm font-medium">Settings</span>
          </button>
          <span className="text-xs text-gray-500">v{import.meta.env.VITE_APP_VERSION || '1.0.0'}</span>
        </div>
      </div>
    </aside>
  );
}