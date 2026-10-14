// Contenu repris des données du jeu (front/data/classes/*.tres) et de son README.

const FACTS = [
  { value: '8', label: 'joueurs max.' },
  { value: '3 min', label: 'par match' },
  { value: '3', label: 'classes' },
  { value: '120 m', label: 'd’arène' },
];

const CLASSES = [
  {
    name: 'Samouraï',
    kanji: '侍',
    accent: 'magenta',
    health: 150,
    weapon: 'Fusil à pompe (9 plombs)',
    text: 'Lent mais très résistant sous son armure de plaques. Dévastateur au corps à corps.',
    ability: 'Garde de fer',
    abilityText: 'Position de garde : réduit les dégâts reçus de 70 % pendant 3 s.',
  },
  {
    name: 'Shinobi',
    kanji: '忍',
    accent: 'cyan',
    health: 80,
    weapon: 'Mitraillette',
    text: 'Rapide et agile, mais fragile. Harcèle, puis disparaît.',
    ability: 'Shunpo',
    abilityText: 'Pas éclair : bond fulgurant dans la direction du déplacement.',
  },
  {
    name: 'Archer',
    kanji: '弓',
    accent: 'yellow',
    health: 100,
    weapon: 'Fusil de précision',
    text: 'Fragile au contact, redoutable à distance. Vise avec le clic droit.',
    ability: 'Flèche perforante',
    abilityText: 'Pendant 6 s, les balles traversent les ennemis.',
  },
];

const ZONES = [
  { name: 'Sanctuaire', text: 'Au centre, sur une estrade de 3 m : grand torii, escaliers, lanternes de pierre.' },
  { name: 'Marché couvert', text: 'Échoppes de bois à toits de tuiles, tonneaux de saké, guirlandes de lanternes.' },
  { name: 'Laboratoire IoT', text: 'Néons, bras robotiques, tapis roulant et mezzanine pour dominer la zone.' },
  { name: 'Pagode', text: 'Cinq toits et une tour de guet, reliées par une passerelle à 5 m de haut.' },
  { name: 'Jardin sec', text: 'Gravier ratissé, bassin à carpes koï, pont rouge et cerisiers en fleurs.' },
  { name: 'Ruelles', text: 'Enseignes en kanji, distributeurs de boissons, caméras qui suivent les joueurs.' },
];

export function About() {
  return (
    <section id="presentation" className="section">
      <header className="section__head">
        <p className="section__eyebrow">Présentation</p>
        <h2 className="section__title">Chacun pour soi</h2>
        <p className="section__lead">
          Arena TPS est un match à mort en vue à la troisième personne. Jusqu’à 8 joueurs s’affrontent,
          des bots complètent la partie, et au bout de 3 minutes le meilleur score l’emporte. Après chaque
          apparition, 3 secondes de protection pour revenir dans la bataille.
        </p>
      </header>

      <ul className="facts">
        {FACTS.map((fact) => (
          <li key={fact.label} className="panel facts__item">
            <span className="facts__value">{fact.value}</span>
            <span className="facts__label">{fact.label}</span>
          </li>
        ))}
      </ul>

      <h3 className="subhead">
        Trois classes, une capacité chacune <kbd>E</kbd>
      </h3>
      <ul className="classes">
        {CLASSES.map((c) => (
          <li key={c.name} className={`panel class-card class-card--${c.accent}`}>
            <div className="class-card__head">
              <span className="class-card__kanji" lang="ja" aria-hidden="true">
                {c.kanji}
              </span>
              <div>
                <h4 className="class-card__name">{c.name}</h4>
                <p className="class-card__meta">
                  {c.health} PV · {c.weapon}
                </p>
              </div>
            </div>
            <p className="class-card__text">{c.text}</p>
            <div className="class-card__ability">
              <span className="class-card__ability-name">
                <kbd>E</kbd> {c.ability}
              </span>
              <p>{c.abilityText}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="split">
        <div className="panel panel--light">
          <h3 className="subhead subhead--flush">
            L’univers <span className="accent-magenta">NEO-EDO</span>
          </h3>
          <p className="muted">
            Une arène de 120 × 120 m où un quartier traditionnel répond à un quartier néon : le sanctuaire{' '}
            <span lang="ja">ネオ江戸アリーナ</span> au centre, le laboratoire <span lang="ja">IoT 研究所</span>{' '}
            au nord-est. Drones en patrouille et capteurs aux valeurs en direct animent le décor.
          </p>
          <ul className="zones">
            {ZONES.map((zone) => (
              <li key={zone.name}>
                <strong>{zone.name}</strong>
                <span>{zone.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="modes">
          <div className="panel mode">
            <h3 className="subhead subhead--flush">
              <span className="dot dot--cyan" aria-hidden="true" /> En ligne
            </h3>
            <ul className="ticks">
              <li>Compte avec vérification de l’e-mail, connexion par e-mail ou pseudo.</li>
              <li>Amis et présence en direct, groupes jusqu’à 8 joueurs avec invitations.</li>
              <li>Le chef du groupe clique sur « Lancer en ligne » : tout le groupe rejoint un serveur dédié.</li>
              <li>Liste des serveurs publics pour rejoindre une partie en cours.</li>
              <li>Statistiques, succès et classements.</li>
            </ul>
          </div>
          <div className="panel mode">
            <h3 className="subhead subhead--flush">
              <span className="dot dot--green" aria-hidden="true" /> En LAN
            </h3>
            <ul className="ticks">
              <li>« Jouer hors ligne » sur l’écran de connexion : aucun compte nécessaire.</li>
              <li>« Rejoindre par adresse » avec l’adresse affichée par le serveur de la salle.</li>
              <li>Le premier joueur connecté règle les bots et la durée, puis lance la partie.</li>
              <li>Partie solo contre des bots, ou entraînement sur des mannequins.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
