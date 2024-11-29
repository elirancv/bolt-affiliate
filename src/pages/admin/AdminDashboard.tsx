import React, { useEffect, useState } from 'react';
import { getAdminStats } from '../../lib/admin';
import { useAdmin } from '../../hooks/useAdmin';
import AdminStats from '../../components/admin/AdminStats';
import UsersList from '../../components/admin/UsersList';
import SubscriptionChart from '../../components/admin/SubscriptionChart';
import ActivityChart from '../../components/admin/ActivityChart';
import StorePerformance from '../../components/admin/StorePerformance';
import LoadingState from '../../components/admin/LoadingState';
import ErrorState from '../../components/admin/ErrorState';
import PageHeader from '../../components/ui/PageHeader';
import { Shield } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';

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
  const [timeFilter, setTimeFilter] = useState("all");

  useEffect(() => {
    const loadStats = async () => {
      if (!isAdminUser) return;
      
      try {
        const data = await getAdminStats(timeFilter);
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
  }, [isAdminUser, adminCheckLoading, timeFilter]);

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <PageHeader
          title="Admin Dashboard"
          subtitle="Monitor platform usage and user statistics"
          icon={Shield}
          actions={
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          }
        />

        <div className="space-y-6">
          {/* Stats Overview */}
          <AdminStats stats={stats} />

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <ActivityChart activityByDate={stats.activityByDate} />
              </div>
            </div>
            <div>
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <SubscriptionChart 
                  usersByTier={stats.usersByTier} 
                  totalUsers={stats.totalUsers} 
                />
              </div>
            </div>
          </div>

          {/* Lists Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Registered Users</h2>
              <UsersList users={stats.users} />
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Store Performance</h2>
              <StorePerformance stores={stats.storePerformance} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}