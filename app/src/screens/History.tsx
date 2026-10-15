import { useCallback, useEffect, useState } from 'react';
import { get } from '../lib/api';
import { mapName } from '../lib/labels';
import { formatDateTime, ordinal } from '../lib/format';
import { useResource } from '../lib/resource';
import { HREF } from '../lib/route';
import type { MatchPage, PlayerMatch, User } from '../lib/types';
import { CachedNote, Empty, ErrorState, Loading } from '../components/Status';

const PAGE = 20;

interface Props {
  user: User;
  online: boolean;
}

export function History({ user, online }: Props) {
  const load = useCallback(() => get<MatchPage>(`/players/${user.user_id}/matches?limit=${PAGE}`), [user.user_id]);
  // Seule la première page est gardée pour le mode hors ligne.
  const first = useResource(user, online, 'history', load);
  const [more, setMore] = useState<PlayerMatch[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [moreState, setMoreState] = useState<{ loading: boolean; error: string | null }>({ loading: false, error: null });

  useEffect(() => {
    setMore([]);
    setCursor(first.data?.next_cursor ?? null);
  }, [first.data]);

  async function loadMore() {
    if (!cursor) return;
    setMoreState({ loading: true, error: null });
    try {
      const page = await get<MatchPage>(
        `/players/${user.user_id}/matches?limit=${PAGE}&before=${encodeURIComponent(cursor)}`,
      );
      setMore((m) => [...m, ...page.matches]);
      setCursor(page.next_cursor);
      setMoreState({ loading: false, error: null });
    } catch (e) {
      setMoreState({ loading: false, error: e instanceof Error ? e.message : 'Erreur inattendue.' });
    }
  }

  if (!first.data) {
    return first.loading ? (
      <Loading />
    ) : (
      <ErrorState message={first.error ?? 'Erreur inattendue.'} onRetry={first.reload} />
    );
  }

  const matches = [...first.data.matches, ...more];
  return (
    <>
      <CachedNote cachedAt={first.cachedAt} loading={first.loading} />
      {first.error && <p className="note note--error">{first.error}</p>}
      <h1 className="screen-title">Historique</h1>
      {matches.length === 0 ? (
        <Empty>Aucune partie terminée pour l’instant. Seules les parties sur un serveur dédié comptent.</Empty>
      ) : (
        <ul className="matches">
          {matches.map((m) => (
            <li key={m.match_id}>
              <MatchRow match={m} />
            </li>
          ))}
        </ul>
      )}
      {moreState.error && <p className="note note--error">{moreState.error}</p>}
      {cursor && online && first.cachedAt === null && (
        <button type="button" className="btn more-btn" onClick={() => void loadMore()} disabled={moreState.loading}>
          {moreState.loading ? 'Chargement…' : 'Parties plus anciennes'}
        </button>
      )}
    </>
  );
}

function MatchRow({ match }: { match: PlayerMatch }) {
  const win = match.placement === 1;
  return (
    <a className={`panel match-row${win ? ' match-row--win' : ''}`} href={HREF.match(match.match_id)}>
      <span className="match-row__place">
        <strong>{ordinal(match.placement)}</strong>
        <span className="muted">/ {match.player_count}</span>
      </span>
      <span className="match-row__body">
        <span className="match-row__map">{mapName(match.map)}</span>
        <span className="muted match-row__date">{formatDateTime(match.ended_at)}</span>
      </span>
      <span className="match-row__score">
        <span>
          <span className="accent-cyan">{match.kills}</span> K · <span className="accent-magenta">{match.deaths}</span> M
        </span>
        <span className="match-row__xp">+{match.xp_gained} XP</span>
      </span>
    </a>
  );
}
