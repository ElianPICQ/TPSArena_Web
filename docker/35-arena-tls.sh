#!/bin/sh
# Lancé par l'entrypoint de l'image nginx (/docker-entrypoint.d/) à chaque démarrage du
# conteneur : choisit HTTP seul ou HTTP + HTTPS selon la présence du certificat mkcert
# (certs/ sur l'hôte, monté en lecture seule), et règle l'adresse du web-bff et le port HTTPS.
set -eu

CERT=/etc/nginx/certs/site.crt
KEY=/etc/nginx/certs/site.key
SNIPPETS=/etc/nginx/snippets
HTTPS_PORT=${SITE_HTTPS_PORT:-8443}
WEB_BFF=${WEB_BFF_UPSTREAM:-web-bff:8006}
REALTIME=${REALTIME_UPSTREAM:-realtime:8005}

case $HTTPS_PORT in
	'' | *[!0-9]*) echo "35-arena-tls: SITE_HTTPS_PORT invalide : $HTTPS_PORT" >&2; exit 1 ;;
esac
for upstream in "$WEB_BFF" "$REALTIME"; do
	case $upstream in
		'' | *[!A-Za-z0-9.:_-]*) echo "35-arena-tls: adresse amont invalide : $upstream" >&2; exit 1 ;;
	esac
done

sed -e "s|@WEB_BFF@|$WEB_BFF|g" -e "s|@REALTIME@|$REALTIME|g" /etc/arena/app-locations.conf >"$SNIPPETS/app-locations.conf"
sed "s|@HTTPS_PORT@|$HTTPS_PORT|g" /etc/arena/app-redirect.conf >"$SNIPPETS/app-redirect.conf"

if [ -r "$CERT" ] && [ -r "$KEY" ]; then
	cp /etc/arena/nginx-https.conf /etc/nginx/conf.d/default.conf
	echo "35-arena-tls: certificat trouvé, HTTPS actif (port $HTTPS_PORT sur l'hôte) ; app sur https://<ip>:$HTTPS_PORT/app/"
else
	cp /etc/arena/nginx.conf /etc/nginx/conf.d/default.conf
	echo "35-arena-tls: pas de certificat dans certs/, HTTP seul (l'app ne s'installera pas) : voir scripts/certificat.sh"
fi
