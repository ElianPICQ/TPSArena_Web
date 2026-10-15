import { useCallback, useEffect, useRef, useState } from 'react';
import { NetworkError, SessionExpiredError } from './api';
import { readCache, writeCache } from './cache';
import type { User } from './types';

export interface Resource<T> {
  data: T | null;
  /** Date des données affichées si elles viennent du cache (hors ligne), sinon null. */
  cachedAt: number | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Données d'un écran : affiche tout de suite la dernière version gardée, puis la remplace par
 * celle du serveur. Hors ligne ou en cas d'erreur, la version gardée reste affichée avec sa date.
 */
export function useResource<T>(user: User, online: boolean, key: string, load: () => Promise<T>): Resource<T> {
  const [state, setState] = useState<Omit<Resource<T>, 'reload'>>(() => initial<T>(user, key));
  const [attempt, setAttempt] = useState(0);
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    setState(initial<T>(user, key));
    if (!online) {
      setState((s) => ({ ...s, loading: false, error: s.data ? null : 'Hors ligne, et rien n’a encore été gardé pour cet écran.' }));
      return;
    }
    let cancelled = false;
    loadRef.current().then(
      (data) => {
        if (cancelled) return;
        writeCache(user.user_id, key, data);
        setState({ data, cachedAt: null, loading: false, error: null });
      },
      (error: unknown) => {
        if (cancelled || error instanceof SessionExpiredError) return;
        const offline = error instanceof NetworkError;
        setState((s) => ({
          ...s,
          loading: false,
          // Avec des données gardées, hors ligne n'est pas une erreur : la date suffit.
          error: offline && s.data ? null : error instanceof Error ? error.message : 'Erreur inattendue.',
        }));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [user, online, key, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, reload };
}

function initial<T>(user: User, key: string): Omit<Resource<T>, 'reload'> {
  const cached = readCache<T>(user.user_id, key);
  return { data: cached?.data ?? null, cachedAt: cached?.savedAt ?? null, loading: true, error: null };
}
