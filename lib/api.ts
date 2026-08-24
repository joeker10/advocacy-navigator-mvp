/**
 * Centralized, typed API client for SpEd Navigator.
 * Automatically handles baseUrl resolution across Web and Native Capacitor platforms.
 */

const getApiBaseUrl = (): string => {
  const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.();
  return isNative ? 'https://www.thespecialeducationnavigator.app' : '';
};

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export const api = {
  /**
   * Fetch current authenticated session
   */
  async getSession(token: string): Promise<ApiResponse> {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/session`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      return { success: res.ok && data.success, ...data };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error fetching session' };
    }
  },

  /**
   * Send chat inquiry to AI reasoning engine
   */
  async sendChat(params: {
    query: string;
    history?: { role: string; text: string }[];
    context?: any;
    rag_chunks?: any[];
    token?: string | null;
  }): Promise<ApiResponse<{ response: string }>> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (params.token) {
        headers['Authorization'] = `Bearer ${params.token}`;
      }

      const res = await fetch(`${getApiBaseUrl()}/api/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: params.query,
          history: params.history,
          context: params.context,
          rag_chunks: params.rag_chunks,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || `Server error (${res.status})` };
      }
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error sending inquiry' };
    }
  },

  /**
   * Redeem promo or coupon code
   */
  async redeemCoupon(code: string, token: string): Promise<ApiResponse> {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      return { success: res.ok && data.success, ...data };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error redeeming coupon' };
    }
  },
};
