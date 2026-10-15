import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Build de l'app mobile (PWA « TPS Arena Companion »), servie sous /app/ à côté de la vitrine.
// Build séparé : ses fichiers, son service worker et son cache restent sous /app/, sans
// toucher à la vitrine. `npm run build` fait la vitrine puis cette app (dans dist/app/).
export default defineConfig({
  root: 'app',
  base: '/app/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Fichier registerSW.js à part : la CSP du site interdit les scripts inline.
      injectRegister: 'script-defer',
      scope: '/app/',
      // /manifest.json est déjà pris par la liste des builds de la vitrine.
      manifestFilename: 'app.webmanifest',
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        id: '/app/',
        name: 'TPS Arena Companion',
        short_name: 'TPS Arena',
        description: 'Tes statistiques, ta progression et tes succès TPS Arena.',
        lang: 'fr',
        start_url: '/app/',
        scope: '/app/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#07090f',
        theme_color: '#07090f',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // L'app shell (HTML, JS, CSS, polices, icônes) est mis en cache à l'installation.
        // Les réponses de l'API ne passent pas par le service worker : l'app garde elle-même
        // les dernières données affichées (src/lib/cache.ts), par joueur.
        globPatterns: ['**/*.{html,js,css,ttf,otf,png,svg,webmanifest}'],
        navigateFallback: '/app/index.html',
        navigateFallbackAllowlist: [/^\/app\//],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  publicDir: 'public',
  build: {
    outDir: '../dist/app',
    emptyOutDir: true,
    assetsInlineLimit: 0,
  },
  server: {
    port: 5174,
    // En développement, le web-bff tourne sur la boucle locale de l'hôte (port 8006).
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8006',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  preview: { port: 4174 },
});
