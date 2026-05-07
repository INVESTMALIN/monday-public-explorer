import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Loader2, Search } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import SearchBar from '../components/SearchBar.jsx';
import ResultsList from '../components/ResultsList.jsx';
import StatusMessage from '../components/StatusMessage.jsx';

const MIN_QUERY_LENGTH = 2;

export default function Annuaire() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleQueryChange = useCallback((value) => {
    setQuery(value);
  }, []);

  useEffect(() => {
    if (query.length < MIN_QUERY_LENGTH) {
      setResults(null);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(`/api/search?q=${encodeURIComponent(query)}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(body.error || `Erreur ${res.status}`);
        }
        return body;
      })
      .then((body) => {
        setResults(body.results ?? []);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError(err.message);
        setResults(null);
        setLoading(false);
      });

    return () => controller.abort();
  }, [query]);

  const showInitial = query.length === 0 && !loading && !error && !results;
  const showShortQuery = query.length > 0 && query.length < MIN_QUERY_LENGTH;
  const showLoading = query.length >= MIN_QUERY_LENGTH && loading;
  const showResults = !loading && !error && results;

  return (
    <>
      <PageHeader
        title="Annuaire"
        description="Recherche transverse dans les 6 boards Monday miroirs (lecture seule, rafraîchis chaque nuit)."
      />
      <div className="flex flex-col gap-8">
        <SearchBar onDebouncedChange={handleQueryChange} loading={loading} />
        <div>
          {showInitial && (
            <StatusMessage
              icon={Search}
              text="Lance une recherche pour voir les résultats."
            />
          )}
          {showShortQuery && (
            <StatusMessage
              icon={Search}
              text={`Tape au moins ${MIN_QUERY_LENGTH} caractères pour lancer la recherche.`}
            />
          )}
          {showLoading && (
            <StatusMessage
              icon={Loader2}
              text="Recherche en cours..."
              iconClassName="animate-spin"
            />
          )}
          {error && (
            <StatusMessage icon={AlertCircle} text={`Erreur : ${error}`} tone="error" />
          )}
          {showResults && <ResultsList results={results} />}
        </div>
      </div>
    </>
  );
}
