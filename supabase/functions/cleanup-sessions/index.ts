import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Check if specific session code was provided (for immediate cleanup on browser close)
    let sessionCode: string | null = null
    try {
      const body = await req.json()
      sessionCode = body.session_code || null
    } catch {
      // No body or invalid JSON - proceed with scheduled cleanup
    }

    if (sessionCode) {
      // Delete specific session - require host_id for security
      let hostId: string | null = null
      try {
        const body = await req.clone().json()
        hostId = body.host_id || null
      } catch {
        // Already parsed above
      }
      
      console.log(`Deleting session: ${sessionCode}, host_id: ${hostId}`)
      
      // Build query - if host_id provided, validate ownership
      let query = supabase
        .from('game_sessions')
        .delete()
        .eq('session_code', sessionCode)
      
      if (hostId) {
        query = query.eq('host_id', hostId)
      }
      
      const { data, error } = await query.select()

      if (error) {
        console.error('Delete session error:', error)
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!data || data.length === 0) {
        console.log(`Session ${sessionCode} not found or not owned by host`)
        return new Response(
          JSON.stringify({ success: false, error: 'Session not found or not authorized' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Session ${sessionCode} deleted`)
      return new Response(
        JSON.stringify({ success: true, deleted: sessionCode }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Scheduled cleanup: Delete sessions older than 60 minutes
    const cutoffTime = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    console.log(`Cleaning up sessions older than: ${cutoffTime}`)

    const { data, error } = await supabase
      .from('game_sessions')
      .delete()
      .lt('updated_at', cutoffTime)
      .select()

    if (error) {
      console.error('Cleanup error:', error)
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Cleanup completed: ${data?.length || 0} sessions deleted`)

    return new Response(
      JSON.stringify({ success: true, deleted: data?.length || 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(
      JSON.stringify({ success: false, error: 'Unexpected error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
