import { Fragment, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { useAdmin } from '../../hooks/useAdmin';
import { cn } from '../../lib/utils';
import {
  LayoutDashboard,
  Store,
  ShoppingBag,
  Shield,
  CreditCard,
  Settings,
  BarChart3,
  X
} from 'lucide-react';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Stores', href: '/stores', icon: Store },
  { name: 'Products', href: '/products', icon: ShoppingBag },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Subscription', href: '/subscription', icon: CreditCard },
  { name: 'Billing', href: '/billing', icon: Settings },
];

const MenuItems = () => {
  const { isAdmin } = useAdmin();
  const location = useLocation();
  const items = isAdmin ? [{ name: 'Admin', href: '/admin', icon: Shield }, ...navigation] : navigation;

  return (
    <div className="flex-1 flex flex-col">
      {/* Logo */}
      <div className="flex items-center px-6 pt-3 pb-4">
        <div className="flex items-center group cursor-pointer">
          <div className="relative">
            {/* Logo background glow */}
            <div className="absolute -inset-3 bg-blue-50 rounded-lg opacity-75 group-hover:bg-blue-100 group-hover:scale-110 transition-all duration-300 ease-out"></div>
            <img src="/logo.svg" alt="Logo" className="relative h-10 w-10 transform group-hover:rotate-6 group-hover:scale-110 transition-transform duration-300 ease-out" />
          </div>
          <div className="ml-4">
            <h1 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-blue-600 to-gray-900 transform group-hover:scale-105 transition-transform duration-300">Linkxstore</h1>
            <p className="text-xs font-medium text-gray-500 group-hover:text-blue-500 transition-colors duration-300">Your Affiliate Hub</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-3">
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-2">
        {items.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                  isActive
                    ? 'text-blue-600 bg-blue-50 hover:bg-blue-100/80'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                )
              }
            >
              <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  const location = useLocation();
  
  useEffect(() => {
    onClose();
  }, [location, onClose]);

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-linear duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/50" />
        </Transition.Child>

        <div className="fixed inset-0 flex">
          <Transition.Child
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
              <div className="flex grow flex-col overflow-y-auto bg-white pb-4">
                <div className="absolute right-0 top-0 -mr-12 pt-2">
                  <button
                    type="button"
                    className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close sidebar</span>
                    <X className="h-6 w-6 text-white" aria-hidden="true" />
                  </button>
                </div>
                <MenuItems />
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

interface MainMenuComponent extends React.FC {
  Mobile: React.FC<MobileMenuProps>;
}

const MainMenu = () => {
  return <MenuItems />;
};

MainMenu.Mobile = MobileMenu;

export default MainMenu as MainMenuComponent;
