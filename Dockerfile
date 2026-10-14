# syntax=docker/dockerfile:1

# --- Étape 1 : build du site (React + Vite) ---
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Étape 2 : service par nginx ---
FROM nginx:alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --chmod=755 docker/40-arena-manifest.sh /docker-entrypoint.d/40-arena-manifest.sh
COPY --from=build /app/dist /usr/share/nginx/html
RUN mkdir -p /srv/releases /srv/screenshots
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s \
    CMD wget -q -O /dev/null http://127.0.0.1/manifest.json || exit 1
