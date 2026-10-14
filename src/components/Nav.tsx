import { useEffect, useState } from 'react';
import { MenuIcon, CloseIcon } from './Icons';

const LINKS = [
  { href: '#presentation', label: 'Présentation' },
  { href: '#captures', label: 'Captures' },
  { href: '#telechargements', label: 'Téléchargements' },
  { href: '#commandes', label: 'Commandes' },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className={`nav${scrolled ? ' nav--scrolled' : ''}`}>
      <a className="skip-link" href="#contenu">
        Aller au contenu
      </a>
      <div className="nav__inner">
        <a className="nav__brand" href="#accueil" onClick={() => setOpen(false)}>
          ARENA <span>TPS</span>
        </a>
        <button
          type="button"
          className="nav__toggle"
          aria-expanded={open}
          aria-controls="nav-links"
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
        <nav aria-label="Sections">
          <ul id="nav-links" className={`nav__links${open ? ' nav__links--open' : ''}`}>
            {LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} onClick={() => setOpen(false)}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
