import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'

interface StoreCreate {
  name: string
  description?: string
  category: string
  settings?: Record<string, any>
}

interface StoreUpdate {
  name?: string
  description?: string
  category?: string
  status?: string
  settings?: Record<string, any>
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

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

    // Check user's subscription limits
    const { data: subscription } = await supabaseClient
      .from('users')
      .select('subscription_plan_id')
      .single()

    switch (req.method) {
      case 'GET': {
        const url = new URL(req.url)
        const storeId = url.searchParams.get('id')

        if (storeId) {
          // Get single store
          const { data, error } = await supabaseClient
            .from('stores')
            .select(`
              *,
              products (
                id,
                name,
                price,
                status
              ),
              analytics_cache (
                metrics
              )
            `)
            .eq('id', storeId)
            .single()

          if (error) throw error
          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        } else {
          // List stores
          const { data, error } = await supabaseClient
            .from('stores')
            .select('*')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: false })

          if (error) throw error
          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      }

      case 'POST': {
        const { name, description, category, settings }: StoreCreate = await req.json()

        // Check store limit
        const { count: storeCount } = await supabaseClient
          .from('stores')
          .select('id', { count: 'exact' })
          .eq('owner_id', user.id)

        const { data: featureLimit } = await supabaseClient.rpc('check_feature_access', {
          p_user_id: user.id,
          p_feature_code: 'stores',
          p_value: (storeCount + 1).toString()
        })

        if (!featureLimit) {
          return new Response(
            JSON.stringify({ error: 'Store limit reached for your subscription plan' }),
            {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        const { data, error } = await supabaseClient
          .from('stores')
          .insert({
            name,
            description,
            category,
            settings,
            owner_id: user.id,
            status: 'active'
          })
          .select()
          .single()

        if (error) throw error
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'PUT': {
        const { id, ...updates }: StoreUpdate & { id: string } = await req.json()

        const { data, error } = await supabaseClient
          .from('stores')
          .update(updates)
          .eq('id', id)
          .eq('owner_id', user.id)
          .select()
          .single()

        if (error) throw error
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'DELETE': {
        const url = new URL(req.url)
        const id = url.searchParams.get('id')
        if (!id) throw new Error('Store ID is required')

        const { error } = await supabaseClient
          .from('stores')
          .delete()
          .eq('id', id)
          .eq('owner_id', user.id)

        if (error) throw error
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
