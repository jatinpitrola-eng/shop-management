// Generate PWA icons (192px, 512px, apple-touch-icon) from the Nexoryos logo SVG.
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.resolve(__dirname, '..', 'public');
const SVG = fs.readFileSync(path.join(PUBLIC, 'nexoryos-logo.svg'));

await sharp(SVG).resize(192, 192).png().toFile(path.join(PUBLIC, 'icon-192.png'));
await sharp(SVG).resize(512, 512).png().toFile(path.join(PUBLIC, 'icon-512.png'));
await sharp(SVG).resize(180, 180).png().toFile(path.join(PUBLIC, 'apple-touch-icon.png'));
await sharp(SVG).resize(32, 32).png().toFile(path.join(PUBLIC, 'favicon-32.png'));
console.log('✅ PWA icons generated.');
