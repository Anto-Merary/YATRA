import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import { AdminDashboard } from '../components/AdminDashboard';
import { Toaster } from '../components/ui/toaster';

type AuthState = 'loading' | 'unauthenticated' | 'authorized' | 'unauthorized';

export function AdminPage() {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Use a ref to track if we've already initialized to prevent double-firing
  const hasInitialized = useRef(false);

  // 1. Define Admin Verification Logic
  const verifyAdmin = async (currentUser: User) => {
    if (!currentUser?.email) {
      console.error('No email found in user object');
      setError('User email not found.');
      setAuthState('unauthorized');
      return;
    }

    const userEmail = currentUser.email.toLowerCase().trim();
    console.log('Verifying admin for:', userEmail);
    
    // MVP Bypass: Immediate access for your email (case-insensitive)
    if (userEmail === 'meraryanto@gmail.com') {
      console.log('Master admin detected - granting access');
      setUser(currentUser);
      setAuthState('authorized');
      return;
    }

    try {
      // Use RPC for secure, server-side verification
      const { data: isAdmin, error: rpcError } = await supabase
        .rpc('check_is_admin', { user_email: userEmail });

      if (rpcError) {
        console.error('RPC error:', rpcError);
        throw rpcError;
      }

      console.log('RPC check result:', isAdmin);

      if (isAdmin) {
        console.log('Admin verified');
        setUser(currentUser);
        setAuthState('authorized');
      } else {
        console.log('User is not an admin');
        setError(`Access denied. ${userEmail} is not authorized as an admin.`);
        setAuthState('unauthorized');
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Admin verification failed:', err);
      setError(`Failed to verify admin privileges: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setAuthState('unauthorized');
      await supabase.auth.signOut();
    }
  };

  // 2. Main Auth Effect - Runs ONCE on mount
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initAuth = async () => {
      console.log('Initializing Admin Auth...');
      
      // First, set up the auth state change listener BEFORE checking session
      // This ensures we catch the SIGNED_IN event if it fires during OAuth callback
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth event:', event, session?.user?.email);

        if (event === 'SIGNED_IN' && session) {
          console.log('User signed in - verifying');
          await verifyAdmin(session.user);
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          setAuthState('unauthenticated');
          setUser(null);
        } else if (event === 'TOKEN_REFRESHED' && session) {
          console.log('Token refreshed');
          // Re-verify admin on token refresh to ensure still authorized
          await verifyAdmin(session.user);
        }
      });

      // Now check for existing session (this will also extract session from URL if present)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        setError('Failed to check session.');
        setAuthState('unauthenticated');
        return subscription;
      }
      
      if (session) {
        console.log('Session detected on load:', session.user.email);
        await verifyAdmin(session.user);
      } else {
        console.log('No session on load');
        // Check if we're coming back from OAuth
        // - Implicit flow: URL hash has access_token
        // - PKCE flow (our default): URL query has code
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const queryParams = new URLSearchParams(window.location.search);
        const code = queryParams.get('code');
        
        if (accessToken || code) {
          console.log('OAuth callback detected in URL, waiting for session...', {
            hasAccessToken: Boolean(accessToken),
            hasCode: Boolean(code),
          });
          // Session should be processed by Supabase automatically, but wait a bit
          setTimeout(async () => {
            const { data: { session: newSession } } = await supabase.auth.getSession();
            if (newSession) {
              console.log('Session found after OAuth callback');
              await verifyAdmin(newSession.user);
            } else {
              console.log('No session after OAuth callback');
              setAuthState('unauthenticated');
            }
          }, 500);
        } else {
          setAuthState('unauthenticated');
        }
      }

      return subscription;
    };

    const authPromise = initAuth();

    // Cleanup subscription
    return () => {
      authPromise.then(sub => sub?.unsubscribe());
    };
  }, []);

  // Clean up URL after OAuth callback - remove hash fragments
  useEffect(() => {
    // Check if we have OAuth callback parameters in the URL
    const hasHashCallback =
      window.location.hash.includes('access_token') || window.location.hash.includes('error');
    const hasQueryCallback =
      window.location.search.includes('code=') || window.location.search.includes('error=');

    if (hasHashCallback || hasQueryCallback) {
      // Clean up the URL after a short delay to allow Supabase to process it
      const timer = setTimeout(() => {
        // Only clean up if we're still on /admin (or /admin/...).
        // Normalize any trailing slash/extra segments back to "/admin".
        if (window.location.pathname.startsWith('/admin')) {
          window.history.replaceState(null, '', '/admin');
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // 3. Handlers
  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      const redirectUrl = `${window.location.origin}/admin`;
      console.log('Initiating Google OAuth with redirect to:', redirectUrl);

      // Mark that we intentionally started an admin OAuth flow.
      // If Supabase redirects back to "/" (misconfigured redirect allowlist),
      // the App-level handler can forward `/?code=...` to `/admin`.
      sessionStorage.setItem('admin-oauth-in-progress', '1');
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      
      if (error) {
        console.error('OAuth initiation error:', error);
        throw error;
      }
      // Note: User will be redirected to Google, then back to /admin
    } catch (err) {
      console.error('Login failed:', err);
      setError(`Failed to initiate login: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleSignOut = async () => {
    setAuthState('loading');
    await supabase.auth.signOut();
    setAuthState('unauthenticated');
  };

  // 4. Render UI based on State
  if (authState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Loading admin session...</p>
        </div>
      </div>
    );
  }

  if (authState === 'unauthorized') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-2xl font-bold mb-4 text-red-500">Access Denied</h1>
          <p className="mb-6 text-gray-300">
            {error || 'You are not authorized to view this page.'}
          </p>
          <button
            onClick={() => setAuthState('unauthenticated')}
            className="px-6 py-2 bg-white text-black rounded hover:bg-gray-200 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (authState === 'authorized' && user) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-gray-400">Welcome, {user.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-white text-sm transition-colors"
            >
              Sign Out
            </button>
          </div>
          
          {/* Dashboard fetches data independently now that auth is confirmed */}
          <AdminDashboard adminEmail={user.email} />
        </div>
        <Toaster />
      </div>
    );
  }

  // Unauthenticated - Show Login
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center max-w-md mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Admin Login</h1>
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}
        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
