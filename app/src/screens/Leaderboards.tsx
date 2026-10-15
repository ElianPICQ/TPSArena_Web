import { useCallback, useState } from 'react';
import { get } from '../lib/api';
import { BOARD_LABELS } from '../lib/labels';
import { formatNumber } from '../lib/format';
import { useResource } from '../lib/resource';
import type { BoardType, Leaderboard, LeaderboardAround, User } from '../lib/types';
import { CachedNote, Empty, ErrorState, Loading } from '../components/Status';

const TYPES: BoardType[] = ['xp', 'wins', 'kills'];
type View = 'around' | 'top';

interface Props {
  user: User;
  online: boolean;
}

export function Leaderboards({ user, online }: Props) {
  const [type, setType] = useState<BoardType>('xp');
  const [view, setView] = useState<View>('around');

  const load = useCallback(
    (): Promise<Leaderboard | LeaderboardAround> =>
      view === 'top'
        ? get<Leaderboard>(`/leaderboards/${type}?limit=50`)
        : get<LeaderboardAround>(`/leaderboards/${type}/around/${user.user_id}?radius=5`),
    [type, view, user.user_id],
  );
  const { data, cachedAt, loading, error, reload } = useResource(user, online, `board.${type}.${view}`, load);

  return (
    <>
      <h1 className="screen-title">Classements</h1>
      <div className="segmented" role="group" aria-label="Classement">
        {TYPES.map((t) => (
          <button key={t} type="button" aria-pressed={type === t} onClick={() => setType(t)}>
            {BOARD_LABELS[t].tab}
          </button>
        ))}
      </div>
      <div className="segmented segmented--small" role="group" aria-label="Affichage">
        <button type="button" aria-pressed={view === 'around'} onClick={() => setView('around')}>
          Autour de moi
        </button>
        <button type="button" aria-pressed={view === 'top'} onClick={() => setView('top')}>
          Top 50
        </button>
      </div>

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
          <Board board={data} type={type} view={view} me={user.user_id} />
        </>
      )}
    </>
  );
}

function Board({ board, type, view, me }: { board: Leaderboard | LeaderboardAround; type: BoardType; view: View; me: string }) {
  const unit = BOARD_LABELS[type].unit;
  if (view === 'around' && 'player_rank' in board && board.player_rank === null) {
    return <Empty>Termine une partie en ligne pour apparaître au classement.</Empty>;
  }
  if (board.entries.length === 0) return <Empty>Personne n’est encore classé.</Empty>;
  return (
    <>
      <p className="muted match-meta">
        {'player_rank' in board && board.player_rank !== null
          ? `Tu es ${board.player_rank === 1 ? '1er' : `${board.player_rank}e`} sur ${formatNumber(board.total_players)} joueurs.`
          : `${formatNumber(board.total_players)} joueurs classés.`}
      </p>
      <ol className="board">
        {board.entries.map((e) => (
          <li key={e.user_id} className={`board__row${e.user_id === me ? ' is-me' : ''}${e.rank <= 3 ? ` board__row--top${e.rank}` : ''}`}>
            <span className="board__rank">{e.rank}</span>
            <span className="board__name">
              {e.username ?? <span className="muted">Joueur inconnu</span>}
              {e.user_id === me && <span className="board__me"> (toi)</span>}
            </span>
            <span className="board__value">
              {formatNumber(e.value)} <span className="muted">{unit}</span>
            </span>
          </li>
        ))}
      </ol>
    </>
  );
}
