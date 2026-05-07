import { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';
import { supabase } from '../lib/supabaseClient.js';
import ThemeToggle from './ThemeToggle.jsx';

export default function UserBadge() {
  const [email, setEmail] = useState(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) console.error('[UserBadge] getUser error:', error);
        setEmail(data?.user?.email ?? null);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error('[UserBadge] getUser threw:', err);
      });
    return () => {
      mounted = false;
    };
  }, []);

  function handleLogout() {
    supabase.auth.signOut().catch((err) => {
      console.error('[UserBadge] signOut error:', err);
    });
  }

  return (
    <div className="border-t border-neutral-200 px-3 py-3 dark:border-white/10">
      {email && (
        <p
          className="mb-3 truncate px-2 font-mono text-xs text-neutral-500 dark:text-neutral-500"
          title={email}
        >
          {email}
        </p>
      )}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Se déconnecter"
          title="Se déconnecter"
          className="flex h-9 w-9 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-white/5 dark:hover:text-neutral-100"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
