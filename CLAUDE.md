# CLAUDE.md

Static showcase and download site for TPS Arena, served on the LAN at `http://<host-ip>:8080` (no local name: mDNS does not pass on the school Wi-Fi).
The README, UI text and commit messages are in French.

## Commands

- `npm run dev`: Vite dev server. A plugin in `vite.config.ts` serves `/manifest.json`, `/releases/` and `/screenshots/` from the local folders, like the container does.
- `npm run build`: `tsc --noEmit`, then the Vite build into `dist/`.
- `docker compose up -d --build`: production (host port `SITE_PORT`, default 8080; nginx listens on 80 inside the container).

## Architecture

- `docker/40-arena-manifest.sh` (POSIX sh, BusyBox) runs from the nginx image's `/docker-entrypoint.d/` and writes `manifest.json` (`builds.{windows,linux,macos}` = `{file,size,modified}` or `null`, plus `screenshots: string[]`). It then polls the mounted folders every `MANIFEST_REFRESH` seconds and regenerates the file when something changed. Keep `vite.config.ts` (dev) and `src/lib/manifest.ts` (types) in sync with it.
- `docker/nginx.conf`: `manifest.json` is `no-store`, `/assets/` is immutable, `/releases/` is forced to download. Security headers live in `security-headers.conf` and are included in every location because `add_header` does not inherit.
- `src/components/NeonBackground.tsx` is a WebGL port of `TPSArena_Jeu/client/front/shaders/menu_background.gdshader`. Keep its constants identical to the Godot shader. The CSS fallback is in `.neon-bg__fallback`.
- The colors in `src/styles.css` come from `TPSArena_Jeu/client/front/scripts/ui/ui_theme.gd`, the panel and button styles (chamfered top-left and bottom-right corners, 12 px / 8 px) from `front/ui/theme/neon_theme.tres`. CSS draws a chamfer with `clip-path` plus an `::after` that redraws the diagonal in `--bc`: set `--bc`, never `border-color`, on those elements. The presentation (specialists, classes, bonuses, maps, modes) and controls content comes from the game's README, `front/data/classes/*.tres`, `scripts/inputs.gd`, `scripts/pickups.gd` and `scripts/maps/*`. Re-check them when the game changes.
- The site is served over plain HTTP, which is not a secure context, so `navigator.clipboard` is unavailable. `src/lib/clipboard.ts` falls back to `execCommand('copy')`.
