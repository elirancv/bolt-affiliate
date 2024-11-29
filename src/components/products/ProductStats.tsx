import React from 'react';
import { Package, DollarSign, Tags, CheckCircle, TrendingUp, ArrowUp, ArrowDown, Activity } from 'lucide-react';

interface ProductStatsProps {
  stats: {
    total: number;
    active: number;
    categories: number;
    averagePrice: number;
  };
}

export const ProductStats: React.FC<ProductStatsProps> = ({ stats }) => {
  const statCards = [
    {
      title: 'Total Products',
      value: stats.total,
      icon: Package,
      change: '+12.5%',
      trend: 'up',
      color: 'blue',
      description: 'Products in your store',
      chart: [35, 60, 45, 75, 55, 85, 70],
    },
    {
      title: 'Active Products',
      value: stats.active,
      icon: CheckCircle,
      change: '+8.2%',
      trend: 'up',
      color: 'emerald',
      description: 'Currently active products',
      chart: [45, 30, 60, 40, 70, 50, 65],
    },
    {
      title: 'Categories',
      value: stats.categories,
      icon: Tags,
      change: '-2.4%',
      trend: 'down',
      color: 'violet',
      description: 'Product categories',
      chart: [55, 70, 45, 65, 40, 60, 50],
    },
    {
      title: 'Average Price',
      value: `$${stats.averagePrice.toFixed(2)}`,
      icon: DollarSign,
      change: '+5.7%',
      trend: 'up',
      color: 'amber',
      description: 'Average product price',
      chart: [40, 55, 35, 65, 45, 70, 60],
    },
  ];

  const renderSparkline = (data: number[]) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min;
    const points = data
      .map((value, index) => {
        const x = (index / (data.length - 1)) * 100;
        const y = 100 - ((value - min) / range) * 100;
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <svg className="w-full h-12" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-50"
        />
      </svg>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        const isPositive = stat.trend === 'up';
        const gradientColors = {
          blue: 'from-blue-500/10 to-blue-500/5',
          emerald: 'from-emerald-500/10 to-emerald-500/5',
          violet: 'from-violet-500/10 to-violet-500/5',
          amber: 'from-amber-500/10 to-amber-500/5',
        };
        const strokeColors = {
          blue: 'stroke-blue-500',
          emerald: 'stroke-emerald-500',
          violet: 'stroke-violet-500',
          amber: 'stroke-amber-500',
        };

        return (
          <div
            key={index}
            className="group relative bg-white rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-lg"
          >
            {/* Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradientColors[stat.color]} opacity-50`} />

            {/* Content */}
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-${stat.color}-50 text-${stat.color}-600`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium ${
                  isPositive 
                    ? 'text-emerald-700 bg-emerald-50' 
                    : 'text-red-700 bg-red-50'
                }`}>
                  {isPositive ? (
                    <ArrowUp className="h-4 w-4" />
                  ) : (
                    <ArrowDown className="h-4 w-4" />
                  )}
                  {stat.change}
                </div>
              </div>

              <div className="space-y-1 mb-4">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-bold text-gray-900">
                    {stat.value}
                  </h3>
                  <Activity className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-600">
                  {stat.title}
                </p>
                <p className="text-xs text-gray-400">
                  {stat.description}
                </p>
              </div>

              {/* Sparkline */}
              <div className={`${strokeColors[stat.color]} transform transition-transform duration-500 group-hover:scale-y-110`}>
                {renderSparkline(stat.chart)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
