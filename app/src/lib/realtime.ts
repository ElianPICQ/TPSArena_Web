// WebSocket de Real-time pour la présence des amis, le chat et les notifications, à travers le
// nginx du site (/ws, même origine). Même protocole que le jeu (backend/services/realtime/PROTOCOL.md),
// avec `client: "mobile"` : les amis voient le joueur « sur mobile », et Social ne le compte pas
// comme dans le jeu.

import { useSyncExternalStore } from 'react';
import { accessExpiresAt, accessToken, dropAccessToken, expireSession, NetworkError, SessionExpiredError } from './api';
import { achievementText, messageFor } from './labels';
import type { FriendMessage, Presence, User } from './types';

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected';

export interface Toast {
  id: number;
  text: string;
  href?: string;
}

export interface RealtimeState {
  status: ConnectionStatus;
  /** Présence des amis, connue seulement une fois connecté. */
  presence: Record<string, Presence>;
  /** Messages reçus ou envoyés depuis l'ouverture de l'app, par ami (du plus ancien au plus récent). */
  messages: Record<string, FriendMessage[]>;
  unread: Record<string, number>;
  /** Augmente à chaque changement d'amitié ou de demande : l'écran Amis recharge la liste. */
  friendsVersion: number;
  /** Demandes d'ami reçues en attente (badge de l'onglet Amis). */
  incoming: number;
  toasts: Toast[];
}

const INITIAL: RealtimeState = {
  status: 'idle',
  presence: {},
  messages: {},
  unread: {},
  friendsVersion: 0,
  incoming: 0,
  toasts: [],
};

const RECONNECT_DELAYS = [1000, 2000, 5000, 10_000, 30_000];
const TOAST_MS = 4500;
const SEND_TIMEOUT_MS = 10_000;

interface PendingSend {
  clientId: string;
  resolve: (message: FriendMessage) => void;
  reject: (error: Error) => void;
  timer: number;
}

// Erreurs du serveur qui répondent à un envoi de message (elles n'ont pas de client_id : les
// messages d'un socket sont traités dans l'ordre, la plus ancienne demande en attente est visée).
const SEND_ERRORS = new Set(['not_friends', 'invalid_body', 'invalid_recipient', 'rate_limited', 'internal_error']);

const SOCKET_MESSAGES: Record<string, string> = {
  not_friends: 'Vous n’êtes plus amis : message non envoyé.',
  invalid_body: 'Un message fait de 1 à 500 caractères.',
  rate_limited: 'Trop de messages d’un coup. Patiente quelques secondes.',
  internal_error: 'Le message n’a pas pu être envoyé. Réessaie.',
};

class Realtime {
  private state: RealtimeState = INITIAL;
  private listeners = new Set<() => void>();
  private ws: WebSocket | null = null;
  private user: User | null = null;
  private activeChat: string | null = null;
  private attempt = 0;
  private reconnectTimer: number | undefined;
  private heartbeatTimer: number | undefined;
  private reauthTimer: number | undefined;
  private pending: PendingSend[] = [];
  private nextToast = 1;
  private names: Record<string, string> = {};

  // --- Abonnement (useSyncExternalStore) ---

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getState = () => this.state;

  private set(patch: Partial<RealtimeState>): void {
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) listener();
  }

  // --- Cycle de vie ---

  start(user: User): void {
    if (this.user?.user_id === user.user_id && this.ws) return;
    this.stop();
    this.user = user;
    this.connect();
  }

  /** Déconnexion de l'app : ferme le socket, oublie tout. */
  stop(): void {
    this.user = null;
    this.names = {};
    this.clearTimers();
    window.clearTimeout(this.reconnectTimer);
    const ws = this.ws;
    this.ws = null;
    ws?.close(1000);
    this.failPending(new Error('Déconnecté.'));
    this.state = INITIAL;
    for (const listener of this.listeners) listener();
  }

  /** Retour au premier plan ou réseau revenu : reconnecte tout de suite si besoin. */
  wake(): void {
    if (!this.user || this.ws) return;
    window.clearTimeout(this.reconnectTimer);
    this.connect();
  }

  private connect(): void {
    if (!this.user) return;
    const scheme = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${scheme}://${location.host}/ws`);
    this.ws = ws;
    this.set({ status: 'connecting' });
    ws.onopen = () => void this.authenticate(ws);
    ws.onmessage = (event) => this.onMessage(ws, event.data);
    ws.onclose = (event) => this.onClose(ws, event.code, event.reason);
  }

  private async authenticate(ws: WebSocket): Promise<void> {
    try {
      const token = await accessToken();
      if (ws === this.ws) ws.send(JSON.stringify({ type: 'auth', token, client: 'mobile' }));
    } catch (error) {
      // Session finie (l'app repasse à la connexion) ou serveur injoignable (nouvel essai).
      if (!(error instanceof SessionExpiredError)) ws.close();
    }
  }

  private onClose(ws: WebSocket, code: number, reason: string): void {
    if (ws !== this.ws) return;
    this.ws = null;
    this.clearTimers();
    this.failPending(new Error('Connexion au chat perdue.'));
    if (!this.user) return;
    this.set({ status: 'disconnected' });
    if (code === 4003 || (code === 4001 && reason === 'session_revoked')) {
      expireSession();
      return;
    }
    if (code === 4001) dropAccessToken(); // jeton refusé : le suivant sera rafraîchi
    const delay = RECONNECT_DELAYS[Math.min(this.attempt, RECONNECT_DELAYS.length - 1)]!;
    this.attempt += 1;
    this.reconnectTimer = window.setTimeout(() => this.connect(), delay);
  }

  private clearTimers(): void {
    window.clearInterval(this.heartbeatTimer);
    window.clearTimeout(this.reauthTimer);
  }

  /** Renvoie `auth` avec un jeton neuf avant l'expiration du précédent (sinon le serveur ferme en 4001). */
  private scheduleReauth(ws: WebSocket): void {
    window.clearTimeout(this.reauthTimer);
    const expiresAt = accessExpiresAt();
    const delay = expiresAt ? Math.max(5000, expiresAt - Date.now()) : 60_000;
    this.reauthTimer = window.setTimeout(async () => {
      try {
        const token = await accessToken();
        if (ws !== this.ws) return;
        ws.send(JSON.stringify({ type: 'auth', token }));
        this.scheduleReauth(ws);
      } catch (error) {
        if (error instanceof NetworkError) this.scheduleReauth(ws);
      }
    }, delay);
  }

  // --- Messages du serveur ---

  private onMessage(ws: WebSocket, raw: unknown): void {
    let message: Record<string, any>;
    try {
      message = JSON.parse(String(raw));
    } catch {
      return;
    }
    switch (message.type) {
      case 'hello': {
        this.attempt = 0;
        const presence: Record<string, Presence> = {};
        for (const p of message.friends as Presence[]) presence[p.user_id] = p;
        this.set({ status: 'connected', presence, friendsVersion: this.state.friendsVersion + 1 });
        window.clearInterval(this.heartbeatTimer);
        const every = Number(message.heartbeat_interval) || 20;
        this.heartbeatTimer = window.setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send('{"type":"heartbeat"}');
        }, every * 1000);
        this.scheduleReauth(ws);
        return;
      }
      case 'presence': {
        const { type: _type, ...presence } = message;
        this.set({ presence: { ...this.state.presence, [presence.user_id]: presence as Presence } });
        return;
      }
      case 'friend_message': {
        const msg = message.message as FriendMessage;
        this.addMessage(msg);
        if (msg.from_user_id !== this.activeChat) {
          this.set({ unread: { ...this.state.unread, [msg.from_user_id]: (this.state.unread[msg.from_user_id] ?? 0) + 1 } });
          const name = this.names[msg.from_user_id];
          this.toast(name ? `Message de ${name}` : 'Nouveau message', `#/amis/${msg.from_user_id}`, msg.from_user_id);
        }
        return;
      }
      case 'friend_message_sent': {
        const msg = message.message as FriendMessage;
        this.addMessage(msg);
        const index = this.pending.findIndex((p) => p.clientId === message.client_id);
        if (index >= 0) {
          const [done] = this.pending.splice(index, 1);
          window.clearTimeout(done!.timer);
          done!.resolve(msg);
        }
        return;
      }
      case 'notification':
        return this.onNotification(message.event, message.data ?? {});
      case 'error':
        if (SEND_ERRORS.has(message.error) && this.pending.length > 0) {
          const done = this.pending.shift()!;
          window.clearTimeout(done.timer);
          done.reject(new Error(SOCKET_MESSAGES[message.error] ?? messageFor(message.error)));
        }
        return;
    }
  }

  private onNotification(event: string, data: Record<string, any>): void {
    const bump = () => this.set({ friendsVersion: this.state.friendsVersion + 1 });
    switch (event) {
      case 'friend.request_sent':
        bump();
        if (data.to_user_id === this.user?.user_id) this.toast('Nouvelle demande d’ami', '#/amis');
        return;
      case 'friend.added':
        bump();
        return this.toast('Nouvel ami ajouté', '#/amis');
      case 'friend.request_removed':
      case 'friend.removed':
        return bump();
      case 'progress.level_up':
        return this.toast(`Niveau ${data.level} atteint !`, '#/');
      case 'progress.achievement_unlocked': {
        const id = String(data.achievement_id ?? '');
        return this.toast(`Succès débloqué : ${achievementText(id, id, '').name}`, '#/succes');
      }
    }
  }

  private addMessage(msg: FriendMessage): void {
    const friend = msg.from_user_id === this.user?.user_id ? msg.to_user_id : msg.from_user_id;
    const list = this.state.messages[friend] ?? [];
    if (list.some((m) => m.id === msg.id)) return;
    this.set({ messages: { ...this.state.messages, [friend]: [...list, msg] } });
  }

  // --- Actions de l'app ---

  /** Envoie un message ; résolu avec le message enregistré par le serveur. */
  sendMessage(to: string, body: string): Promise<FriendMessage> {
    const ws = this.ws;
    if (!ws || ws.readyState !== WebSocket.OPEN || this.state.status !== 'connected') {
      return Promise.reject(new Error('Chat déconnecté : réessaie dans un instant.'));
    }
    const clientId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => {
        this.pending = this.pending.filter((p) => p.clientId !== clientId);
        reject(new Error('Pas de réponse du chat. Réessaie.'));
      }, SEND_TIMEOUT_MS);
      this.pending.push({ clientId, resolve, reject, timer });
      ws.send(JSON.stringify({ type: 'friend_message', to, body, client_id: clientId }));
    });
  }

  /** Conversation affichée : ses messages ne comptent pas comme non lus. */
  openChat(friendId: string | null): void {
    this.activeChat = friendId;
    if (!friendId) return;
    const { [friendId]: _read, ...unread } = this.state.unread;
    const toasts = this.state.toasts.filter((t) => t.href !== `#/amis/${friendId}`);
    if (_read || toasts.length !== this.state.toasts.length) this.set({ unread, toasts });
  }

  /** Après chaque chargement de la liste d'amis : pseudos (pour les notifications) et demandes reçues. */
  setFriends(names: Record<string, string>, incoming: number): void {
    this.names = names;
    if (incoming !== this.state.incoming) this.set({ incoming });
  }

  dismissToast(id: number): void {
    this.set({ toasts: this.state.toasts.filter((t) => t.id !== id) });
  }

  private toast(text: string, href?: string, from?: string): void {
    const id = this.nextToast++;
    // Un seul toast par conversation : pas de pile pour une rafale de messages.
    const toasts = this.state.toasts.filter((t) => !from || t.href !== href);
    this.set({ toasts: [...toasts, { id, text, href }].slice(-3) });
    window.setTimeout(() => this.dismissToast(id), TOAST_MS);
  }

  private failPending(error: Error): void {
    for (const p of this.pending.splice(0)) {
      window.clearTimeout(p.timer);
      p.reject(error);
    }
  }
}

export const realtime = new Realtime();

export function useRealtime(): RealtimeState {
  return useSyncExternalStore(realtime.subscribe, realtime.getState);
}

/** Libellé de présence affiché sous le pseudo d'un ami. */
export function presenceLabel(p: Presence | undefined): { text: string; tone: 'match' | 'online' | 'mobile' | 'offline' } {
  if (!p || p.status === 'offline') return { text: 'Hors ligne', tone: 'offline' };
  if (p.activity === 'in_match') return { text: 'En partie', tone: 'match' };
  if (p.activity === 'mobile') return { text: 'Sur mobile', tone: 'mobile' };
  return { text: 'Dans le menu', tone: 'online' };
}
