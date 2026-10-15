import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { get, send } from '../lib/api';
import { formatDateTime } from '../lib/format';
import { presenceLabel, realtime, useRealtime } from '../lib/realtime';
import { useResource, type Resource } from '../lib/resource';
import { HREF } from '../lib/route';
import type { FriendMessage, FriendsListing, MessagePage, User } from '../lib/types';
import { BackIcon } from '../components/Icons';
import { CachedNote, ErrorState, Loading } from '../components/Status';
import { PresenceDot } from './Friends';

const PAGE = 30;
const MAX_LENGTH = 500;

interface Props {
  user: User;
  online: boolean;
  friendId: string;
  friends: Resource<FriendsListing>;
}

/** Ordre chronologique ; les ids sont des entiers croissants (en texte). */
function byTime(a: FriendMessage, b: FriendMessage): number {
  return a.created_at.localeCompare(b.created_at) || Number(BigInt(a.id) - BigInt(b.id));
}

export function Chat({ user, online, friendId, friends }: Props) {
  const rt = useRealtime();
  const load = useCallback(() => get<MessagePage>(`/conversations/${friendId}/messages?limit=${PAGE}`), [friendId]);
  const history = useResource(user, online, `chat.${friendId}`, load);
  const [older, setOlder] = useState<FriendMessage[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [olderState, setOlderState] = useState<{ loading: boolean; error: string | null }>({ loading: false, error: null });
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const keepScroll = useRef(false);

  // Les messages de cette conversation ne comptent pas comme non lus tant qu'elle est ouverte.
  useEffect(() => {
    realtime.openChat(friendId);
    return () => realtime.openChat(null);
  }, [friendId]);

  useEffect(() => {
    setOlder([]);
    setCursor(history.data?.next_cursor ?? null);
  }, [history.data]);

  const friend = friends.data?.friends.find((f) => f.user_id === friendId);
  const name = friend?.username ?? friends.data?.incoming.find((r) => r.user_id === friendId)?.username ?? 'Joueur';
  const stillFriends = !friends.data || Boolean(friend);
  const live = online && rt.status === 'connected';

  const merged = new Map<string, FriendMessage>();
  for (const m of [...older, ...(history.data?.messages ?? []), ...(rt.messages[friendId] ?? [])]) merged.set(m.id, m);
  const messages = [...merged.values()].sort(byTime);
  const lastId = messages.at(-1)?.id;

  // Nouveau message : on descend en bas (sauf après « messages plus anciens »).
  useLayoutEffect(() => {
    if (keepScroll.current) {
      keepScroll.current = false;
      return;
    }
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [lastId]);

  async function loadOlder() {
    if (!cursor) return;
    setOlderState({ loading: true, error: null });
    try {
      const page = await get<MessagePage>(
        `/conversations/${friendId}/messages?limit=${PAGE}&before=${encodeURIComponent(cursor)}`,
      );
      keepScroll.current = true;
      setOlder((o) => [...o, ...page.messages]);
      setCursor(page.next_cursor);
      setOlderState({ loading: false, error: null });
    } catch (e) {
      setOlderState({ loading: false, error: e instanceof Error ? e.message : 'Erreur inattendue.' });
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setSendError(null);
    try {
      await realtime.sendMessage(friendId, body);
      setDraft('');
    } catch (e) {
      setSendError(e instanceof Error ? e.message : 'Erreur inattendue.');
    } finally {
      setSending(false);
    }
  }

  async function removeFriend() {
    if (!window.confirm(`Retirer ${name} de tes amis ? Vous ne pourrez plus vous écrire.`)) return;
    try {
      await send('DELETE', `/friends/${friendId}`);
      friends.reload();
      window.location.hash = HREF.friends;
    } catch (e) {
      setSendError(e instanceof Error ? e.message : 'Erreur inattendue.');
    }
  }

  return (
    <div className="chat">
      <div className="chat__head">
        <a className="back-link" href={HREF.friends} aria-label="Retour aux amis">
          <BackIcon />
        </a>
        <PresenceDot presence={live ? rt.presence[friendId] : undefined} known={live} />
        <span className="chat__who">
          <span className="chat__name">{name}</span>
          <span className="friend-row__status">{live ? presenceLabel(rt.presence[friendId]).text : 'Présence indisponible'}</span>
        </span>
        {online && friend && (
          <button type="button" className="link-btn chat__remove" onClick={() => void removeFriend()}>
            Retirer
          </button>
        )}
      </div>

      <CachedNote cachedAt={history.cachedAt} loading={history.loading} />
      {history.error && history.data && <p className="note note--error">{history.error}</p>}

      {!history.data ? (
        history.loading ? (
          <Loading />
        ) : (
          <ErrorState message={history.error ?? 'Erreur inattendue.'} onRetry={history.reload} />
        )
      ) : (
        <>
          {cursor && online && history.cachedAt === null && (
            <button type="button" className="btn btn--small chat__older" onClick={() => void loadOlder()} disabled={olderState.loading}>
              {olderState.loading ? 'Chargement…' : 'Messages plus anciens'}
            </button>
          )}
          {olderState.error && <p className="note note--error">{olderState.error}</p>}
          {messages.length === 0 ? (
            <p className="muted chat__empty">Aucun message pour l’instant. Dis bonjour !</p>
          ) : (
            <ol className="chat__list" aria-label={`Conversation avec ${name}`}>
              {messages.map((m) => {
                const mine = m.from_user_id === user.user_id;
                return (
                  <li key={m.id} className={`bubble${mine ? ' bubble--mine' : ''}`}>
                    <span className="visually-hidden">{mine ? 'Toi : ' : `${name} : `}</span>
                    <span className="bubble__body">{m.body}</span>
                    <time className="bubble__time" dateTime={m.created_at}>
                      {formatDateTime(m.created_at)}
                    </time>
                  </li>
                );
              })}
            </ol>
          )}
        </>
      )}
      <div ref={endRef} />

      <form className="chat__compose" onSubmit={(e) => void submit(e)}>
        {sendError && (
          <p className="note note--error chat__error" role="alert">
            {sendError}
          </p>
        )}
        {!stillFriends ? (
          <p className="muted chat__notice">Vous n’êtes plus amis : la conversation est en lecture seule.</p>
        ) : !online ? (
          <p className="muted chat__notice">Hors ligne : envoi impossible.</p>
        ) : (
          <div className="chat__row">
            <label className="visually-hidden" htmlFor="chat-input">
              Message à {name}
            </label>
            <input
              id="chat-input"
              className="field__input chat__input"
              placeholder={live ? 'Message' : 'Connexion au chat…'}
              autoComplete="off"
              enterKeyHint="send"
              maxLength={MAX_LENGTH}
              disabled={!live}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button type="submit" className="btn btn--primary chat__send" disabled={!live || sending || !draft.trim()}>
              {sending ? '…' : 'Envoyer'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
