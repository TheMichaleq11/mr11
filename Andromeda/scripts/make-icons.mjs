// Generuje ikony PWA z jednego SVG (galaktyka na niebieskim tle).
// Uruchom: npm install --no-save sharp && npm run icons
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';

const galaxy = (size, pad) => {
  const s = 24;
  const inner = size - pad * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#2F5BEA"/>
  <g transform="translate(${pad} ${pad}) scale(${inner / s})" fill="none" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round">
    <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-30 12 12)"/>
    <ellipse cx="12" cy="12" rx="5.5" ry="2" transform="rotate(-30 12 12)"/>
    <circle cx="12" cy="12" r="1.5" fill="#FFFFFF" stroke="none"/>
    <circle cx="19.5" cy="4.5" r="0.7" fill="#FFFFFF" stroke="none"/>
    <circle cx="4.2" cy="18.8" r="0.5" fill="#FFFFFF" stroke="none"/>
  </g>
</svg>`;
};

await mkdir('public/icons', { recursive: true });

const out = [
  ['icon-192.png', 192, 30],
  ['icon-512.png', 512, 80],
  ['maskable-512.png', 512, 130],
  ['apple-touch-icon.png', 180, 28],
];
for (const [name, size, pad] of out) {
  await sharp(Buffer.from(galaxy(size, pad))).png().toFile(`public/icons/${name}`);
}
await writeFile('public/icons/icon.svg', galaxy(512, 80));
await sharp(Buffer.from(galaxy(64, 8))).png().toFile('app/icon.png');
console.log('ikony gotowe');
