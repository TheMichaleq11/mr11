// Generuje ikony aplikacji z logo Andromedy (assets/logo/).
// Uruchom: npm run icons (robi się też automatycznie przed buildem)
import sharp from 'sharp';
import { mkdir, copyFile } from 'node:fs/promises';

const MASTER = 'assets/logo/ikona-1024.png';            // z tłem kosmosu — iPhone wymaga tła (przezroczystość wypełnia czarnym)
const TRANSPARENT = 'assets/logo/znak-1024.png';        // sam znak, bez tła — Android i przeglądarki
const MASKABLE = 'assets/logo/ikona-maskable-1024.png'; // znak mniejszy, w strefie bezpiecznej dla Androida

await mkdir('public/icons', { recursive: true });

const out = [
  [TRANSPARENT, 'icon-192.png', 192],
  [TRANSPARENT, 'icon-512.png', 512],
  [MASKABLE, 'maskable-512.png', 512],
  [MASTER, 'apple-touch-icon.png', 180],
];
for (const [src, name, size] of out) {
  await sharp(src).resize(size, size, { kernel: 'lanczos3' }).png().toFile(`public/icons/${name}`);
}
await sharp('assets/logo/favicon-64.png').png().toFile('app/icon.png');
await sharp('assets/logo/favicon-64.png').resize(32, 32).png().toFile('public/icons/favicon-32.png');
await copyFile('assets/logo/favicon.svg', 'public/icons/favicon.svg'); // wektorowa ikonka karty
console.log('ikony gotowe');
