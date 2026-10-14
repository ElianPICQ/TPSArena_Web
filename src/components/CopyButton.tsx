import { useEffect, useRef, useState } from 'react';
import { copyText } from '../lib/clipboard';
import { CheckIcon, CopyIcon } from './Icons';

interface Props {
  text: string;
  /** Ce qui est copié, pour les lecteurs d'écran (« la commande », « l'empreinte »…). */
  what: string;
}

export function CopyButton({ text, what }: Props) {
  const [state, setState] = useState<'idle' | 'ok' | 'fail'>('idle');
  const timer = useRef<number>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onClick = async () => {
    const ok = await copyText(text);
    setState(ok ? 'ok' : 'fail');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState('idle'), 2000);
  };

  return (
    <button type="button" className={`copy-btn copy-btn--${state}`} onClick={onClick} aria-label={`Copier ${what}`}>
      {state === 'ok' ? <CheckIcon /> : <CopyIcon />}
      <span aria-live="polite">{state === 'ok' ? 'Copié' : state === 'fail' ? 'Échec' : 'Copier'}</span>
    </button>
  );
}

/** Ligne de commande affichée en police fixe, avec son bouton « Copier ». */
export function CommandLine({ command, what = 'la commande' }: { command: string; what?: string }) {
  return (
    <div className="command">
      <code>{command}</code>
      <CopyButton text={command} what={what} />
    </div>
  );
}
