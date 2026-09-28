import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Tetris',
    short_name: 'Tetris',
    description: 'Guideline Tetris: 7-bag randomizer, SRS, hold, ghost piece, T-spins',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#05070d',
    theme_color: '#05070d',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
