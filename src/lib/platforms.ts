export type Platform = 'windows' | 'linux' | 'macos';

export interface PlatformInfo {
  id: Platform;
  label: string;
  expectedFile: string;
  /** Commande qui affiche le SHA-256 du fichier téléchargé, à lancer dans son dossier. */
  verifyCommand: (file: string) => string;
  verifyShell: string;
}

/** Chemin PowerShell entre apostrophes (une apostrophe s'y écrit en double). */
function psArg(file: string): string {
  const path = `.\\${file}`;
  return /^[\w.\\+-]+$/.test(path) ? path : `'${path.replace(/'/g, "''")}'`;
}

/** Nom de fichier tel qu'il doit être tapé dans un terminal (entre guillemets si besoin). */
export function shellArg(file: string): string {
  if (/^[\w.+-]+$/.test(file)) return file;
  return `'${file.replace(/'/g, `'\\''`)}'`;
}

export const PLATFORMS: PlatformInfo[] = [
  {
    id: 'windows',
    label: 'Windows',
    expectedFile: 'ArenaTPS.exe',
    verifyCommand: (file) => `Get-FileHash ${psArg(file)} -Algorithm SHA256`,
    verifyShell: 'PowerShell',
  },
  {
    id: 'linux',
    label: 'Linux',
    expectedFile: 'ArenaTPS.x86_64',
    verifyCommand: (file) => `sha256sum ${shellArg(file)}`,
    verifyShell: 'Terminal',
  },
  {
    id: 'macos',
    label: 'macOS',
    expectedFile: 'ArenaTPS.zip',
    verifyCommand: (file) => `shasum -a 256 ${shellArg(file)}`,
    verifyShell: 'Terminal',
  },
];

export function platformInfo(id: Platform): PlatformInfo {
  return PLATFORMS.find((p) => p.id === id)!;
}

interface UADataLike {
  platform?: string;
}

/** Système du visiteur, ou null s'il n'y a pas de build pour lui (mobile, ChromeOS…). */
export function detectPlatform(): Platform | null {
  if (typeof navigator === 'undefined') return null;
  const uaData = (navigator as Navigator & { userAgentData?: UADataLike }).userAgentData;
  const hint = uaData?.platform?.toLowerCase() ?? '';
  if (hint) {
    if (hint.includes('windows')) return 'windows';
    if (hint.includes('mac')) return 'macos';
    if (hint === 'linux') return 'linux';
    return null;
  }
  const ua = navigator.userAgent;
  if (/android|iphone|ipad|ipod|cros/i.test(ua)) return null;
  if (/windows/i.test(ua)) return 'windows';
  if (/macintosh|mac os x/i.test(ua)) {
    // Un iPad récent se présente comme un Mac : on le reconnaît à l'écran tactile.
    return navigator.maxTouchPoints > 1 ? null : 'macos';
  }
  if (/linux|x11/i.test(ua)) return 'linux';
  return null;
}
