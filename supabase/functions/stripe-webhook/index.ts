import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2022-11-15',
})

const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

serve(async (req) => {
  try {
    const signature = req.headers.get('stripe-signature')
    if (!signature || !endpointSecret) {
      throw new Error('Missing signature or endpoint secret')
    }

    const body = await req.text()
    const event = stripe.webhooks.constructEvent(body, signature, endpointSecret)

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const { user_id, plan_id } = session.metadata

        // Create subscription record
        await supabaseClient.from('subscriptions').upsert({
          user_id,
          subscription_plan_id: plan_id,
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          status: 'active',
          current_period_start: new Date(session.subscription_data.current_period_start * 1000),
          current_period_end: new Date(session.subscription_data.current_period_end * 1000),
        })
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const { user_id } = subscription.metadata

        await supabaseClient.from('subscriptions').upsert({
          user_id,
          stripe_subscription_id: subscription.id,
          status: subscription.status,
          cancel_at_period_end: subscription.cancel_at_period_end,
          canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
          current_period_start: new Date(subscription.current_period_start * 1000),
          current_period_end: new Date(subscription.current_period_end * 1000),
        })
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const { user_id } = subscription.metadata

        await supabaseClient.from('subscriptions').update({
          status: 'canceled',
          canceled_at: new Date(),
        }).eq('stripe_subscription_id', subscription.id)

        // Revert to free plan
        const { data: freePlan } = await supabaseClient
          .from('subscription_plans')
          .select('id')
          .eq('code', 'free')
          .single()

        if (freePlan) {
          await supabaseClient.from('subscriptions').insert({
            user_id,
            subscription_plan_id: freePlan.id,
            status: 'active',
          })
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
        const { user_id } = subscription.metadata

        await supabaseClient.from('subscriptions').update({
          status: 'past_due',
        }).eq('stripe_subscription_id', subscription.id)

        // Notify user about failed payment
        await supabaseClient.from('notifications').insert({
          user_id,
          type: 'payment_failed',
          title: 'Payment Failed',
          message: 'Your latest subscription payment has failed. Please update your payment method.',
          severity: 'error',
        })
        break
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
