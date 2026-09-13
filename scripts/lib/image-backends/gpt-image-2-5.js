import { fal } from '@fal-ai/client'

// Generic OpenAI GPT Image 2.5 edit backend (via fal). Reusable by any image-generation flow.
// Same shape as gpt-image-2 - no seed, resolution, aspect_ratio, or web search - but the
// quality scale gained 'xhigh' and 'max' above 'high', and the endpoint is namespaced under
// the model's release channel. Like GPT Image 2 it moderates real-person likenesses more
// strictly than nano-banana, so callers keep a fallback backend.
export const id = 'gpt-image-2-5'
export const label = 'GPT Image 2.5'

// gpt-image-2.5/edit accepts multiple reference images.
export const maxInputImages = 16

// Default to a high-resolution 16:9 size (both dimensions are multiples of 16, max edge < 3840,
// total pixels within the model's 655,360-8,294,400 range). Left explicit rather than 'auto',
// which infers a square from the square album artwork we send as references.
const DEFAULT_IMAGE_SIZE = { width: 2560, height: 1440 }

const QUALITY_LEVELS = ['auto', 'low', 'medium', 'high', 'xhigh', 'max']

function resolveQuality(value) {
  const requested = String(value || '').trim().toLowerCase()
  if (QUALITY_LEVELS.includes(requested)) return requested
  if (requested) console.warn(`  Unknown GPT Image 2.5 quality "${value}"; using "high"`)
  return 'high'
}

// Build the GPT Image 2.5 input. `seed` is accepted for a uniform backend signature but
// ignored (the model has no seed parameter).
export function buildInput({ imageUrls, prompt, imageSize, quality }) {
  return {
    prompt,
    image_urls: imageUrls,
    image_size: imageSize || process.env.GPT_IMAGE_2_5_SIZE || DEFAULT_IMAGE_SIZE,
    quality: resolveQuality(quality || process.env.GPT_IMAGE_2_5_QUALITY),
    num_images: 1,
    output_format: 'png'
  }
}

// Call the model. Returns { imageUrl, model }. `imageSize` and `quality` are overridable per
// call (or via env).
export async function generate({ imageUrls, prompt, debug, imageSize, quality }) {
  const input = buildInput({ imageUrls, prompt, imageSize, quality })
  const modelName = process.env.GPT_IMAGE_2_5_MODEL || 'openai/gpt-image-2.5/sunburst/edit'

  const result = await fal.subscribe(modelName, {
    input,
    logs: debug,
    onQueueUpdate: update => {
      if (debug && update.status === 'IN_PROGRESS') {
        update.logs?.map(log => log.message).forEach(message => console.log(`  [FAL] ${message}`))
      }
    }
  })

  const imageUrl = result.data?.images?.[0]?.url
  if (!imageUrl) throw new Error('FAL.ai returned no image URL')
  return { imageUrl, model: modelName }
}
