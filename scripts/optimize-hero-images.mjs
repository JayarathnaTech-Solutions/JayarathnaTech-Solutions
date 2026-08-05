import sharp from 'sharp'
import { fileURLToPath } from 'node:url'

const ASSETS_DIR = new URL('../src/assets/', import.meta.url)
const SOURCES = ['background-image1.jpg', 'background-image2.jpg', 'background-image3.jpg']

for (const source of SOURCES) {
    const inputPath = fileURLToPath(new URL(source, ASSETS_DIR))
    const outputName = source.replace(/\.jpg$/, '.webp')
    const outputPath = fileURLToPath(new URL(outputName, ASSETS_DIR))

    // sharp reads the real file signature, not the extension — handles the
    // hero images that turned out to be mislabeled (PNG content in a .jpg file).
    await sharp(inputPath)
        .resize({ width: 1600, withoutEnlargement: true })
        .webp({ quality: 78 })
        .toFile(outputPath)

    console.log(`optimize-hero-images: wrote ${outputName}`)
}
