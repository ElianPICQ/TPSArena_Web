// Contenu repris des données du jeu (front/data/classes/*.tres, scripts/pickups.gd,
// scripts/maps/*) et de son README.

const FACTS = [
  { value: '16', label: 'joueurs max.' },
  { value: '3 min', label: 'par match' },
  { value: '4', label: 'spécialistes' },
  { value: '2', label: 'maps' },
];

const SPECIALISTS = [
  {
    name: 'Samouraï',
    kanji: '侍',
    accent: 'magenta',
    health: 150,
    text: 'Lent mais très résistant sous son armure de plaques. Dévastateur au corps à corps.',
    ability: 'Garde de fer',
    abilityText: 'Position de garde : réduit les dégâts reçus de 70 % pendant 3 s.',
  },
  {
    name: 'Shinobi',
    kanji: '忍',
    accent: 'cyan',
    health: 80,
    text: 'Rapide et agile, mais fragile. Harcèle, puis disparaît.',
    ability: 'Shunpo',
    abilityText: 'Pas éclair : bond fulgurant dans la direction du déplacement.',
  },
  {
    name: 'Archer',
    kanji: '弓',
    accent: 'yellow',
    health: 100,
    text: 'Fragile au contact, redoutable à distance. Vise avec le clic droit.',
    ability: 'Flèche perforante',
    abilityText: 'Pendant 6 s, les balles traversent les ennemis.',
  },
  {
    name: 'Oni',
    kanji: '鬼',
    accent: 'red',
    health: 130,
    text: 'Démolisseur en armure lourde. Fonce dans la mêlée et renverse tout sur son passage.',
    ability: 'Charge',
    abilityText: 'Ruée de 0,35 s : les ennemis percutés prennent 30 dégâts et sont projetés.',
  },
];

const WEAPONS = [
  'Mitraillette',
  'Fusil à pompe',
  'Fusil de précision',
  'Lance-roquettes',
  'Lance-flammes',
  'Pistolet laser',
  'Katana',
  'Lance-caca',
];

const BONUSES = [
  { name: 'Soin, armure, double saut, vitesse', text: 'Ramassés au sol, ils réapparaissent après quelques dizaines de secondes.' },
  { name: 'Armes spéciales', key: '3', text: 'Sulfateuse, fusil laser, poing puissant : introuvables dans les classes.' },
  { name: 'Super-pouvoir', key: 'F', text: 'Surcharge néon, onde de choc ou invisibilité, gardé en réserve jusqu’au bon moment.' },
];

const MAPS = [
  {
    name: 'NEO-EDO',
    jp: 'ネオ江戸',
    accent: 'magenta',
    text: 'Arène de 120 × 120 m où un quartier traditionnel répond à un quartier néon. Drones en patrouille, caméras qui suivent les joueurs et capteurs aux valeurs en direct animent le décor.',
    zones: [
      { name: 'Sanctuaire', text: 'Au centre, sur une estrade de 3 m : grand torii, escaliers, lanternes de pierre.' },
      { name: 'Marché couvert', text: 'Échoppes de bois à toits de tuiles, tonneaux de saké, guirlandes de lanternes.' },
      { name: 'Laboratoire IoT', text: 'Néons, bras robotiques, tapis roulant et mezzanine pour dominer la zone.' },
      { name: 'Pagode', text: 'Cinq toits et une tour de guet, reliées par une passerelle à 5 m de haut.' },
      { name: 'Jardin sec', text: 'Gravier ratissé, bassin à carpes koï, pont rouge et cerisiers en fleurs.' },
      { name: 'Ruelles', text: 'Enseignes en kanji, distributeurs de boissons, lampadaires de pierre.' },
    ],
  },
  {
    name: 'Hikari Mall',
    jp: 'ひかりモール',
    accent: 'cyan',
    text: 'Centre commercial abandonné de 100 × 100 m sur deux niveaux, au crépuscule. Escalators, escaliers et planchers effondrés relient l’étage au rez-de-chaussée.',
    zones: [
      { name: 'Atrium', text: 'Vide central sur deux niveaux, fontaine à sec et verrière éventrée.' },
      { name: 'Supermarché', text: 'Des rayons pour se couvrir, un balcon effondré à l’étage.' },
      { name: 'Food court', text: 'Comptoirs et tables au rez-de-chaussée, salon à l’étage.' },
      { name: 'Quai de livraison', text: 'Camions et palettes au sud, réserve à l’étage.' },
      { name: 'Cinéma et arcade', text: 'Aux coins nord de l’étage, l’arcade baignée de néons.' },
      { name: 'Hall d’entrée', text: 'Au nord, sous les boutiques de l’étage.' },
    ],
  },
];

export function About() {
  return (
    <section id="presentation" className="section">
      <header className="section__head">
        <p className="section__eyebrow">Présentation</p>
        <h2 className="section__title">Chacun pour soi</h2>
        <p className="section__lead">
          TPS Arena est un match à mort en vue à la troisième personne. Jusqu’à 16 joueurs s’affrontent,
          des bots complètent la partie, et au bout de 3 minutes le meilleur score l’emporte. Tirs à la tête,
          grenades et bonus à ramasser ; après chaque apparition, 3 secondes de protection pour revenir dans
          la bataille.
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
        Quatre spécialistes, une capacité chacun <kbd>E</kbd>
      </h3>
      <ul className="classes">
        {SPECIALISTS.map((c) => (
          <li key={c.name} className={`panel class-card class-card--${c.accent}`}>
            <div className="class-card__head">
              <span className="class-card__kanji" lang="ja" aria-hidden="true">
                {c.kanji}
              </span>
              <div>
                <h4 className="class-card__name">{c.name}</h4>
                <p className="class-card__meta">{c.health} PV</p>
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

      <div className="split split--even">
        <div className="panel panel--light">
          <h3 className="subhead subhead--flush">Classes : votre équipement</h3>
          <p className="muted">
            Une arme principale, une arme secondaire et 2 grenades. Chaque joueur crée jusqu’à 10 classes,
            enregistrées sur son compte, et en change en partie depuis le menu pause. N’importe quel spécialiste
            peut prendre n’importe quelle classe.
          </p>
          <ul className="chips" aria-label="Armes des classes">
            {WEAPONS.map((weapon) => (
              <li key={weapon}>{weapon}</li>
            ))}
          </ul>
          <p className="muted keys-line">
            <kbd>1</kbd> <kbd>2</kbd> ou molette : changer d’arme · <kbd>G</kbd> : grenade
          </p>
        </div>
        <div className="panel panel--light">
          <h3 className="subhead subhead--flush">Bonus sur la map</h3>
          <ul className="zones zones--single">
            {BONUSES.map((bonus) => (
              <li key={bonus.name}>
                <strong>
                  {bonus.key && <kbd>{bonus.key}</kbd>} {bonus.name}
                </strong>
                <span>{bonus.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <h3 className="subhead">Deux maps</h3>
      <div className="split split--even">
        {MAPS.map((map) => (
          <div key={map.name} className="panel panel--light">
            <h3 className="subhead subhead--flush">
              <span className={`accent-${map.accent}`}>{map.name}</span>{' '}
              <span className="map-jp" lang="ja">
                {map.jp}
              </span>
            </h3>
            <p className="muted">{map.text}</p>
            <ul className="zones">
              {map.zones.map((zone) => (
                <li key={zone.name}>
                  <strong>{zone.name}</strong>
                  <span>{zone.text}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="modes modes--three">
        <div className="panel mode">
          <h3 className="subhead subhead--flush">
            <span className="dot dot--cyan" aria-hidden="true" /> En ligne
          </h3>
          <ul className="ticks">
            <li>Compte avec vérification de l’e-mail, connexion par e-mail ou pseudo.</li>
            <li>Amis et présence en direct, groupes jusqu’à 16 joueurs avec invitations.</li>
            <li>« Lancer en ligne » : tout le groupe rejoint le salon d’un serveur dédié, où le chef règle les bots, la durée et la map.</li>
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
            <li>Le premier joueur connecté règle les bots, la durée et la map, puis lance la partie.</li>
          </ul>
        </div>
        <div className="panel mode">
          <h3 className="subhead subhead--flush">
            <span className="dot dot--yellow" aria-hidden="true" /> Solo
          </h3>
          <ul className="ticks">
            <li>Partie solo contre 1 à 15 bots, au niveau Facile, Normal, Difficile ou Expert, sur la map de son choix.</li>
            <li>Entraînement sur des mannequins-robots, sans limite de temps.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
