import React, { useEffect } from 'react';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import SubscriptionStatus from '../../components/subscription/SubscriptionStatus';
import SubscriptionUsage from '../../components/subscription/SubscriptionUsage';
import BillingHistory from '../../components/subscription/BillingHistory';
import { CreditCard, Receipt } from 'lucide-react';

const Billing = () => {
  const { fetchCurrentPlan, fetchAvailablePlans } = useSubscriptionStore();

  useEffect(() => {
    fetchCurrentPlan();
    fetchAvailablePlans();
  }, [fetchCurrentPlan, fetchAvailablePlans]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Billing & Subscription
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your subscription, view usage, and download invoices
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Subscription Status */}
        <div className="col-span-1">
          <SubscriptionStatus />
        </div>

        {/* Subscription Usage */}
        <div className="col-span-1">
          <SubscriptionUsage />
        </div>
      </div>

      {/* Payment Method Section */}
      <div className="mt-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex items-center">
              <CreditCard className="h-5 w-5 text-gray-400 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">Payment Method</h3>
            </div>
          </div>
          <div className="px-6 py-4">
            <button
              onClick={() => window.location.href = '/subscription'}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Update Payment Method
            </button>
          </div>
        </div>
      </div>

      {/* Billing History */}
      <div className="mt-8">
        <BillingHistory />
      </div>
    </div>
  );
};

export default Billing;
