import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2022-11-15',
})

serve(async (req) => {
  const corsResponse = await handleCORS(req)
  if (corsResponse) return corsResponse

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    switch (req.method) {
      case 'GET': {
        // Get current subscription
        const { data: subscription, error } = await supabaseClient
          .from('subscriptions')
          .select(`
            *,
            subscription_plans (
              name,
              code,
              description,
              price,
              billing_interval,
              features:plan_feature_limits (
                feature_code,
                limit_value
              )
            )
          `)
          .eq('user_id', user.id)
          .single()

        if (error) throw error
        return new Response(JSON.stringify(subscription), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'POST': {
        const { planId, successUrl, cancelUrl } = await req.json()

        // Get plan details
        const { data: plan, error: planError } = await supabaseClient
          .from('subscription_plans')
          .select('*')
          .eq('id', planId)
          .single()

        if (planError || !plan) {
          throw new Error('Invalid plan selected')
        }

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
          customer_email: user.email,
          client_reference_id: user.id,
          success_url: successUrl,
          cancel_url: cancelUrl,
          mode: 'subscription',
          line_items: [
            {
              price: plan.stripe_price_id,
              quantity: 1,
            },
          ],
          metadata: {
            user_id: user.id,
            plan_id: planId,
          },
        })

        return new Response(JSON.stringify({ sessionId: session.id, url: session.url }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'PUT': {
        const { action } = await req.json()

        // Get current subscription
        const { data: subscription, error: subError } = await supabaseClient
          .from('subscriptions')
          .select('stripe_subscription_id')
          .eq('user_id', user.id)
          .single()

        if (subError || !subscription?.stripe_subscription_id) {
          throw new Error('No active subscription found')
        }

        switch (action) {
          case 'cancel': {
            await stripe.subscriptions.update(subscription.stripe_subscription_id, {
              cancel_at_period_end: true,
            })
            break
          }
          case 'reactivate': {
            await stripe.subscriptions.update(subscription.stripe_subscription_id, {
              cancel_at_period_end: false,
            })
            break
          }
          default:
            throw new Error('Invalid action')
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      default:
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
