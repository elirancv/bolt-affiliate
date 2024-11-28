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
import { useLocation, useParams } from 'react-router-dom';

export default function Sidebar() {
  const { isAdmin } = useAdmin();
  const location = useLocation();
  const { storeId } = useParams();

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
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
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
    <aside className="w-56 bg-white border-r border-gray-100 min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="flex-1 py-5 px-2">
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

      {/* Footer */}
      <div className="mt-auto border-t border-gray-100">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <Settings className="h-4 w-4" />
            <span>v1.0.0</span>
          </div>
        </div>
      </div>
    </aside>
  );
}