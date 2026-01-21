import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

/**
 * Converts all images in `src/assets/events images/` to `.webp` (same filename, new extension).
 *
 * - Keeps original dimensions (no resize) to avoid any styling/layout changes.
 * - Leaves originals in place for easy rollback.
 */

const ROOT = process.cwd()
const IN_DIR = path.join(ROOT, 'src', 'assets', 'events images')

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png'])

function isConvertible(fileName) {
  return IMAGE_EXTS.has(path.extname(fileName).toLowerCase())
}

async function main() {
  const entries = await fs.readdir(IN_DIR, { withFileTypes: true })
  const files = entries.filter((e) => e.isFile() && isConvertible(e.name)).map((e) => e.name)

  let converted = 0
  let skipped = 0

  for (const name of files) {
    const absIn = path.join(IN_DIR, name)
    const outName = name.replace(/\.(png|jpe?g)$/i, '.webp')
    const absOut = path.join(IN_DIR, outName)

    // If already exists and is newer/equal, skip.
    try {
      const [inStat, outStat] = await Promise.all([fs.stat(absIn), fs.stat(absOut)])
      if (outStat.mtimeMs >= inStat.mtimeMs) {
        skipped++
        continue
      }
    } catch {
      // output doesn't exist → proceed
    }

    await sharp(absIn, { failOn: 'none' })
      .webp({
        quality: 72,
        effort: 5,
        smartSubsample: true,
      })
      .toFile(absOut)

    converted++
  }

  // eslint-disable-next-line no-console
  console.log(`Events images → webp: converted=${converted}, skipped=${skipped}, total=${files.length}`)
  // eslint-disable-next-line no-console
  console.log(`Output dir: ${path.relative(ROOT, IN_DIR)}`)
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})

