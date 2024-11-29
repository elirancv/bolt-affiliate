import React from 'react';
import { Users, Store, ShoppingBag, TrendingUp } from 'lucide-react';

interface AdminStatsProps {
  stats: {
    totalUsers: number;
    usersByTier: Record<string, number>;
    totalStores: number;
    totalProducts: number;
    averageStoresPerUser: number;
    averageProductsPerStore: number;
    totalPageViews: number;
    totalVisitors: number;
    totalClicks: number;
  };
}

export default function AdminStats({ stats }: AdminStatsProps) {
  const cards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Total Stores',
      value: stats.totalStores,
      icon: Store,
      color: 'bg-green-500'
    },
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: ShoppingBag,
      color: 'bg-purple-500'
    },
    {
      title: 'Total Clicks',
      value: stats.totalClicks,
      icon: TrendingUp,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.title} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{card.title}</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{card.value}</p>
            </div>
            <div className={`p-2 ${card.color.replace('500', '50')} rounded-lg`}>
              <card.icon className={`h-5 w-5 ${card.color.replace('bg-', 'text-').replace('500', '600')}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}