import Sidebar from './Sidebar.jsx';

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-neutral-50 font-sans text-neutral-900 transition-colors dark:bg-neutral-950 dark:text-neutral-100">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl px-8 py-10 sm:py-12">{children}</div>
      </main>
    </div>
  );
}
