import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Inbox, Loader2, Search } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import MatchingCard from '../components/MatchingCard.jsx';

const PERIOD_OPTIONS = [
  { value: '24h', label: '24 h', counterSuffix: 'ces dernières 24 h' },
  { value: '7d', label: '7 j', counterSuffix: 'sur les 7 derniers jours' },
  { value: '30d', label: '30 j', counterSuffix: 'sur les 30 derniers jours' },
];

const DEBOUNCE_MS = 400;

function pillClasses(isActive) {
  return `rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
    isActive
      ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-neutral-100'
      : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
  }`;
}

export default function Matching() {
  const [period, setPeriod] = useState('7d');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [matchings, setMatchings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  // Debounce de la saisie de recherche
  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [searchInput]);

  // Fetch matchings
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ period });
    if (debouncedSearch) params.set('q', debouncedSearch);

    fetch(`/api/matchings?${params.toString()}`, { signal: controller.signal })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(body.error || `Erreur ${res.status}`);
        }
        return body;
      })
      .then((body) => {
        setMatchings(body.matchings ?? []);
        // Reset des cartes dépliées quand on change de filtre :
        // les update_id ne sont plus pertinents.
        setExpandedIds(new Set());
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError(err.message);
        setMatchings(null);
        setLoading(false);
      });

    return () => controller.abort();
  }, [period, debouncedSearch]);

  function toggleExpand(updateId) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(updateId)) next.delete(updateId);
      else next.add(updateId);
      return next;
    });
  }

  const periodOption = useMemo(
    () => PERIOD_OPTIONS.find((o) => o.value === period) ?? PERIOD_OPTIONS[1],
    [period]
  );

  const showCount = !loading && !error && matchings && matchings.length > 0;
  const showEmpty = !loading && !error && matchings && matchings.length === 0;

  return (
    <>
      <PageHeader
        title="Matching"
        description="Matchings RDC remontés par l'Assistant IA dans le board Ventes Conciergeries."
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-lg border border-neutral-200 bg-neutral-100 p-1 dark:border-white/10 dark:bg-neutral-950">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPeriod(opt.value)}
              className={pillClasses(period === opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 dark:text-neutral-500"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Rechercher dans les matchings..."
            className="h-10 w-full rounded-lg border border-neutral-200 bg-white pl-9 pr-3 text-sm text-neutral-900 transition-colors placeholder:text-neutral-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/30"
          />
        </div>
      </div>

      {showCount && (
        <p className="mb-4 text-xs text-neutral-500 dark:text-neutral-400">
          <span className="font-mono text-neutral-700 dark:text-neutral-300">
            {matchings.length}
          </span>{' '}
          matching{matchings.length > 1 ? 's' : ''} {periodOption.counterSuffix}
          {debouncedSearch && (
            <>
              {' '}
              · filtre <span className="font-mono">«{debouncedSearch}»</span>
            </>
          )}
        </p>
      )}

      {loading && (
        <StatusMessage
          icon={Loader2}
          text="Chargement des matchings..."
          iconClassName="animate-spin"
        />
      )}

      {error && (
        <StatusMessage icon={AlertCircle} text={`Erreur : ${error}`} tone="error" />
      )}

      {showEmpty && (
        <StatusMessage
          icon={Inbox}
          text={
            debouncedSearch
              ? 'Aucun matching ne correspond à ta recherche.'
              : 'Aucun matching sur cette période.'
          }
        />
      )}

      {!loading && !error && matchings && matchings.length > 0 && (
        <div className="flex flex-col gap-3">
          {matchings.map((m) => (
            <MatchingCard
              key={m.update_id}
              matching={m}
              expanded={expandedIds.has(m.update_id)}
              onToggleExpand={toggleExpand}
            />
          ))}
        </div>
      )}
    </>
  );
}
