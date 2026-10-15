// Textes affichés : messages d'erreur (par code `error` de l'API, comme ApiClient.ERROR_MESSAGES
// du client Godot), noms des maps (MapCatalog du jeu) et succès (stats/progression.py, en anglais
// côté API).

const ERROR_MESSAGES: Record<string, string> = {
  unreachable: 'Impossible de joindre le serveur. Vérifie ta connexion au réseau.',
  bad_gateway: 'Le serveur a renvoyé une réponse invalide. Réessaie dans un instant.',
  web_bff_unavailable: 'Le service de l’app est indisponible. Réessaie dans un instant.',
  auth_unavailable: 'Le service des comptes est indisponible. Réessaie dans un instant.',
  stats_unavailable: 'Les statistiques sont indisponibles. Réessaie dans un instant.',
  rate_limited: 'Trop de tentatives. Patiente un peu avant de réessayer.',
  validation: 'Certaines informations sont invalides.',
  invalid_credentials: 'Identifiant ou mot de passe incorrect.',
  email_not_verified: 'Vérifie d’abord ton adresse e-mail avec le code reçu, depuis le jeu.',
  invalid_token: 'Ta session a expiré. Reconnecte-toi.',
  token_expired: 'Ta session a expiré. Reconnecte-toi.',
  not_authenticated: 'Ta session a expiré. Reconnecte-toi.',
  invalid_refresh_token: 'Ta session a expiré. Reconnecte-toi.',
  match_not_found: 'Cette partie n’existe pas.',
  social_unavailable: 'Le service des amis est indisponible. Réessaie dans un instant.',
  realtime_unavailable: 'Le chat est indisponible. Réessaie dans un instant.',
  user_not_found: 'Ce joueur n’existe pas.',
  cannot_friend_self: 'Tu ne peux pas t’ajouter toi-même.',
  already_friends: 'Vous êtes déjà amis.',
  request_exists: 'Tu as déjà envoyé une demande à ce joueur.',
  request_not_found: 'Cette demande d’ami n’existe plus.',
  too_many_friends: 'Nombre maximal d’amis atteint.',
  not_friends: 'Vous n’êtes pas amis.',
  invalid_cursor: 'Impossible de charger la suite de l’historique. Recharge la page.',
};

export function messageFor(code: string, status?: number): string {
  return ERROR_MESSAGES[code] ?? (status ? `Erreur inattendue (code ${status}).` : 'Erreur inattendue.');
}

const MAPS: Record<string, string> = {
  'neo-edo': 'NEO-EDO',
  'hikari-mall': 'Hikari Mall',
};

export function mapName(id: string): string {
  return MAPS[id] ?? id;
}

const ACHIEVEMENTS: Record<string, { name: string; description: string }> = {
  first_match: { name: 'Bienvenue dans l’arène', description: 'Jouer sa première partie.' },
  first_win: { name: 'Premier bain de sang', description: 'Gagner une partie.' },
  wins_10: { name: 'Prétendant', description: 'Gagner 10 parties.' },
  kills_100: { name: 'Tireur d’élite', description: 'Faire 100 kills.' },
  kills_1000: { name: 'Légende', description: 'Faire 1000 kills.' },
  match_10_kills: { name: 'Carnage', description: 'Faire 10 kills dans une seule partie.' },
  flawless: { name: 'Intouchable', description: 'Gagner une partie sans mourir.' },
};

/** Nom et description en français ; ceux de l'API pour un succès ajouté depuis. */
export function achievementText(id: string, name: string, description: string) {
  return ACHIEVEMENTS[id] ?? { name, description };
}

export const BOARD_LABELS = {
  xp: { tab: 'XP', unit: 'XP' },
  wins: { tab: 'Victoires', unit: 'victoires' },
  kills: { tab: 'Kills', unit: 'kills' },
} as const;
