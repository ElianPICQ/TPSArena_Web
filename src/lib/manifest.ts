import { useEffect, useState } from 'react';
import type { Platform } from './platforms';

/** Un build du jeu, tel que décrit par le manifeste généré au démarrage du conteneur. */
export interface Build {
  file: string;
  size: number;
  modified: string;
  sha256: string;
}

export interface Manifest {
  generated: string;
  builds: Record<Platform, Build | null>;
  screenshots: string[];
}

export type ManifestState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; manifest: Manifest };

const EMPTY: Manifest = {
  generated: '',
  builds: { windows: null, linux: null, macos: null },
  screenshots: [],
};

function normalize(raw: unknown): Manifest {
  const data = (raw ?? {}) as Partial<Manifest>;
  return {
    generated: data.generated ?? '',
    builds: { ...EMPTY.builds, ...(data.builds ?? {}) },
    screenshots: Array.isArray(data.screenshots) ? data.screenshots.filter((s) => typeof s === 'string') : [],
  };
}

export function useManifest(): ManifestState {
  const [state, setState] = useState<ManifestState>({ status: 'loading' });
  useEffect(() => {
    const controller = new AbortController();
    fetch('/manifest.json', { cache: 'no-store', signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => setState({ status: 'ready', manifest: normalize(json) }))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setState({ status: 'error' });
      });
    return () => controller.abort();
  }, []);
  return state;
}

export function buildUrl(platform: Platform, build: Build): string {
  return `/releases/${platform}/${encodeURIComponent(build.file)}`;
}

export function screenshotUrl(file: string): string {
  return `/screenshots/${encodeURIComponent(file)}`;
}

const sizeFormat = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1, minimumFractionDigits: 1 });
const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' });

export function formatSize(bytes: number): string {
  return `${sizeFormat.format(bytes / (1024 * 1024))} Mo`;
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : dateFormat.format(date);
}
