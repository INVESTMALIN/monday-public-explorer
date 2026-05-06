import ThemeToggle from './ThemeToggle.jsx';

export default function Header() {
  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Monday Explorer
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Recherche transverse — 6 boards Monday
          </p>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
