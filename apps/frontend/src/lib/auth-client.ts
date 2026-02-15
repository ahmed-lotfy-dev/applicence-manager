const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface AuthResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
  error?: string;
}

export interface MeResponse {
  authenticated: boolean;
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
}

class AuthClient {
  private csrfToken: string | null = null;

  private async parseResponse<T>(response: Response): Promise<T | null> {
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return null;
    }

    try {
      return (await response.json()) as T;
    } catch {
      return null;
    }
  }

  async getCsrfToken(): Promise<string | null> {
    if (this.csrfToken) return this.csrfToken;

    try {
      const response = await fetch(`${API_BASE_URL}/api/csrf`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await this.parseResponse<{ csrfToken?: string }>(response);
      if (!response.ok || !data?.csrfToken) return null;
      this.csrfToken = data.csrfToken;
      return this.csrfToken;
    } catch {
      return null;
    }
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const csrfToken = await this.getCsrfToken();
      if (!csrfToken) {
        return { success: false, error: 'Failed to initialize secure session' };
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await this.parseResponse<AuthResponse>(response);

      if (!response.ok) {
        return {
          success: false,
          error: data?.error || `Login failed (${response.status})`,
        };
      }

      if (!data) {
        return { success: false, error: 'Login failed: invalid server response' };
      }

      return data;
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error' 
      };
    }
  }

  async signOut(): Promise<void> {
    try {
      const csrfToken = await this.getCsrfToken();
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        },
        credentials: 'include',
      });
    } finally {
      this.csrfToken = null;
    }
  }

  async getSession(): Promise<MeResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        credentials: 'include',
      });
      const data = await this.parseResponse<MeResponse>(response);
      if (!response.ok || !data) {
        return { authenticated: false };
      }
      return data;
    } catch {
      return { authenticated: false };
    }
  }
}

// Create singleton instance
export const authClient = new AuthClient();
