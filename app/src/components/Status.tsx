import { formatDateTime } from '../lib/format';

export function Loading({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div className="state" role="status">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="state" role="alert">
      <p className="note note--error state__note">{message}</p>
      {onRetry && (
        <button type="button" className="btn" onClick={onRetry}>
          Réessayer
        </button>
      )}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="state state--empty muted">{children}</p>;
}

/** Bandeau des données gardées : « mise à jour » pendant le chargement, sinon « hors ligne ». */
export function CachedNote({ cachedAt, loading }: { cachedAt: number | null; loading: boolean }) {
  if (cachedAt === null) return null;
  return (
    <p className={`note ${loading ? '' : 'note--warn '}cached-note`} role="status">
      {loading ? 'Mise à jour…' : `Hors ligne, données du ${formatDateTime(cachedAt)}`}
    </p>
  );
}
