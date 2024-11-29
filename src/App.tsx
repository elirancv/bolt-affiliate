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
import SubscriptionPlans from './pages/subscription/SubscriptionPlans';
import Billing from './pages/subscription/Billing';
import LandingPage from './pages/LandingPage';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function App() {
  const { user, isLoading, initializeAuth } = useAuthStore();

  useEffect(() => {
    console.log('App: Initializing auth...');
    initializeAuth();
  }, [initializeAuth]);

  if (isLoading) {
    console.log('App: Loading...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" expand={true} richColors />
      <div className="min-h-screen bg-gray-100">
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={!user ? <LandingPage /> : <Navigate to="/dashboard" replace />} />
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />
            <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" replace />} />
            
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
                
                {/* Subscription Routes */}
                <Route path="/subscription" element={<SubscriptionPlans />} />
                <Route path="/billing" element={<Billing />} />
                
                {/* Admin Routes */}
                <Route path="/admin" element={<AdminDashboard />} />
              </Route>
            </Route>

            {/* Catch-all route */}
            <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
          </Routes>
        </Router>
      </div>
    </QueryClientProvider>
  );
}