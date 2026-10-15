#!/usr/bin/env bash
# Crée ou refait le certificat HTTPS du site pour l'adresse IP de la machine, signé par la CA
# locale de mkcert, puis redémarre le conteneur pour l'utiliser.
#
#   scripts/certificat.sh            IP de la route par défaut
#   scripts/certificat.sh 10.0.0.12  IP donnée
#
# À relancer quand l'IP change (Wi-Fi de l'école). La CA ne change pas : rien à refaire sur les
# téléphones. Écrit dans certs/ : site.crt, site.key et tps-arena-ca.crt (certificat PUBLIC de
# la CA, servi en /ca.crt). La clé de la CA (rootCA-key.pem) n'est jamais copiée.
set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v mkcert >/dev/null 2>&1; then
	echo "mkcert introuvable. Debian : sudo apt install mkcert ; autres : https://github.com/FiloSottile/mkcert" >&2
	exit 1
fi

ip=${1:-}
if [ -z "$ip" ]; then
	ip=$(ip -4 route get 1.1.1.1 2>/dev/null | sed -n 's/.* src \([0-9.]*\).*/\1/p')
fi
if ! [[ $ip =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]; then
	echo "Adresse IP introuvable ou invalide (« $ip ») : passe-la en argument." >&2
	exit 1
fi

if [ -e certs/rootCA-key.pem ]; then
	echo "certs/rootCA-key.pem existe : c'est la clé privée de la CA, elle n'a rien à faire ici. Supprime-la." >&2
	exit 1
fi

caroot=$(mkcert -CAROOT)
mkdir -p certs
# Crée aussi la CA dans $caroot si elle n'existe pas encore (sans l'installer sur ce PC).
mkcert -cert-file certs/site.crt -key-file certs/site.key "$ip" localhost 127.0.0.1 ::1
cp "$caroot/rootCA.pem" certs/tps-arena-ca.crt
chmod 644 certs/site.crt certs/tps-arena-ca.crt
chmod 600 certs/site.key

echo
echo "Certificat créé pour $ip (valable aussi pour localhost)."
if command -v openssl >/dev/null 2>&1; then
	echo "Empreinte SHA-256 de la CA, à comparer sur le téléphone :"
	openssl x509 -noout -fingerprint -sha256 -in certs/tps-arena-ca.crt | sed 's/^.*=/  /'
fi

if docker compose ps --status running --services 2>/dev/null | grep -qx site; then
	docker compose restart site
	port=$(docker compose port site 443 2>/dev/null | sed 's/.*://')
	echo "Site redémarré : app sur https://$ip:${port:-8443}/app/ ; certificat de la CA sur http://$ip:${SITE_PORT:-8080}/ca.crt"
else
	echo "Le conteneur ne tourne pas : docker compose up -d --build"
fi
