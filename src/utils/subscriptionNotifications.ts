import { supabase } from '../lib/supabase';

export const createSubscriptionNotification = async (
  userId: string,
  type: 'success' | 'info' | 'warning' | 'error',
  title: string,
  message: string,
  metadata?: Record<string, any>
) => {
  try {
    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      type,
      title,
      message,
      metadata,
      read: false,
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

export const sendSubscriptionUpdateNotification = async (
  userId: string,
  planName: string,
  status: string
) => {
  let title = '';
  let message = '';
  let type: 'success' | 'info' | 'warning' | 'error' = 'info';

  switch (status) {
    case 'active':
      title = 'Subscription Activated';
      message = `Your ${planName} subscription is now active.`;
      type = 'success';
      break;
    case 'trialing':
      title = 'Trial Started';
      message = `Your ${planName} trial has begun.`;
      type = 'info';
      break;
    case 'past_due':
      title = 'Payment Failed';
      message = 'Your latest payment failed. Please update your payment method.';
      type = 'error';
      break;
    case 'canceled':
      title = 'Subscription Canceled';
      message = `Your ${planName} subscription has been canceled.`;
      type = 'warning';
      break;
    default:
      title = 'Subscription Updated';
      message = `Your subscription status has been updated to ${status}.`;
  }

  await createSubscriptionNotification(userId, type, title, message, {
    route: '/billing',
  });
};

export const sendUpgradeReminderNotification = async (
  userId: string,
  featureCode: string,
  currentUsage: number,
  limit: number
) => {
  const usagePercentage = (currentUsage / limit) * 100;
  
  if (usagePercentage >= 90) {
    await createSubscriptionNotification(
      userId,
      'warning',
      'Usage Limit Almost Reached',
      `You've used ${currentUsage} out of ${limit} ${featureCode.replace(
        /_/g,
        ' '
      )}. Consider upgrading your plan.`,
      {
        route: '/subscription',
        feature: featureCode,
        usage: currentUsage,
        limit,
      }
    );
  }
};

export const sendTrialEndingNotification = async (
  userId: string,
  daysRemaining: number
) => {
  if (daysRemaining <= 3) {
    await createSubscriptionNotification(
      userId,
      'warning',
      'Trial Ending Soon',
      `Your trial will end in ${daysRemaining} day${
        daysRemaining === 1 ? '' : 's'
      }. Upgrade now to keep your features.`,
      {
        route: '/subscription',
        daysRemaining,
      }
    );
  }
};
