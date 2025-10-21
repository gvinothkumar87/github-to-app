import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'google_drive_tokens';

interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
}

export class GoogleDriveOAuth {
  private static tokens: GoogleTokens | null = null;

  static async initialize() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      this.tokens = JSON.parse(stored);
    }
  }

  static async getAuthUrl(): Promise<string> {
    const { data, error } = await supabase.functions.invoke('google-drive-oauth', {
      body: { action: 'getAuthUrl' },
    });

    if (error) throw error;
    return data.authUrl;
  }

  static async handleCallback(code: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke('google-drive-oauth', {
      body: { action: 'exchangeCode', code },
    });

    if (error) throw error;

    this.tokens = {
      access_token: data.tokens.access_token,
      refresh_token: data.tokens.refresh_token,
      expires_at: Date.now() + (data.tokens.expires_in * 1000),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.tokens));
  }

  static async getAccessToken(): Promise<string | null> {
    await this.initialize();

    if (!this.tokens) {
      return null;
    }

    // Check if token is expired (with 5 min buffer)
    if (this.tokens.expires_at < Date.now() + 300000) {
      // Token expired or about to expire
      if (this.tokens.refresh_token) {
        await this.refreshToken();
      } else {
        return null;
      }
    }

    return this.tokens.access_token;
  }

  private static async refreshToken(): Promise<void> {
    if (!this.tokens?.refresh_token) {
      this.clearTokens();
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('google-drive-oauth', {
        body: { 
          action: 'refreshAccessToken',
          refreshToken: this.tokens.refresh_token 
        },
      });

      if (error) throw error;

      this.tokens = {
        access_token: data.tokens.access_token,
        refresh_token: this.tokens.refresh_token, // Keep the existing refresh token
        expires_at: Date.now() + (data.tokens.expires_in * 1000),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.tokens));
    } catch (error) {
      console.error('Failed to refresh token:', error);
      this.clearTokens();
    }
  }

  static clearTokens(): void {
    this.tokens = null;
    localStorage.removeItem(STORAGE_KEY);
  }

  static isAuthenticated(): boolean {
    return this.tokens !== null && this.tokens.expires_at > Date.now();
  }

  static async uploadFile(dataUrl: string, fileName: string): Promise<string> {
    const { data, error } = await supabase.functions.invoke('upload-to-google-drive', {
      body: {
        dataUrl,
        fileName,
      },
    });

    if (error) {
      throw error;
    }

    return data.viewUrl;
  }
}
