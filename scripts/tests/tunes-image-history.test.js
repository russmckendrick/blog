import test from 'node:test'
import assert from 'node:assert/strict'
import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'
import { appendHistory, recentConcepts, recentMedia, loadHistory } from '../lib/tunes-image-history.js'

async function writeHistory(entries) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'tunes-history-'))
  const file = path.join(dir, '.tunes-image-history.json')
  await fs.writeFile(file, JSON.stringify({ version: 1, entries }, null, 2))
  return file
}

const cover = (date, concept) => ({ type: 'cover', date, concept })

test('reads the window by date, not by position in the file', async () => {
  // The real file had summer weeks first and a backfilled winter block after them, so the
  // positional window served six-month-old concepts and hid the genuinely recent ones.
  const file = await writeHistory([
    cover('2026-08-31', 'Paper conservatory'),
    cover('2026-09-07', 'Moonlit amphitheater'),
    cover('2026-03-02', 'Laundry reliquary'),
    cover('2026-03-09', 'Rooftop observatory')
  ])

  assert.deepEqual(await recentConcepts('cover', 2, file), [
    'Moonlit amphitheater',
    'Paper conservatory'
  ])
})

test('keeps one entry per week so a re-recorded run cannot eat the window', async () => {
  const file = await writeHistory([
    cover('2026-08-31', 'First attempt'),
    cover('2026-08-31', 'Second attempt'),
    cover('2026-08-31', 'Third attempt'),
    cover('2026-08-24', 'Open-air gallery')
  ])

  assert.deepEqual(await recentConcepts('cover', 8, file), [
    'Third attempt',
    'Open-air gallery'
  ])
})

test('appending the same week again replaces it rather than stacking', async () => {
  const file = await writeHistory([cover('2026-09-14', 'Paper greenhouse')])
  await appendHistory(cover('2026-09-14', 'Regenerated concept'), file)

  const { entries } = await loadHistory(file)
  assert.equal(entries.length, 1)
  assert.equal(entries[0].concept, 'Regenerated concept')
})

test('writes the file back in date order', async () => {
  const file = await writeHistory([cover('2026-09-07', 'Later'), cover('2026-03-02', 'Earlier')])
  await appendHistory(cover('2026-06-01', 'Middle'), file)

  const { entries } = await loadHistory(file)
  assert.deepEqual(entries.map(entry => entry.date), ['2026-03-02', '2026-06-01', '2026-09-07'])
})

test('trims the oldest weeks, not whichever happened to be appended first', async () => {
  const entries = []
  for (let day = 1; day <= 28; day++) {
    entries.push(cover(`2026-02-${String(day).padStart(2, '0')}`, `Concept ${day}`))
  }
  // Append an old week last: positional trimming would have kept it and dropped a recent one.
  const file = await writeHistory(entries)
  await appendHistory(cover('2025-01-01', 'Ancient'), file)

  const { entries: kept } = await loadHistory(file)
  assert.equal(kept.length, 26)
  assert.ok(!kept.some(entry => entry.date === '2025-01-01'), 'the ancient week should be trimmed')
  assert.equal(kept[kept.length - 1].date, '2026-02-28')
})

test('keeps the two image types in separate windows', async () => {
  const file = await writeHistory([
    cover('2026-09-07', 'A cover'),
    { type: 'artist', date: '2026-09-14', concept: 'A portrait' }
  ])

  assert.deepEqual(await recentConcepts('cover', 8, file), ['A cover'])
  assert.deepEqual(await recentConcepts('artist', 8, file), ['A portrait'])
})

test('an undated entry never displaces a real week', async () => {
  const file = await writeHistory([
    { type: 'cover', concept: 'No date recorded' },
    cover('2026-09-07', 'Dated')
  ])

  assert.deepEqual(await recentConcepts('cover', 1, file), ['Dated'])
})

test('feeds recent media back on their own axis, newest first', async () => {
  const file = await writeHistory([
    { type: 'cover', date: '2026-09-07', concept: 'A', medium: 'cut-paper diorama' },
    { type: 'cover', date: '2026-09-14', concept: 'B', medium: 'wet-plate photography' }
  ])

  assert.deepEqual(await recentMedia('cover', 8, file), [
    'wet-plate photography',
    'cut-paper diorama'
  ])
})

test('falls back to creativeDirection for entries predating the medium field', async () => {
  const file = await writeHistory([
    { type: 'cover', date: '2026-08-31', concept: 'A', creativeDirection: 'A hand-cut paper diorama' }
  ])

  assert.deepEqual(await recentMedia('cover', 8, file), ['A hand-cut paper diorama'])
})

test('collapses repeats so one medium cannot fill the whole refusal list', async () => {
  const file = await writeHistory([
    { type: 'cover', date: '2026-08-31', concept: 'A', medium: 'Cut-paper diorama' },
    { type: 'cover', date: '2026-09-07', concept: 'B', medium: 'cut-paper diorama' },
    { type: 'cover', date: '2026-09-14', concept: 'C', medium: 'oil on canvas' }
  ])

  assert.deepEqual(await recentMedia('cover', 8, file), ['oil on canvas', 'cut-paper diorama'])
})
