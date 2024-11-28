import React from 'react';
import { useParams } from 'react-router-dom';
import { StoreMetrics } from '../components/analytics/StoreMetrics';

export default function Analytics() {
  const { storeId } = useParams<{ storeId: string }>();

  if (!storeId) {
    return <div>Store ID is required</div>;
  }

  return (
    <div className="space-y-6">
      {/* Main Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track your store's performance and insights
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <StoreMetrics storeId={storeId} />
    </div>
  );
}