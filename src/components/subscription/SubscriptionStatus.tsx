import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { ArrowUpRight, AlertCircle } from 'lucide-react';

const SubscriptionStatus = () => {
  const navigate = useNavigate();
  const { currentPlan, isLoading } = useSubscriptionStore();

  if (isLoading) {
    return (
      <div className="animate-pulse bg-gray-100 rounded-lg p-4">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50';
      case 'trialing':
        return 'text-blue-600 bg-blue-50';
      case 'past_due':
        return 'text-red-600 bg-red-50';
      case 'canceled':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
  };

  const daysRemaining = currentPlan ? Math.ceil(
    (new Date(currentPlan.current_period_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  ) : 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Subscription Status</h3>
          {currentPlan ? (
            <>
              <p className="mt-2 text-sm text-gray-500">
                You are currently on the {currentPlan.plan?.name || 'Free'} plan
              </p>
              <div className="mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(currentPlan.status || 'free')}`}>
                  {formatStatus(currentPlan.status || 'free')}
                </span>
              </div>
              {currentPlan.status === 'active' && currentPlan.current_period_end && (
                <p className="mt-2 text-sm text-gray-500">
                  {daysRemaining} days remaining in current billing period
                </p>
              )}
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-gray-500">
                You are currently on the Free plan
              </p>
              <div className="mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor('free')}`}>
                  Free
                </span>
              </div>
            </>
          )}
        </div>
        <button
          onClick={() => navigate('/subscription')}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Manage Subscription
          <ArrowUpRight className="ml-2 -mr-0.5 h-4 w-4" />
        </button>
      </div>

      {currentPlan?.status === 'past_due' && (
        <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Your payment is past due. Please update your payment method to avoid service interruption.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionStatus;
