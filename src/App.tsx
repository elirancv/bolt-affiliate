import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useAuthStore } from './store/authStore';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import StoreList from './pages/stores/StoreList';
import CreateStore from './pages/stores/CreateStore';
import StoreView from './pages/stores/StoreView';
import StoreSettings from './pages/stores/StoreSettings';
import ProductView from './pages/stores/ProductView';
import ProductList from './pages/products/ProductList';
import AddProduct from './pages/products/AddProduct';
import EditProduct from './pages/products/EditProduct';
import Analytics from './pages/Analytics';
import Pages from './pages/Pages';
import StoreDetails from './pages/stores/StoreDetails';
import { ToastProvider } from './components/ui/Toast';

export default function App() {
  const { setUser, refreshSession } = useAuthStore();

  useEffect(() => {
    // Initial session check
    refreshSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          metadata: {
            first_name: session.user.user_metadata?.first_name,
            last_name: session.user.user_metadata?.last_name,
            subscription_tier: session.user.user_metadata?.subscription_tier || 'free'
          }
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, refreshSession]);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-100">
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Store User Routes */}
            <Route path="/user/:storeId" element={<StoreView />} />
            <Route path="/user/:storeId/products/:productId" element={<ProductView />} />
            
            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                {/* Main Routes */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/stores" element={<StoreList />} />
                <Route path="/stores/create" element={<CreateStore />} />
                
                {/* Product Routes */}
                <Route path="/products">
                  <Route index element={<ProductList />} />
                  <Route path=":productId" element={<ProductView />} />
                  <Route path=":productId/edit" element={<EditProduct />} />
                  <Route path="add" element={<AddProduct />} />
                </Route>
                
                {/* Store-specific Routes */}
                <Route path="/stores/:storeId">
                  <Route index element={<StoreDetails />} />
                  <Route path="products" element={<ProductList />} />
                  <Route path="products/add" element={<AddProduct />} />
                  <Route path="products/:productId/edit" element={<EditProduct />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="pages" element={<Pages />} />
                  <Route path="settings" element={<StoreSettings />} />
                </Route>
                
                {/* Admin Routes */}
                <Route path="/admin" element={<AdminDashboard />} />
              </Route>
            </Route>

            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </div>
    </ToastProvider>
  );
}