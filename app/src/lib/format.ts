const number = new Intl.NumberFormat('fr-FR');
const date = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const dateTime = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

export const formatNumber = (n: number) => number.format(n);
export const formatDate = (iso: string) => date.format(new Date(iso));
export const formatDateTime = (iso: string | number) => dateTime.format(new Date(iso)).replace(' ', ' à ');

/** 1er, 2e, 3e… */
export const ordinal = (n: number) => (n === 1 ? '1er' : `${n}e`);

export function formatDuration(startIso: string, endIso: string): string {
  const seconds = Math.max(0, Math.round((Date.parse(endIso) - Date.parse(startIso)) / 1000));
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m} min ${String(s).padStart(2, '0')} s`;
}
