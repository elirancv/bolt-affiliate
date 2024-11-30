import React from 'react';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { Card } from './ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/Tooltip';
import { Progress } from './ui/Progress';
import { Info, CreditCard, Rocket, Settings } from 'lucide-react';
import { Button } from './ui/Button';
import { useNavigate } from 'react-router-dom';

const SubscriptionUsage: React.FC = () => {
  const { 
    featureLimits, 
    fetchFeatureLimits, 
    isLoading,
    subscription 
  } = useSubscriptionStore();
  const navigate = useNavigate();

  React.useEffect(() => {
    fetchFeatureLimits();
  }, [fetchFeatureLimits]);

  if (isLoading) {
    return (
      <Card className="p-6 bg-white/50 backdrop-blur-sm">
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Card>
    );
  }

  if (!featureLimits) {
    return (
      <Card className="p-6 bg-white/50 backdrop-blur-sm">
        <div className="flex items-center justify-center text-red-500 p-4">
          <p>Unable to load usage information. Please try again later.</p>
        </div>
      </Card>
    );
  }

  const calculatePercentage = (current?: number, limit?: number) => {
    if (!current || !limit || limit === 0) return 0;
    return Math.min((current / limit) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    if (percentage === 100) return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getUsageDescription = (type: string, current: number, limit: number) => {
    const percentage = (current / limit) * 100;
    if (percentage >= 90) {
      return `You're using ${percentage.toFixed(1)}% of your ${type} limit. Consider upgrading your plan.`;
    }
    if (percentage >= 70) {
      return `You're using ${percentage.toFixed(1)}% of your ${type} limit. Plan ahead for growth.`;
    }
    return `You're using ${percentage.toFixed(1)}% of your ${type} limit.`;
  };

  const renderUsageBar = (
    label: string,
    current: number | undefined,
    limit: number | undefined,
    description?: string
  ) => {
    const percentage = calculatePercentage(current, limit);
    const color = getProgressColor(percentage);
    const usageDescription = current && limit ? getUsageDescription(label.toLowerCase(), current, limit) : description;

    return (
      <div className="py-4 border-b border-gray-100 last:border-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">{label}</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p className="text-sm">{usageDescription}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex-1">
            <Progress
              value={percentage}
              className="h-2 bg-gray-100"
              indicatorClassName={color}
            />
          </div>
          <div className="min-w-[100px] text-right">
            <span className="text-sm font-medium text-gray-900">
              {current ?? 0}
            </span>
            <span className="text-sm text-gray-500">
              {' '}/ {limit ?? 0}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="p-6 bg-white/50 backdrop-blur-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CreditCard className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {subscription?.plan_name || 'Free Plan'}
            </h3>
            <p className="text-sm text-gray-500">
              {subscription?.is_subscribed ? 'Active Subscription' : 'Limited Features'}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/pricing')}
          className="gap-2"
        >
          {subscription?.is_subscribed 
            ? <Settings className="h-4 w-4" />
            : <Rocket className="h-4 w-4" />
          }
          {subscription?.is_subscribed 
            ? 'Manage Subscription' 
            : 'Upgrade to Pro'}
        </Button>
      </div>
      <div>
        {renderUsageBar(
          'Stores',
          featureLimits.current_stores,
          featureLimits.max_stores,
          'Number of stores you can create'
        )}
        {renderUsageBar(
          'Products',
          featureLimits.current_products,
          featureLimits.total_products_limit,
          'Total number of products across all stores'
        )}
        {renderUsageBar(
          'Analytics History',
          featureLimits.current_analytics_days,
          featureLimits.analytics_retention_days,
          'Days of analytics data retention'
        )}
      </div>
    </Card>
  );
};

export default SubscriptionUsage;
