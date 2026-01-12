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
    console.log('Verifying admin for:', currentUser.email);
    
    // MVP Bypass: Immediate access for your email
    if (currentUser.email === 'meraryanto@gmail.com') {
      console.log('Master admin detected - granting access');
      setUser(currentUser);
      setAuthState('authorized');
      return;
    }

    try {
      // Use RPC for secure, server-side verification
      const { data: isAdmin, error: rpcError } = await supabase
        .rpc('check_is_admin', { user_email: currentUser.email });

      if (rpcError) throw rpcError;

      if (isAdmin) {
        console.log('Admin verified');
        setUser(currentUser);
        setAuthState('authorized');
      } else {
        console.log('User is not an admin');
        setAuthState('unauthorized');
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Admin verification failed:', err);
      setError('Failed to verify admin privileges.');
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
      
      // Check current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        console.log('Session detected on load');
        await verifyAdmin(session.user);
      } else {
        console.log('No session on load');
        setAuthState('unauthenticated');
      }

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth event:', event);

        if (event === 'SIGNED_IN' && session) {
          console.log('User signed in - verifying');
          await verifyAdmin(session.user);
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          setAuthState('unauthenticated');
          setUser(null);
        }
      });

      return subscription;
    };

    const authPromise = initAuth();

    // Cleanup subscription
    return () => {
      authPromise.then(sub => sub?.unsubscribe());
    };
  }, []);

  // 3. Handlers
  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/admin`,
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error('Login failed:', err);
      setError('Failed to initiate login.');
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
