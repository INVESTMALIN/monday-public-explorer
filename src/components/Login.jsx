import { useState } from 'react';
import { CheckCircle2, KeyRound, Loader2, Mail, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabaseClient.js';

const ALLOWED_DOMAIN = '@invest-malin.com';

const inputClasses =
  'h-11 w-full rounded-lg border border-neutral-200 bg-white pl-10 pr-3 text-sm text-neutral-900 transition-colors placeholder:text-neutral-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/30';

const submitClasses =
  'inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:focus:ring-emerald-400/40';

function tabClasses(isActive) {
  return `flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
    isActive
      ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-neutral-100'
      : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
  }`;
}

export default function Login() {
  const [method, setMethod] = useState('magic'); // 'magic' | 'password'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState(null);

  function switchMethod(next) {
    if (next === method) return;
    setMethod(next);
    setStatus('idle');
    setErrorMessage(null);
  }

  function validateDomain(value) {
    if (!value) return 'Renseigne ton email.';
    if (!value.endsWith(ALLOWED_DOMAIN)) {
      return `Seuls les emails ${ALLOWED_DOMAIN} sont autorisés.`;
    }
    return null;
  }

  async function handleMagicSubmit(event) {
    event.preventDefault();
    setErrorMessage(null);

    const trimmed = email.trim().toLowerCase();
    const domainError = validateDomain(trimmed);
    if (domainError) {
      setErrorMessage(domainError);
      setStatus('error');
      return;
    }

    setStatus('loading');
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      setStatus('success');
    } catch (err) {
      setErrorMessage(err?.message || "Impossible d'envoyer le lien magique.");
      setStatus('error');
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    setErrorMessage(null);

    const trimmed = email.trim().toLowerCase();
    const domainError = validateDomain(trimmed);
    if (domainError) {
      setErrorMessage(domainError);
      setStatus('error');
      return;
    }
    if (!password) {
      setErrorMessage('Renseigne ton mot de passe.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmed,
        password,
      });
      if (error) throw error;
      // Pas de setStatus('success') : l'AuthGuard détecte la session et bascule sur l'app.
    } catch (err) {
      setErrorMessage(err?.message || 'Identifiants invalides.');
      setStatus('error');
    }
  }

  const isLoading = status === 'loading';
  const isSuccess = status === 'success' && method === 'magic';

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-10 font-sans text-neutral-900 transition-colors dark:bg-neutral-950 dark:text-neutral-100">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-neutral-200 bg-white p-8 dark:border-white/10 dark:bg-neutral-900">
          <div className="mb-6 flex flex-col gap-1">
            <h1 className="text-xl font-bold tracking-tight">Monday Explorer</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Connecte-toi avec ton email Invest Malin pour accéder à l'app.
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-950">
            <button
              type="button"
              onClick={() => switchMethod('magic')}
              className={tabClasses(method === 'magic')}
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Magic link
            </button>
            <button
              type="button"
              onClick={() => switchMethod('password')}
              className={tabClasses(method === 'password')}
            >
              <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
              Mot de passe
            </button>
          </div>

          {isSuccess ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2
                className="h-8 w-8 text-emerald-500 dark:text-emerald-400"
                aria-hidden="true"
              />
              <p className="text-sm text-neutral-700 dark:text-neutral-300">
                Lien envoyé. Check tes mails et clique sur le lien magique pour te connecter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setStatus('idle');
                  setEmail('');
                }}
                className="text-xs text-neutral-500 underline-offset-2 hover:underline dark:text-neutral-400"
              >
                Renvoyer un lien
              </button>
            </div>
          ) : method === 'magic' ? (
            <form onSubmit={handleMagicSubmit} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Email
                </span>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 dark:text-neutral-500"
                    aria-hidden="true"
                  />
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={`prenom${ALLOWED_DOMAIN}`}
                    disabled={isLoading}
                    className={inputClasses}
                  />
                </div>
              </label>

              {errorMessage && status === 'error' && (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                  {errorMessage}
                </p>
              )}

              <button type="submit" disabled={isLoading} className={submitClasses}>
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {isLoading ? 'Envoi...' : 'Recevoir le lien magique'}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Email
                </span>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 dark:text-neutral-500"
                    aria-hidden="true"
                  />
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={`prenom${ALLOWED_DOMAIN}`}
                    disabled={isLoading}
                    className={inputClasses}
                  />
                </div>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Mot de passe
                </span>
                <div className="relative">
                  <KeyRound
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 dark:text-neutral-500"
                    aria-hidden="true"
                  />
                  <input
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isLoading}
                    className={inputClasses}
                  />
                </div>
              </label>

              {errorMessage && status === 'error' && (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                  {errorMessage}
                </p>
              )}

              <button type="submit" disabled={isLoading} className={submitClasses}>
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-neutral-400 dark:text-neutral-500">
          Outil interne Invest Malin · accès restreint
        </p>
      </div>
    </div>
  );
}
