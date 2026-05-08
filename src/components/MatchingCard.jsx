import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { relativeDate } from '../lib/dateUtils.js';

const MATCHING_MARKER = 'Suggestion de contenu:';
const PREVIEW_LENGTH = 200;

// Le matching_text envoyé par l'API commence par "Suggestion de contenu:".
// Pour la preview tronquée on retire ce préambule afin de montrer du contenu utile.
function getPreview(text) {
  if (!text) return '';
  let stripped = text;
  if (stripped.startsWith(MATCHING_MARKER)) {
    stripped = stripped.slice(MATCHING_MARKER.length);
  }
  stripped = stripped.trim();
  if (stripped.length <= PREVIEW_LENGTH) return stripped;
  return stripped.slice(0, PREVIEW_LENGTH).trim() + '…';
}

export default function MatchingCard({ matching, expanded, onToggleExpand }) {
  const {
    update_id,
    prospect_name,
    group_title,
    creator_name,
    monday_created_at,
    matching_text,
    monday_url,
  } = matching;

  const preview = getPreview(matching_text);
  const displayName = prospect_name ?? 'Prospect inconnu';

  return (
    <article className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-300 dark:border-white/10 dark:bg-neutral-900 dark:hover:border-white/20">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex min-w-0 flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <h3 className="truncate text-base font-bold text-neutral-900 dark:text-neutral-100">
            {displayName}
          </h3>
          {group_title && (
            <span className="self-start rounded-full border border-emerald-500/20 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              {group_title}
            </span>
          )}
        </div>
        <p
          className="shrink-0 font-mono text-xs text-neutral-400 dark:text-neutral-500 sm:text-right"
          title={monday_created_at}
        >
          {relativeDate(monday_created_at)}
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500 dark:text-neutral-500">
        {creator_name && <span>{creator_name}</span>}
        <a
          href={monday_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded text-neutral-500 transition-colors hover:text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 dark:text-neutral-400 dark:hover:text-emerald-400 dark:focus:ring-emerald-400/40"
        >
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
          Ouvrir dans Monday
        </a>
      </div>

      <div className="text-sm text-neutral-700 dark:text-neutral-300">
        {expanded ? (
          <p className="whitespace-pre-line">{matching_text}</p>
        ) : (
          <p>{preview}</p>
        )}
      </div>

      <div>
        <button
          type="button"
          onClick={() => onToggleExpand(update_id)}
          className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 transition-colors hover:text-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 dark:text-emerald-400 dark:hover:text-emerald-300 dark:focus:ring-emerald-400/40"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
              Réduire
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              Voir plus
            </>
          )}
        </button>
      </div>
    </article>
  );
}
