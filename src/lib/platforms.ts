export type Platform = 'windows' | 'linux' | 'macos';

export interface PlatformInfo {
  id: Platform;
  label: string;
  expectedFile: string;
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
    expectedFile: 'TPSArena.exe',
  },
  {
    id: 'linux',
    label: 'Linux',
    expectedFile: 'TPSArena.x86_64',
  },
  {
    id: 'macos',
    label: 'macOS',
    expectedFile: 'TPSArena.zip',
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
