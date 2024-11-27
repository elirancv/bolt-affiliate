import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Store, 
  ShoppingBag, 
  FileText, 
  Settings,
  BarChart,
  Shield
} from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';

export default function Sidebar() {
  const { isAdmin } = useAdmin();

  const navigation = [
    ...(isAdmin ? [{ name: 'Admin', href: '/admin', icon: Shield }] : []),
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Stores', href: '/stores', icon: Store },
    { name: 'Products', href: '/products', icon: ShoppingBag },
    { name: 'Pages', href: '/pages', icon: FileText },
    { name: 'Analytics', href: '/analytics', icon: BarChart },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <nav className="mt-8 space-y-1 px-4">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}