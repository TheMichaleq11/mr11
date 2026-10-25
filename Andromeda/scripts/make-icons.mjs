// Generuje ikony aplikacji z logo Andromedy (assets/logo/).
// Uruchom: npm run icons (robi się też automatycznie przed buildem)
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const MASTER = 'assets/logo/ikona-1024.png';            // kwadrat, bez zaokrągleń (iOS i Android same je dodają)
const MASKABLE = 'assets/logo/ikona-maskable-1024.png'; // znak mniejszy, w strefie bezpiecznej dla Androida

await mkdir('public/icons', { recursive: true });

const out = [
  [MASTER, 'icon-192.png', 192],
  [MASTER, 'icon-512.png', 512],
  [MASKABLE, 'maskable-512.png', 512],
  [MASTER, 'apple-touch-icon.png', 180],
];
for (const [src, name, size] of out) {
  await sharp(src).resize(size, size, { kernel: 'lanczos3' }).png().toFile(`public/icons/${name}`);
}
await sharp(MASTER).resize(64, 64, { kernel: 'lanczos3' }).png().toFile('app/icon.png');
console.log('ikony gotowe');
