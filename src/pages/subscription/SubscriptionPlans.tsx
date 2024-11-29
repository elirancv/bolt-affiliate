import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'react-hot-toast';
import { Check, X } from 'lucide-react';

const SubscriptionPlans = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    currentPlan,
    availablePlans,
    isLoading,
    error,
    fetchCurrentPlan,
    fetchAvailablePlans,
    upgradePlan,
    cancelSubscription,
    reactivateSubscription,
  } = useSubscriptionStore();

  useEffect(() => {
    fetchCurrentPlan();
    fetchAvailablePlans();
  }, [fetchCurrentPlan, fetchAvailablePlans]);

  const handleUpgrade = async (planId: string) => {
    try {
      const { url } = await upgradePlan(planId);
      window.location.href = url;
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleCancel = async () => {
    try {
      await cancelSubscription();
      toast.success('Subscription cancelled successfully');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleReactivate = async () => {
    try {
      await reactivateSubscription();
      toast.success('Subscription reactivated successfully');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Subscription Plans
        </h2>
        <p className="mt-4 text-lg text-gray-600">
          Choose the perfect plan for your business
        </p>
      </div>

      <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:grid-cols-4">
        {availablePlans.map((plan) => {
          const isCurrentPlan = currentPlan?.subscription_plans.id === plan.id;
          const isUpgrading = currentPlan && plan.price > currentPlan.subscription_plans.price;
          const isDowngrading = currentPlan && plan.price < currentPlan.subscription_plans.price;

          return (
            <div
              key={plan.id}
              className={`rounded-lg shadow-lg divide-y divide-gray-200 ${
                isCurrentPlan ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="p-6">
                <h3 className="text-2xl font-semibold text-gray-900">{plan.name}</h3>
                <p className="mt-4 text-sm text-gray-500">{plan.description}</p>
                <p className="mt-8">
                  <span className="text-4xl font-extrabold text-gray-900">
                    ${plan.price}
                  </span>
                  <span className="text-base font-medium text-gray-500">
                    /{plan.billing_interval}
                  </span>
                </p>

                <ul className="mt-6 space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature.feature_code} className="flex">
                      <Check className="flex-shrink-0 w-6 h-6 text-green-500" />
                      <span className="ml-3 text-sm text-gray-500">
                        {feature.limit_value === -1
                          ? 'Unlimited'
                          : feature.limit_value}{' '}
                        {feature.feature_code.replace(/_/g, ' ')}
                      </span>
                    </li>
                  ))}
                </ul>

                {isCurrentPlan ? (
                  <div className="mt-8">
                    <span className="block w-full rounded-md shadow-sm">
                      <button
                        type="button"
                        className="w-full px-4 py-2 text-sm font-medium text-blue-500 bg-white border border-blue-500 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        onClick={
                          currentPlan.cancel_at_period_end
                            ? handleReactivate
                            : handleCancel
                        }
                      >
                        {currentPlan.cancel_at_period_end
                          ? 'Reactivate Subscription'
                          : 'Cancel Subscription'}
                      </button>
                    </span>
                    {currentPlan.cancel_at_period_end && (
                      <p className="mt-2 text-sm text-gray-500">
                        Your subscription will end on{' '}
                        {new Date(
                          currentPlan.current_period_end
                        ).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    className="mt-8 block w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={() => handleUpgrade(plan.id)}
                  >
                    {isUpgrading ? 'Upgrade' : isDowngrading ? 'Downgrade' : 'Select Plan'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubscriptionPlans;
