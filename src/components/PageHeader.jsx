export default function PageHeader({ title, description }) {
  return (
    <header className="mb-8 flex flex-col gap-1">
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
        {title}
      </h1>
      {description && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{description}</p>
      )}
    </header>
  );
}
