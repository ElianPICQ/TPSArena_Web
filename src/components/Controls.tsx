const CONTROLS: { keys: string[][]; action: string; detail?: string }[] = [
  { keys: [['Souris']], action: 'Orienter la caméra' },
  { keys: [['Clic gauche']], action: 'Tirer' },
  { keys: [['Clic droit']], action: 'Viser', detail: 'zoom et meilleure précision' },
  { keys: [['Z', 'Q', 'S', 'D'], ['↑', '←', '↓', '→']], action: 'Se déplacer' },
  { keys: [['Maj']], action: 'Courir' },
  { keys: [['Espace']], action: 'Sauter' },
  { keys: [['Ctrl'], ['C']], action: 'S’accroupir (maintenir)', detail: 'silhouette plus basse, tir plus précis' },
  { keys: [['R']], action: 'Recharger' },
  { keys: [['1', '2'], ['Molette']], action: 'Arme principale / secondaire' },
  { keys: [['G']], action: 'Lancer une grenade' },
  { keys: [['E']], action: 'Capacité du spécialiste' },
  { keys: [['3']], action: 'Arme spéciale', detail: 'si un bonus d’arme a été ramassé' },
  { keys: [['F']], action: 'Super-pouvoir', detail: 'si un bonus de super-pouvoir est en réserve' },
  { keys: [['Tab']], action: 'Tableau des scores (maintenir)' },
  { keys: [['Échap']], action: 'Menu pause', detail: 'la partie continue pendant ce temps' },
];

export function Controls() {
  return (
    <section id="commandes" className="section">
      <header className="section__head">
        <p className="section__eyebrow">Commandes</p>
        <h2 className="section__title">Clavier et souris</h2>
        <p className="section__lead">
          Touches par défaut d’un clavier AZERTY (sur QWERTY, Z Q S D devient W A S D). Toutes, sauf Échap,
          se changent dans Paramètres, onglet Commandes.
        </p>
      </header>
      <div className="panel controls">
        <table>
          <caption className="visually-hidden">Touches du jeu</caption>
          <thead>
            <tr>
              <th scope="col">Touche</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {CONTROLS.map((row) => (
              <tr key={row.action}>
                <td>
                  {row.keys.map((group, i) => (
                    <span key={i} className="keys">
                      {i > 0 && <span className="keys__or">ou</span>}
                      {group.map((key) => (
                        <kbd key={key}>{key}</kbd>
                      ))}
                    </span>
                  ))}
                </td>
                <td>
                  {row.action}
                  {row.detail && <span className="controls__detail"> : {row.detail}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
