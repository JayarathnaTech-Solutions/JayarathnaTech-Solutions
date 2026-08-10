import sharp from 'sharp'
import { fileURLToPath } from 'node:url'

// Default social-share preview image (1200×630, the standard OG/Twitter card
// size) used by src/lib/siteInfo.ts's DEFAULT_OG_IMAGE for every page that
// doesn't supply a more specific one. Composited from existing brand assets
// so there's no dependency on a designer-provided graphic.
const WIDTH = 1200
const HEIGHT = 630

const assetsDir = new URL('../src/assets/', import.meta.url)
const backgroundPath = fileURLToPath(new URL('background-image1.webp', assetsDir))
const logoPath = fileURLToPath(new URL('logo-dark.png', assetsDir))
const outputPath = fileURLToPath(new URL('../public/og-image.jpg', import.meta.url))

const background = await sharp(backgroundPath)
    .resize({ width: WIDTH, height: HEIGHT, fit: 'cover', position: 'centre' })
    .toBuffer()

// Dark scrim so white text stays legible over the photo, mirroring the
// treatment HeroBackdrop.tsx uses on the live hero sections.
const scrim = Buffer.from(`
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="fade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#0f172a" stop-opacity="0.92" />
        <stop offset="65%" stop-color="#0f172a" stop-opacity="0.55" />
        <stop offset="100%" stop-color="#0f172a" stop-opacity="0.15" />
      </linearGradient>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#fade)" />
  </svg>
`)

const logo = await sharp(logoPath).resize({ width: 260 }).toBuffer()
const logoMeta = await sharp(logo).metadata()

const text = Buffer.from(`
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .title { font-family: Arial, sans-serif; font-weight: 800; font-size: 52px; fill: #ffffff; }
      .tagline { font-family: Arial, sans-serif; font-weight: 500; font-size: 27px; fill: #cbd5e1; }
      .badge { font-family: Arial, sans-serif; font-weight: 600; font-size: 20px; fill: #93c5fd; letter-spacing: 0.5px; }
    </style>
    <text x="90" y="330" class="badge">SRI LANKA &#8226; WORLDWIDE</text>
    <text x="90" y="390" class="title">Software Solutions,</text>
    <text x="90" y="450" class="title">Built to Grow Your Business</text>
    <text x="90" y="500" class="tagline">Web &#8226; E-commerce &#8226; Mobile &#8226; SaaS &#8226; Custom Software</text>
  </svg>
`)

await sharp(background)
    .composite([
        { input: scrim, top: 0, left: 0 },
        { input: logo, top: 64, left: 90 },
        { input: text, top: 0, left: 0 },
    ])
    .jpeg({ quality: 85 })
    .toFile(outputPath)

console.log(`generate-og-image: wrote public/og-image.jpg (${WIDTH}x${HEIGHT}, logo ${logoMeta.width}x${logoMeta.height})`)
