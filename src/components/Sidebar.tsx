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
  CreditCard
} from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { cn } from '../lib/utils';
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
      { name: 'Analytics', href: '/analytics', icon: BarChart },
      { name: 'Billing', href: '/billing', icon: CreditCard },
      { name: 'Settings', href: '/settings', icon: Settings },
    ];

    // Add admin option if user is admin (at the top)
    if (isAdmin) {
      mainNav.unshift({ name: 'Admin', href: '/admin', icon: Shield });
    }

    return mainNav;
  };

  const navigation = getNavigation();

  return (
    <aside className="sticky top-0 h-screen w-56 bg-white border-r border-gray-200">
      {/* Main Navigation */}
      <nav className="px-2 py-4">
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
    </aside>
  );
}