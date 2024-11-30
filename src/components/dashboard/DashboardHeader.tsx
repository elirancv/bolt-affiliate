import React from 'react';
import PageHeader from '../../components/ui/PageHeader';
import SubscriptionStatus from './SubscriptionStatus';
import type { Subscription } from '../../types/subscription';
import { LayoutDashboard } from 'lucide-react';

interface DashboardHeaderProps {
  subscription: Subscription | null;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ subscription }) => {
  return (
    <div className="flex flex-col space-y-4">
      <PageHeader
        title="Dashboard"
        subtitle="Monitor your affiliate marketing performance"
        icon={LayoutDashboard}
      />
      <SubscriptionStatus subscription={subscription} />
    </div>
  );
};

export default DashboardHeader;
