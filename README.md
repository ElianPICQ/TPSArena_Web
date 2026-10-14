# Arena TPS — site de téléchargement

Site vitrine et de téléchargement d'**Arena TPS**, jeu de tir multijoueur à la troisième
personne (Godot 4.7.2) dans le quartier néo-japonais « NEO-EDO ». Le site est servi sur le
réseau local à l'adresse **http://tpsarena.local:8080**. Il est entièrement statique et n'a
aucun lien avec le back du jeu.

- React + Vite + TypeScript, sans framework CSS.
- Fond animé : port WebGL du shader des menus du jeu (`menu_background.gdshader`).
- Polices et ressources embarquées : aucune requête vers Internet, aucun compteur.
- Les builds du jeu et les captures d'écran sont **copiés à la main** sur l'hôte, sans
  rebuild de l'image.

## Prérequis

Sur la machine hôte (Debian 13) :

- **Docker** avec le plugin Compose (`docker compose version`) ;
- **Avahi** pour le nom `tpsarena.local` (voir plus bas) ;
- le **port 8080** libre (modifiable, voir « Changer de port »).

Pour développer : Node.js 24 ou plus récent.

## Arborescence

```
TPSArena_Site/
├── src/                     Code du site (React)
│   ├── components/          Sections de la page, fond WebGL, visionneuse
│   ├── lib/                 Détection du système, manifeste, presse-papiers
│   ├── assets/fonts/        Orbitron, Rajdhani, Noto Sans JP (+ licences OFL)
│   └── styles.css           Charte graphique (reprise de ui_theme.gd)
├── public/                  Favicon
├── docker/
│   ├── nginx.conf           Configuration du serveur web
│   ├── security-headers.conf
│   └── 40-arena-manifest.sh Script d'entrée : génère manifest.json
├── deploy/avahi/            Alias mDNS tpsarena.local (service systemd)
├── releases/                ← builds du jeu (non versionnés)
│   ├── windows/             ArenaTPS.exe
│   ├── linux/               ArenaTPS.x86_64
│   └── macos/               ArenaTPS.zip
├── screenshots/             ← captures d'écran (non versionnées)
├── Dockerfile               Build Node, puis service par nginx:alpine
└── compose.yaml
```

## Lancement

```sh
git clone <url-du-dépôt> TPSArena_Site
cd TPSArena_Site
docker compose up -d --build
```

Le site répond sur `http://<ip-de-la-machine>:8080/` et, une fois Avahi configuré, sur
**http://tpsarena.local:8080**. Pour suivre les journaux : `docker compose logs -f`.

### Changer de port

Le port publié est 8080 par défaut : le port 80 est souvent déjà pris sur la machine, et
le back du jeu utilise 8000 à 8005 et 8025. Pour en choisir un autre, créer un fichier
`.env` à côté de `compose.yaml` (ignoré par Git) :

```sh
echo "SITE_PORT=8090" > .env
docker compose up -d
```

## Ajouter ou mettre à jour un build

Les builds sont produits dans le dépôt du jeu par `tools/build_client.sh`
(`TPSArena_Jeu/client/build/<plateforme>/`). Les copier dans le dossier de la plateforme :

| Plateforme | Dossier | Fichier attendu |
|---|---|---|
| Windows | `releases/windows/` | `ArenaTPS.exe` (PCK intégré) |
| Linux | `releases/linux/` | `ArenaTPS.x86_64` (PCK intégré) |
| macOS | `releases/macos/` | `ArenaTPS.zip` (Intel et Apple Silicon, non signé) |

```sh
cp ../TPSArena_Jeu/client/build/windows/ArenaTPS.exe releases/windows/
```

Seule la dernière version est proposée : on **remplace** le fichier. Si le nom attendu
est absent, le site prend le fichier le plus récent qui a la bonne extension (`.exe`,
`.x86_64` ou `.zip`).

Le conteneur vérifie les dossiers toutes les 30 s et régénère `manifest.json` (nom,
taille, date, SHA-256) dès qu'un fichier change : il suffit de recharger la page. Pour
forcer la mise à jour tout de suite :

```sh
docker compose restart
```

Pour un gros fichier copié par le réseau, le manifeste peut être généré pendant la copie
(taille et empreinte fausses) : il est corrigé à la vérification suivante. Pour éviter
cet état, copier sous un autre nom puis renommer (`mv` est instantané) :

```sh
cp ArenaTPS.exe releases/windows/.ArenaTPS.exe.tmp && mv releases/windows/.ArenaTPS.exe.tmp releases/windows/ArenaTPS.exe
```

Une plateforme sans fichier s'affiche grisée avec « Bientôt disponible ».

Réglage de la surveillance dans `compose.yaml` : `MANIFEST_REFRESH` (en secondes ;
`0` = génération au démarrage seulement, il faut alors `docker compose restart`).

## Ajouter une capture d'écran

Déposer des images (`.png`, `.jpg`, `.webp`, `.avif`, `.gif`) dans `screenshots/`. Elles
sont affichées par ordre alphabétique : les préfixer par un numéro. Le texte alternatif
vient du nom du fichier (`02-marche-couvert.png` → « marche couvert »).

```
screenshots/01-sanctuaire.png
screenshots/02-marche-couvert.png
```

Tant que le dossier est vide, la galerie affiche 6 emplacements « Capture à venir ».
Format conseillé : 16:9, 1920 × 1080, en WebP ou JPEG pour garder des fichiers légers.

## Mettre à jour le site (nouveau code)

```sh
git pull
docker compose up -d --build
```

Les builds et les captures restent sur l'hôte : ils ne sont pas touchés.

## Nom `tpsarena.local` (mDNS avec Avahi)

Les noms en `.local` sont résolus par **mDNS** sur le réseau local, sans serveur DNS.
Windows 10/11, macOS et la plupart des Linux de bureau savent les résoudre sans
configuration. Sur l'hôte Debian :

```sh
sudo apt install avahi-daemon avahi-utils
sudo systemctl enable --now avahi-daemon
```

Puis choisir **une** des deux méthodes.

### Méthode 1 : renommer la machine (la plus simple)

Avahi publie automatiquement `<nom-d-hôte>.local` et suit les changements d'adresse IP.

```sh
sudo hostnamectl set-hostname tpsarena
sudo sed -i 's/^127\.0\.1\.1.*/127.0.1.1\ttpsarena/' /etc/hosts
sudo systemctl restart avahi-daemon
```

### Méthode 2 : garder le nom de la machine et ajouter un alias

Le service fourni publie `tpsarena.local` vers l'adresse IP actuelle de la machine :

```sh
sudo install -m 755 deploy/avahi/tpsarena-alias.sh /usr/local/bin/
sudo install -m 644 deploy/avahi/tpsarena-alias.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now tpsarena-alias
```

L'adresse est lue au démarrage du service : si la machine change d'adresse IP (DHCP),
lancer `sudo systemctl restart tpsarena-alias`.

### Vérifier

```sh
avahi-resolve -n tpsarena.local          # sur l'hôte ou un autre Linux
```

Sous Windows (PowerShell) : `Resolve-DnsName tpsarena.local`, ou `ping tpsarena.local`.
Sous macOS : `dns-sd -G v4 tpsarena.local`.

## Développement

```sh
npm install
npm run dev        # http://localhost:5173
npm run build      # vérification des types + build dans dist/
```

En développement, Vite imite le conteneur : il sert `/manifest.json`, `/releases/` et
`/screenshots/` à partir des dossiers locaux.

## Fonctionnement

1. **Build** (`Dockerfile`, étape Node) : `npm ci` puis `npm run build` produit le site
   statique dans `dist/`. Les fichiers JS, CSS et les polices ont un nom versionné
   (hash), mis en cache un an.
2. **Démarrage** (`docker/40-arena-manifest.sh`, lancé par l'entrée de l'image nginx) :
   le script parcourt `/srv/releases` et `/srv/screenshots` (montés en lecture seule) et
   écrit `manifest.json`, puis surveille les dossiers en tâche de fond.
3. **Service** (`docker/nginx.conf`) : `manifest.json` n'est jamais mis en cache, les
   builds sont envoyés avec `Content-Disposition: attachment` (et `sendfile`), les
   captures sont revalidées à chaque visite.
4. **Page** : le site lit le manifeste, détecte le système du visiteur
   (`navigator.userAgentData`, sinon `userAgent`) et met en avant le bon téléchargement.

## Dépannage

**La page ne s'ouvre pas avec l'adresse IP.**
- `docker compose ps` : le conteneur doit être `running (healthy)`.
- `curl -I http://localhost:8080/` sur l'hôte.
- Pare-feu de l'hôte : ouvrir le port 8080.
  ```sh
  sudo ufw allow 8080/tcp            # avec ufw
  sudo nft list ruleset | grep 8080  # avec nftables, vérifier les règles
  ```
- Le port 8080 est déjà pris (`sudo ss -ltnp | grep ':8080 '`) : arrêter l'autre service,
  ou choisir un autre port avec `SITE_PORT` (voir « Changer de port »).

**L'adresse IP marche, mais pas `tpsarena.local`.**
- Sur l'hôte : `systemctl status avahi-daemon` (et `tpsarena-alias` pour la méthode 2),
  puis `avahi-resolve -n tpsarena.local`.
- Le pare-feu de l'hôte doit laisser passer **mDNS** : `sudo ufw allow 5353/udp`.
- Le client et l'hôte doivent être sur le **même réseau local** (même sous-réseau) : mDNS
  ne traverse pas les routeurs.
- Certains réseaux Wi-Fi (écoles, entreprises, invités) isolent les appareils ou bloquent
  le multicast : mDNS ne passe pas. Utiliser alors l'adresse IP (`hostname -I` sur l'hôte).
- Windows : le réseau doit être en profil **Privé** (Paramètres → Réseau et Internet).
- Linux client : installer `avahi-daemon` et `libnss-mdns` (`mdns4_minimal` dans la ligne
  `hosts:` de `/etc/nsswitch.conf`).
- Un VPN actif sur le client peut empêcher la résolution.

**Un téléchargement manque ou affiche une vieille version.**
- `docker compose exec site cat /usr/share/nginx/html/manifest.json`
- Vérifier le nom et l'extension du fichier, puis `docker compose restart`.
- `docker compose logs site | grep arena-manifest` affiche chaque génération.

**Le fond animé ne s'affiche pas.** Le navigateur n'a pas WebGL (ou l'accélération
matérielle est désactivée) : la page affiche alors un dégradé fixe. Avec le réglage
système « réduire les animations », le fond est volontairement figé.

**macOS refuse d'ouvrir le jeu.** L'application n'est pas signée par Apple : clic droit
sur l'application → **Ouvrir**, puis confirmer (une seule fois).

## Crédits

Projet M2 Architecture SI — CFA INSTA.

Polices sous **SIL Open Font License 1.1** (textes de licence dans `src/assets/fonts/`) :
Orbitron, Rajdhani, Noto Sans JP (sous-ensemble du jeu).
