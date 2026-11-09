import { fal } from '@fal-ai/client'

// Generic OpenAI GPT Image 2.6 edit backend (via fal). Reusable by any image-generation flow.
// Same request shape as gpt-image-2.5 (no seed or aspect_ratio; quality runs up to 'xhigh' and
// 'max'), on the Sunburst channel - the full-size model, rather than the faster, smaller Flare.
// 2.6 also exposes `reasoning_effort` (low/medium/high, default high), which is left at the
// endpoint default unless GPT_IMAGE_2_6_REASONING_EFFORT sets it. Like the earlier GPT Image
// models it moderates real-person likenesses strictly, so callers keep a fallback backend.
export const id = 'gpt-image-2-6'
export const label = 'GPT Image 2.6'

// gpt-image-2.6/sunburst/edit accepts up to 16 reference images.
export const maxInputImages = 16

// Explicit 16:9 rather than 'auto', which infers a square from the square album artwork we
// send as references. Multiples of 16, long edge under 3840, within the pixel budget.
const DEFAULT_IMAGE_SIZE = { width: 2560, height: 1440 }

const QUALITY_LEVELS = ['auto', 'low', 'medium', 'high', 'xhigh', 'max']
const REASONING_LEVELS = ['low', 'medium', 'high']

// Carried over from 2.5, where 'xhigh' was what made sleeve likenesses land on the weekly
// cover. GPT_IMAGE_2_6_QUALITY or a per-call `quality` still overrides it.
const DEFAULT_QUALITY = 'xhigh'

function resolveQuality(value) {
  const requested = String(value || '').trim().toLowerCase()
  if (QUALITY_LEVELS.includes(requested)) return requested
  if (requested) console.warn(`  Unknown GPT Image 2.6 quality "${value}"; using "${DEFAULT_QUALITY}"`)
  return DEFAULT_QUALITY
}

function resolveReasoningEffort(value) {
  const requested = String(value || '').trim().toLowerCase()
  if (!requested) return null
  if (REASONING_LEVELS.includes(requested)) return requested
  console.warn(`  Unknown GPT Image 2.6 reasoning effort "${value}"; using the endpoint default`)
  return null
}

// Build the GPT Image 2.6 input. `seed` is accepted for a uniform backend signature but
// ignored (the model has no seed parameter).
export function buildInput({ imageUrls, prompt, imageSize, quality, reasoningEffort }) {
  const effort = resolveReasoningEffort(reasoningEffort || process.env.GPT_IMAGE_2_6_REASONING_EFFORT)
  return {
    prompt,
    image_urls: imageUrls,
    image_size: imageSize || process.env.GPT_IMAGE_2_6_SIZE || DEFAULT_IMAGE_SIZE,
    quality: resolveQuality(quality || process.env.GPT_IMAGE_2_6_QUALITY),
    ...(effort ? { reasoning_effort: effort } : {}),
    num_images: 1,
    output_format: 'png'
  }
}

// Call the model. Returns { imageUrl, model }.
export async function generate({ imageUrls, prompt, debug, imageSize, quality, reasoningEffort }) {
  const input = buildInput({ imageUrls, prompt, imageSize, quality, reasoningEffort })
  const modelName = process.env.GPT_IMAGE_2_6_MODEL || 'openai/gpt-image-2.6/sunburst/edit'

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
