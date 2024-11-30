import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function restoreData() {
  // Insert subscription plans
  const { error: plansError } = await supabase
    .from('subscription_plans')
    .upsert([
      {
        name: 'free',
        description: 'Free tier with basic features',
        price: 0,
        billing_interval: 'month',
        max_stores: 1,
        total_products_limit: 10,
        analytics_retention_days: 7
      },
      {
        name: 'pro',
        description: 'Professional tier with advanced features',
        price: 29,
        billing_interval: 'month',
        max_stores: 3,
        total_products_limit: 50,
        analytics_retention_days: 30
      },
      {
        name: 'business',
        description: 'Business tier with unlimited features',
        price: 99,
        billing_interval: 'month',
        max_stores: 10,
        total_products_limit: 200,
        analytics_retention_days: 90
      }
    ], {
      onConflict: 'name'
    });

  if (plansError) {
    console.error('Error restoring subscription plans:', plansError);
    return;
  }

  console.log('Successfully restored subscription plans');
}

restoreData()
  .catch(console.error);
