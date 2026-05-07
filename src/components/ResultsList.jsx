import { SearchX } from 'lucide-react';
import ResultCard from './ResultCard.jsx';
import StatusMessage from './StatusMessage.jsx';

export default function ResultsList({ results }) {
  const nonEmpty = results.filter((board) => board.count > 0);

  if (nonEmpty.length === 0) {
    return <StatusMessage icon={SearchX} text="Aucun résultat trouvé." />;
  }

  return (
    <div className="flex flex-col gap-8">
      {nonEmpty.map((board) => (
        <section key={board.view}>
          <header className="mb-3 flex items-center gap-3">
            <h2 className="font-semibold text-neutral-800 dark:text-neutral-200">
              {board.label}
            </h2>
            <span className="rounded-full border border-emerald-500/20 bg-emerald-50 px-2.5 py-0.5 font-mono text-xs font-medium text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              {board.count}
            </span>
          </header>
          <div className="flex flex-col gap-2">
            {board.items.map((item) => (
              <ResultCard key={`${board.view}-${item.item_id}`} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
