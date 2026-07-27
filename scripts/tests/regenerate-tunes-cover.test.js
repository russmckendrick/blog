import assert from 'node:assert/strict'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import {
  DEFAULT_RECENT_WEEK_LIMIT,
  getRecentWeeks
} from '../regenerate-tunes-cover.js'

test('lists the most recent 20 Tunes weeks by default', async (t) => {
  const assetsDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tunes-weeks-'))
  t.after(() => fs.rm(assetsDir, { recursive: true, force: true }))

  const weeks = Array.from({ length: 22 }, (_, index) => {
    const day = String(index + 1).padStart(2, '0')
    return `2026-07-${day}-listened-to-this-week`
  })
  await Promise.all([
    ...weeks.map(week => fs.mkdir(path.join(assetsDir, week))),
    fs.mkdir(path.join(assetsDir, 'unrelated-folder'))
  ])

  const recentWeeks = await getRecentWeeks(undefined, assetsDir)

  assert.equal(DEFAULT_RECENT_WEEK_LIMIT, 20)
  assert.equal(recentWeeks.length, 20)
  assert.equal(recentWeeks[0], '2026-07-22-listened-to-this-week')
  assert.equal(recentWeeks.at(-1), '2026-07-03-listened-to-this-week')
})
