#!/bin/sh
# Publie le nom tpsarena.local en mDNS (Avahi) vers l'adresse IP actuelle de la machine.
# Utilisé par tpsarena-alias.service quand on garde le nom d'hôte de la machine.
# Si l'adresse change (DHCP), redémarrer le service : systemctl restart tpsarena-alias
set -eu

NAME="${1:-tpsarena.local}"

# Adresse de l'interface qui porte la route par défaut (aucun paquet n'est envoyé).
IP="$(ip -4 route get 1.1.1.1 2>/dev/null | sed -n 's/.* src \([0-9.]*\).*/\1/p')"
if [ -z "$IP" ]; then
	echo "Aucune adresse IPv4 trouvée : la machine est-elle connectée au réseau ?" >&2
	exit 1
fi

echo "Publication de $NAME -> $IP"
exec avahi-publish --address --no-reverse "$NAME" "$IP"
