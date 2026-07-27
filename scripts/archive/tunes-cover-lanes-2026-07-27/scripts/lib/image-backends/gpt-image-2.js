import { fal } from '@fal-ai/client'

// Generic OpenAI GPT Image 2 edit backend (via fal). Reusable by any image-generation flow.
// Note: GPT Image 2 has no seed, resolution, aspect_ratio, or web search - it uses image_size
// and quality instead, and moderates real-person likenesses more strictly than nano-banana.
export const id = 'gpt-image-2'
export const label = 'GPT Image 2'

// gpt-image-2/edit accepts multiple reference images.
export const maxInputImages = 16

// Default to a high-resolution 16:9 size (both dimensions are multiples of 16, max edge < 3840,
// total pixels within the model's 655,360-8,294,400 range).
const DEFAULT_IMAGE_SIZE = { width: 2560, height: 1440 }

// Build the GPT Image 2 input and call the model. Returns { imageUrl, model }. `imageSize` and
// `quality` are overridable per call (or via env). `seed` is accepted for a uniform backend
// signature but ignored (the model has no seed parameter).
export async function generate({ imageUrls, prompt, debug, imageSize, quality }) {
  const input = {
    prompt,
    image_urls: imageUrls,
    image_size: imageSize || process.env.GPT_IMAGE_2_SIZE || DEFAULT_IMAGE_SIZE,
    quality: quality || process.env.GPT_IMAGE_2_QUALITY || 'high',
    num_images: 1,
    output_format: 'png'
  }

  const modelName = process.env.GPT_IMAGE_2_MODEL || 'openai/gpt-image-2/edit'

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
