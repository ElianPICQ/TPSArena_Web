import { useEffect, useState } from 'react';

// Navigation par ancre (#/matchs…) : toutes les vues restent sur /app/, la seule page que le
// service worker doit connaître.
export type Route =
  | { name: 'profile' }
  | { name: 'achievements' }
  | { name: 'history' }
  | { name: 'match'; id: string }
  | { name: 'leaderboards' }
  | { name: 'friends' }
  | { name: 'chat'; id: string };

export const HREF = {
  profile: '#/',
  achievements: '#/succes',
  history: '#/matchs',
  leaderboards: '#/classements',
  match: (id: string) => `#/matchs/${id}`,
  friends: '#/amis',
  chat: (id: string) => `#/amis/${id}`,
};

function parse(hash: string): Route {
  const path = hash.replace(/^#/, '');
  const match = /^\/matchs\/([0-9a-f-]{36})$/i.exec(path);
  if (match) return { name: 'match', id: match[1] };
  const chat = /^\/amis\/([0-9a-f-]{36})$/i.exec(path);
  if (chat) return { name: 'chat', id: chat[1].toLowerCase() };
  if (path === '/amis') return { name: 'friends' };
  if (path === '/succes') return { name: 'achievements' };
  if (path === '/matchs') return { name: 'history' };
  if (path === '/classements') return { name: 'leaderboards' };
  return { name: 'profile' };
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parse(window.location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parse(window.location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
