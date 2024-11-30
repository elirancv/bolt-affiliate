import React, { useEffect, useState } from 'react';
import { useSubscription } from '../../hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

const SubscriptionUsage = () => {
  const navigate = useNavigate();
  const { featureLimits, isLoading } = useSubscription();

  if (isLoading || !featureLimits) {
    return (
      <div className="animate-pulse bg-gray-100 rounded-lg p-4">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="space-y-3 mt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  const formatFeatureName = (code: string) => {
    return code.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatLimit = (limit: number) => {
    return limit === -1 ? 'Unlimited' : limit;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Feature Usage</h3>
        <button
          onClick={() => navigate('/subscription')}
          className="text-sm text-blue-600 hover:text-blue-500"
        >
          Upgrade Plan
        </button>
      </div>

      <div className="space-y-4">
        {Object.entries(featureLimits).map(([featureCode, feature]) => {
          const current = feature.current_value || 0;
          const limit = feature.limit_value;
          const percentage = getUsagePercentage(current, limit);
          const isNearLimit = percentage >= 80 && percentage < 100;
          const isAtLimit = percentage >= 100;

          return (
            <div key={featureCode} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  {formatFeatureName(featureCode)}
                </span>
                <span className="text-sm text-gray-500">
                  {current} / {formatLimit(limit)}
                </span>
              </div>
              
              <div className="relative">
                <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-100">
                  <div
                    style={{ width: `${percentage}%` }}
                    className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                      isAtLimit
                        ? 'bg-red-500'
                        : isNearLimit
                        ? 'bg-yellow-500'
                        : 'bg-blue-500'
                    }`}
                  ></div>
                </div>
              </div>

              {(isNearLimit || isAtLimit) && (
                <div className={`flex items-center mt-1 text-sm ${
                  isAtLimit ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {isAtLimit
                    ? 'Usage limit reached. Upgrade your plan for more.'
                    : 'Approaching usage limit'}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubscriptionUsage;
