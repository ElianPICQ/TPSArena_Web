import { useEffect, useState } from 'react';
import type { User } from '../lib/types';
import { HREF } from '../lib/route';
import { realtime, useRealtime } from '../lib/realtime';
import { FriendsIcon, HistoryIcon, InstallIcon, LogoutIcon, PodiumIcon, ProfileIcon, TrophyIcon } from './Icons';

// Événement de Chrome/Android qui permet d'afficher notre propre bouton « Installer ».
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function useInstallPrompt() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => setPrompt(null);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);
  if (!prompt) return null;
  return async () => {
    await prompt.prompt();
    await prompt.userChoice;
    setPrompt(null);
  };
}

interface HeaderProps {
  user: User;
  offline: boolean;
  onRetry: () => void;
  onLogout: () => void;
}

export function Header({ user, offline, onRetry, onLogout }: HeaderProps) {
  const install = useInstallPrompt();
  return (
    <header className="app-header">
      <a className="skip-link" href="#contenu">
        Aller au contenu
      </a>
      <div className="app-header__inner">
        <a className="nav__brand app-header__brand" href={HREF.profile} aria-label="TPS Arena, mon profil">
          TPS <span>ARENA</span>
        </a>
        <p className="app-header__user" title={user.username}>
          {user.username}
        </p>
        {install && (
          <button type="button" className="icon-btn" onClick={() => void install()} aria-label="Installer l’app">
            <InstallIcon />
          </button>
        )}
        <button type="button" className="icon-btn" onClick={onLogout} aria-label="Se déconnecter">
          <LogoutIcon />
        </button>
      </div>
      {offline && (
        <div className="app-header__offline" role="status">
          <span>Hors ligne : affichage des dernières données gardées.</span>
          <button type="button" className="link-btn" onClick={onRetry}>
            Réessayer
          </button>
        </div>
      )}
    </header>
  );
}

const TABS = [
  { name: 'profile', href: HREF.profile, label: 'Profil', Icon: ProfileIcon },
  { name: 'achievements', href: HREF.achievements, label: 'Succès', Icon: TrophyIcon },
  { name: 'history', href: HREF.history, label: 'Matchs', Icon: HistoryIcon },
  { name: 'leaderboards', href: HREF.leaderboards, label: 'Classement', Icon: PodiumIcon },
  { name: 'friends', href: HREF.friends, label: 'Amis', Icon: FriendsIcon },
] as const;

export function TabBar({ active }: { active: string }) {
  const { unread, incoming } = useRealtime();
  const unreadTotal = Object.values(unread).reduce((sum, n) => sum + n, 0);
  const badge = unreadTotal + incoming;
  return (
    <nav className="tabbar" aria-label="Écrans">
      <ul>
        {TABS.map(({ name, href, label, Icon }) => (
          <li key={name}>
            <a href={href} className="tabbar__link" aria-current={active === name ? 'page' : undefined}>
              <span className="tabbar__icon-wrap">
                <Icon className="tabbar__icon" />
                {name === 'friends' && badge > 0 && (
                  <span className="badge tabbar__badge" aria-label={`${badge} nouveauté(s)`}>
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </span>
              <span>{label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Notifications du WebSocket (message, demande d'ami, succès…), en bas au-dessus des onglets. */
export function Toasts() {
  const { toasts } = useRealtime();
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) =>
        t.href ? (
          <a key={t.id} className="toast" href={t.href} onClick={() => realtime.dismissToast(t.id)}>
            {t.text}
          </a>
        ) : (
          <p key={t.id} className="toast">
            {t.text}
          </p>
        ),
      )}
    </div>
  );
}
