import { fal } from '@fal-ai/client'
import { isContentPolicyViolation } from '../fal-content-policy.js'

// Generic FAL Nano Banana Pro edit backend. This is kept separate from nano-banana-2 so
// artist portraits can prioritise likeness without changing the album-cover fallback.
export const id = 'nano-banana-pro'
export const label = 'Nano Banana Pro'

// nano-banana-pro/edit accepts enough references for the artist portrait casting pool.
export const maxInputImages = 14

function runModel(modelName, input, debug) {
  return fal.subscribe(modelName, {
    input,
    logs: debug,
    onQueueUpdate: update => {
      if (debug && update.status === 'IN_PROGRESS') {
        update.logs?.map(log => log.message).forEach(message => console.log(`  [FAL] ${message}`))
      }
    }
  })
}

function resolveSafetyTolerance(value) {
  const parsed = Number(value)
  return String(Number.isInteger(parsed) && parsed >= 1 && parsed <= 6 ? parsed : 5)
}

export function buildInput({
  imageUrls,
  prompt,
  seed,
  aspectRatio = '16:9',
  resolution = '2K',
  safetyTolerance = process.env.NANO_BANANA_PRO_SAFETY_TOLERANCE
}) {
  return {
    prompt,
    image_urls: imageUrls,
    aspect_ratio: aspectRatio,
    resolution,
    output_format: 'png',
    num_images: 1,
    safety_tolerance: resolveSafetyTolerance(safetyTolerance),
    limit_generations: true,
    enable_web_search: false,
    seed
  }
}

// Build the Nano Banana Pro input and call the model. Content-policy errors are re-thrown so
// the caller can retry with fewer people; other failures use an explicitly configured fallback.
export async function generate(options) {
  const input = buildInput(options)
  const modelName = process.env.NANO_BANANA_PRO_MODEL || 'fal-ai/nano-banana-pro/edit'
  const fallbackModelName = process.env.NANO_BANANA_PRO_FALLBACK_MODEL || ''

  try {
    const result = await runModel(modelName, input, options.debug)
    const imageUrl = result.data?.images?.[0]?.url
    if (!imageUrl) throw new Error('FAL.ai returned no image URL')
    return { imageUrl, model: modelName }
  } catch (error) {
    if (isContentPolicyViolation(error)) throw error

    if (fallbackModelName && fallbackModelName !== modelName) {
      console.warn(`  Primary FAL model failed; retrying with fallback model ${fallbackModelName}`)
      const result = await runModel(fallbackModelName, input, options.debug)
      const imageUrl = result.data?.images?.[0]?.url
      if (!imageUrl) throw new Error('FAL.ai returned no image URL')
      return { imageUrl, model: fallbackModelName }
    }

    throw error
  }
}
