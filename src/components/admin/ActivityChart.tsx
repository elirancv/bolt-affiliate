import React from 'react';
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
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ActivityChartProps {
  activityByDate?: Record<string, {
    pageViews: number;
    visitors: number;
    clicks: number;
  }>;
}

export default function ActivityChart({ activityByDate = {} }: ActivityChartProps) {
  const dates = Object.keys(activityByDate).sort();
  const pageViews = dates.map(date => activityByDate[date]?.pageViews || 0);
  const visitors = dates.map(date => activityByDate[date]?.visitors || 0);
  const clicks = dates.map(date => activityByDate[date]?.clicks || 0);

  const data = {
    labels: dates,
    datasets: [
      {
        label: 'Page Views',
        data: pageViews,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
      },
      {
        label: 'Unique Visitors',
        data: visitors,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
      },
      {
        label: 'Affiliate Clicks',
        data: clicks,
        borderColor: 'rgb(249, 115, 22)',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        fill: true,
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  if (dates.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Platform Activity</h3>
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No activity data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Platform Activity</h3>
      <Line data={data} options={options} />
    </div>
  );
}