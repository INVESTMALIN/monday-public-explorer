const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

function formatDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return dateFormatter.format(date);
}

export default function ResultCard({ item }) {
  const formattedDate = formatDate(item.monday_updated_at);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex min-w-0 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
        <p className="truncate text-base font-medium text-neutral-900 dark:text-neutral-100">
          {item.item_name}
        </p>
        {item.group_title && (
          <span className="self-start rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
            {item.group_title}
          </span>
        )}
      </div>
      {formattedDate && (
        <p className="shrink-0 text-xs text-neutral-400 dark:text-neutral-500 sm:text-right">
          Maj le {formattedDate}
        </p>
      )}
    </div>
  );
}
