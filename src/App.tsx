import { useState } from 'react';
import { About } from './components/About';
import { Companion } from './components/Companion';
import { Controls } from './components/Controls';
import { Downloads } from './components/Downloads';
import { Footer } from './components/Footer';
import { Gallery } from './components/Gallery';
import { Hero } from './components/Hero';
import { Nav } from './components/Nav';
import { NeonBackground } from './components/NeonBackground';
import { useManifest } from './lib/manifest';
import { detectPlatform } from './lib/platforms';

export function App() {
  const [platform] = useState(detectPlatform);
  const state = useManifest();

  return (
    <>
      <NeonBackground />
      <Nav />
      <main id="contenu" tabIndex={-1}>
        <Hero platform={platform} state={state} />
        <About />
        <Gallery state={state} />
        <Downloads state={state} detected={platform} />
        <Companion />
        <Controls />
      </main>
      <Footer />
    </>
  );
}
