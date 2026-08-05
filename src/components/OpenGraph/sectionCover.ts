import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

// Hub routes and the two static pages that get a card have no cover of their
// own, so each section points at one shared image here — every tag hub shares
// tags.png, every book hub shares books.png, and so on. That is what puts them
// on the Scrim card instead of the coverless Plate.
const SECTIONS_DIR = path.join(process.cwd(), 'src/images/opengraph/sections')

/**
 * Resolves a section image and digests its bytes.
 *
 * The digest belongs in the caller's cache key. Without it, regenerating a
 * section image leaves every card in that section stale until someone
 * remembers to bump the design salt — the cards look identical to the old ones
 * and nothing fails, so the mistake is invisible until it ships.
 */
export function sectionCover(name: string) {
  const file = path.join(SECTIONS_DIR, `${name}.png`)
  const digest = crypto
    .createHash('md5')
    .update(fs.readFileSync(file))
    .digest('hex')
  return { path: file, digest }
}
