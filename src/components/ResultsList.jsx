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
            <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
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
