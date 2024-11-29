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
];

const MenuItems = () => {
  const { isAdmin } = useAdmin();
  const location = useLocation();
  const items = isAdmin ? [{ name: 'Admin', href: '/admin', icon: Shield }, ...navigation] : navigation;

  return (
    <div className="flex-1 flex flex-col">
      {/* Logo */}
      <div className="flex items-center px-6 pt-5 pb-6">
        <div className="flex items-center">
          <div className="relative">
            <div className="absolute -inset-3 bg-blue-50 rounded-lg blur-sm opacity-75"></div>
            <img src="/logo.svg" alt="Logo" className="relative h-7 w-7" />
          </div>
          <div className="ml-3">
            <h1 className="text-base font-semibold text-gray-900 leading-none mb-1">Linkxstore</h1>
            <p className="text-xs font-medium text-gray-500 leading-none">Your Affiliate Hub</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-3 pb-2">
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-2">
        {items.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-lg',
                'transition-all duration-150 ease-in-out',
                'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500/20',
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon 
                className={cn(
                  "flex-shrink-0 w-5 h-5 transition-transform duration-150",
                  "group-hover:scale-110 group-hover:rotate-3",
                  isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                )}
              />
              <span className="ml-3 font-medium">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 z-40 flex">
          <Transition.Child
            as={Fragment}
            enter="transform transition-all ease-out duration-300"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transform transition-all ease-in duration-200"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <Dialog.Panel className="relative flex w-full max-w-[280px] flex-col bg-white">
              <div className="flex h-16 items-center justify-between px-4 border-b border-gray-100">
                <Dialog.Title className="text-lg font-semibold">
                  Menu
                </Dialog.Title>
                <button
                  type="button"
                  className="rounded-lg p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                  onClick={onClose}
                >
                  <span className="sr-only">Close menu</span>
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-4">
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

const MainMenu: MainMenuComponent = () => {
  return (
    <div className="flex flex-col h-full py-4">
      <MenuItems />
    </div>
  );
};

MainMenu.Mobile = MobileMenu;

export default MainMenu;
