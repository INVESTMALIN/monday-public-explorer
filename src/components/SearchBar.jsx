import { useEffect, useState } from 'react';
import { Loader2, Search } from 'lucide-react';

const DEBOUNCE_MS = 400;

export default function SearchBar({ onDebouncedChange, loading = false }) {
  const [value, setValue] = useState('');

  useEffect(() => {
    const handle = setTimeout(() => {
      onDebouncedChange(value.trim());
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [value, onDebouncedChange]);

  const Icon = loading ? Loader2 : Search;

  return (
    <div className="relative">
      <Icon
        className={`pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 ${
          loading ? 'animate-spin' : ''
        }`}
        aria-hidden="true"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Rechercher un nom, un email, un numéro de bien..."
        className="h-12 w-full rounded-lg border border-neutral-200 bg-white pl-12 pr-4 text-base text-neutral-900 transition-colors placeholder:text-neutral-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/30"
      />
    </div>
  );
}
