import assert from 'node:assert/strict'
import test from 'node:test'
import os from 'node:os'
import path from 'node:path'
import { promises as fs } from 'node:fs'
import {
  applyArtistReuseRule,
  artistKey,
  displayNameFor,
  loadArtistUsage,
  recentlyUsedArtists,
  recordArtistUsage,
  saveArtistUsage
} from '../lib/tunes-artist-usage.js'

async function tempUsageFile(weeks = {}) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'tunes-artist-usage-'))
  const usagePath = path.join(dir, '.tunes-artist-usage.json')
  await saveArtistUsage({ version: 1, weeks }, usagePath)
  return usagePath
}

test('artistKey matches across filename, humanised and cased spellings', () => {
  assert.equal(artistKey('Tears-for-Fears.jpg'), artistKey('Tears for Fears'))
  assert.equal(artistKey('Tears for Fears'), artistKey('Tears For Fears'))
  assert.equal(artistKey('T-Rex.jpg'), artistKey('T. Rex'))
  assert.notEqual(artistKey('Pink Floyd'), artistKey('Pink Fairies'))
})

test('displayNameFor turns a photo path into a readable artist name', () => {
  assert.equal(displayNameFor('/a/b/artists/Tears-for-Fears.jpg'), 'Tears for Fears')
  assert.equal(displayNameFor('Public_Service_Broadcasting.png'), 'Public Service Broadcasting')
  assert.equal(displayNameFor('Pink Floyd'), 'Pink Floyd')
})

test('recentlyUsedArtists only looks backwards, inside the window', async () => {
  const usagePath = await tempUsageFile({
    '2026-01-05': ['Tears for Fears'],
    '2026-02-16': ['Pink Floyd', 'Crowded House'],
    '2026-03-02': ['Propagandhi'],
    '2026-03-30': ['Slowdive']
  })

  // 2026-03-23 with a 6-week window reaches back to 2026-02-09.
  const used = await recentlyUsedArtists('2026-03-23', 6, usagePath)
  assert.deepEqual(
    [...used.keys()].sort(),
    [artistKey('Crowded House'), artistKey('Pink Floyd'), artistKey('Propagandhi')].sort()
  )
  // 2026-01-05 is 11 weeks back, outside the window.
  assert.equal(used.has(artistKey('Tears for Fears')), false)
  // 2026-03-30 is in the future relative to the target week.
  assert.equal(used.has(artistKey('Slowdive')), false)
  assert.equal(used.get(artistKey('Pink Floyd')).weeksAgo, 5)
})

test('a week never blocks itself, so regenerating is idempotent', async () => {
  const usagePath = await tempUsageFile({ '2026-03-23': ['Pink Floyd'] })
  const used = await recentlyUsedArtists('2026-03-23', 6, usagePath)
  assert.equal(used.size, 0)
})

test('a zero or missing window disables the lookup', async () => {
  const usagePath = await tempUsageFile({ '2026-03-16': ['Pink Floyd'] })
  assert.equal((await recentlyUsedArtists('2026-03-23', 0, usagePath)).size, 0)
  assert.equal((await recentlyUsedArtists('', 6, usagePath)).size, 0)
})

test('applyArtistReuseRule drops recent artists and keeps play rank', () => {
  const recentlyUsed = new Map([
    [artistKey('Pink Floyd'), { name: 'Pink Floyd', week: '2026-02-16', weeksAgo: 5 }]
  ])
  const result = applyArtistReuseRule({
    imagePaths: ['/a/Pink-Floyd.jpg', '/a/Slowdive.jpg', '/a/Beth-Orton.jpg'],
    recentlyUsed,
    minimum: 2
  })

  assert.deepEqual(result.imagePaths, ['/a/Slowdive.jpg', '/a/Beth-Orton.jpg'])
  assert.equal(result.blocked.length, 1)
  assert.equal(result.relaxed.length, 0)
  assert.equal(result.stillBlocked.length, 1)
})

test('a thin week relaxes least recently used first, appended after fresh faces', () => {
  const recentlyUsed = new Map([
    [artistKey('Pink Floyd'), { name: 'Pink Floyd', week: '2026-02-16', weeksAgo: 2 }],
    [artistKey('Tori Amos'), { name: 'Tori Amos', week: '2026-01-26', weeksAgo: 5 }],
    [artistKey('Crowded House'), { name: 'Crowded House', week: '2026-02-02', weeksAgo: 4 }]
  ])
  const result = applyArtistReuseRule({
    imagePaths: ['/a/Pink-Floyd.jpg', '/a/Tori-Amos.jpg', '/a/Crowded-House.jpg', '/a/Big-Big-Train.jpg'],
    recentlyUsed,
    minimum: 3
  })

  // The one unused artist leads; the two oldest-used come back, oldest first.
  assert.deepEqual(result.imagePaths, ['/a/Big-Big-Train.jpg', '/a/Tori-Amos.jpg', '/a/Crowded-House.jpg'])
  assert.deepEqual(result.relaxed.map(item => item.name), ['Tori Amos', 'Crowded House'])
  assert.deepEqual(result.stillBlocked.map(item => item.name), ['Pink Floyd'])
})

test('the rule cannot invent artists it was never given', () => {
  const recentlyUsed = new Map([
    [artistKey('Pink Floyd'), { name: 'Pink Floyd', week: '2026-02-16', weeksAgo: 2 }]
  ])
  const result = applyArtistReuseRule({
    imagePaths: ['/a/Pink-Floyd.jpg'],
    recentlyUsed,
    minimum: 4
  })

  assert.deepEqual(result.imagePaths, ['/a/Pink-Floyd.jpg'])
  assert.equal(result.relaxed.length, 1)
})

test('recordArtistUsage replaces a week rather than appending to it', async () => {
  const usagePath = await tempUsageFile({ '2026-03-23': ['Pink Floyd', 'T Rex'] })
  await recordArtistUsage('2026-03-23', ['/a/Slowdive.jpg', '/a/Beth-Orton.jpg'], usagePath)

  const usage = await loadArtistUsage(usagePath)
  assert.deepEqual(usage.weeks['2026-03-23'], ['Slowdive', 'Beth Orton'])
})

test('recordArtistUsage de-duplicates and stores display names', async () => {
  const usagePath = await tempUsageFile()
  await recordArtistUsage('2026-04-06', ['/a/Tears-for-Fears.jpg', '/a/Tears For Fears.png', '/a/Kraftwerk.jpg'], usagePath)

  const usage = await loadArtistUsage(usagePath)
  assert.deepEqual(usage.weeks['2026-04-06'], ['Tears for Fears', 'Kraftwerk'])
})

test('saved weeks are sorted so the committed file diffs cleanly', async () => {
  const usagePath = await tempUsageFile()
  await recordArtistUsage('2026-05-11', ['/a/Belly.jpg'], usagePath)
  await recordArtistUsage('2026-01-05', ['/a/Kraftwerk.jpg'], usagePath)

  const raw = await fs.readFile(usagePath, 'utf-8')
  assert.ok(raw.indexOf('2026-01-05') < raw.indexOf('2026-05-11'))
})

test('a missing usage file reads as empty rather than throwing', async () => {
  const usage = await loadArtistUsage('/nonexistent/.tunes-artist-usage.json')
  assert.deepEqual(usage, { version: 1, weeks: {} })
})
