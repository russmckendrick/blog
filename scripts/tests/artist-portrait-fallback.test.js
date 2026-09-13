import test from 'node:test'
import assert from 'node:assert/strict'
import { BACKENDS } from '../lib/image-backends/index.js'
import { resolveFallbackBackend } from '../fal-tunes-artists.js'

// Every case passes an explicit value, so the resolver never reaches tunes-config.yaml and
// these stay independent of whatever the configured primary happens to be.
const GPT_2_5 = BACKENDS['gpt-image-2-5']
const NANO_PRO = BACKENDS['nano-banana-pro']

test('falls back to Nano Banana Pro when a GPT backend is primary', async () => {
  const fallback = await resolveFallbackBackend(GPT_2_5, 'nano-banana-pro')
  assert.equal(fallback.id, 'nano-banana-pro')
})

test('disables the fallback when it would equal the primary', async () => {
  assert.equal(await resolveFallbackBackend(NANO_PRO, 'nano-banana-pro'), null)
})

test('treats none/off/empty as an explicit opt-out', async () => {
  for (const value of ['none', 'off', 'None', '  ', '']) {
    assert.equal(await resolveFallbackBackend(GPT_2_5, value), null, `expected "${value}" to disable`)
  }
})

test('disables rather than guesses on an unknown fallback id', async () => {
  assert.equal(await resolveFallbackBackend(GPT_2_5, 'not-a-real-model'), null)
})

test('accepts loose spellings of a known backend', async () => {
  const fallback = await resolveFallbackBackend(GPT_2_5, 'Nano Banana Pro Edit')
  assert.equal(fallback.id, 'nano-banana-pro')
})
