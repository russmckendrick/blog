import { fal } from '@fal-ai/client'

// Generic FAL Recraft V3 image-to-image backend. Restyles ONE already-composed image into a
// named Recraft illustration/vector style - used as the optional second stage of print lanes,
// never as a compose backend (it cannot blend multiple references).
export const id = 'recraft-i2i'
export const label = 'Recraft Image-to-Image'

// Single-image endpoint: callers must not hand this backend more than one reference.
export const maxInputImages = 1
export const maxPromptLength = 1000

// IMPORTANT - strength semantics: Recraft's `strength` is the amount of CHANGE (0 = almost
// identical to the source, 1 = barely related). This is the OPPOSITE of Ideogram's remix
// strength in ideogram-remix.js. Keep lane values low (0.3-0.4) so the album motifs in the
// composed image survive the restyle.
export async function generate({ imageUrls, prompt, debug, strength = 0.35, style = 'digital_illustration', negativePrompt = '' }) {
  if (prompt.length > maxPromptLength) {
    throw new Error(`Recraft prompt exceeds its ${maxPromptLength}-character limit`)
  }

  const input = {
    prompt,
    image_url: imageUrls[0],
    strength,
    // Full substyle ids like "digital_illustration/grain" or "vector_illustration/linocut";
    // output size follows the input, so a 16:9 compose stays 16:9. No seed parameter.
    style,
    negative_prompt: negativePrompt
  }

  const modelName = process.env.RECRAFT_I2I_MODEL || 'fal-ai/recraft/v3/image-to-image'

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
