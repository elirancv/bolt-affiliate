import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Execute the refresh functions
    const { data: refreshSubscription, error: subscriptionError } = await supabaseClient
      .rpc('refresh_subscription_metrics')

    if (subscriptionError) {
      console.error('Error refreshing subscription metrics:', subscriptionError)
    }

    const { data: refreshFeatures, error: featuresError } = await supabaseClient
      .rpc('refresh_feature_usage_metrics')

    if (featuresError) {
      console.error('Error refreshing feature metrics:', featuresError)
    }

    return new Response(
      JSON.stringify({
        message: "Analytics refresh completed",
        subscription_refresh: subscriptionError ? 'failed' : 'success',
        features_refresh: featuresError ? 'failed' : 'success'
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error in refresh-analytics function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500
      }
    )
  }
})
