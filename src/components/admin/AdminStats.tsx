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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card) => (
        <div key={card.title} className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{card.title}</p>
              <p className="text-2xl font-semibold mt-1">{card.value}</p>
            </div>
            <div className={`${card.color} p-3 rounded-lg`}>
              <card.icon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}