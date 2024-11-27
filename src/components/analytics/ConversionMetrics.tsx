import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ConversionMetricsProps {
  data: Array<{
    date: string;
    unique_visitors: number;
    product_clicks: number;
  }>;
}

export default function ConversionMetrics({ data }: ConversionMetricsProps) {
  const chartData = {
    labels: data.map(record => record.date),
    datasets: [
      {
        label: 'Conversion Rate (%)',
        data: data.map(record => 
          record.unique_visitors > 0 
            ? ((record.product_clicks / record.unique_visitors) * 100).toFixed(1)
            : 0
        ),
        backgroundColor: 'rgba(249, 115, 22, 0.5)',
        borderColor: 'rgb(249, 115, 22)',
        borderWidth: 1,
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
        display: true,
        text: 'Daily Conversion Rate'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Conversion Rate (%)'
        }
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <Bar data={chartData} options={options} />
    </div>
  );
}