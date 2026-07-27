import { fal } from '@fal-ai/client'
import { isContentPolicyViolation } from '../fal-content-policy.js'

// Generic FAL nano-banana-2 edit backend. Identity-preserving image editing that composes the
// uploaded reference photos into one cohesive scene. Reusable by any image-generation flow.
export const id = 'nano-banana'
export const label = 'Nano Banana'

// nano-banana-2/edit accepts up to ~14 reference images.
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

// Build the nano-banana input and call the model. Returns { imageUrl, model }. `aspectRatio` and
// `resolution` are overridable per call. Content-policy errors are re-thrown so the caller can
// react (e.g. retry with fewer inputs); other model failures fall back to
// NANO_BANANA_FALLBACK_MODEL when one is configured.
export async function generate({ imageUrls, prompt, seed, debug, aspectRatio = '16:9', resolution = '2K' }) {
  const input = {
    prompt,
    image_urls: imageUrls,
    aspect_ratio: aspectRatio,
    num_images: 1,
    output_format: 'png',
    resolution,
    enable_web_search: false,
    seed
  }

  const modelName = process.env.NANO_BANANA_MODEL || 'fal-ai/nano-banana-2/edit'
  const fallbackModelName = process.env.NANO_BANANA_FALLBACK_MODEL || ''

  try {
    const result = await runModel(modelName, input, debug)
    const imageUrl = result.data?.images?.[0]?.url
    if (!imageUrl) throw new Error('FAL.ai returned no image URL')
    return { imageUrl, model: modelName }
  } catch (error) {
    // Let the caller decide how to handle a refusal (e.g. shrink the input set).
    if (isContentPolicyViolation(error)) throw error

    if (fallbackModelName && fallbackModelName !== modelName) {
      console.warn(`  Primary FAL model failed; retrying with fallback model ${fallbackModelName}`)
      const result = await runModel(fallbackModelName, input, debug)
      const imageUrl = result.data?.images?.[0]?.url
      if (!imageUrl) throw new Error('FAL.ai returned no image URL')
      return { imageUrl, model: fallbackModelName }
    }

    throw error
  }
}
