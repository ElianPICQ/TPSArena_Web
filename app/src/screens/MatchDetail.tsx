import { useCallback } from 'react';
import { get } from '../lib/api';
import { mapName } from '../lib/labels';
import { formatDateTime, formatDuration, ordinal } from '../lib/format';
import { useResource } from '../lib/resource';
import { HREF } from '../lib/route';
import type { Match, User } from '../lib/types';
import { CachedNote, ErrorState, Loading } from '../components/Status';
import { BackIcon } from '../components/Icons';

interface Props {
  user: User;
  online: boolean;
  matchId: string;
}

export function MatchDetail({ user, online, matchId }: Props) {
  const load = useCallback(() => get<Match>(`/matches/${matchId}`), [matchId]);
  const { data, cachedAt, loading, error, reload } = useResource(user, online, `match.${matchId}`, load);

  return (
    <>
      <a className="back-link" href={HREF.history}>
        <BackIcon /> Historique
      </a>
      {!data ? (
        loading ? (
          <Loading />
        ) : (
          <ErrorState message={error ?? 'Erreur inattendue.'} onRetry={reload} />
        )
      ) : (
        <>
          <CachedNote cachedAt={cachedAt} loading={loading} />
          {error && <p className="note note--error">{error}</p>}
          <h1 className="screen-title">{mapName(data.map)}</h1>
          <p className="muted match-meta">
            {formatDateTime(data.ended_at)} · {formatDuration(data.started_at, data.ended_at)} · {data.players.length}{' '}
            {data.players.length > 1 ? 'joueurs' : 'joueur'}
          </p>
          <p className="muted match-meta">Les bots ne sont pas listés, mais comptent dans les places.</p>
          <div className="panel table-wrap">
            <table className="scoreboard">
              <thead>
                <tr>
                  <th scope="col">Place</th>
                  <th scope="col">Joueur</th>
                  <th scope="col" className="num">
                    <abbr title="Kills">K</abbr>
                  </th>
                  <th scope="col" className="num">
                    <abbr title="Morts">M</abbr>
                  </th>
                  <th scope="col" className="num">
                    XP
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.players.map((p, i) => {
                  const me = p.user_id === user.user_id;
                  return (
                    <tr key={p.user_id ?? `deleted-${i}`} className={me ? 'is-me' : undefined}>
                      <td>{ordinal(p.placement)}</td>
                      <td className="scoreboard__name">
                        {p.username ?? <span className="muted">{p.user_id ? 'Joueur inconnu' : 'Compte supprimé'}</span>}
                        {me && <span className="visually-hidden"> (toi)</span>}
                      </td>
                      <td className="num">{p.kills}</td>
                      <td className="num">{p.deaths}</td>
                      <td className="num">+{p.xp_gained}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
