import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { username, password } = await req.json()

    console.log('GRM Username Login: Processing login for username:', username)

    // Validate input
    if (!username || !password) {
      return new Response(JSON.stringify({ error: 'Username and password are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Lookup username in profiles table - prefer approved accounts
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, status')
      .eq('username', username)
      .order('status', { ascending: false }) // 'approved' comes before 'pending' and 'rejected'

    if (profileError) {
      console.error('GRM Username Login: Database error:', profileError)
      return new Response(JSON.stringify({ error: 'Authentication service error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!profiles || profiles.length === 0) {
      console.log('GRM Username Login: Username not found:', username)
      return new Response(JSON.stringify({ error: 'Invalid username or password' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Find the first approved account, or check status of first account
    const approvedProfile = profiles.find(p => p.status === 'approved')
    const profile = approvedProfile || profiles[0]

    // Check account status
    if (profile.status === 'rejected') {
      console.log('GRM Username Login: Account rejected:', username)
      return new Response(JSON.stringify({ error: 'Your account has been rejected. Please contact administrator.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (profile.status === 'pending') {
      console.log('GRM Username Login: Account pending approval:', username)
      return new Response(JSON.stringify({ error: 'Your account is pending admin approval. Please wait for confirmation.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (profile.status !== 'approved') {
      console.log('GRM Username Login: Invalid account status:', username, profile.status)
      return new Response(JSON.stringify({ error: 'Account access denied. Please contact administrator.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get the user's email from auth.users using admin API
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()

    if (usersError) {
      console.error('GRM Username Login: Error listing users:', usersError)
      return new Response(JSON.stringify({ error: 'Authentication service error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Find the user with matching ID
    const user = users?.find((u) => u.id === profile.id)

    if (!user?.email) {
      console.log('GRM Username Login: User email not found for profile ID:', profile.id)
      return new Response(JSON.stringify({ error: 'User email not found' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('GRM Username Login: Successfully found email for username:', username)

    // Success - return email for the client to use for authentication
    // Password will be verified by the client using Supabase auth
    return new Response(JSON.stringify({ email: user.email }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('GRM Username Login: Error in function:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})