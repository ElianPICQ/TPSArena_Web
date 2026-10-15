// Réponses du web-bff (backend/services/web-bff), qui reprend celles de Stats en ajoutant
// les pseudos venus d'Auth.

export interface User {
  user_id: string;
  username: string;
}

export interface Session {
  access_token: string;
  expires_in: number;
  user: User;
}

export interface PlayerStats {
  user_id: string;
  matches_played: number;
  wins: number;
  kills: number;
  deaths: number;
  kd_ratio: number;
  level: number;
  xp: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked_at: string | null;
}

export interface Progression {
  user_id: string;
  level: number;
  xp: number;
  xp_in_level: number;
  xp_to_next_level: number; // XP du niveau entier (de level à level + 1)
  achievements: Achievement[];
}

export interface PlayerMatch {
  match_id: string;
  map: string;
  started_at: string;
  ended_at: string;
  kills: number;
  deaths: number;
  placement: number;
  player_count: number;
  xp_gained: number;
}

export interface MatchPage {
  matches: PlayerMatch[];
  next_cursor: string | null;
}

export interface MatchPlayer {
  user_id: string | null; // null : compte supprimé
  username: string | null;
  kills: number;
  deaths: number;
  placement: number;
  xp_gained: number;
}

export interface Match {
  match_id: string;
  map: string;
  started_at: string;
  ended_at: string;
  players: MatchPlayer[];
}

export type BoardType = 'xp' | 'wins' | 'kills';

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string | null;
  value: number;
}

export interface Leaderboard {
  type: BoardType;
  total_players: number;
  entries: LeaderboardEntry[];
}

export interface LeaderboardAround extends Leaderboard {
  player_rank: number | null; // null : aucune partie terminée
}

// --- Amis (Social, pseudos ajoutés par le web-bff) et chat (Real-time) ---

export interface Friend {
  user_id: string;
  since: string;
  username: string | null;
}

export interface FriendRequest {
  request_id: string;
  user_id: string; // l'autre joueur
  created_at: string;
  username: string | null;
}

export interface FriendsListing {
  friends: Friend[];
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
}

export interface FriendRequestResult {
  status: 'pending' | 'accepted';
  request_id: string | null;
}

export interface PublicUser {
  user_id: string;
  username: string;
}

export type Activity = 'menu' | 'in_match' | 'mobile';

export interface Presence {
  user_id: string;
  status: 'online' | 'offline';
  activity: Activity | null;
}

export interface FriendMessage {
  id: string;
  from_user_id: string;
  to_user_id: string;
  body: string;
  created_at: string;
}

export interface MessagePage {
  messages: FriendMessage[]; // du plus récent au plus ancien
  next_cursor: string | null;
}
