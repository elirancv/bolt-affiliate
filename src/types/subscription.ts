export interface SubscriptionPlan {
  id: string;
  name: string;
  code: string;
  description: string;
  price: number;
  billing_interval: 'monthly' | 'yearly';
  trial_days: number;
  status: 'active' | 'inactive';
  features: PlanFeature[];
  stripe_price_id: string;
  created_at: string;
  updated_at: string;
}

export interface PlanFeature {
  feature_code: string;
  limit_value: string | number;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  subscription_plan_id: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  cancel_at_period_end: boolean;
  current_period_start: string;
  current_period_end: string;
  canceled_at?: string;
  subscription_plans: SubscriptionPlan;
}

export interface FeatureLimit {
  feature_code: string;
  limit_value: string | number;
  current_usage?: number;
}
