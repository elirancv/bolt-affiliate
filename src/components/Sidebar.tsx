import React from 'react';
import { NavLink, useLocation, useParams } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Store, 
  ShoppingBag, 
  FileText, 
  Settings,
  BarChart,
  Shield,
  ArrowLeft
} from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';

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

    // Main navigation, sorted alphabetically
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