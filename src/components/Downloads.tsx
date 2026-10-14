import type { Build, ManifestState } from '../lib/manifest';
import { buildUrl, formatDate, formatSize } from '../lib/manifest';
import type { Platform, PlatformInfo } from '../lib/platforms';
import { PLATFORMS, shellArg } from '../lib/platforms';
import { CommandLine, CopyButton } from './CopyButton';
import { DownloadIcon, PlatformIcon } from './Icons';

function PlatformNotes({ platform, file }: { platform: Platform; file: string }) {
  if (platform === 'linux') {
    return (
      <div className="dl-card__notes">
        <p>Rendre le fichier exécutable une fois, puis le lancer :</p>
        <CommandLine command={`chmod +x ${shellArg(file)}`} />
        <p>
          puis <code className="inline-code">./{shellArg(file)}</code> ou un double-clic.
        </p>
      </div>
    );
  }
  if (platform === 'macos') {
    return (
      <div className="dl-card__notes">
        <p>Mac Intel et Apple Silicon. Décompresser l’archive pour obtenir l’application.</p>
        <p className="note note--warn">
          Application non signée : clic droit → <strong>Ouvrir</strong> au premier lancement.
        </p>
      </div>
    );
  }
  return (
    <div className="dl-card__notes">
      <p>Un seul fichier, rien à installer : double-cliquer pour lancer le jeu.</p>
    </div>
  );
}

interface CardProps {
  info: PlatformInfo;
  build: Build | null;
  loading: boolean;
  featured: boolean;
}

function DownloadCard({ info, build, loading, featured }: CardProps) {
  const titleId = `dl-${info.id}`;
  const classes = ['panel', 'dl-card'];
  if (featured) classes.push('dl-card--featured');
  if (!build) classes.push('dl-card--missing');

  return (
    <li className={classes.join(' ')} aria-labelledby={titleId}>
      {featured && <span className="dl-card__badge">Votre système</span>}
      <div className="dl-card__head">
        <PlatformIcon platform={info.id} className="dl-card__icon" />
        <div>
          <h3 id={titleId} className="dl-card__title">
            {info.label}
          </h3>
          <p className="dl-card__file">{build?.file ?? info.expectedFile}</p>
        </div>
      </div>

      {build ? (
        <>
          <dl className="dl-card__meta">
            <div>
              <dt>Taille</dt>
              <dd>{formatSize(build.size)}</dd>
            </div>
            <div>
              <dt>Build du</dt>
              <dd>
                <time dateTime={build.modified}>{formatDate(build.modified)}</time>
              </dd>
            </div>
          </dl>
          <a
            className={`btn ${featured ? 'btn--primary' : ''} dl-card__btn`}
            href={buildUrl(info.id, build)}
            download={build.file}
          >
            <DownloadIcon /> Télécharger
          </a>
          <PlatformNotes platform={info.id} file={build.file} />
          <details className="verify">
            <summary>Vérifier le fichier</summary>
            <div className="verify__body">
              <p className="verify__label">Empreinte SHA-256 attendue</p>
              <div className="command command--hash">
                <code>{build.sha256}</code>
                <CopyButton text={build.sha256} what="l’empreinte SHA-256" />
              </div>
              <p className="verify__label">
                Dans le dossier du fichier ({info.verifyShell}), comparer avec :
              </p>
              <CommandLine command={info.verifyCommand(build.file)} />
            </div>
          </details>
        </>
      ) : (
        <div className="dl-card__soon">
          <span className="btn btn--disabled dl-card__btn" aria-disabled="true">
            {loading ? 'Chargement…' : 'Bientôt disponible'}
          </span>
        </div>
      )}
    </li>
  );
}

export function Downloads({ state, detected }: { state: ManifestState; detected: Platform | null }) {
  // La carte du système détecté passe en premier.
  const ordered = detected ? [...PLATFORMS].sort((a, b) => Number(b.id === detected) - Number(a.id === detected)) : PLATFORMS;
  return (
    <section id="telechargements" className="section">
      <header className="section__head">
        <p className="section__eyebrow">Téléchargements</p>
        <h2 className="section__title">Dernière version</h2>
        <p className="section__lead">
          Le jeu complet tient dans un seul fichier. Une fois lancé, choisissez « Jouer hors ligne » pour une
          partie en LAN, ou connectez-vous pour jouer en ligne.
        </p>
      </header>
      {state.status === 'error' && (
        <p className="note note--error" role="status">
          Impossible de lire la liste des fichiers pour le moment. Rechargez la page dans quelques instants.
        </p>
      )}
      <ul className="downloads">
        {ordered.map((info) => (
          <DownloadCard
            key={info.id}
            info={info}
            build={state.status === 'ready' ? state.manifest.builds[info.id] : null}
            loading={state.status === 'loading'}
            featured={info.id === detected}
          />
        ))}
      </ul>
    </section>
  );
}
