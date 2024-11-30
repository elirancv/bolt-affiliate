import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Alert } from '../../components/ui/Alert';
import { Loader2 } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
} from 'chart.js';
import { format } from 'date-fns';
import { LineChart, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const options = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        precision: 0
      }
    }
  }
};

interface DashboardChartsProps {
  userId: string | undefined;
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({ userId }) => {
  const { data: analyticsData, isLoading, error } = useQuery({
    queryKey: ['analyticsData', userId],
    queryFn: async (): Promise<any> => {
      try {
        logger.info('Fetching analytics data...', { userId });

        // First, get all store IDs that belong to the user
        const { data: stores, error: storesError } = await supabase
          .from('stores')
          .select('id')
          .eq('user_id', userId);

        if (storesError) throw new Error(`Failed to fetch stores: ${storesError.message}`);
        if (!stores?.length) {
          return {
            viewsByDate: new Map(),
            clicksByDate: new Map()
          };
        }

        const storeIds = stores.map(s => s.id);

        // Get all product IDs that belong to the user's stores
        const { data: userProducts, error: productsError } = await supabase
          .from('products')
          .select('id')
          .in('store_id', storeIds);

        if (productsError) throw new Error(`Failed to fetch products: ${productsError.message}`);
        if (!userProducts?.length) {
          return {
            viewsByDate: new Map(),
            clicksByDate: new Map()
          };
        }

        const productIds = userProducts.map(p => p.id);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Now fetch views and clicks for these products
        const [viewsResponse, clicksResponse] = await Promise.all([
          supabase
            .from('product_views')
            .select('viewed_at, product_id')
            .in('product_id', productIds)
            .gte('viewed_at', thirtyDaysAgo.toISOString()),
          supabase
            .from('product_clicks')
            .select('clicked_at, product_id')
            .in('product_id', productIds)
            .gte('clicked_at', thirtyDaysAgo.toISOString())
        ]);

        if (viewsResponse.error) throw new Error(`Failed to fetch views: ${viewsResponse.error.message}`);
        if (clicksResponse.error) throw new Error(`Failed to fetch clicks: ${clicksResponse.error.message}`);

        // Process the data to group by date
        const viewsByDate = new Map<string, number>();
        const clicksByDate = new Map<string, number>();

        // Initialize dates for the last 30 days
        for (let i = 0; i < 30; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const formattedDate = format(date, 'MMM d');
          viewsByDate.set(formattedDate, 0);
          clicksByDate.set(formattedDate, 0);
        }

        // Convert the Maps to objects for serialization
        const views = Object.fromEntries(viewsByDate);
        const clicks = Object.fromEntries(clicksByDate);

        // Count views by date
        viewsResponse.data.forEach(view => {
          const date = format(new Date(view.viewed_at), 'MMM d');
          views[date] = (views[date] || 0) + 1;
        });

        // Count clicks by date
        clicksResponse.data.forEach(click => {
          const date = format(new Date(click.clicked_at), 'MMM d');
          clicks[date] = (clicks[date] || 0) + 1;
        });

        return {
          viewsByDate: new Map(Object.entries(views)),
          clicksByDate: new Map(Object.entries(clicks))
        };
      } catch (err) {
        logger.error('Error fetching analytics data:', err);
        throw err;
      }
    },
    enabled: !!userId
  });

  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mt-6">
        <CardContent className="pt-6">
          <Alert variant="destructive" title="Error">
            {error instanceof Error ? error.message : 'Failed to load analytics data'}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!analyticsData || (!analyticsData.viewsByDate && !analyticsData.clicksByDate)) {
    return (
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="p-3 bg-blue-50 rounded-full mb-4">
              <LineChart className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Visitors Yet</h3>
            <p className="text-sm text-gray-500 max-w-sm mb-4">
              Share your affiliate links to start tracking views and clicks.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasData = analyticsData.viewsByDate.size > 0 || analyticsData.clicksByDate.size > 0;

  if (!hasData) {
    return (
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="p-3 bg-blue-50 rounded-full mb-4">
              <LineChart className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Visitors Yet</h3>
            <p className="text-sm text-gray-500 max-w-sm mb-4">
              Share your affiliate links to start tracking views and clicks.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const dates = Array.from(analyticsData.viewsByDate.keys()).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  );

  const chartData: ChartData<'line'> = {
    labels: dates,
    datasets: [
      {
        label: 'Views',
        data: dates.map(date => analyticsData.viewsByDate.get(date) || 0),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
        tension: 0.4,
      },
      {
        label: 'Clicks',
        data: dates.map(date => analyticsData.clicksByDate.get(date) || 0),
        borderColor: 'rgb(251, 146, 60)',
        backgroundColor: 'rgba(251, 146, 60, 0.5)',
        tension: 0.4,
      },
    ],
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Analytics Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <Line options={options} data={chartData} />
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardCharts;
