// Rasterises the original SVG icons in public/icons into the PNG sizes the manifest needs.
import sharp from 'sharp'
import { readFileSync } from 'node:fs'

const jobs = [
  ['icon.svg', 'icon-512.png', 512],
  ['icon.svg', 'icon-192.png', 192],
  ['icon.svg', 'apple-touch-icon.png', 180],
  ['icon-maskable.svg', 'icon-512-maskable.png', 512],
]
for (const [src, out, size] of jobs) {
  await sharp(readFileSync(new URL(`../public/icons/${src}`, import.meta.url).pathname))
    .resize(size, size)
    .png()
    .toFile(new URL(`../public/icons/${out}`, import.meta.url).pathname)
  console.log('wrote', out)
}
