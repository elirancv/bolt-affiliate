import React, { useEffect, useState } from 'react';
import { getAdminStats } from '../../lib/admin';
import { useAdmin } from '../../hooks/useAdmin';
import AdminHeader from '../../components/admin/AdminHeader';
import AdminStats from '../../components/admin/AdminStats';
import UsersList from '../../components/admin/UsersList';
import SubscriptionChart from '../../components/admin/SubscriptionChart';
import ActivityChart from '../../components/admin/ActivityChart';
import StorePerformance from '../../components/admin/StorePerformance';
import LoadingState from '../../components/admin/LoadingState';
import ErrorState from '../../components/admin/ErrorState';

interface AdminStats {
  totalUsers: number;
  usersByTier: Record<string, number>;
  totalStores: number;
  totalProducts: number;
  totalPageViews: number;
  totalVisitors: number;
  totalClicks: number;
  averageStoresPerUser: number;
  averageProductsPerStore: number;
  users: Array<{
    id: string;
    email: string;
    created_at: string;
    subscription_tier: string;
    is_admin: boolean;
  }>;
  activityByDate?: Record<string, {
    pageViews: number;
    visitors: number;
    clicks: number;
  }>;
  storePerformance?: Array<{
    id: string;
    name: string;
    productsCount: number;
    totalClicks: number;
    createdAt: string;
  }>;
}

export default function AdminDashboard() {
  const { isAdmin: isAdminUser, loading: adminCheckLoading, error: adminError } = useAdmin();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStats = async () => {
      if (!isAdminUser) return;
      
      try {
        const data = await getAdminStats();
        setStats(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (!adminCheckLoading && isAdminUser) {
      loadStats();
    }
  }, [isAdminUser, adminCheckLoading]);

  if (adminCheckLoading || loading) {
    return <LoadingState />;
  }

  if (adminError || !isAdminUser) {
    return <ErrorState message="You don't have permission to access this page." />;
  }

  if (error) {
    return <ErrorState message={`Error loading admin stats: ${error}`} />;
  }

  if (!stats) {
    return <ErrorState message="No stats data available" />;
  }

  return (
    <div className="space-y-6">
      <AdminHeader 
        title="Admin Dashboard" 
        subtitle="Monitor platform usage and user statistics"
      />

      <AdminStats stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityChart activityByDate={stats.activityByDate} />
        </div>
        <div>
          <SubscriptionChart usersByTier={stats.usersByTier} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Users</h2>
          <UsersList users={stats.users} />
        </div>
        <StorePerformance stores={stats.storePerformance} />
      </div>
    </div>
  );
}