import React from 'react';

interface SubscriptionChartProps {
  usersByTier: Record<string, number>;
}

export default function SubscriptionChart({ usersByTier }: SubscriptionChartProps) {
  const total = Object.values(usersByTier).reduce((sum, count) => sum + count, 0);
  
  const tiers = [
    { name: 'Free', color: 'bg-gray-500' },
    { name: 'Starter', color: 'bg-blue-500' },
    { name: 'Professional', color: 'bg-green-500' },
    { name: 'Business', color: 'bg-purple-500' },
    { name: 'Unlimited', color: 'bg-orange-500' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Subscription Distribution</h3>
      <div className="space-y-4">
        {tiers.map((tier) => {
          const count = usersByTier[tier.name.toLowerCase()] || 0;
          const percentage = total > 0 ? (count / total) * 100 : 0;
          
          return (
            <div key={tier.name}>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>{tier.name}</span>
                <span>{count} users ({percentage.toFixed(1)}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`${tier.color} h-2.5 rounded-full`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}