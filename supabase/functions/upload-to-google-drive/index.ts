import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.8/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const pemContents = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\n/g, '')
    .replace(/\r/g, '')
    .replace(/\s/g, '');
  const binary = atob(pemContents);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const keyData = pemToArrayBuffer(pem);
  return await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

async function createServiceAccountJWT(serviceAccount: any): Promise<string> {
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/drive',
    aud: 'https://oauth2.googleapis.com/token',
    exp: getNumericDate(60 * 60), // 1 hour expiry
    iat: getNumericDate(0),
  };

  const key = await importPrivateKey(serviceAccount.private_key);
  return await create(header, payload, key);
}

async function getServiceAccountAccessToken(serviceAccount: any): Promise<string> {
  const jwt = await createServiceAccountJWT(serviceAccount);
  
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const { access_token } = await tokenResponse.json();
  return access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawServiceAccount = Deno.env.get('GOOGLE_DRIVE_SERVICE_ACCOUNT');
    const GOOGLE_DRIVE_FOLDER_ID = Deno.env.get('GOOGLE_DRIVE_FOLDER_ID');

    if (!rawServiceAccount) {
      return new Response(JSON.stringify({ error: 'Missing GOOGLE_DRIVE_SERVICE_ACCOUNT secret' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!GOOGLE_DRIVE_FOLDER_ID) {
      return new Response(JSON.stringify({ error: 'Missing GOOGLE_DRIVE_FOLDER_ID secret' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let serviceAccount: any;
    try {
      serviceAccount = JSON.parse(rawServiceAccount);
    } catch (e) {
      console.error('Invalid GOOGLE_DRIVE_SERVICE_ACCOUNT JSON:', e);
      return new Response(JSON.stringify({ error: 'Invalid GOOGLE_DRIVE_SERVICE_ACCOUNT JSON. Paste the FULL service account key JSON from Google Cloud.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const access_token = await getServiceAccountAccessToken(serviceAccount);

    // Parse the multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const fileName = (formData.get('fileName') as string) || file?.name || `upload_${Date.now()}`;

    if (!file) {
      throw new Error('No file provided');
    }

    const fileBuffer = await file.arrayBuffer();

    // Use multipart upload for small files (simpler and reliable)
    const metadata = {
      name: fileName,
      parents: [GOOGLE_DRIVE_FOLDER_ID],
    };

    const boundary = 'foo_bar_' + crypto.randomUUID();
    const delimiter = `--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metaPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
    const fileHeader = `${delimiter}Content-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`;

    const multipartBody = new Blob([
      metaPart,
      fileHeader,
      new Uint8Array(fileBuffer),
      closeDelimiter,
    ]);

    const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
        'Content-Length': String(multipartBody.size),
      },
      body: multipartBody,
    });

    if (!uploadResponse.ok) {
      const t = await uploadResponse.text();
      console.error('Multipart upload failed', uploadResponse.status, t);
      throw new Error(`Failed to upload file: ${uploadResponse.status} ${t}`);
    }

    const uploadResult = await uploadResponse.json();

    // Make the file publicly accessible
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
