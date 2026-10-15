import { useCallback, useEffect } from 'react';
import { get } from './api';
import { realtime, useRealtime } from './realtime';
import { useResource, type Resource } from './resource';
import type { FriendsListing, User } from './types';

/**
 * Liste d'amis et demandes, chargée une fois pour toute l'app (badge de l'onglet, pseudos des
 * notifications, écrans Amis et Chat) et rechargée à chaque notification d'amitié du WebSocket.
 */
export function useFriendsListing(user: User, online: boolean): Resource<FriendsListing> {
  const load = useCallback(() => get<FriendsListing>('/friends'), []);
  const listing = useResource(user, online, 'friends', load);
  const { friendsVersion } = useRealtime();
  const { reload, data } = listing;

  useEffect(() => {
    if (friendsVersion > 0) reload();
  }, [friendsVersion, reload]);

  useEffect(() => {
    if (!data) return;
    const names: Record<string, string> = {};
    for (const f of [...data.friends, ...data.incoming, ...data.outgoing]) if (f.username) names[f.user_id] = f.username;
    realtime.setFriends(names, data.incoming.length);
  }, [data]);

  return listing;
}
