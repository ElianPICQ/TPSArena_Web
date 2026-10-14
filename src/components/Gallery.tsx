import type { KeyboardEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ManifestState } from '../lib/manifest';
import { screenshotUrl } from '../lib/manifest';
import { CameraIcon, ChevronLeft, ChevronRight, CloseIcon } from './Icons';

const PLACEHOLDERS = 6;

/** « 02-marche-couvert.png » → « marche couvert », pour le texte alternatif. */
function altText(file: string, index: number): string {
  const name = file
    .replace(/\.[^.]+$/, '')
    .replace(/^\d+[-_ ]*/, '')
    .replace(/[-_]+/g, ' ')
    .trim();
  return name ? `Capture d’écran : ${name}` : `Capture d’écran ${index + 1}`;
}

interface LightboxProps {
  files: string[];
  index: number;
  onChange: (index: number) => void;
  onClose: () => void;
}

function Lightbox({ files, index, onChange, onClose }: LightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const count = files.length;
  const prev = useCallback(() => onChange((index - 1 + count) % count), [index, count, onChange]);
  const next = useCallback(() => onChange((index + 1) % count), [index, count, onChange]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    // showModal() rend le reste de la page inerte et piège le focus dans la visionneuse.
    dialog.showModal();
    document.documentElement.classList.add('no-scroll');
    return () => {
      document.documentElement.classList.remove('no-scroll');
      if (dialog.open) dialog.close();
    };
  }, []);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      next();
    } else if (e.key === 'Home') {
      e.preventDefault();
      onChange(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      onChange(count - 1);
    }
  };

  const file = files[index];
  return (
    <dialog
      ref={dialogRef}
      className="lightbox"
      aria-label="Visionneuse de captures d’écran"
      onKeyDown={onKeyDown}
      // Échap déclenche « cancel » : on laisse React fermer la visionneuse.
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <figure className="lightbox__figure">
        <img src={screenshotUrl(file)} alt={altText(file, index)} />
        <figcaption>
          {index + 1} / {count}
          <span className="lightbox__hint"> · ← → pour naviguer, Échap pour fermer</span>
        </figcaption>
      </figure>
      <button type="button" className="lightbox__btn lightbox__close" onClick={onClose} aria-label="Fermer" autoFocus>
        <CloseIcon />
      </button>
      {count > 1 && (
        <>
          <button type="button" className="lightbox__btn lightbox__prev" onClick={prev} aria-label="Capture précédente">
            <ChevronLeft />
          </button>
          <button type="button" className="lightbox__btn lightbox__next" onClick={next} aria-label="Capture suivante">
            <ChevronRight />
          </button>
        </>
      )}
    </dialog>
  );
}

export function Gallery({ state }: { state: ManifestState }) {
  const files = state.status === 'ready' ? state.manifest.screenshots : [];
  const [open, setOpen] = useState<number | null>(null);
  const thumbs = useRef<(HTMLButtonElement | null)[]>([]);

  const close = useCallback(() => {
    const thumb = open === null ? null : thumbs.current[open];
    setOpen(null);
    // Rend le focus à la miniature de la dernière capture affichée.
    requestAnimationFrame(() => thumb?.focus());
  }, [open]);

  return (
    <section id="captures" className="section">
      <header className="section__head">
        <p className="section__eyebrow">Captures d’écran</p>
        <h2 className="section__title">Dans l’arène</h2>
      </header>

      {files.length > 0 ? (
        <ul className="gallery">
          {files.map((file, i) => (
            <li key={file}>
              <button
                type="button"
                className="gallery__item"
                ref={(el) => {
                  thumbs.current[i] = el;
                }}
                onClick={() => setOpen(i)}
                aria-label={`${altText(file, i)} (agrandir)`}
              >
                <img src={screenshotUrl(file)} alt="" loading="lazy" decoding="async" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="gallery" aria-label="Captures à venir">
          {Array.from({ length: PLACEHOLDERS }, (_, i) => (
            <li key={i}>
              <div className="gallery__item gallery__placeholder">
                <CameraIcon className="gallery__camera" />
                <span>Capture à venir</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {open !== null && open < files.length && (
        <Lightbox files={files} index={open} onChange={setOpen} onClose={close} />
      )}
    </section>
  );
}
