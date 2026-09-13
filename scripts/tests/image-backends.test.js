import test from 'node:test'
import assert from 'node:assert/strict'
import { BACKENDS, getBackend, normalizeBackendId } from '../lib/image-backends/index.js'
import { buildInput } from '../lib/image-backends/nano-banana-pro.js'
import { buildInput as buildGptImage25Input } from '../lib/image-backends/gpt-image-2-5.js'

test('registers Nano Banana Pro separately from Nano Banana 2', () => {
  assert.equal(BACKENDS['nano-banana-pro'].label, 'Nano Banana Pro')
  assert.equal(normalizeBackendId('Nano Banana Pro Edit'), 'nano-banana-pro')
  assert.equal(normalizeBackendId('nbpro'), 'nano-banana-pro')
  assert.equal(getBackend('nano banana').id, 'nano-banana')
})

test('builds the proven Nano Banana Pro portrait request', () => {
  assert.deepEqual(buildInput({
    imageUrls: ['https://example.com/one.png'],
    prompt: 'Keep the subject recognisable',
    seed: 1234
  }), {
    prompt: 'Keep the subject recognisable',
    image_urls: ['https://example.com/one.png'],
    aspect_ratio: '16:9',
    resolution: '2K',
    output_format: 'png',
    num_images: 1,
    safety_tolerance: '5',
    limit_generations: true,
    enable_web_search: false,
    seed: 1234
  })
})

test('rejects an out-of-range safety tolerance in favour of the tested default', () => {
  const input = buildInput({
    imageUrls: [],
    prompt: 'Test',
    seed: 1,
    safetyTolerance: 99
  })

  assert.equal(input.safety_tolerance, '5')
})

test('tells GPT Image 2.5 apart from GPT Image 2 however it is spelled', () => {
  assert.equal(BACKENDS['gpt-image-2-5'].label, 'GPT Image 2.5')
  assert.equal(normalizeBackendId('gpt-image-2.5'), 'gpt-image-2-5')
  assert.equal(normalizeBackendId('GPT Image 2.5'), 'gpt-image-2-5')
  assert.equal(normalizeBackendId('gpt-image-2-5'), 'gpt-image-2-5')
  assert.equal(normalizeBackendId('gpt-image-2'), 'gpt-image-2')
  assert.equal(getBackend('gpt').id, 'gpt-image-2')
})

test('builds a 16:9 GPT Image 2.5 edit request from the album references', () => {
  assert.deepEqual(buildGptImage25Input({
    imageUrls: ['https://example.com/album.png'],
    prompt: 'A nocturne in miniature'
  }), {
    prompt: 'A nocturne in miniature',
    image_urls: ['https://example.com/album.png'],
    image_size: { width: 2560, height: 1440 },
    quality: 'high',
    num_images: 1,
    output_format: 'png'
  })
})

test('accepts the quality levels GPT Image 2.5 added and rejects the rest', () => {
  assert.equal(buildGptImage25Input({ imageUrls: [], prompt: 'x', quality: 'xhigh' }).quality, 'xhigh')
  assert.equal(buildGptImage25Input({ imageUrls: [], prompt: 'x', quality: 'max' }).quality, 'max')
  assert.equal(buildGptImage25Input({ imageUrls: [], prompt: 'x', quality: 'ultra' }).quality, 'high')
})
