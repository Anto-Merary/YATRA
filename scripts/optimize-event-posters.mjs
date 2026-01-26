import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

/**
 * Converts all PNG images in `src/assets/YATRA EVENT POSTERS/` to `.webp` (same filename, new extension).
 *
 * - Keeps original dimensions (no resize) to avoid any styling/layout changes.
 * - Leaves originals in place for easy rollback.
 */

const ROOT = process.cwd()
const IN_DIR = path.join(ROOT, 'src', 'assets', 'YATRA EVENT POSTERS')

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg'])

function isConvertible(fileName) {
  return IMAGE_EXTS.has(path.extname(fileName).toLowerCase())
}

async function main() {
  const entries = await fs.readdir(IN_DIR, { withFileTypes: true })
  const files = entries.filter((e) => e.isFile() && isConvertible(e.name)).map((e) => e.name)

  let converted = 0
  let skipped = 0
  let errors = 0

  console.log(`Found ${files.length} image files to process...\n`)

  for (const name of files) {
    const absIn = path.join(IN_DIR, name)
    const outName = name.replace(/\.(png|jpe?g)$/i, '.webp')
    const absOut = path.join(IN_DIR, outName)

    // If already exists and is newer/equal, skip.
    try {
      const [inStat, outStat] = await Promise.all([fs.stat(absIn), fs.stat(absOut)])
      if (outStat.mtimeMs >= inStat.mtimeMs) {
        console.log(`⏭️  Skipped: ${name} (WebP already exists and is up-to-date)`)
        skipped++
        continue
      }
    } catch {
      // output doesn't exist → proceed
    }

    try {
      await sharp(absIn, { failOn: 'none' })
        .webp({
          quality: 85,
          effort: 6,
          smartSubsample: true,
        })
        .toFile(absOut)

      const inSize = (await fs.stat(absIn)).size
      const outSize = (await fs.stat(absOut)).size
      const savings = ((1 - outSize / inSize) * 100).toFixed(1)

      console.log(`✅ Converted: ${name} → ${outName} (${savings}% smaller)`)
      converted++
    } catch (err) {
      console.error(`❌ Error converting ${name}:`, err.message)
      errors++
    }
  }

  console.log(`\n📊 Summary:`)
  console.log(`   Converted: ${converted}`)
  console.log(`   Skipped: ${skipped}`)
  console.log(`   Errors: ${errors}`)
  console.log(`   Total: ${files.length}`)
  console.log(`\n📁 Output directory: ${path.relative(ROOT, IN_DIR)}`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
