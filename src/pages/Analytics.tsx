import React from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { StoreMetrics } from '../components/analytics/StoreMetrics';

export default function Analytics() {
  const { storeId } = useParams<{ storeId: string }>();

  if (!storeId) {
    return <div>Store ID is required</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Analytics"
        subtitle="Track your store's performance"
      />
      
      <div className="mt-8">
        <StoreMetrics storeId={storeId} />
      </div>
    </div>
  );
}