import type { ManifestState } from '../lib/manifest';
import { buildUrl } from '../lib/manifest';
import type { Platform } from '../lib/platforms';
import { platformInfo } from '../lib/platforms';
import { DownloadIcon } from './Icons';

interface Props {
  platform: Platform | null;
  state: ManifestState;
}

function MainButton({ platform, state }: Props) {
  if (!platform) {
    return (
      <a className="btn btn--primary btn--xl" href="#telechargements">
        <DownloadIcon /> Voir les téléchargements
      </a>
    );
  }
  const label = `Télécharger pour ${platformInfo(platform).label}`;
  const build = state.status === 'ready' ? state.manifest.builds[platform] : null;
  if (build) {
    return (
      <a className="btn btn--primary btn--xl" href={buildUrl(platform, build)} download={build.file}>
        <DownloadIcon /> {label}
      </a>
    );
  }
  return (
    <a className="btn btn--primary btn--xl btn--pending" href="#telechargements" aria-describedby="hero-note">
      <DownloadIcon /> {label}
    </a>
  );
}

export function Hero({ platform, state }: Props) {
  const build = platform && state.status === 'ready' ? state.manifest.builds[platform] : null;
  let note = '';
  if (!platform) note = 'Le jeu se joue sur ordinateur : Windows, Linux ou macOS.';
  else if (state.status === 'loading') note = 'Recherche de la dernière version…';
  else if (!build) note = `Version ${platformInfo(platform).label} bientôt disponible.`;

  return (
    <section id="accueil" className="hero">
      <p className="hero__kicker">
        Quartier <span lang="ja">ネオ江戸</span> · NEO-EDO
      </p>
      <h1 className="hero__title">
        ARENA <span>TPS</span>
      </h1>
      <p className="hero__tagline">
        Tir à la troisième personne, chacun pour soi : 16 joueurs, des bots et 3 minutes pour finir en
        tête, entre temple ancien et néons de Tokyo.
      </p>
      <div className="hero__actions">
        <MainButton platform={platform} state={state} />
        <a className="hero__secondary" href="#telechargements">
          Autres plateformes
        </a>
      </div>
      <p id="hero-note" className="hero__note" aria-live="polite">
        {note}
      </p>
    </section>
  );
}
