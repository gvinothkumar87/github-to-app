import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, code, file, fileName, accessToken } = await req.json();
    
    const CLIENT_ID = Deno.env.get('GOOGLE_OAUTH_CLIENT_ID')?.trim();
    const CLIENT_SECRET = Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET')?.trim();
    const REDIRECT_URI = Deno.env.get('GOOGLE_OAUTH_REDIRECT_URI')?.trim();
    const FOLDER_ID = Deno.env.get('GOOGLE_DRIVE_FOLDER_ID')?.trim();

    if (!CLIENT_ID || !CLIENT_SECRET) {
      return new Response(
        JSON.stringify({ error: 'Missing Google OAuth credentials' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get auth URL
    if (action === 'getAuthUrl') {
      if (!REDIRECT_URI) {
        return new Response(
          JSON.stringify({ error: 'GOOGLE_OAUTH_REDIRECT_URI not configured' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent('https://www.googleapis.com/auth/drive.file')}` +
        `&access_type=offline` +
        `&prompt=consent`;

      return new Response(
        JSON.stringify({ authUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Exchange code for tokens
    if (action === 'exchangeCode' && code) {
      if (!REDIRECT_URI) {
        return new Response(
          JSON.stringify({ error: 'GOOGLE_OAUTH_REDIRECT_URI not configured' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        throw new Error(`Failed to exchange code: ${error}`);
      }

      const tokens = await tokenResponse.json();
      return new Response(
        JSON.stringify({ tokens }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Upload file with access token
    if (action === 'upload' && file && fileName) {
      if (!accessToken) {
        return new Response(
          JSON.stringify({ error: 'Missing access token' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Convert base64 to blob
      const base64Data = file.split(',')[1];
      const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      const metadata = {
        name: fileName,
        ...(FOLDER_ID && { parents: [FOLDER_ID] }),
      };

      const boundary = 'foo_bar_' + crypto.randomUUID();
      const delimiter = `--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const metaPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
      const fileHeader = `${delimiter}Content-Type: image/jpeg\r\n\r\n`;

      const multipartBody = new Blob([
        metaPart,
        fileHeader,
        binaryData,
        closeDelimiter,
      ]);

      const uploadResponse = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartBody,
        }
      );

      if (!uploadResponse.ok) {
        const error = await uploadResponse.text();
        throw new Error(`Upload failed: ${error}`);
      }

      const uploadResult = await uploadResponse.json();

      // Make file publicly accessible
      await fetch(`https://www.googleapis.com/drive/v3/files/${uploadResult.id}/permissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone',
        }),
      });

      const fileUrl = `https://drive.google.com/file/d/${uploadResult.id}/view`;
      const viewUrl = `https://drive.google.com/uc?id=${uploadResult.id}`;

      return new Response(
        JSON.stringify({ 
          success: true, 
          fileId: uploadResult.id,
          fileUrl,
          viewUrl,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }), 
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in Google Drive OAuth:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
