import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

/**
 * Converts common site images to `.webp` next to the originals.
 * - Keeps originals (safe rollback / legacy fallback if needed).
 * - Keeps dimensions (no resize) to avoid styling/layout changes.
 *
 * Targets:
 *   - repo root (logo files)
 *   - src/assets
 *   - public (static HTML assets)
 */

const ROOT = process.cwd()
const TARGET_DIRS = [
  path.join(ROOT, '.'), // root logo files
  path.join(ROOT, 'src', 'assets'),
  path.join(ROOT, 'public'),
]

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png'])

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'fonts',
  'optimized',
])

function isConvertible(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  return IMAGE_EXTS.has(ext)
}

function shouldSkipDir(dirName) {
  return SKIP_DIRS.has(dirName)
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const out = []

  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) {
      if (shouldSkipDir(e.name)) continue
      out.push(...(await walk(full)))
    } else if (e.isFile()) {
      out.push(full)
    }
  }

  return out
}

async function main() {
  const files = []
  for (const d of TARGET_DIRS) {
    files.push(...(await walk(d)))
  }

  const convertible = files.filter(isConvertible)

  let converted = 0
  let skipped = 0

  for (const absIn of convertible) {
    const dir = path.dirname(absIn)
    const base = path.basename(absIn, path.extname(absIn))
    const absOut = path.join(dir, `${base}.webp`)

    // Skip if output exists and is newer/equal.
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
        quality: 75,
        effort: 5,
        smartSubsample: true,
      })
      .toFile(absOut)

    converted++
  }

  // eslint-disable-next-line no-console
  console.log(`Site images → webp: converted=${converted}, skipped=${skipped}, total=${convertible.length}`)
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})

