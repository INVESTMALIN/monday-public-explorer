import { Sparkles } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';

export default function ComingSoon({ title, description }) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-neutral-300 bg-white px-6 py-20 text-center dark:border-white/10 dark:bg-neutral-900">
        <Sparkles
          className="h-8 w-8 text-emerald-500 dark:text-emerald-400"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">À venir</p>
        <p className="max-w-md text-xs text-neutral-500 dark:text-neutral-400">
          Cette section est en cours de définition. Reviens plus tard.
        </p>
      </div>
    </>
  );
}
