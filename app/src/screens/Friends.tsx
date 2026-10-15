import { useState, type FormEvent } from 'react';
import { get, send } from '../lib/api';
import { presenceLabel, useRealtime } from '../lib/realtime';
import type { Resource } from '../lib/resource';
import { HREF } from '../lib/route';
import type { FriendRequestResult, FriendsListing, Presence, PublicUser, User } from '../lib/types';
import { CachedNote, Empty, ErrorState, Loading } from '../components/Status';

interface Props {
  user: User;
  online: boolean;
  friends: Resource<FriendsListing>;
}

// Ordre d'affichage : en partie, dans le menu, sur mobile, hors ligne ; puis par pseudo.
const RANK = { match: 0, online: 1, mobile: 2, offline: 3 } as const;

export function Friends({ user, online, friends }: Props) {
  const rt = useRealtime();
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function act(key: string, action: () => Promise<unknown>) {
    setBusy(key);
    setActionError(null);
    try {
      await action();
      friends.reload();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Erreur inattendue.');
    } finally {
      setBusy(null);
    }
  }

  const { data, cachedAt, loading, error, reload } = friends;
  if (!data) return loading ? <Loading /> : <ErrorState message={error ?? 'Erreur inattendue.'} onRetry={reload} />;

  const sorted = [...data.friends].sort((a, b) => {
    const pa = RANK[presenceLabel(rt.presence[a.user_id]).tone];
    const pb = RANK[presenceLabel(rt.presence[b.user_id]).tone];
    return pa - pb || (a.username ?? '').localeCompare(b.username ?? '', 'fr');
  });
  const known = new Set([...data.friends, ...data.incoming, ...data.outgoing].map((f) => f.user_id));
  const live = online && rt.status === 'connected';

  return (
    <>
      <CachedNote cachedAt={cachedAt} loading={loading} />
      {error && <p className="note note--error">{error}</p>}
      <h1 className="screen-title">Amis</h1>
      {online && !live && (
        <p className="muted match-meta" role="status">
          {rt.status === 'disconnected' ? 'Chat déconnecté, nouvelle tentative…' : 'Connexion au chat…'}
        </p>
      )}
      {actionError && (
        <p className="note note--error" role="alert">
          {actionError}
        </p>
      )}

      {online && (
        <AddFriend
          me={user.user_id}
          known={known}
          friendIds={new Set(data.friends.map((f) => f.user_id))}
          onAdd={(target) =>
            act(`add-${target.user_id}`, async () => {
              const result = await send<FriendRequestResult>('POST', '/friends/requests', { user_id: target.user_id });
              return result;
            })
          }
          busy={busy}
        />
      )}

      {data.incoming.length > 0 && (
        <section aria-labelledby="incoming-title">
          <h2 className="subhead subhead--flush friends__title" id="incoming-title">
            Demandes reçues <span className="badge">{data.incoming.length}</span>
          </h2>
          <ul className="friends">
            {data.incoming.map((r) => (
              <li key={r.request_id} className="panel friend-row">
                <span className="friend-row__name">{r.username ?? 'Joueur inconnu'}</span>
                <span className="friend-row__actions">
                  <button
                    type="button"
                    className="btn btn--small btn--primary"
                    disabled={!online || busy !== null}
                    onClick={() => act(r.request_id, () => send('POST', `/friends/requests/${r.request_id}/accept`))}
                  >
                    Accepter
                  </button>
                  <button
                    type="button"
                    className="btn btn--small"
                    disabled={!online || busy !== null}
                    onClick={() => act(r.request_id, () => send('POST', `/friends/requests/${r.request_id}/decline`))}
                  >
                    Refuser
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="friends-title">
        <h2 className="subhead subhead--flush friends__title" id="friends-title">
          Mes amis <span className="muted">{data.friends.length}</span>
        </h2>
        {sorted.length === 0 ? (
          <Empty>Pas encore d’amis. Cherche un pseudo ci-dessus pour envoyer une demande.</Empty>
        ) : (
          <ul className="friends">
            {sorted.map((f) => (
              <li key={f.user_id}>
                <a className="panel friend-row friend-row--link" href={HREF.chat(f.user_id)}>
                  <PresenceDot presence={live ? rt.presence[f.user_id] : undefined} known={live} />
                  <span className="friend-row__body">
                    <span className="friend-row__name">{f.username ?? 'Joueur inconnu'}</span>
                    <span className="friend-row__status">
                      {live ? presenceLabel(rt.presence[f.user_id]).text : 'Présence indisponible'}
                    </span>
                  </span>
                  {rt.unread[f.user_id] ? (
                    <span className="badge" aria-label={`${rt.unread[f.user_id]} message(s) non lu(s)`}>
                      {rt.unread[f.user_id]}
                    </span>
                  ) : (
                    <span aria-hidden="true" className="summary-link__arrow">
                      ›
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      {data.outgoing.length > 0 && (
        <section aria-labelledby="outgoing-title">
          <h2 className="subhead subhead--flush friends__title" id="outgoing-title">
            Demandes envoyées
          </h2>
          <ul className="friends">
            {data.outgoing.map((r) => (
              <li key={r.request_id} className="panel friend-row">
                <span className="friend-row__body">
                  <span className="friend-row__name">{r.username ?? 'Joueur inconnu'}</span>
                  <span className="friend-row__status">En attente de réponse</span>
                </span>
                <button
                  type="button"
                  className="btn btn--small"
                  disabled={!online || busy !== null}
                  onClick={() => act(r.request_id, () => send('POST', `/friends/requests/${r.request_id}/decline`))}
                >
                  Annuler
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

export function PresenceDot({ presence, known = true }: { presence: Presence | undefined; known?: boolean }) {
  const tone = known ? presenceLabel(presence).tone : 'unknown';
  return <span className={`presence-dot presence-dot--${tone}`} aria-hidden="true" />;
}

interface AddFriendProps {
  me: string;
  known: Set<string>;
  friendIds: Set<string>;
  onAdd: (user: PublicUser) => Promise<void>;
  busy: string | null;
}

function AddFriend({ me, known, friendIds, onAdd, busy }: AddFriendProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PublicUser[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search(event: FormEvent) {
    event.preventDefault();
    const name = query.trim();
    if (!name) return;
    setSearching(true);
    setError(null);
    try {
      const { users } = await get<{ users: PublicUser[] }>(`/users/search?username=${encodeURIComponent(name)}`);
      setResults(users.filter((u) => u.user_id !== me));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inattendue.');
    } finally {
      setSearching(false);
    }
  }

  return (
    <section className="panel panel--light add-friend" aria-labelledby="add-title">
      <h2 className="add-friend__title" id="add-title">
        Ajouter un ami
      </h2>
      <form className="add-friend__form" onSubmit={(e) => void search(e)} role="search">
        <label className="visually-hidden" htmlFor="friend-search">
          Pseudo
        </label>
        <input
          id="friend-search"
          className="field__input add-friend__input"
          placeholder="Pseudo"
          autoCapitalize="none"
          autoComplete="off"
          spellCheck={false}
          maxLength={20}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="btn" disabled={searching || !query.trim()}>
          {searching ? '…' : 'Chercher'}
        </button>
      </form>
      {error && <p className="note note--error">{error}</p>}
      {results !== null &&
        (results.length === 0 ? (
          <p className="muted add-friend__empty">Aucun joueur trouvé.</p>
        ) : (
          <ul className="add-friend__results">
            {results.map((u) => (
              <li key={u.user_id} className="friend-row">
                <span className="friend-row__name">{u.username}</span>
                {friendIds.has(u.user_id) ? (
                  <span className="muted">Déjà ami</span>
                ) : known.has(u.user_id) ? (
                  <span className="muted">Demande en cours</span>
                ) : (
                  <button
                    type="button"
                    className="btn btn--small btn--primary"
                    disabled={busy !== null}
                    onClick={() => void onAdd(u)}
                  >
                    {busy === `add-${u.user_id}` ? '…' : 'Ajouter'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        ))}
    </section>
  );
}
