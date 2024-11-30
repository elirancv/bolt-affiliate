import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Progress } from '../../components/ui/Progress';
import type { Subscription, FeatureLimits } from '../../store/subscriptionStore';

interface SubscriptionStatusProps {
  storeCount: number;
  productCount: number;
  subscription: Subscription | null;
  featureLimits: FeatureLimits | null;
}

export default function SubscriptionStatus({ 
  storeCount, 
  productCount, 
  subscription, 
  featureLimits 
}: SubscriptionStatusProps) {
  const navigate = useNavigate();

  if (!subscription || !featureLimits) {
    return null;
  }

  const storeUsagePercentage = (storeCount / featureLimits.max_stores) * 100;
  const productUsagePercentage = (productCount / featureLimits.total_products_limit) * 100;

  return (
    <div className="bg-white rounded-lg h-full">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Subscription Status</h3>
          <p className="text-sm text-gray-500">Current usage and limits</p>
        </div>
        <button
          onClick={() => navigate('/subscription')}
          className="text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          Manage
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Store Usage</span>
            <span className="text-sm text-gray-600">{storeCount} / {featureLimits.max_stores}</span>
          </div>
          <Progress 
            value={storeUsagePercentage} 
            className="h-2"
            indicatorClassName={storeUsagePercentage >= 90 ? 'bg-red-500' : 'bg-blue-500'}
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Product Usage</span>
            <span className="text-sm text-gray-600">{productCount} / {featureLimits.total_products_limit}</span>
          </div>
          <Progress 
            value={productUsagePercentage}
            className="h-2"
            indicatorClassName={productUsagePercentage >= 90 ? 'bg-red-500' : 'bg-blue-500'}
          />
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-700">Current Plan</p>
              <p className="text-xs text-gray-500">{subscription.tier}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700">Analytics Retention</p>
              <p className="text-xs text-gray-500">{featureLimits.analytics_retention_days} days</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
