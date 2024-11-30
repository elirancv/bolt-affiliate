import React from 'react';
import { Progress } from '../ui/Progress';
import { useSubscriptionStore } from '../../store/subscriptionStore';

interface SubscriptionChartProps {
  usersByTier: Record<string, number>;
  totalUsers: number;
}

export default function SubscriptionChart({ usersByTier, totalUsers }: SubscriptionChartProps) {
  const { availablePlans, fetchAvailablePlans } = useSubscriptionStore();

  // Fetch plans on mount
  React.useEffect(() => {
    fetchAvailablePlans();
  }, [fetchAvailablePlans]);
  
  // Map plans to chart tiers with consistent colors
  const chartTiers = availablePlans?.map((plan, index) => {
    const colors = ['bg-gray-500', 'bg-blue-500', 'bg-purple-500'];
    const planName = plan.name.toLowerCase();
    let displayName = '';
    
    // Properly capitalize plan names
    switch (planName) {
      case 'free':
        displayName = 'Free';
        break;
      case 'pro':
        displayName = 'Pro';
        break;
      case 'business':
        displayName = 'Business';
        break;
      default:
        displayName = plan.name.charAt(0).toUpperCase() + plan.name.slice(1);
    }

    return {
      key: planName,
      label: displayName,
      color: colors[index % colors.length]
    };
  }) || [
    { key: 'free', label: 'Free', color: 'bg-gray-500' },
    { key: 'pro', label: 'Pro', color: 'bg-blue-500' },
    { key: 'business', label: 'Business', color: 'bg-purple-500' }
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-gray-900">Subscription Distribution</h2>
      <div className="space-y-3">
        {chartTiers.map(tier => {
          const count = usersByTier[tier.key] || 0;
          const percentage = totalUsers > 0 ? (count / totalUsers) * 100 : 0;
          
          return (
            <div key={tier.key}>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${tier.color}`}></div>
                  <span className="text-sm text-gray-900">{tier.label}</span>
                </div>
                <span className="text-sm text-gray-600">
                  {count} user{count !== 1 ? 's' : ''} ({percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-50 rounded-full h-2">
                <div
                  className={`${tier.color} h-2 rounded-full transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="pt-2 border-t mt-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium text-gray-900">Total Users</span>
          <span className="font-medium text-gray-900">{totalUsers}</span>
        </div>
      </div>
    </div>
  );
}