/**
 * Copie un texte dans le presse-papiers.
 * Le site est servi en HTTP sur le réseau local : ce n'est pas un « contexte sécurisé »,
 * donc navigator.clipboard n'existe pas. On passe alors par une zone de texte cachée.
 */
export async function copyText(text: string): Promise<boolean> {
  if (window.isSecureContext && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // On essaie la méthode de secours ci-dessous.
    }
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.className = 'visually-hidden';
  document.body.appendChild(area);
  const previous = document.activeElement as HTMLElement | null;
  area.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  area.remove();
  previous?.focus({ preventScroll: true });
  return ok;
}
