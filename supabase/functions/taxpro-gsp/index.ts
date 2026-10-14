import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

const allowedRoles = new Set(['admin', 'moderator', 'manager', 'user'])
const normalizeGstin = (value: unknown) => String(value ?? '').trim().toUpperCase()

const isAllowedTarget = (path: string, method: string) => {
  if (!['GET', 'POST'].includes(method)) return false
  const exactPaths = new Set([
    '/eivital/dec/v1.04/auth', '/v1.03/dec/auth', '/eicore/dec/v1.03/Invoice',
    '/eicore/dec/v1.03/Invoice/Cancel', '/eiewb/dec/v1.03/ewaybill',
    '/eiewb/dec/v1.03/ewaybill/cancel', '/v1.03/dec/ewayapi',
    '/aspapi/v1.0/printewb', '/aspapi/v1.0/printdetailewb', '/aspapi/v1.0/printcewb',
  ])
  return exactPaths.has(path) || /^\/eicore\/dec\/v1\.03\/Invoice\/irn\/[A-Za-z0-9]+$/.test(path)
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
      gstin: rawGstin,
    } = await req.json()

    const gstin = normalizeGstin(rawGstin)
    const normalizedMethod = String(method || 'GET').toUpperCase()
    const normalizedPath = String(path || '').startsWith('/') ? String(path) : `/${String(path || '')}`

    if (!/^[0-9A-Z]{15}$/.test(gstin)) {
      return new Response(JSON.stringify({ error: 'GSTIN is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!isAllowedTarget(normalizedPath, normalizedMethod)) {
      return new Response(JSON.stringify({ error: 'TAXPRO_ENDPOINT_NOT_ALLOWED' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 1. Authorize caller and resolve server-managed credentials.
    const aspid = Deno.env.get('TAXPRO_ASPID')?.trim() ?? ''
    const password = Deno.env.get('TAXPRO_ASPPASSWORD')?.trim() ?? ''
    let username = null
    let eInvPwd = null
    let ewbpwd = null

    const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole)

    const { data: roleRows, error: roleError } = await supabaseAdmin
      .from('user_roles').select('role').eq('user_id', user.id)
    if (roleError || !roleRows?.some((row: any) => allowedRoles.has(row.role))) {
      return new Response(JSON.stringify({ error: 'TAXPRO_OPERATION_NOT_AUTHORIZED' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: company, error: companyError } = await supabaseAdmin
      .from('company_settings')
      .select('id, gstin, is_active, einvoice_username, einvoice_password, ewaybill_password')
      .eq('gstin', gstin).eq('is_active', true).limit(1).maybeSingle()
    if (companyError) console.error('Error resolving company settings:', companyError.message)
    if (!company) {
      return new Response(JSON.stringify({ error: 'TAXPRO_GSTIN_NOT_FOUND' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const environment = sandbox ? 'sandbox' : 'production'
    const { data: secureCredentials, error: credentialError } = await supabaseAdmin
      .from('taxpro_gstin_credentials')
      .select('nic_username, einvoice_password, ewaybill_password')
      .eq('company_setting_id', company.id).eq('environment', environment).maybeSingle()
    if (credentialError) console.error('Error resolving secure TaxPro credentials:', credentialError.message)
    username = secureCredentials?.nic_username || company.einvoice_username
    eInvPwd = secureCredentials?.einvoice_password || company.einvoice_password
    ewbpwd = secureCredentials?.ewaybill_password || company.ewaybill_password

    if (!aspid || !password) {
      return new Response(JSON.stringify({ error: 'TAXPRO_ASP_NOT_CONFIGURED' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (serviceType === 'ewaybill-auth' && (!username || !ewbpwd)) {
      return new Response(JSON.stringify({ error: 'TAXPRO_NOT_CONFIGURED', service: 'ewaybill', environment }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (serviceType === 'einvoice-auth' && (!username || !eInvPwd)) {
      return new Response(JSON.stringify({ error: 'TAXPRO_NOT_CONFIGURED', service: 'einvoice', environment }), {
        status: 409,
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
    const mayRetryAcrossHosts = normalizedMethod === 'GET' || normalizedMethod === 'HEAD'

    for (let i = 0; i < servers.length; i++) {
      const server = servers[i]
      // Ensure path starts with slash and build final URL
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

        if (res.status >= 500 && mayRetryAcrossHosts) {
          console.warn(`[Proxy] GSP Server ${server} returned status ${res.status}. Trying next server...`)
          lastError = new Error(`Server returned HTTP ${res.status}`)
          await new Promise(resolve => setTimeout(resolve, 1200))
          continue
        }

        // Generation, cancellation and update POSTs are not safe to replay on
        // another host: the first server may have committed the operation even
        // when its response is 5xx. Return that response for reconciliation.
        if (res.status >= 500 && !mayRetryAcrossHosts) {
          console.warn(`[Proxy] Not replaying ${normalizedMethod} request after status ${res.status}`)
        }

        response = res
        break
      } catch (err: any) {
        console.error(`[Proxy] Request to ${server} failed:`, err)
        lastError = err
        if (!mayRetryAcrossHosts) break
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
