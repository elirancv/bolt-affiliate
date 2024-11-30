import React from 'react';
import { Store, Users, TrendingUp, Package } from 'lucide-react';
import StatsCard from './StatsCard';
import { Progress } from '../../components/ui/Progress';
import type { DashboardData } from './DashboardContainer';
import type { FeatureLimits } from '../../types/subscription';

interface DashboardStatsProps {
  data: DashboardData;
  limits: FeatureLimits | null;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ data, limits }) => {
  const getProgressValue = (current: number, limit: number) => {
    if (!current || !limit) return 0;
    return Math.min((current / limit) * 100, 100);
  };

  if (!data) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Stores"
        value={data.stores}
        icon={<Store className="h-4 w-4" />}
        footer={
          limits?.maxStores ? (
            <Progress value={getProgressValue(data.stores, limits.maxStores)} />
          ) : null
        }
      />
      <StatsCard
        title="Total Products"
        value={data.products}
        icon={<Package className="h-4 w-4" />}
        footer={
          limits?.maxProducts ? (
            <Progress value={getProgressValue(data.products, limits.maxProducts)} />
          ) : null
        }
      />
      <StatsCard
        title="Total Visitors"
        value={data.visitors}
        icon={<Users className="h-4 w-4" />}
      />
      <StatsCard
        title="Total Clicks"
        value={data.clicks}
        icon={<TrendingUp className="h-4 w-4" />}
      />
    </div>
  );
};

export default DashboardStats;
