// Dernières données affichées, gardées dans le navigateur pour le mode hors ligne.
// Une entrée par joueur et par écran ; tout est effacé à la déconnexion. Le stockage peut
// être indisponible (navigation privée, données bloquées) : l'app marche alors sans.

import type { User } from './types';

const PREFIX = 'tps-arena.cache.';
const LAST_USER = 'tps-arena.last-user';

export interface Cached<T> {
  savedAt: number;
  data: T;
}

export function readCache<T>(userId: string, key: string): Cached<T> | null {
  try {
    const raw = localStorage.getItem(`${PREFIX}${userId}.${key}`);
    return raw ? (JSON.parse(raw) as Cached<T>) : null;
  } catch {
    return null;
  }
}

export function writeCache<T>(userId: string, key: string, data: T): void {
  try {
    localStorage.setItem(`${PREFIX}${userId}.${key}`, JSON.stringify({ savedAt: Date.now(), data }));
  } catch {
    // Quota plein ou stockage bloqué : pas de mode hors ligne pour cet écran.
  }
}

/** Le dernier joueur connecté, pour ouvrir l'app hors ligne sur ses données. */
export function readLastUser(): User | null {
  try {
    const raw = localStorage.getItem(LAST_USER);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function writeLastUser(user: User): void {
  try {
    localStorage.setItem(LAST_USER, JSON.stringify(user));
  } catch {
    // Sans stockage, l'app ne s'ouvre simplement pas hors ligne.
  }
}

export function clearCache(): void {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(PREFIX) || key === LAST_USER) localStorage.removeItem(key);
    }
  } catch {
    // Rien à effacer.
  }
}
