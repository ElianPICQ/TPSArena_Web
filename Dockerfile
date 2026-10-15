# syntax=docker/dockerfile:1

# --- Étape 1 : build du site (React + Vite) ---
FROM node:24-alpine AS build
# Pas /app : Vite confondrait /app/index.html (vitrine) et le dossier app/ (PWA).
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Étape 2 : service par nginx ---
FROM nginx:alpine
# Configurations HTTP et HTTPS : 35-arena-tls.sh choisit au démarrage (certificat présent ou non).
COPY docker/nginx.conf docker/nginx-https.conf docker/app-locations.conf docker/app-redirect.conf /etc/arena/
COPY docker/security-headers.conf docker/server-common.conf docker/site-locations.conf /etc/nginx/snippets/
COPY --chmod=755 docker/35-arena-tls.sh /docker-entrypoint.d/35-arena-tls.sh
COPY --chmod=755 docker/40-arena-manifest.sh /docker-entrypoint.d/40-arena-manifest.sh
COPY --from=build /src/dist /usr/share/nginx/html
RUN mkdir -p /srv/releases /srv/screenshots /etc/nginx/certs
EXPOSE 80 443
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s \
    CMD wget -q -O /dev/null http://127.0.0.1/manifest.json || exit 1
