// Registry of generic image-generation backends. Each backend exports { id, label, generate }
// and is interchangeable: generate({ imageUrls, prompt, seed, debug, ...modelOptions }) returns
// { imageUrl, model }. Reusable by any flow that needs to swap image models behind a switch.
import * as nanoBanana from './nano-banana.js'
import * as gptImage2 from './gpt-image-2.js'

export const BACKENDS = {
  [nanoBanana.id]: nanoBanana,
  [gptImage2.id]: gptImage2
}

// Map loose input to a known backend id (e.g. "gpt", "gpt-image2" -> "gpt-image-2").
export function normalizeBackendId(value) {
  const key = String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  if (key.startsWith('gpt')) return gptImage2.id
  if (key.startsWith('nano')) return nanoBanana.id
  return value || ''
}

// Resolve a backend by id (loose matching). Returns null for unknown ids so callers can decide
// on their own default.
export function getBackend(value) {
  return BACKENDS[normalizeBackendId(value)] || null
}
