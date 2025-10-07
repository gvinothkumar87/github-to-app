import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.8/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to create JWT for service account
async function createServiceAccountJWT(serviceAccount: any): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const now = getNumericDate(new Date());
  
  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/drive.file",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  // Import the private key
  const privateKey = serviceAccount.private_key.replace(/\\n/g, '\n');
  const key = await crypto.subtle.importKey(
    "pkcs8",
    new TextEncoder().encode(privateKey)
      .reduce((acc, byte, i) => {
        const pem = privateKey.replace(/-----BEGIN PRIVATE KEY-----/, '')
          .replace(/-----END PRIVATE KEY-----/, '')
          .replace(/\s/g, '');
        return Uint8Array.from(atob(pem), c => c.charCodeAt(0));
      }, new Uint8Array()),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  return await create(header, payload, key);
}

// Get access token using service account
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
    const GOOGLE_DRIVE_SERVICE_ACCOUNT = Deno.env.get('GOOGLE_DRIVE_SERVICE_ACCOUNT');
    const GOOGLE_DRIVE_FOLDER_ID = Deno.env.get('GOOGLE_DRIVE_FOLDER_ID');
    
    if (!GOOGLE_DRIVE_SERVICE_ACCOUNT || !GOOGLE_DRIVE_FOLDER_ID) {
      throw new Error('Google Drive service account credentials not configured');
    }

    const serviceAccount = JSON.parse(GOOGLE_DRIVE_SERVICE_ACCOUNT);
    
    // Get access token using service account
    const access_token = await getServiceAccountAccessToken(serviceAccount);

    // Parse the multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string || file.name;

    if (!file) {
      throw new Error('No file provided');
    }

    const fileBuffer = await file.arrayBuffer();

    // Upload metadata first
    const metadata = {
      name: fileName,
      parents: [GOOGLE_DRIVE_FOLDER_ID],
    };

    const metadataResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });

    if (!metadataResponse.ok) {
      throw new Error('Failed to initiate upload');
    }

    const uploadUrl = metadataResponse.headers.get('Location');
    if (!uploadUrl) {
      throw new Error('No upload URL received');
    }

    // Upload the file
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: fileBuffer,
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload file');
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

  } catch (error) {
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