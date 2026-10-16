# TPS Arena — site de téléchargement

Site vitrine et de téléchargement d'**TPS Arena**, jeu de tir multijoueur à la troisième
personne (Godot 4.7.2) dans le quartier néo-japonais « NEO-EDO ». Le site est servi sur le
réseau local à l'adresse **http://<ip-de-la-machine>:8080**. La vitrine est entièrement
statique. Le site sert aussi **TPS Arena Companion** (`/app/`), une app web installable (PWA)
où chaque joueur consulte ses stats, sa progression, ses succès, son historique et les
classements, gère ses amis et discute avec eux depuis son téléphone. C'est la seule partie liée
au back du jeu : nginx relaie `/api/` vers le `web-bff` du back (`backend/services/web-bff`) et
`/ws` (WebSocket du chat) vers Real-time. Dans le jeu, un ami qui n'a que l'app ouverte
apparaît « Sur mobile ».

- React + Vite + TypeScript, sans framework CSS.
- Fond animé : port WebGL du shader des menus du jeu (`menu_background.gdshader`).
- Polices et ressources embarquées : aucune requête vers Internet, aucun compteur.
- Les builds du jeu et les captures d'écran sont **copiés à la main** sur l'hôte, sans
  rebuild de l'image.
- L'app mobile s'installe et marche hors ligne seulement en **HTTPS** : certificat du réseau
  local créé avec **mkcert** (voir « App mobile et HTTPS »).

## Prérequis

Sur la machine hôte (Debian 13) :

- **Docker** avec le plugin Compose (`docker compose version`) ;
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
├── app/                     App mobile (PWA), build à part : vite.app.config.ts
│   ├── src/                 Écrans, session, cache hors ligne, client de l'API
│   └── public/icons/        Icônes de l'app (tirées du favicon)
├── docker/
│   ├── nginx.conf           Serveur web sans certificat (tout en HTTP)
│   ├── nginx-https.conf     Avec certificat : vitrine en HTTP et HTTPS, app en HTTPS
│   ├── site-locations.conf  Vitrine, builds, captures, /ca.crt
│   ├── app-locations.conf   /app/, /api/ (relais vers le web-bff) et /ws (chat, Real-time)
│   ├── security-headers.conf
│   ├── 35-arena-tls.sh      Script d'entrée : choisit HTTP seul ou HTTPS
│   └── 40-arena-manifest.sh Script d'entrée : génère manifest.json
├── scripts/certificat.sh    Certificat mkcert pour l'IP de l'hôte (+ certificat.ps1 sous Windows)
├── certs/                   ← certificat HTTPS du site (non versionné)
├── releases/                ← builds du jeu (non versionnés)
│   ├── windows/             TPSArena.exe
│   ├── linux/               TPSArena.x86_64
│   └── macos/               TPSArena.zip
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

Le site répond sur **`http://<ip-de-la-machine>:8080/`**. Pour suivre les journaux :
`docker compose logs -f`.

Pour connaître l'adresse IP à communiquer aux joueurs :

```sh
hostname -I | awk '{print $1}'
```

Sous Windows (PowerShell) :

```powershell
(Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -and $_.NetAdapter.Status -eq "Up" }).IPv4Address.IPAddress
```

Sur un réseau en DHCP (Wi-Fi de l'école notamment), cette adresse peut changer d'un jour
à l'autre : la vérifier avant chaque séance.

### Changer de port

Le port publié est 8080 par défaut : le port 80 est souvent déjà pris sur la machine, et
le back du jeu utilise 8000 à 8006 et 8025. Pour en choisir un autre, créer un fichier
`.env` à côté de `compose.yaml` (ignoré par Git) :

```sh
echo "SITE_PORT=8090" > .env
docker compose up -d
```

Sous Windows, écrire le fichier avec `Set-Content .env "SITE_PORT=8090"` : dans
PowerShell 5.1, `>` l'écrit en UTF-16, que Docker Compose ne lit pas correctement.

Le port HTTPS (app mobile) est 8443 par défaut, `SITE_HTTPS_PORT` dans le même fichier.

## App mobile et HTTPS

L'app est servie sous **`/app/`**. Elle a besoin du back du jeu lancé (`docker compose up -d`
dans `backend/`, qui démarre le `web-bff` et Real-time) : les projets partagent le réseau
Docker `tpsarena-web`. Sans back, la vitrine marche normalement et seule l'app affiche une erreur.

Un service worker (installation, mode hors ligne) et le cookie de session `Secure` exigent
HTTPS. Sur un réseau local, aucune autorité publique ne signe un certificat pour une adresse
IP : on crée donc **une autorité de certification locale (CA)** avec
[mkcert](https://github.com/FiloSottile/mkcert) et on l'installe sur les téléphones de démo.

Sans certificat dans `certs/`, tout reste en HTTP : l'app s'ouvre, mais ne s'installe pas et
demande de se reconnecter à chaque rechargement.

### Mettre en place (une fois par machine hôte)

```sh
sudo apt install mkcert           # Windows : winget install FiloSottile.mkcert
scripts/certificat.sh             # Windows : .\scripts\certificat.ps1
```

Le script crée la CA dans le dossier de mkcert (`mkcert -CAROOT`) si elle n'existe pas,
puis écrit dans `certs/` le certificat du site pour l'IP courante (`site.crt`, `site.key`) et
le **certificat public** de la CA (`tps-arena-ca.crt`, servi en `/ca.crt`). Il redémarre le
conteneur s'il tourne, et affiche l'empreinte SHA-256 de la CA.

> **La clé privée de la CA (`rootCA-key.pem`) ne quitte jamais le dossier de mkcert.** Ne
> pas la copier dans ce dépôt, dans un conteneur ni sur un téléphone : avec elle, n'importe
> qui pourrait fabriquer un faux certificat (pour n'importe quel site) qu'accepterait un
> téléphone où la CA est installée. Les fichiers de `certs/` ne sont jamais versionnés.

Pour tester depuis le navigateur du PC hôte, `mkcert -install` y installe aussi la CA.

### Sur chaque téléphone Android (une fois)

1. Ouvrir `http://<ip-de-la-machine>:8080/ca.crt` (ou le bouton « Télécharger le
   certificat » de la section « App mobile » de la vitrine).
2. **Paramètres › Sécurité › Chiffrement et identifiants › Installer un certificat ›
   Certificat CA**, puis choisir `tps-arena-ca.crt` (le chemin varie un peu selon la
   marque ; chercher « certificat CA » dans les paramètres). Android avertit que le réseau
   peut être surveillé : c'est normal pour une CA ajoutée par l'utilisateur.
3. Ouvrir `https://<ip-de-la-machine>:8443/app/` (ou « Mes stats » sur la vitrine, qui
   redirige), se connecter avec le compte du jeu, puis **menu ⋮ › Installer l'application**.

Pour retirer la CA après la démo : **Paramètres › Sécurité › Chiffrement et identifiants ›
Certificats de confiance › Utilisateur**, choisir la CA mkcert, puis **Supprimer**.

### Quand l'adresse IP change

Le certificat du site est lié à l'IP. Sur le Wi-Fi de l'école, relancer simplement :

```sh
scripts/certificat.sh             # ou : scripts/certificat.sh 10.0.0.12
```

Sous Windows : `.\scripts\certificat.ps1` (ou `.\scripts\certificat.ps1 10.0.0.12`).

La CA ne change pas : **rien à refaire sur les téléphones**. L'app installée garde son
adresse : si l'IP a changé, l'ouvrir de nouveau depuis la vitrine.

### Ce que fait nginx

- HTTP (8080) : la vitrine ; `/app/` et `/api/` sont redirigés vers HTTPS dès qu'un
  certificat est présent. La vitrine reste en HTTP pour les PC sans la CA.
- HTTPS (8443) : la vitrine, l'app (`/app/`), son API (`/api/` → `web-bff:8006`, avec
  `X-Forwarded-For` écrasé par l'adresse du joueur pour les limites de connexion d'Auth) et
  le WebSocket du chat (`/ws` → `realtime:8005`, `wss://` seulement).
- Pas de HSTS : il s'appliquerait à toute l'adresse IP et casserait la vitrine en HTTP et
  le back du jeu (8000, 8002, 8005) dans les navigateurs.

## Ajouter ou mettre à jour un build

Les builds sont produits dans le dépôt du jeu par `tools/build_client.sh`
(`TPSArena_Jeu/client/build/<plateforme>/`). Les copier dans le dossier de la plateforme :

| Plateforme | Dossier | Fichier attendu |
|---|---|---|
| Windows | `releases/windows/` | `TPSArena.exe` (PCK intégré) |
| Linux | `releases/linux/` | `TPSArena.x86_64` (PCK intégré) |
| macOS | `releases/macos/` | `TPSArena.zip` (Intel et Apple Silicon, non signé) |

```sh
cp ../TPSArena_Jeu/client/build/windows/TPSArena.exe releases/windows/
```

Seule la dernière version est proposée : on **remplace** le fichier. Si le nom attendu
est absent, le site prend le fichier le plus récent qui a la bonne extension (`.exe`,
`.x86_64` ou `.zip`).

Le conteneur vérifie les dossiers toutes les 30 s et régénère `manifest.json` (nom,
taille, date) dès qu'un fichier change : il suffit de recharger la page. Pour
forcer la mise à jour tout de suite :

```sh
docker compose restart
```

Pour un gros fichier copié par le réseau, le manifeste peut être généré pendant la copie
(taille fausse) : il est corrigé à la vérification suivante. Pour éviter
cet état, copier sous un autre nom puis renommer (`mv` est instantané) :

```sh
cp TPSArena.exe releases/windows/.TPSArena.exe.tmp && mv releases/windows/.TPSArena.exe.tmp releases/windows/TPSArena.exe
```

Sous Windows (PowerShell) :

```powershell
Copy-Item TPSArena.exe releases/windows/.TPSArena.exe.tmp
Move-Item -Force releases/windows/.TPSArena.exe.tmp releases/windows/TPSArena.exe
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

## Développement

```sh
npm install
npm run dev        # vitrine : http://localhost:5173
npm run dev:app    # app mobile : http://localhost:5174/app/ (back lancé : /api/ → 127.0.0.1:8006)
npm run build      # vérification des types + build de la vitrine puis de l'app dans dist/
```

En développement, Vite imite le conteneur : il sert `/manifest.json`, `/releases/` et
`/screenshots/` à partir des dossiers locaux. `localhost` est un contexte sécurisé : le
cookie de session et le service worker y marchent sans certificat.

## Fonctionnement

1. **Build** (`Dockerfile`, étape Node) : `npm ci` puis `npm run build` produit le site
   statique dans `dist/`. Les fichiers JS, CSS et les polices ont un nom versionné
   (hash), mis en cache un an.
2. **Démarrage** (`docker/40-arena-manifest.sh`, lancé par l'entrée de l'image nginx) :
   le script parcourt `/srv/releases` et `/srv/screenshots` (montés en lecture seule) et
   écrit `manifest.json`, puis surveille les dossiers en tâche de fond.
3. **Service** (`docker/nginx.conf`, ou `nginx-https.conf` si `docker/35-arena-tls.sh`
   trouve un certificat) : `manifest.json` n'est jamais mis en cache, les builds sont
   envoyés avec `Content-Disposition: attachment` (et `sendfile`), les captures sont
   revalidées à chaque visite.
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

**Un téléchargement manque ou affiche une vieille version.**
- `docker compose exec site cat /usr/share/nginx/html/manifest.json`
- Vérifier le nom et l'extension du fichier, puis `docker compose restart`.
- `docker compose logs site | grep arena-manifest` affiche chaque génération.

**Le fond animé ne s'affiche pas.** Le navigateur n'a pas WebGL (ou l'accélération
matérielle est désactivée) : la page affiche alors un dégradé fixe. Avec le réglage
système « réduire les animations », le fond est volontairement figé.

**L'app mobile affiche « Le service de l'app est indisponible ».** Le back n'est pas lancé,
ou le `web-bff` n'est pas sur le réseau `tpsarena-web` : `docker network inspect
tpsarena-web` doit lister `tps-arena-site` et `backend-web-bff-1`.

**Le chat reste sur « Connexion au chat… ».** Real-time n'est pas sur le réseau
`tpsarena-web` (back lancé avant cette version : `docker compose up -d` dans `backend/` le
rattache), ou `/ws` est ouvert en HTTP alors que HTTPS est actif (refusé : passer par
`https://…:8443/app/`).

**Le téléphone affiche une erreur de certificat sur `/app/`.** La CA n'est pas installée
(voir « Sur chaque téléphone Android »), ou le certificat date d'une ancienne IP : relancer
`scripts/certificat.sh`. `docker compose logs site | grep arena-tls` dit si HTTPS est actif.

**macOS refuse d'ouvrir le jeu.** L'application n'est pas signée par Apple : clic droit
sur l'application → **Ouvrir**, puis confirmer (une seule fois).

## Crédits

Projet M2 Architecture SI — CFA INSTA.

Polices sous **SIL Open Font License 1.1** (textes de licence dans `src/assets/fonts/`) :
Orbitron, Rajdhani, Noto Sans JP (sous-ensemble du jeu).
