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
 * Sign up a new user with Supabase Auth
 */
export const supabaseSignUp = async (
  email: string,
  password: string,
  username?: string
): Promise<{ user?: AuthUser; error?: string; requiresEmailVerification?: boolean }> => {
  const { url, anonKey } = getSupabaseConfig();

  if (!url || !anonKey) {
    return { error: 'Supabase credentials missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel or Settings.' };
  }

  try {
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
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: data.error_description || data.msg || data.message || 'Signup failed' };
    }

    // Check if session or token was returned or if email verification is required
    const session = data.session;
    const user = data.user || data;

    if (!user || !user.id) {
      return { error: 'Invalid response from Supabase Auth' };
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email || email,
      username: user.user_metadata?.username || username || email.split('@')[0],
      accessToken: session?.access_token || '',
      createdAt: user.created_at,
    };

    const requiresEmailVerification = !session;

    return { user: authUser, requiresEmailVerification };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg || 'Network error during signup' };
  }
};

/**
 * Sign in existing user with Supabase Auth
 */
export const supabaseSignIn = async (
  email: string,
  password: string
): Promise<{ user?: AuthUser; error?: string }> => {
  const { url, anonKey } = getSupabaseConfig();

  if (!url || !anonKey) {
    return { error: 'Supabase credentials missing. Please check your Vercel Project Settings or local configuration.' };
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
