import React, { useEffect, useState } from 'react';
import { getStoreAnalytics } from '../../lib/analytics';
import { Users, MousePointerClick, TrendingUp, DollarSign } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

interface StoreMetricsProps {
  storeId: string;
}

interface Metric {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
}

export function StoreMetrics({ storeId }: StoreMetricsProps) {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      const data = await getStoreAnalytics(storeId);
      setMetrics(data || {
        unique_visitors: 0,
        product_clicks: 0,
        conversion_rate: 0,
        total_commission: 0
      });
      setLoading(false);
    }

    loadMetrics();
  }, [storeId]);

  const metricCards: Metric[] = [
    {
      title: 'Unique Visitors',
      value: metrics?.unique_visitors || 0,
      icon: <Users className="h-5 w-5" />,
      description: 'Total unique visitors to your store'
    },
    {
      title: 'Product Clicks',
      value: metrics?.product_clicks || 0,
      icon: <MousePointerClick className="h-5 w-5" />,
      description: 'Number of clicks on products'
    },
    {
      title: 'Conversion Rate',
      value: `${(metrics?.conversion_rate || 0).toFixed(1)}%`,
      icon: <TrendingUp className="h-5 w-5" />,
      description: 'Click-through rate'
    },
    {
      title: 'Total Commission',
      value: `$${(metrics?.total_commission || 0).toFixed(2)}`,
      icon: <DollarSign className="h-5 w-5" />,
      description: 'Total earnings from commissions'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="mt-4 h-4 w-[100px]" />
              <Skeleton className="mt-2 h-6 w-[60px]" />
              <Skeleton className="mt-2 h-4 w-[150px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {metricCards.map((metric, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-primary/10 p-3">
                {React.cloneElement(metric.icon as React.ReactElement, {
                  className: 'h-5 w-5 text-primary',
                  'aria-hidden': 'true',
                })}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </p>
                <p className="text-2xl font-bold">
                  {metric.value}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {metric.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
