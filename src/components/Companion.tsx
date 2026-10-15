import { useEffect, useState } from 'react';

// Lien vers l'app mobile (PWA servie sous /app/, voir app/). En HTTP, nginx redirige /app/
// vers HTTPS quand un certificat est en place ; le certificat de la CA locale (/ca.crt)
// n'existe que dans ce cas.
function useCaAvailable(): boolean {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/ca.crt', { method: 'HEAD', cache: 'no-store', signal: controller.signal })
      .then((r) => setAvailable(r.ok))
      .catch(() => setAvailable(false));
    return () => controller.abort();
  }, []);
  return available;
}

export function Companion() {
  const ca = useCaAvailable();
  return (
    <section id="app-mobile" className="section">
      <header className="section__head">
        <p className="section__eyebrow">App mobile</p>
        <h2 className="section__title">Vos stats sur téléphone</h2>
        <p className="section__lead">
          TPS Arena Companion affiche votre niveau, vos succès, l’historique de vos parties en ligne et les
          classements. Connectez-vous avec le compte du jeu, puis installez l’app depuis le menu du navigateur.
        </p>
      </header>
      <div className="split split--even">
        <div className="panel panel--light">
          <h3 className="subhead subhead--flush">Ouvrir l’app</h3>
          <p className="muted">
            Sur Android, Chrome propose ensuite « Installer l’application » : elle s’ouvre alors comme une app,
            et garde les dernières données affichées pour les consulter hors ligne.
          </p>
          <p className="companion__action">
            <a className="btn btn--primary" href="/app/">
              Mes stats
            </a>
          </p>
        </div>
        {ca && (
          <div className="panel panel--light">
            <h3 className="subhead subhead--flush">Première fois : le certificat</h3>
            <p className="muted">
              L’app passe en HTTPS avec un certificat du réseau local. Installez une fois le certificat de son
              autorité sur le téléphone : Paramètres › Sécurité › Chiffrement et identifiants › Installer un
              certificat › Certificat CA. À retirer au même endroit quand vous n’en avez plus besoin.
            </p>
            <p className="companion__action">
              <a className="btn" href="/ca.crt" download="tps-arena-ca.crt">
                Télécharger le certificat
              </a>
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
