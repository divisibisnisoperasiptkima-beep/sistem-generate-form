import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { share_token, action, data } = await req.json()

    if (!share_token) {
      return new Response(
        JSON.stringify({ error: 'Missing share_token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('PROJECT_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    )

    if (action === 'get') {
      // Handle form subssion
      const { data: template, error: templateError } = await supabase
        .from('templates')
        .select('*')
        .eq('share_token', share_token)
        .eq('is_published', true)
        .single()

      if (templateError || !template) {
        return new Response(
          JSON.stringify({ error: 'Form not found or not published' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: fields } = await supabase
        .from('template_fields')
        .select('id, name, label, field_type, required, placeholder, default_value, options, sort_order')
        .eq('template_id', template.id)
        .order('sort_order', { ascending: true })

      return new Response(
        JSON.stringify({ template, fields }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'submit') {
      const { data: template, error: templateError } = await supabase
        .from('templates')
        .select('*')
        .eq('share_token', share_token)
        .eq('is_published', true)
        .single()

      if (templateError || !template) {
        return new Response(
          JSON.stringify({ error: 'Form not found or not published' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Call the generate-pdf function
      const generateResponse = await fetch(
        `${Deno.env.get('PROJECT_URL')}/functions/v1/generate-pdf`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({
            template_id: template.id,
            data: data || {},
          }),
        }
      )

      const result = await generateResponse.json()

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
