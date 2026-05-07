import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient.js';
import Login from './Login.jsx';

export default function AuthGuard({ children }) {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) console.error('[AuthGuard] getSession error:', error);
        setSession(data?.session ?? null);
        setReady(true);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error('[AuthGuard] getSession threw:', err);
        setSession(null);
        setReady(true);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <Loader2
          className="h-6 w-6 animate-spin text-neutral-400 dark:text-neutral-500"
          aria-hidden="true"
        />
      </div>
    );
  }

  if (!session) return <Login />;
  return children;
}
