import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { usePerformance } from '../../hooks/usePerformance';
import { analytics } from '../../services/analytics';
import { logger } from '../../services/logger';
import { Outlet, Link } from 'react-router-dom';
import { Store, BarChart2, Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/auth/authStore';

interface AppLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  sidebar?: React.ReactNode;
}

const navigation = [
  { name: 'Stores', href: '/stores', icon: Store },
  { name: 'Analytics', href: '/analytics', icon: BarChart2 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function AppLayout({ children, header, footer, sidebar }: AppLayoutProps) {
  const location = useLocation();
  const performance = usePerformance({
    name: 'app_layout',
    threshold: 500,
    onThresholdExceeded: (duration) => {
      logger.warn('App layout render took longer than expected', { duration });
    }
  });
  const { user, signOut } = useAuthStore();

  useEffect(() => {
    // Track page views and performance
    const startTime = performance.now();
    
    analytics.trackPageView(location.pathname, document.title);
    
    return () => {
      const duration = performance.now() - startTime;
      if (duration > 100) {
        logger.debug('Page render duration', {
          path: location.pathname,
          duration
        });
      }
    };
  }, [location, performance]);

  if (!user) {
    return <Outlet />;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {header && (
          <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
            {header}
          </header>
        )}
        
        <div className="flex flex-1 h-[calc(100vh-4rem)]">
          {sidebar && (
            <aside className="w-64 border-r border-gray-200 bg-white">
              <div className="flex flex-col h-full">
                {/* Logo */}
                <div className="flex items-center h-16 px-6 border-b border-gray-200">
                  <Link to="/" className="flex items-center space-x-2">
                    <Store className="h-6 w-6 text-blue-600" />
                    <span className="text-xl font-semibold text-gray-900">Bolt Affiliate</span>
                  </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-4 space-y-1">
                  {navigation.map((item) => {
                    const isActive = location.pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                          isActive
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <item.icon
                          className={`mr-3 h-5 w-5 ${
                            isActive ? 'text-blue-500' : 'text-gray-400'
                          }`}
                        />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>

                {/* User */}
                <div className="flex items-center px-4 py-4 border-t border-gray-200">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.email}
                    </p>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="ml-2 p-2 text-gray-400 hover:text-gray-500"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </aside>
          )}
          
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-4 py-6">
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </div>
          </main>
        </div>

        {footer && (
          <footer className="border-t border-gray-200 bg-white">
            {footer}
          </footer>
        )}
      </div>
    </ErrorBoundary>
  );
}
