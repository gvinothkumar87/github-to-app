import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getAccessTokenFromRefreshToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<string> {
  console.log('🔄 Requesting access token from Google...');
  
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const { access_token } = await tokenResponse.json();
  console.log('✅ Access token obtained successfully');
  return access_token;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📤 Upload request received');
    
    const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_OAUTH_CLIENT_ID_CASH');
    const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET_CASH');
    const GOOGLE_REFRESH_TOKEN = Deno.env.get('GOOGLE_OAUTH_REFRESH_TOKEN_CASH');
    const GOOGLE_DRIVE_FOLDER_ID = Deno.env.get('GOOGLE_DRIVE_FOLDER_ID');

    console.log('🔑 Checking secrets:', {
      hasClientId: !!GOOGLE_CLIENT_ID,
      hasClientSecret: !!GOOGLE_CLIENT_SECRET,
      hasRefreshToken: !!GOOGLE_REFRESH_TOKEN,
      hasFolderId: !!GOOGLE_DRIVE_FOLDER_ID,
    });

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
      return new Response(
        JSON.stringify({ error: 'Missing required Google OAuth secrets' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!GOOGLE_DRIVE_FOLDER_ID) {
      return new Response(
        JSON.stringify({ error: 'Missing GOOGLE_DRIVE_FOLDER_ID secret' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const access_token = await getAccessTokenFromRefreshToken(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REFRESH_TOKEN
    );

    // Parse the request body (support multiple payload shapes for backward compatibility)
    const body = await req.json();
    const fileName = body.fileName || body.name || body.filename;
    const incoming = body.dataUrl || body.fileData || body.file; // support: dataUrl | fileData | file
    
    console.log('📝 File details (raw):', {
      providedKeys: Object.keys(body || {}),
      hasDataUrl: !!body?.dataUrl,
      hasFileData: !!body?.fileData,
      hasFile: !!body?.file,
      fileName,
    });

    const dataUrl = incoming;
    if (!dataUrl || !fileName) {
      const msg = `Missing required fields: ${(!!dataUrl) ? '' : 'dataUrl/fileData'} ${(!!fileName) ? '' : 'and fileName'}`.trim();
      console.error('❌', msg);
      return new Response(
        JSON.stringify({ error: msg }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert base64 data URL to binary (avoid large Blob to reduce memory)
    console.log('📦 Decoding base64 data...');
    const base64Data = dataUrl.split(',')[1];
    const mimeType = dataUrl.split(';')[0].split(':')[1];
    const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    console.log('✅ Decoded bytes:', binaryData.byteLength, 'bytes');

    // Prepare multipart upload
    console.log('☁️ Uploading to Google Drive...');
    const metadata = {
      name: fileName,
      parents: [GOOGLE_DRIVE_FOLDER_ID],
    };

    const boundary = 'foo_bar_' + crypto.randomUUID();
    const delimiter = `--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metaPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
    const fileHeader = `${delimiter}Content-Type: ${mimeType}\r\n\r\n`;

    const encoder = new TextEncoder();
    const metaUint8 = encoder.encode(metaPart);
    const headerUint8 = encoder.encode(fileHeader);
    const closeUint8 = encoder.encode(closeDelimiter);

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(metaUint8);
        controller.enqueue(headerUint8);
        controller.enqueue(binaryData);
        controller.enqueue(closeUint8);
        controller.close();
      }
    });

    const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: stream as any,
    });

    if (!uploadResponse.ok) {
      const t = await uploadResponse.text();
      console.error('Multipart upload failed', uploadResponse.status, t);
      throw new Error(`Failed to upload file: ${uploadResponse.status} ${t}`);
    }

    const uploadResult = await uploadResponse.json();
    console.log('✅ File uploaded successfully! File ID:', uploadResult.id);

    // Make the file publicly accessible
    console.log('🔓 Making file publicly accessible...');
    await fetch(`https://www.googleapis.com/drive/v3/files/${uploadResult.id}/permissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });

    // Get the shareable link
    const fileUrl = `https://drive.google.com/file/d/${uploadResult.id}/view`;

    console.log('🎉 Upload complete! Returning response...');
    return new Response(
      JSON.stringify({ 
        success: true, 
        fileId: uploadResult.id,
        fileUrl: fileUrl,
        viewUrl: `https://drive.google.com/uc?id=${uploadResult.id}`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error uploading to Google Drive:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
