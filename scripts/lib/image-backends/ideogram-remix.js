import { fal } from '@fal-ai/client'

// Generic FAL Ideogram V3 remix backend. Restyles ONE already-composed image toward a design
// style while keeping its content recognisable - used as the optional second stage of print
// lanes, never as a compose backend (it cannot blend multiple references).
export const id = 'ideogram-remix'
export const label = 'Ideogram Remix'

// Single-image endpoint: callers must not hand this backend more than one reference.
export const maxInputImages = 1

// The landscape_16_9 preset renders at ~1024x576, far below the ~2K compose output it
// replaces; a custom size keeps the restyled cover as sharp as Ideogram allows (custom
// dimensions cap at 1536).
const DEFAULT_IMAGE_SIZE = { width: 1536, height: 864 }

// IMPORTANT - strength semantics: Ideogram's `strength` is the weight of the INPUT image.
// HIGHER keeps MORE of the source (0.8 default = strongly source-preserving). This is the
// OPPOSITE of Recraft's image-to-image strength in recraft-i2i.js.
export async function generate({ imageUrls, prompt, seed, debug, strength = 0.8, style = 'AUTO', negativePrompt = '', imageSize }) {
  const input = {
    prompt,
    image_url: imageUrls[0],
    strength,
    // The remix endpoint only accepts AUTO | GENERAL | REALISTIC | DESIGN (the 60+ named
    // presets belong to Ideogram's text-to-image endpoint) - styling detail comes from the
    // prompt plus the strength.
    style,
    image_size: imageSize || DEFAULT_IMAGE_SIZE,
    // MagicPrompt rewrites would fight the carefully assembled restyle prompt.
    expand_prompt: false,
    negative_prompt: negativePrompt,
    num_images: 1,
    seed
  }

  const modelName = process.env.IDEOGRAM_REMIX_MODEL || 'fal-ai/ideogram/v3/remix'

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
