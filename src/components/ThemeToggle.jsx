import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

function getInitialTheme() {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {
      // localStorage indisponible (mode privé strict) : on accepte de perdre la préférence
    }
  }, [theme]);

  const isDark = theme === 'dark';
  const Icon = isDark ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      className="flex h-9 w-9 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-white/5 dark:hover:text-neutral-100"
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
