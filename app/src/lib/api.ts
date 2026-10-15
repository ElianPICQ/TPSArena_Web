// Client du web-bff (servi par le nginx du site sous /api/, même origine que l'app).
//
// Session : le jeton d'accès (15 min) reste en mémoire ; le jeton de rafraîchissement est dans
// un cookie HttpOnly que le script ne voit jamais. Au chargement de la page et quand le jeton
// d'accès expire, POST /api/auth/refresh en donne un nouveau (et fait tourner le cookie).
//
// Un jeton de rafraîchissement déjà utilisé fait révoquer toutes les sessions du joueur par
// Auth (vol présumé). Deux onglets qui rafraîchissent en même temps enverraient le même
// cookie : les rafraîchissements sont donc faits un par un, entre onglets (Web Locks) et
// dans l'onglet (une seule promesse en cours).

import { messageFor } from './labels';
import type { Session, User } from './types';

const BASE = '/api';
const REFRESH_LOCK = 'tps-arena-refresh';
const EXPIRY_MARGIN_MS = 60_000;

/** Réponse d'erreur de l'API (`{"error", "message"}`), avec son message en français. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string) {
    super(messageFor(code, status));
    this.status = status;
    this.code = code;
  }
}

/** Le serveur n'a pas pu être joint (hors ligne, Wi-Fi coupé…). */
export class NetworkError extends Error {
  constructor() {
    super(messageFor('unreachable'));
  }
}

/** La session est finie (cookie expiré, révoqué ou absent) : il faut se reconnecter. */
export class SessionExpiredError extends ApiError {
  constructor() {
    super(401, 'invalid_refresh_token');
  }
}

let access: { token: string; expiresAt: number } | null = null;
let refreshing: Promise<User | null> | null = null;
let onExpired: () => void = () => {};

/** Appelé quand la session ne peut plus être prolongée (retour à l'écran de connexion). */
export function setSessionExpiredHandler(handler: () => void): void {
  onExpired = handler;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(BASE + path, {
      ...init,
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { accept: 'application/json', ...init.headers },
    });
  } catch {
    throw new NetworkError();
  }
  if (response.status === 204) return undefined as T;
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // Pas du JSON : page d'erreur d'un intermédiaire.
  }
  if (!response.ok) {
    const code = (body as { error?: unknown } | null)?.error;
    throw new ApiError(response.status, typeof code === 'string' ? code : fallbackCode(response.status));
  }
  if (body === null) throw new ApiError(502, 'bad_gateway');
  return body as T;
}

function fallbackCode(status: number): string {
  if (status === 422) return 'validation';
  if (status === 429) return 'rate_limited';
  if (status >= 500) return 'bad_gateway';
  return 'unknown';
}

function applySession(session: Session): User {
  access = { token: session.access_token, expiresAt: Date.now() + session.expires_in * 1000 - EXPIRY_MARGIN_MS };
  return session.user;
}

async function withRefreshLock<T>(task: () => Promise<T>): Promise<T> {
  // Web Locks : disponible dans un contexte sécurisé (HTTPS ou localhost).
  if (typeof navigator !== 'undefined' && navigator.locks) {
    return navigator.locks.request(REFRESH_LOCK, task);
  }
  return task();
}

/**
 * Prolonge la session avec le cookie. Renvoie le joueur, ou null s'il faut se reconnecter.
 * Lève NetworkError si le serveur est injoignable (la session est peut-être encore valide).
 */
export function refreshSession(): Promise<User | null> {
  refreshing ??= withRefreshLock(async () => {
    try {
      return applySession(await request<Session>('/auth/refresh', { method: 'POST' }));
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        access = null;
        return null;
      }
      throw error;
    }
  }).finally(() => {
    refreshing = null;
  });
  return refreshing;
}

export async function login(identifier: string, password: string): Promise<User> {
  const session = await request<Session>('/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  return applySession(session);
}

/** Révoque le jeton de rafraîchissement et supprime le cookie. Ne lève jamais. */
export async function logout(): Promise<void> {
  access = null;
  try {
    await withRefreshLock(() => request<void>('/auth/logout', { method: 'POST' }));
  } catch {
    // Hors ligne : le cookie expirera de lui-même ; la session locale est fermée quand même.
  }
}

async function validToken(): Promise<string> {
  if (access && access.expiresAt > Date.now()) return access.token;
  const user = await refreshSession();
  if (!user || !access) {
    onExpired();
    throw new SessionExpiredError();
  }
  return access.token;
}

/** Requête authentifiée. Un 401 (jeton expiré entre-temps) déclenche un rafraîchissement et un nouvel essai. */
async function authed<T>(path: string, init: RequestInit = {}): Promise<T> {
  const call = async () =>
    request<T>(path, { ...init, headers: { ...init.headers, authorization: `Bearer ${await validToken()}` } });
  try {
    return await call();
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401 || error instanceof SessionExpiredError) throw error;
    access = null;
    return call();
  }
}

export function get<T>(path: string): Promise<T> {
  return authed<T>(path);
}

/** POST (corps JSON facultatif) ou DELETE authentifié. */
export function send<T = void>(method: 'POST' | 'DELETE', path: string, body?: unknown): Promise<T> {
  return authed<T>(path, {
    method,
    ...(body === undefined ? {} : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
  });
}

// --- Pour le WebSocket du chat (realtime.ts), qui s'authentifie avec le même jeton d'accès ---

/** Un jeton d'accès valide (rafraîchi si besoin). Lève SessionExpiredError ou NetworkError. */
export const accessToken = validToken;

/** Quand le jeton d'accès actuel doit être remplacé (marge comprise), ou null sans jeton. */
export function accessExpiresAt(): number | null {
  return access?.expiresAt ?? null;
}

/** Le serveur a refusé le jeton : le prochain appel en demandera un nouveau. */
export function dropAccessToken(): void {
  access = null;
}

/** Session révoquée ou compte supprimé (fermeture du WebSocket) : retour à la connexion. */
export function expireSession(): void {
  access = null;
  onExpired();
}
