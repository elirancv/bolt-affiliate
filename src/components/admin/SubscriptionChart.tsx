import React from 'react';
import { Progress } from '../ui/Progress';

interface SubscriptionChartProps {
  usersByTier: Record<string, number>;
  totalUsers: number;
}

const SUBSCRIPTION_TIERS = [
  { key: 'free', label: 'Free', color: 'bg-gray-500' },
  { key: 'starter', label: 'Starter', color: 'bg-blue-500' },
  { key: 'professional', label: 'Professional', color: 'bg-purple-500' },
  { key: 'business', label: 'Business', color: 'bg-green-500' },
  { key: 'unlimited', label: 'Unlimited', color: 'bg-orange-500' }
];

export default function SubscriptionChart({ usersByTier, totalUsers }: SubscriptionChartProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-gray-900">Subscription Distribution</h2>
      <div className="space-y-3">
        {SUBSCRIPTION_TIERS.map(tier => {
          const count = usersByTier[tier.key] || 0;
          const percentage = totalUsers > 0 ? (count / totalUsers) * 100 : 0;
          
          return (
            <div key={tier.key} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">{tier.label}</span>
                <span className="text-gray-500">
                  {count} user{count !== 1 ? 's' : ''} ({percentage.toFixed(1)}%)
                </span>
              </div>
              <Progress 
                value={percentage} 
                className={tier.color} 
                indicatorClassName={tier.color}
              />
            </div>
          );
        })}
      </div>
      <div className="pt-2 border-t">
        <div className="flex justify-between text-sm">
          <span className="font-medium text-gray-700">Total Users</span>
          <span className="font-medium text-gray-900">{totalUsers}</span>
        </div>
      </div>
    </div>
  );
}