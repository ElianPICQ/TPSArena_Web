#!/bin/sh
# Génère manifest.json à partir des dossiers montés (builds du jeu et captures d'écran).
#
# Lancé par l'entrée de l'image nginx (/docker-entrypoint.d/) à chaque démarrage du
# conteneur, puis gardé en tâche de fond : toutes les MANIFEST_REFRESH secondes, il
# regarde si un fichier a été ajouté, remplacé ou supprimé, et régénère le manifeste
# seulement dans ce cas (le calcul du SHA-256 des builds prend quelques secondes).
# MANIFEST_REFRESH=0 désactive la surveillance : il faut alors `docker compose restart`.
#
# Shell POSIX + outils BusyBox (stat, date, sha256sum) : rien à installer.
set -eu

RELEASES_DIR="${RELEASES_DIR:-/srv/releases}"
SCREENSHOTS_DIR="${SCREENSHOTS_DIR:-/srv/screenshots}"
OUT="${MANIFEST_PATH:-/usr/share/nginx/html/manifest.json}"
REFRESH="${MANIFEST_REFRESH:-30}"

log() {
	echo "arena-manifest: $*"
}

# Échappe une chaîne pour l'insérer entre guillemets dans du JSON.
json_str() {
	printf '"%s"' "$(printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g')"
}

# Nom utilisable : pas de fichier caché, pas de saut de ligne ni de tabulation.
usable_name() {
	case "$1" in
		.* | *"
"* | *"	"*) return 1 ;;
	esac
	return 0
}

# Fichier à proposer pour une plateforme : le nom attendu s'il existe, sinon le fichier
# le plus récent qui porte la bonne extension (seule la dernière version est proposée).
pick_build() {
	dir="$1" expected="$2" ext="$3"
	if [ -f "$dir/$expected" ]; then
		printf '%s' "$expected"
		return
	fi
	best="" best_mtime=-1
	for path in "$dir"/*"$ext"; do
		[ -f "$path" ] || continue
		name="${path##*/}"
		usable_name "$name" || continue
		mtime="$(stat -c %Y "$path")"
		if [ "$mtime" -gt "$best_mtime" ]; then
			best="$name" best_mtime="$mtime"
		fi
	done
	printf '%s' "$best"
}

# Objet JSON d'une plateforme, ou null si aucun build n'est présent.
build_json() {
	dir="$RELEASES_DIR/$1"
	name="$(pick_build "$dir" "$2" "$3")"
	if [ -z "$name" ]; then
		printf 'null'
		return
	fi
	path="$dir/$name"
	size="$(stat -c %s "$path")"
	mtime="$(stat -c %Y "$path")"
	modified="$(date -u -d "@$mtime" +%Y-%m-%dT%H:%M:%SZ)"
	sha="$(sha256sum "$path" | cut -d ' ' -f 1)"
	printf '{"file":%s,"size":%s,"modified":"%s","sha256":"%s"}' \
		"$(json_str "$name")" "$size" "$modified" "$sha"
}

screenshots_json() {
	first=1
	printf '['
	for path in "$SCREENSHOTS_DIR"/*; do
		[ -f "$path" ] || continue
		name="${path##*/}"
		usable_name "$name" || continue
		case "$(printf '%s' "$name" | tr 'A-Z' 'a-z')" in
			*.png | *.jpg | *.jpeg | *.webp | *.avif | *.gif) ;;
			*) continue ;;
		esac
		[ "$first" = 1 ] || printf ','
		first=0
		printf '%s' "$(json_str "$name")"
	done
	printf ']'
}

generate() {
	tmp="$OUT.tmp"
	{
		printf '{"generated":"%s",' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
		printf '"builds":{'
		printf '"windows":%s,' "$(build_json windows ArenaTPS.exe .exe)"
		printf '"linux":%s,' "$(build_json linux ArenaTPS.x86_64 .x86_64)"
		printf '"macos":%s' "$(build_json macos ArenaTPS.zip .zip)"
		printf '},"screenshots":%s}\n' "$(screenshots_json)"
	} >"$tmp"
	chmod 644 "$tmp"
	mv -f "$tmp" "$OUT"
	log "manifeste généré ($OUT)"
}

# Empreinte des dossiers surveillés : nom, taille et date de chaque fichier.
signature() {
	for path in "$RELEASES_DIR"/*/* "$SCREENSHOTS_DIR"/*; do
		[ -f "$path" ] && stat -c '%n %s %Y' "$path"
	done
	return 0
}

watch() {
	last="$(signature)"
	while sleep "$REFRESH"; do
		current="$(signature)"
		if [ "$current" != "$last" ]; then
			log "changement détecté dans les dossiers montés"
			generate || log "échec de la génération du manifeste"
			last="$current"
		fi
	done
}

generate
case "$REFRESH" in
	'' | 0 | *[!0-9]*) log "surveillance désactivée (MANIFEST_REFRESH=$REFRESH)" ;;
	*)
		log "surveillance des dossiers toutes les ${REFRESH} s"
		watch </dev/null &
		;;
esac
