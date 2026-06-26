import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Authenticate caller using client JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized access token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Only accept POST requests containing proxy specifications
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { 
      sandbox, 
      serviceType, 
      path, 
      method, 
      queryParams, 
      headers: clientHeaders, 
      body, 
      authToken,
      gstin 
    } = await req.json()

    if (!gstin) {
      return new Response(JSON.stringify({ error: 'GSTIN is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 1. Resolve GSP Credentials (DB first, then ENV fallback)
    let aspid = null
    let password = null
    let username = null
    let eInvPwd = null
    let ewbpwd = null

    const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole)

    const { data: settingsList, error: settingsError } = await supabaseAdmin
      .from('company_settings')
      .select('einvoice_aspid, einvoice_asppassword, einvoice_username, einvoice_password, ewaybill_password')
      .eq('gstin', gstin)

    if (settingsError) {
      console.error('Error fetching settings from DB:', settingsError)
    }

    const hasBaseCredentials = (s: any) => s.einvoice_aspid && s.einvoice_asppassword && s.einvoice_username
    const settings = serviceType === 'ewaybill-auth'
      ? settingsList?.find(s => hasBaseCredentials(s) && s.ewaybill_password) ?? settingsList?.find(hasBaseCredentials)
      : serviceType === 'einvoice-auth'
        ? settingsList?.find(s => hasBaseCredentials(s) && s.einvoice_password) ?? settingsList?.find(hasBaseCredentials)
        : serviceType === 'ewaybill'
          ? settingsList?.find(s => hasBaseCredentials(s) && s.ewaybill_password) ?? settingsList?.find(hasBaseCredentials)
          : settingsList?.find(hasBaseCredentials)

    if (settings) {
      aspid = settings.einvoice_aspid
      password = settings.einvoice_asppassword
      username = settings.einvoice_username
      eInvPwd = settings.einvoice_password
      ewbpwd = settings.ewaybill_password
    }

    // Fallback to Deno Environment variables if not found in DB
    if (!aspid) aspid = Deno.env.get('TAXPRO_ASPID')
    if (!password) password = Deno.env.get('TAXPRO_ASPPASSWORD')
    if (!username) username = Deno.env.get('TAXPRO_USERNAME')
    if (!eInvPwd) eInvPwd = Deno.env.get('TAXPRO_EINVOICE_PASSWORD')
    if (!ewbpwd) ewbpwd = Deno.env.get('TAXPRO_EWAYBILL_PASSWORD')

    if (!aspid || !password) {
      return new Response(JSON.stringify({ error: 'GSP credentials are not configured.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (serviceType === 'ewaybill-auth' && (!username || !ewbpwd)) {
      return new Response(JSON.stringify({ error: 'E-Way Bill credentials are not configured for this GSTIN. Check NIC Portal API User Name and E-Way Bill API Password in Company Settings.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (serviceType === 'einvoice-auth' && (!username || !eInvPwd)) {
      return new Response(JSON.stringify({ error: 'E-Invoice credentials are not configured for this GSTIN. Check NIC Portal API User Name and E-Invoice API Password in Company Settings.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 2. Prepare query string params
    const query = new URLSearchParams()
    if (queryParams && typeof queryParams === 'object') {
      for (const [key, val] of Object.entries(queryParams)) {
        if (val !== undefined && val !== null) {
          query.set(key, String(val))
        }
      }
    }

    // Inject credentials depending on endpoint requirements
    if (serviceType === 'einvoice-auth') {
      query.set('aspid', aspid)
      query.set('password', password)
      query.set('Gstin', gstin)
      query.set('User_name', username || '')
      query.set('eInvPwd', eInvPwd || '')
    } else if (serviceType === 'ewaybill-auth') {
      query.set('action', 'ACCESSTOKEN')
      query.set('aspid', aspid)
      query.set('password', password)
      query.set('gstin', gstin)
      query.set('username', username || '')
      query.set('ewbpwd', ewbpwd || '')
    } else if (serviceType === 'einvoice') {
      query.set('aspid', aspid)
      query.set('password', password)
      query.set('Gstin', gstin)
      query.set('User_name', username || '')
      query.set('AuthToken', authToken || '')
    } else if (serviceType === 'ewaybill') {
      query.set('aspid', aspid)
      query.set('password', password)
      query.set('gstin', gstin)
      query.set('username', username || '')
      query.set('authtoken', authToken || '')
    } else if (serviceType === 'print') {
      query.set('aspid', aspid)
      query.set('password', password)
      query.set('Gstin', gstin)
    }

    // 3. Prepare HTTP headers
    const targetHeaders = new Headers()
    if (clientHeaders && typeof clientHeaders === 'object') {
      for (const [key, val] of Object.entries(clientHeaders)) {
        if (val !== undefined && val !== null) {
          targetHeaders.set(key, String(val))
        }
      }
    }
    
    if (!targetHeaders.has('Content-Type')) {
      targetHeaders.set('Content-Type', 'application/json')
    }
    targetHeaders.set('aspid', aspid)
    targetHeaders.set('password', password)
    targetHeaders.set('Gstin', gstin)
    targetHeaders.set('gstin', gstin)

    // 4. Resolve servers & initiate HTTP failover loop
    const servers = sandbox 
      ? ['https://gstsandbox.charteredinfo.com']
      : [
          'https://einvapi.charteredinfo.com',
          'https://einvapimum1.charteredinfo.com',
          'https://einvapidel2.charteredinfo.com'
        ]

    let response: Response | null = null
    let lastError: any = null

    for (let i = 0; i < servers.length; i++) {
      const server = servers[i]
      // Ensure path starts with slash and build final URL
      const normalizedPath = path.startsWith('/') ? path : `/${path}`
      const targetUrl = `${server}${normalizedPath}?${query.toString()}`

      console.log(`[Proxy] Routing ${method} request to: ${server}${normalizedPath} (Attempt ${i + 1}/${servers.length})`)

      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 35000) // 35s timeout

        const res = await fetch(targetUrl, {
          method: method || 'GET',
          headers: targetHeaders,
          body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (res.status >= 500) {
          console.warn(`[Proxy] GSP Server ${server} returned status ${res.status}. Trying next server...`)
          lastError = new Error(`Server returned HTTP ${res.status}`)
          await new Promise(resolve => setTimeout(resolve, 1200))
          continue
        }

        response = res
        break
      } catch (err: any) {
        console.error(`[Proxy] Request to ${server} failed:`, err)
        lastError = err
        await new Promise(resolve => setTimeout(resolve, 1200))
      }
    }

    if (!response) {
      return new Response(JSON.stringify({ 
        error: 'All GSP servers failed', 
        details: lastError?.message || String(lastError) 
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 5. Pipe response directly back to client
    const responseHeaders = new Headers(corsHeaders)
    const contentType = response.headers.get('content-type')
    if (contentType) {
      responseHeaders.set('content-type', contentType)
    }

    const responseBody = await response.arrayBuffer()
    return new Response(responseBody, {
      status: response.status,
      headers: responseHeaders
    })

  } catch (error: any) {
    console.error('Unhandled proxy exception:', error)
    return new Response(JSON.stringify({ error: 'Internal proxy server error', details: error?.message || String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
