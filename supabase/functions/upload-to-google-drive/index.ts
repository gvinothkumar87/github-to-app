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
    const GOOGLE_DRIVE_CREDENTIALS = Deno.env.get('GOOGLE_DRIVE_CREDENTIALS');
    const GOOGLE_DRIVE_FOLDER_ID = Deno.env.get('GOOGLE_DRIVE_FOLDER_ID');
    
    if (!GOOGLE_DRIVE_CREDENTIALS || !GOOGLE_DRIVE_FOLDER_ID) {
      throw new Error('Google Drive credentials not configured');
    }

    const credentials = JSON.parse(GOOGLE_DRIVE_CREDENTIALS);
    
    // Get OAuth token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: credentials.client_id,
        client_secret: credentials.client_secret,
        refresh_token: credentials.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get access token');
    }

    const { access_token } = await tokenResponse.json();

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