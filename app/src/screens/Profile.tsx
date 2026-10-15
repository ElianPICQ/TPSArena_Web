import { useCallback } from 'react';
import { get } from '../lib/api';
import { achievementText } from '../lib/labels';
import { formatDate, formatNumber } from '../lib/format';
import { useResource } from '../lib/resource';
import { HREF } from '../lib/route';
import type { PlayerStats, Progression, User } from '../lib/types';
import { CachedNote, ErrorState, Loading } from '../components/Status';

interface Props {
  user: User;
  online: boolean;
}

interface ProfileData {
  stats: PlayerStats;
  progression: Progression;
}

export function Profile({ user, online }: Props) {
  const load = useCallback(async (): Promise<ProfileData> => {
    const [stats, progression] = await Promise.all([
      get<PlayerStats>(`/players/${user.user_id}/stats`),
      get<Progression>(`/progression/${user.user_id}`),
    ]);
    return { stats, progression };
  }, [user.user_id]);
  const { data, cachedAt, loading, error, reload } = useResource(user, online, 'profile', load);

  if (!data) return loading ? <Loading /> : <ErrorState message={error ?? 'Erreur inattendue.'} onRetry={reload} />;

  const { stats, progression } = data;
  // xp_to_next_level : XP de tout le niveau (de L à L + 1), pas ce qu'il reste à gagner.
  const levelSpan = progression.xp_to_next_level;
  const remaining = Math.max(0, levelSpan - progression.xp_in_level);
  const percent = levelSpan > 0 ? Math.min(100, (progression.xp_in_level / levelSpan) * 100) : 0;
  const unlocked = progression.achievements
    .filter((a) => a.unlocked_at)
    .sort((a, b) => Date.parse(b.unlocked_at!) - Date.parse(a.unlocked_at!));
  const latest = unlocked[0];
  const winRate = stats.matches_played ? Math.round((stats.wins / stats.matches_played) * 100) : 0;

  return (
    <>
      <CachedNote cachedAt={cachedAt} loading={loading} />
      {error && <p className="note note--error">{error}</p>}

      <section className="panel level" aria-labelledby="level-title">
        <div className="level__badge">
          <span className="level__label">Niveau</span>
          <span className="level__value" id="level-title">
            {progression.level}
          </span>
        </div>
        <div className="level__body">
          <p className="level__xp">
            <strong>{formatNumber(progression.xp_in_level)}</strong> / {formatNumber(levelSpan)} XP
          </p>
          <div
            className="xpbar"
            role="progressbar"
            aria-label={`Progression vers le niveau ${progression.level + 1}`}
            aria-valuemin={0}
            aria-valuemax={levelSpan}
            aria-valuenow={progression.xp_in_level}
          >
            <div className="xpbar__fill" style={{ width: `${percent}%` }} />
          </div>
          <p className="muted level__next">
            Encore {formatNumber(remaining)} XP pour le niveau {progression.level + 1} ·{' '}
            {formatNumber(progression.xp)} XP au total
          </p>
        </div>
      </section>

      <h2 className="screen-title">Statistiques</h2>
      {stats.matches_played === 0 && (
        <p className="note">Aucune partie terminée pour l’instant : lance une partie en ligne pour remplir ton profil.</p>
      )}
      <dl className="tiles">
        <Tile label="Parties" value={formatNumber(stats.matches_played)} />
        <Tile label="Victoires" value={formatNumber(stats.wins)} accent="yellow" />
        <Tile label="Kills" value={formatNumber(stats.kills)} accent="cyan" />
        <Tile label="Morts" value={formatNumber(stats.deaths)} accent="magenta" />
        <Tile label="Ratio K/D" value={stats.kd_ratio.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} />
        <Tile label="Taux de victoire" value={`${winRate} %`} />
      </dl>

      <a className="panel panel--light summary-link" href={HREF.achievements}>
        <span>
          <span className="summary-link__title">
            Succès : {unlocked.length} / {progression.achievements.length}
          </span>
          {latest && (
            <span className="muted summary-link__text">
              Dernier : {achievementText(latest.id, latest.name, latest.description).name}, le{' '}
              {formatDate(latest.unlocked_at!)}
            </span>
          )}
        </span>
        <span aria-hidden="true" className="summary-link__arrow">
          ›
        </span>
      </a>
    </>
  );
}

function Tile({ label, value, accent }: { label: string; value: string; accent?: 'cyan' | 'magenta' | 'yellow' }) {
  return (
    <div className={`panel tile${accent ? ` tile--${accent}` : ''}`}>
      <dt className="tile__label">{label}</dt>
      <dd className="tile__value">{value}</dd>
    </div>
  );
}
