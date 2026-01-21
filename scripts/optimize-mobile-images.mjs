import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

/**
 * Generates optimized WebP variants for `src/mobile/assets/**` images.
 *
 * Output:
 *   src/mobile/assets/optimized/<relative-dir>/<name>-w<width>.webp
 *   src/mobile/assets/optimized/<relative-dir>/<name>-lq.webp
 *   src/mobile/assets/optimized/manifest.json
 */

const ROOT = process.cwd()
const ASSETS_DIR = path.join(ROOT, 'src', 'mobile', 'assets')
const OUT_DIR = path.join(ASSETS_DIR, 'optimized')

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png'])
const TARGET_WIDTHS = [320, 480, 640, 768, 1024, 1280, 1536]
const LQ_WIDTH = 32

function isImageFile(filePath) {
  return IMAGE_EXTS.has(path.extname(filePath).toLowerCase())
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const out = []
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) {
      if (e.name === 'fonts' || e.name === 'optimized') continue
      out.push(...(await walk(full)))
    } else if (e.isFile()) {
      out.push(full)
    }
  }
  return out
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true })
}

async function main() {
  await ensureDir(OUT_DIR)

  const files = (await walk(ASSETS_DIR)).filter(isImageFile)
  const manifest = {
    generatedAt: new Date().toISOString(),
    sourceDir: 'src/mobile/assets',
    outputDir: 'src/mobile/assets/optimized',
    images: [],
  }

  for (const absIn of files) {
    const relFromAssets = path.relative(ASSETS_DIR, absIn).replaceAll('\\', '/')
    const relDir = path.posix.dirname(relFromAssets)
    const ext = path.extname(relFromAssets)
    const base = path.posix.basename(relFromAssets, ext)

    const outDir = path.join(OUT_DIR, relDir === '.' ? '' : relDir)
    await ensureDir(outDir)

    const image = sharp(absIn, { failOn: 'none' })
    const meta = await image.metadata()
    const srcW = meta.width ?? 0
    const srcH = meta.height ?? 0

    const variants = []
    for (const w of TARGET_WIDTHS) {
      if (!srcW || w > srcW) continue
      const outName = `${base}-w${w}.webp`
      const absOut = path.join(outDir, outName)
      await sharp(absIn, { failOn: 'none' })
        .resize({ width: w, withoutEnlargement: true })
        .webp({
          quality: 72,
          effort: 5,
          smartSubsample: true,
        })
        .toFile(absOut)
      variants.push({
        width: w,
        file: path.posix.join('optimized', relDir === '.' ? '' : relDir, outName).replaceAll('\\', '/'),
      })
    }

    // LQ placeholder (tiny, heavily compressed)
    const lqName = `${base}-lq.webp`
    const absLq = path.join(outDir, lqName)
    await sharp(absIn, { failOn: 'none' })
      .resize({ width: LQ_WIDTH, withoutEnlargement: true })
      .webp({ quality: 35, effort: 5 })
      .toFile(absLq)

    manifest.images.push({
      source: relFromAssets,
      sourceWidth: srcW,
      sourceHeight: srcH,
      lq: path.posix
        .join('optimized', relDir === '.' ? '' : relDir, lqName)
        .replaceAll('\\', '/'),
      variants,
    })
  }

  const manifestPath = path.join(OUT_DIR, 'manifest.json')
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8')

  // eslint-disable-next-line no-console
  console.log(`Optimized ${manifest.images.length} images → ${path.relative(ROOT, OUT_DIR)}`)
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})

