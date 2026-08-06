import { AuthUser } from './types';

// Detect Supabase credentials from environment variables or local storage overrides
export const getSupabaseConfig = () => {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    (typeof window !== 'undefined' ? localStorage.getItem('shivgpt_supabase_url') || '' : '');

  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    (typeof window !== 'undefined' ? localStorage.getItem('shivgpt_supabase_anon_key') || '' : '');

  return {
    url: url.trim().replace(/\/$/, ''),
    anonKey: anonKey.trim(),
  };
};

export const isSupabaseConfigured = (): boolean => {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey);
};

/**
 * Sign up a new user with Supabase Auth (or local fallback if unconfigured)
 */
export const supabaseSignUp = async (
  email: string,
  password: string,
  username?: string
): Promise<{ user?: AuthUser; error?: string; requiresEmailVerification?: boolean }> => {
  const { url, anonKey } = getSupabaseConfig();

  if (!url || !anonKey) {
    // Local fallback authentication when Supabase env vars are not set
    const authUser: AuthUser = {
      id: 'usr_' + Date.now(),
      email: email,
      username: username || email.split('@')[0],
      accessToken: 'local_token_' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('shivgpt_user', JSON.stringify(authUser));
    }
    return { user: authUser };
  }

  try {
    const redirectUrl = typeof window !== 'undefined' ? window.location.origin : '';

    const res = await fetch(`${url}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        data: {
          username: username || email.split('@')[0],
        },
        options: {
          emailRedirectTo: redirectUrl,
        },
        redirect_to: redirectUrl,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: data.error_description || data.msg || data.message || 'Signup failed' };
    }

    const session = data.session;
    const user = data.user || data;

    if (!user || !user.id) {
      return { error: 'Invalid response from Supabase Auth' };
    }

    // Check if email confirmation is required (session is null when email confirmation is active)
    if (!session || !session.access_token) {
      return { requiresEmailVerification: true };
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email || email,
      username: user.user_metadata?.username || username || email.split('@')[0],
      accessToken: session.access_token,
      createdAt: user.created_at || new Date().toISOString(),
    };

    // Save user session to localStorage for compulsory auth persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('shivgpt_user', JSON.stringify(authUser));
    }

    return { user: authUser, requiresEmailVerification: false };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg || 'Network error during signup' };
  }
};

/**
 * Resend confirmation email to user
 */
export const supabaseResendConfirmation = async (
  email: string
): Promise<{ success?: boolean; error?: string }> => {
  const { url, anonKey } = getSupabaseConfig();

  if (!url || !anonKey) {
    return { error: 'Supabase is not configured' };
  }

  const redirectUrl = typeof window !== 'undefined' ? window.location.origin : '';

  try {
    const res = await fetch(`${url}/auth/v1/resend`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: redirectUrl,
        },
        redirect_to: redirectUrl,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: data.error_description || data.msg || data.message || 'Failed to resend confirmation email' };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg || 'Network error while requesting email resend' };
  }
};

/**
 * Check and parse Supabase email confirmation redirect URL tokens (#access_token=...)
 */
export const supabaseHandleAuthCallback = async (): Promise<{ user?: AuthUser; confirmed?: boolean; error?: string }> => {
  if (typeof window === 'undefined') return {};

  const hash = window.location.hash || '';
  const search = window.location.search || '';

  if (!hash && !search) return {};

  const params = new URLSearchParams(
    hash.startsWith('#') ? hash.substring(1) : search.startsWith('?') ? search.substring(1) : ''
  );
  const accessToken = params.get('access_token');
  const errorDescription = params.get('error_description');

  if (errorDescription) {
    return { error: decodeURIComponent(errorDescription) };
  }

  if (!accessToken) {
    return {};
  }

  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) return {};

  try {
    const res = await fetch(`${url}/auth/v1/user`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const user = await res.json();
    if (res.ok && user && user.id) {
      const authUser: AuthUser = {
        id: user.id,
        email: user.email || '',
        username: user.user_metadata?.username || user.email?.split('@')[0] || 'User',
        accessToken: accessToken,
        createdAt: user.created_at || new Date().toISOString(),
      };

      localStorage.setItem('shivgpt_user', JSON.stringify(authUser));

      // Remove access_token fragment from window URL
      window.history.replaceState(null, '', window.location.pathname);

      return { user: authUser, confirmed: true };
    }
  } catch (err) {
    console.error('Failed to process confirmation callback:', err);
  }

  return {};
};

/**
 * Sign in existing user with Supabase Auth (or local fallback if unconfigured)
 */
export const supabaseSignIn = async (
  email: string,
  password: string
): Promise<{ user?: AuthUser; error?: string }> => {
  const { url, anonKey } = getSupabaseConfig();

  if (!url || !anonKey) {
    // Local fallback authentication when Supabase env vars are not set
    const authUser: AuthUser = {
      id: 'usr_' + Date.now(),
      email: email,
      username: email.split('@')[0],
      accessToken: 'local_token_' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('shivgpt_user', JSON.stringify(authUser));
    }
    return { user: authUser };
  }

  try {
    const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: data.error_description || data.msg || data.message || 'Invalid email or password' };
    }

    const user = data.user;
    const accessToken = data.access_token;

    if (!user || !user.id) {
      return { error: 'Failed to retrieve user session' };
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email || email,
      username: user.user_metadata?.username || email.split('@')[0],
      accessToken: accessToken,
      createdAt: user.created_at,
    };

    // Save session in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('shivgpt_user', JSON.stringify(authUser));
    }

    return { user: authUser };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg || 'Network error during login' };
  }
};

/**
 * Sign out current user
 */
export const supabaseSignOut = async (token?: string): Promise<void> => {
  const { url, anonKey } = getSupabaseConfig();

  if (typeof window !== 'undefined') {
    localStorage.removeItem('shivgpt_user');
  }

  if (url && anonKey && token) {
    try {
      await fetch(`${url}/auth/v1/logout`, {
        method: 'POST',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${token}`,
        },
      }).catch(() => {});
    } catch (e) {
      // Ignore network errors on logout
    }
  }
};

/**
 * Get cached current logged in user from localStorage
 */
export const getStoredUser = (): AuthUser | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('shivgpt_user');
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    return null;
  }
};


