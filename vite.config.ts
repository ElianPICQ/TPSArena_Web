import { createHash } from 'node:crypto';
import { createReadStream, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import type { Connect, Plugin } from 'vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// En développement (`npm run dev`), imite le conteneur : sert /manifest.json, /releases/
// et /screenshots/ depuis les dossiers locaux. Le build de production n'en contient rien.
const ROOT = import.meta.dirname;
const RELEASES = resolve(ROOT, 'releases');
const SCREENSHOTS = resolve(ROOT, 'screenshots');
const BUILDS = {
  windows: ['ArenaTPS.exe', '.exe'],
  linux: ['ArenaTPS.x86_64', '.x86_64'],
  macos: ['ArenaTPS.zip', '.zip'],
} as const;
const IMAGE = /\.(png|jpe?g|webp|avif|gif)$/i;

const hashCache = new Map<string, string>();

function sha256(path: string, key: string): Promise<string> {
  const cached = hashCache.get(key);
  if (cached) return Promise.resolve(cached);
  return new Promise((ok, fail) => {
    const hash = createHash('sha256');
    createReadStream(path)
      .on('data', (chunk) => hash.update(chunk))
      .on('error', fail)
      .on('end', () => {
        const digest = hash.digest('hex');
        hashCache.set(key, digest);
        ok(digest);
      });
  });
}

function files(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((name) => !name.startsWith('.') && statSync(join(dir, name)).isFile());
}

async function build(platform: keyof typeof BUILDS) {
  const dir = join(RELEASES, platform);
  const [expected, ext] = BUILDS[platform];
  const candidates = files(dir).filter((name) => name.endsWith(ext));
  const name = candidates.includes(expected)
    ? expected
    : candidates.sort((a, b) => statSync(join(dir, b)).mtimeMs - statSync(join(dir, a)).mtimeMs)[0];
  if (!name) return null;
  const path = join(dir, name);
  const stat = statSync(path);
  return {
    file: name,
    size: stat.size,
    modified: new Date(Math.floor(stat.mtimeMs / 1000) * 1000).toISOString().replace('.000Z', 'Z'),
    sha256: await sha256(path, `${path}:${stat.size}:${stat.mtimeMs}`),
  };
}

function serveDir(prefix: string, dir: string, attachment: boolean): Connect.NextHandleFunction {
  return (req, res, next) => {
    const url = decodeURIComponent((req.url ?? '').split('?')[0]);
    if (!url.startsWith(prefix)) return next();
    const path = resolve(dir, '.' + url.slice(prefix.length - 1));
    if (!path.startsWith(dir + sep) || !existsSync(path) || !statSync(path).isFile()) {
      res.statusCode = 404;
      return res.end();
    }
    res.setHeader('Content-Length', statSync(path).size);
    if (attachment) {
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', 'attachment');
    }
    createReadStream(path).pipe(res);
  };
}

function localReleases(): Plugin {
  return {
    name: 'arena-local-releases',
    configureServer(server) {
      server.middlewares.use('/manifest.json', async (_req, res) => {
        const manifest = {
          generated: new Date().toISOString(),
          builds: {
            windows: await build('windows'),
            linux: await build('linux'),
            macos: await build('macos'),
          },
          screenshots: files(SCREENSHOTS).filter((name) => IMAGE.test(name)).sort(),
        };
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.end(JSON.stringify(manifest));
      });
      server.middlewares.use(serveDir('/releases/', RELEASES, true));
      server.middlewares.use(serveDir('/screenshots/', SCREENSHOTS, false));
    },
  };
}

export default defineConfig({
  plugins: [react(), localReleases()],
  build: {
    // Les polices restent des fichiers à part (pas d'URI data: dans le CSS).
    assetsInlineLimit: 0,
  },
});
