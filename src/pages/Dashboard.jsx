import { Database, Layers, RefreshCw, Search } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';

const STATS = [
  { label: 'Boards indexés', value: '6', icon: Layers },
  { label: 'Items indexés', value: '—', icon: Database },
  { label: 'Dernière sync', value: '—', icon: RefreshCw },
  { label: 'Recherches cette semaine', value: '—', icon: Search },
];

export default function Dashboard() {
  return (
    <>
      <PageHeader
        title="Bienvenue sur Monday Explorer"
        description="Outil interne de recherche et de croisement sur les boards Monday d'Invest Malin."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-lg border border-neutral-200 bg-white p-5 transition-colors hover:border-neutral-300 dark:border-white/10 dark:bg-neutral-900 dark:hover:border-white/20"
          >
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </div>
            <p className="font-mono text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
              {value}
            </p>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
          </div>
        ))}
      </div>
    </>
  );
}
