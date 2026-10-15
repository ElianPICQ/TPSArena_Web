import { useCallback } from 'react';
import { get } from '../lib/api';
import { achievementText } from '../lib/labels';
import { formatDate } from '../lib/format';
import { useResource } from '../lib/resource';
import type { Progression, User } from '../lib/types';
import { CachedNote, ErrorState, Loading } from '../components/Status';
import { CheckIcon, LockIcon } from '../components/Icons';

interface Props {
  user: User;
  online: boolean;
}

export function Achievements({ user, online }: Props) {
  const load = useCallback(() => get<Progression>(`/progression/${user.user_id}`), [user.user_id]);
  const { data, cachedAt, loading, error, reload } = useResource(user, online, 'progression', load);

  if (!data) return loading ? <Loading /> : <ErrorState message={error ?? 'Erreur inattendue.'} onRetry={reload} />;

  // Débloqués d'abord (du plus récent au plus ancien), puis verrouillés dans l'ordre de l'API.
  const unlocked = data.achievements
    .filter((a) => a.unlocked_at)
    .sort((a, b) => Date.parse(b.unlocked_at!) - Date.parse(a.unlocked_at!));
  const locked = data.achievements.filter((a) => !a.unlocked_at);

  return (
    <>
      <CachedNote cachedAt={cachedAt} loading={loading} />
      {error && <p className="note note--error">{error}</p>}
      <h1 className="screen-title">
        Succès{' '}
        <span className="muted screen-title__count">
          {unlocked.length} / {data.achievements.length}
        </span>
      </h1>
      <ul className="achievements">
        {[...unlocked, ...locked].map((a) => {
          const text = achievementText(a.id, a.name, a.description);
          return (
            <li key={a.id} className={`panel achievement${a.unlocked_at ? '' : ' achievement--locked'}`}>
              <span className="achievement__icon">{a.unlocked_at ? <CheckIcon /> : <LockIcon />}</span>
              <span className="achievement__body">
                <span className="achievement__name">{text.name}</span>
                <span className="achievement__text">{text.description}</span>
                <span className="achievement__date">
                  {a.unlocked_at ? `Débloqué le ${formatDate(a.unlocked_at)}` : 'Verrouillé'}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </>
  );
}
