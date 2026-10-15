import { useCallback, useEffect, useState } from 'react';
import { logout, refreshSession, setSessionExpiredHandler } from './lib/api';
import { clearCache, readLastUser, writeLastUser } from './lib/cache';
import { useFriendsListing } from './lib/friends';
import { realtime } from './lib/realtime';
import type { User } from './lib/types';
import { useRoute } from './lib/route';
import { Header, TabBar, Toasts } from './components/Chrome';
import { Loading } from './components/Status';
import { Login } from './screens/Login';
import { Profile } from './screens/Profile';
import { Achievements } from './screens/Achievements';
import { History } from './screens/History';
import { MatchDetail } from './screens/MatchDetail';
import { Leaderboards } from './screens/Leaderboards';
import { Friends } from './screens/Friends';
import { Chat } from './screens/Chat';

type AuthState =
  | { status: 'checking' }
  | { status: 'anonymous'; message?: string }
  // offline : serveur injoignable au démarrage, l'app montre les données gardées du dernier joueur.
  | { status: 'online' | 'offline'; user: User };

export function App() {
  const [auth, setAuth] = useState<AuthState>({ status: 'checking' });

  const resume = useCallback(async () => {
    try {
      const user = await refreshSession();
      if (user) {
        writeLastUser(user);
        setAuth({ status: 'online', user });
      } else {
        setAuth({ status: 'anonymous' });
      }
    } catch (error) {
      const last = readLastUser();
      if (last) setAuth({ status: 'offline', user: last });
      else setAuth({ status: 'anonymous', message: error instanceof Error ? error.message : undefined });
    }
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      realtime.stop();
      setAuth({ status: 'anonymous', message: 'Ta session a expiré. Reconnecte-toi.' });
    });
    void resume();
  }, [resume]);

  // Hors ligne au démarrage : nouvel essai dès que le réseau revient.
  useEffect(() => {
    if (auth.status !== 'offline') return;
    const retry = () => void resume();
    window.addEventListener('online', retry);
    return () => window.removeEventListener('online', retry);
  }, [auth.status, resume]);

  const onLogin = useCallback((user: User) => {
    const last = readLastUser();
    if (last && last.user_id !== user.user_id) clearCache();
    writeLastUser(user);
    setAuth({ status: 'online', user });
    window.location.hash = '#/';
  }, []);

  const onLogout = useCallback(async () => {
    realtime.stop();
    await logout();
    clearCache();
    setAuth({ status: 'anonymous' });
  }, []);

  if (auth.status === 'checking') {
    return (
      <Shell>
        <Loading label="Connexion…" />
      </Shell>
    );
  }
  if (auth.status === 'anonymous') {
    return (
      <Shell>
        <Login onLogin={onLogin} notice={auth.message} />
      </Shell>
    );
  }

  return (
    <Shell>
      <SignedIn
        user={auth.user}
        online={auth.status === 'online'}
        onRetry={() => void resume()}
        onLogout={() => void onLogout()}
      />
    </Shell>
  );
}

interface SignedInProps {
  user: User;
  online: boolean;
  onRetry: () => void;
  onLogout: () => void;
}

function SignedIn({ user, online, onRetry, onLogout }: SignedInProps) {
  const route = useRoute();
  const friends = useFriendsListing(user, online);

  // WebSocket du chat et de la présence : ouvert tant que le joueur est connecté et en ligne.
  useEffect(() => {
    if (!online) return;
    realtime.start(user);
    const wake = () => {
      if (document.visibilityState === 'visible') realtime.wake();
    };
    document.addEventListener('visibilitychange', wake);
    window.addEventListener('online', wake);
    return () => {
      document.removeEventListener('visibilitychange', wake);
      window.removeEventListener('online', wake);
    };
  }, [user, online]);

  const props = { user, online };
  let screen;
  switch (route.name) {
    case 'achievements':
      screen = <Achievements {...props} />;
      break;
    case 'history':
      screen = <History {...props} />;
      break;
    case 'match':
      screen = <MatchDetail {...props} matchId={route.id} />;
      break;
    case 'leaderboards':
      screen = <Leaderboards {...props} />;
      break;
    case 'friends':
      screen = <Friends {...props} friends={friends} />;
      break;
    case 'chat':
      screen = <Chat {...props} friendId={route.id} friends={friends} />;
      break;
    default:
      screen = <Profile {...props} />;
  }

  const tab = route.name === 'match' ? 'history' : route.name === 'chat' ? 'friends' : route.name;
  return (
    <>
      <Header user={user} offline={!online} onRetry={onRetry} onLogout={onLogout} />
      <main id="contenu" className={`app-main${route.name === 'chat' ? ' app-main--chat' : ''}`} tabIndex={-1}>
        {screen}
      </main>
      <Toasts />
      <TabBar active={tab} />
    </>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app">
      <div className="neon-bg" aria-hidden="true">
        <div className="neon-bg__fallback" />
      </div>
      {children}
    </div>
  );
}
