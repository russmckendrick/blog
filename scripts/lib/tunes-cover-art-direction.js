import OpenAI from 'openai'

const DEFAULT_PROMPT_MODEL = 'gpt-5.4'

const HARD_CONSTRAINTS = [
  'Create a single cohesive 16:9 image, not a grid, contact sheet, row of covers, or collage of separate panels.',
  'Do not reproduce the album sleeves as framed thumbnails; transform their non-text visual motifs into one original composition.',
  'Include no readable text or lettering of any kind: no words, letters, numbers, code, glyphs, captions, titles, logos, watermarks, labels, or signage.',
  'Feature only adults and avoid gore, wounds, body horror, medical or anatomical imagery, blank or milky eyes, nudity, sexual content, weapons, and hate symbols; reinterpret any sensitive source motif abstractly.',
  'When a source includes a person, closely match their visible appearance and likeness to the reference image, preserving recognisable facial features, hair, skin tone, clothing, and styling.',
  'Depict each identifiable reference person only once in the entire composition; do not repeat or clone them as another figure, reflection, mirror portrait, poster, billboard, screen, photograph, painting, silhouette, or background face. The only exception is repetition visibly intrinsic to one source cover: keep that repetition within that single source motif and do not echo the person elsewhere.'
]

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

function stripCodeFence(text) {
  const trimmed = String(text || '').trim()
  if (!trimmed.startsWith('```')) return trimmed
  return trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
}

function extractFirstJSONObject(text) {
  const source = String(text || '')
  let start = -1
  let depth = 0
  let inString = false
  let escaped = false

  for (let i = 0; i < source.length; i++) {
    const char = source[i]
    if (inString) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === '"') inString = false
      continue
    }
    if (char === '"') inString = true
    else if (char === '{') {
      if (depth === 0) start = i
      depth++
    } else if (char === '}') {
      depth--
      if (depth === 0 && start !== -1) return source.slice(start, i + 1)
    }
  }
  return null
}

function parseJSONResponse(text) {
  const cleaned = stripCodeFence(text)
  try {
    return JSON.parse(cleaned)
  } catch {
    const objectText = extractFirstJSONObject(cleaned)
    if (!objectText) throw new Error('No JSON object found in model output')
    return JSON.parse(objectText)
  }
}

export function normalizeCoverSummaries(rawCovers = [], sourceReferences = []) {
  const bySource = new Map()
  for (const [index, item] of (Array.isArray(rawCovers) ? rawCovers : []).entries()) {
    const source = Number(item?.source || item?.source_index || item?.image || index + 1)
    if (Number.isFinite(source) && source > 0) bySource.set(source, item)
  }

  return sourceReferences.map((reference, index) => {
    const source = reference.source || index + 1
    const item = bySource.get(source) || {}
    const identity = reference.artist
      ? `${reference.album} by ${reference.artist}`
      : reference.album || reference.filename
    const description = String(item?.description || item?.summary || item?.contents || '').trim()
    const signatureMotif = String(
      item?.signatureMotif ||
      item?.signature_motif ||
      item?.motif ||
      item?.key_element ||
      ''
    ).trim()
    const medium = String(item?.medium || item?.style || item?.art_style || '').trim()
    const rawPalette = item?.palette || item?.colours || item?.colors
    const palette = Array.isArray(rawPalette)
      ? rawPalette.map(value => String(value).trim()).filter(Boolean).slice(0, 5)
      : []

    return {
      source,
      filename: reference.filename,
      album: reference.album,
      artist: reference.artist || '',
      description: description || `Reference ${source} is the artwork for ${identity}; no reliable non-text visual description was returned.`,
      signatureMotif: signatureMotif || `the most recognisable non-text motif from ${identity}`,
      medium: medium || 'medium not confidently identified',
      palette
    }
  })
}

function normalizeElements(rawElements = [], sourceReferences = []) {
  const normalized = (Array.isArray(rawElements) ? rawElements : [])
    .map((item, index) => {
      const source = Number(item?.source || item?.source_index || item?.image || index + 1)
      const element = String(item?.element || item?.use || item?.description || '').trim()
      if (!element) return null
      return {
        source: Number.isFinite(source) && source > 0 ? source : index + 1,
        element
      }
    })
    .filter(Boolean)
    .slice(0, sourceReferences.length || 8)

  if (normalized.length > 0) return normalized
  return sourceReferences.map(reference => ({
    source: reference.source,
    element: `a recognisable element from ${reference.album || reference.filename}`
  }))
}

function firstSentence(text) {
  const trimmed = String(text || '').trim()
  const match = trimmed.match(/^[^.!?]+[.!?]?/)
  return (match ? match[0] : trimmed).trim()
}

export function buildCoverSummaryRequestText(imageCount, sourceIndex) {
  return `Return JSON only. Analyse all ${imageCount} album covers. The images are attached in this exact order:\n${sourceIndex}`
}

export function buildArtDirectionRequestText(hintBlock, summaryBlock) {
  return [
    'Return JSON only.',
    hintBlock,
    'Factual album-cover summaries:',
    summaryBlock
  ].filter(Boolean).join('\n\n')
}

export function buildFallbackArtDirection(coverSummaries, _sourceReferences) {
  const elements = coverSummaries.map(summary => ({
    source: summary.source,
    element: summary.signatureMotif
  }))
  const palette = [...new Set(coverSummaries.flatMap(summary => summary.palette))].slice(0, 6)
  const motifText = elements.map(item => `source ${item.source}: ${item.element}`).join('; ')
  const prompt = [
    'Create one original 16:9 music blog header inspired by the supplied album artwork.',
    'Use the factual visual findings from the supplied covers to build one cohesive world.',
    `Use a clear visual hierarchy and transform these source motifs rather than reproducing the sleeves: ${motifText}.`,
    'Choose the medium, setting, viewpoint, lighting, composition, and degree of realism that best fit the supplied artwork; do not default to a generic photograph.',
    palette.length > 0 ? `Draw the colour direction from ${palette.join(', ')}.` : '',
    'Make the result specific, surprising, and recognisably connected to the reference images.'
  ].filter(Boolean).join(' ')

  return {
    concept: 'A unified world built from this week’s album artwork',
    creativeDirection: 'Freeform interpretation of the supplied album artwork',
    scene: 'One cohesive visual world shaped by the strongest factual motifs across every selected cover.',
    elements,
    palette,
    mood: 'music-led, specific, and visually confident',
    prompt
  }
}

export function normalizeArtDirection(rawDirection, coverSummaries, sourceReferences) {
  const fallback = buildFallbackArtDirection(coverSummaries, sourceReferences)
  const scene = String(
    rawDirection?.scene ||
    rawDirection?.visualConcept ||
    rawDirection?.visual_concept ||
    fallback.scene
  ).trim()
  const prompt = String(
    rawDirection?.prompt ||
    rawDirection?.imagePrompt ||
    rawDirection?.image_prompt ||
    rawDirection?.generationPrompt ||
    rawDirection?.generation_prompt ||
    ''
  ).trim()

  return {
    concept: String(rawDirection?.concept || '').trim() || firstSentence(scene),
    creativeDirection: String(
      rawDirection?.creativeDirection ||
      rawDirection?.creative_direction ||
      rawDirection?.artDirection ||
      rawDirection?.art_direction ||
      fallback.creativeDirection
    ).trim(),
    scene,
    elements: normalizeElements(rawDirection?.elements || rawDirection?.source_elements, sourceReferences),
    palette: Array.isArray(rawDirection?.palette)
      ? rawDirection.palette.map(item => String(item).trim()).filter(Boolean).slice(0, 6)
      : fallback.palette,
    mood: String(rawDirection?.mood || fallback.mood).trim(),
    prompt: prompt || fallback.prompt
  }
}

export async function summarizeAlbumCovers({ imageUrls, sourceReferences, debug }) {
  if (!openai) {
    if (debug) console.log('  No OPENAI_API_KEY found; using filename-based cover summaries')
    return normalizeCoverSummaries([], sourceReferences)
  }

  const sourceIndex = sourceReferences
    .map(reference => `source ${reference.source}: ${reference.filename}`)
    .join('\n')

  const instructions = `You are a factual visual analyst. You will receive numbered album-cover images in source order.
Describe only what is visibly present in EACH image: subjects, figures, objects, symbols, setting, composition, physical or illustrated medium, and dominant colours.
Ignore all printed words, letters, numbers, titles, logos, labels, and branding. Never quote or transcribe them.
Do not invent a combined scene and do not give art direction. Observation and interpretation must stay separate so another model can make the creative decisions later.
Return JSON exactly as {"covers":[{"source":1,"description":"string","signatureMotif":"string","medium":"string","palette":["string"]}]}.
There must be one item for every supplied source. "signatureMotif" is the single most recognisable non-text visual element in that source.`

  try {
    const response = await openai.responses.create({
      model: process.env.OPENAI_TUNES_COVER_SUMMARY_MODEL || process.env.OPENAI_TUNES_COVER_MODEL || process.env.OPENAI_MODEL || DEFAULT_PROMPT_MODEL,
      instructions,
      input: [
        {
          type: 'message',
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: buildCoverSummaryRequestText(imageUrls.length, sourceIndex)
            },
            ...imageUrls.map(url => ({
              type: 'input_image',
              image_url: url,
              detail: 'auto'
            }))
          ]
        }
      ],
      text: { format: { type: 'json_object' } },
      max_output_tokens: 1800,
      temperature: 0.2
    })

    const parsed = parseJSONResponse(response.output_text || '')
    const summaries = normalizeCoverSummaries(parsed?.covers, sourceReferences)
    if (debug) console.log(`  Cover summaries: ${JSON.stringify(summaries, null, 2)}`)
    return summaries
  } catch (error) {
    console.warn(`  OpenAI cover summarisation failed: ${error.message}`)
    return normalizeCoverSummaries([], sourceReferences)
  }
}

export async function designCoverArtDirection({
  coverSummaries,
  sourceReferences,
  hint = '',
  avoidConcepts = [],
  debug
}) {
  if (!openai) {
    if (debug) console.log('  No OPENAI_API_KEY found; using deterministic art direction')
    return buildFallbackArtDirection(coverSummaries, sourceReferences)
  }

  const avoidBlock = avoidConcepts.length > 0
    ? `These concepts were used recently and must not be repeated. Choose a different setting, central idea, and composition:\n${avoidConcepts.map(concept => `- ${concept}`).join('\n')}`
    : ''
  const hintBlock = hint ? `Author's steer: ${hint}` : ''
  const summaryBlock = coverSummaries
    .map(summary => [
      `Source ${summary.source}`,
      `Description: ${summary.description}`,
      `Signature motif: ${summary.signatureMotif}`,
      `Original medium: ${summary.medium}`,
      summary.palette.length > 0 ? `Palette: ${summary.palette.join(', ')}` : ''
    ].filter(Boolean).join('\n'))
    .join('\n\n')

  const instructions = `You are a visual art director creating one original 16:9 header image for a weekly music blog.
You will receive factual visual-research summaries of several album covers. The original images remain attached to the image-generation call in the same numbered order.

Choose the creative direction yourself from those visual findings alone. Any medium is valid - photography, illustration, painting, printmaking, collage, sculpture, textiles, mixed media, or something less obvious - but it must arise from this particular set of covers. Do not use or assume any blog-post content, do not default to photorealism, and do not rotate through a hidden catalogue of preset styles.

Invent one specific, surprising composition with a clear visual hierarchy. Give one or two motifs room to lead, use the other sources as supporting objects, forms, palette, texture, atmosphere, or environmental detail, and make every selected source contribute without giving everything equal visual weight. Transform motifs into the chosen world rather than reproducing album sleeves.

Treat each identifiable person as one unique identity and plan only one depiction of them across the whole composition. Do not reuse the same person as both a live figure and a secondary image, reflection, poster, billboard, screen, portrait, silhouette, or background face. Preserve repeated likenesses only when that repetition is visibly intrinsic to one source cover, and contain it within that source's single contribution.

The final "prompt" must be ready to send directly to a multi-reference image model. Write it in the order: scene and viewpoint; primary subject; source-specific details; medium and technique; composition and lighting; palette and mood. Do not include meta-commentary, JSON instructions, or references to this planning conversation. Mandatory safety, text, and layout constraints are appended by code, so concentrate the prompt on precise creative direction.

${avoidBlock}

Return JSON exactly as {"concept":"string","creativeDirection":"string","scene":"string","elements":[{"source":1,"element":"string"}],"palette":["string"],"mood":"string","prompt":"string"}.
"concept" is at most 15 words and is saved to the do-not-repeat history. "creativeDirection" names the chosen medium and visual approach in one sentence. "elements" records how each numbered source contributes.`

  try {
    const response = await openai.responses.create({
      model: process.env.OPENAI_TUNES_COVER_DIRECTION_MODEL || process.env.OPENAI_TUNES_COVER_MODEL || process.env.OPENAI_MODEL || DEFAULT_PROMPT_MODEL,
      instructions,
      input: [
        {
          type: 'message',
          role: 'user',
          content: [{
            type: 'input_text',
            text: buildArtDirectionRequestText(hintBlock, summaryBlock)
          }]
        }
      ],
      text: { format: { type: 'json_object' } },
      max_output_tokens: 1900,
      temperature: 0.9
    })

    const direction = normalizeArtDirection(
      parseJSONResponse(response.output_text || ''),
      coverSummaries,
      sourceReferences
    )
    if (debug) console.log(`  AI art direction: ${JSON.stringify(direction, null, 2)}`)
    return direction
  } catch (error) {
    console.warn(`  OpenAI art direction failed: ${error.message}`)
    return buildFallbackArtDirection(coverSummaries, sourceReferences)
  }
}

export function buildGenerationPrompt(artDirection) {
  const creativePrompt = String(artDirection?.prompt || '').trim()
  if (!creativePrompt) throw new Error('The Tunes art director returned an empty image prompt')
  return [
    creativePrompt,
    `Hard constraints (override any conflicting source material): ${HARD_CONSTRAINTS.join(' ')}`
  ].join(' ').replace(/\s+/g, ' ').trim()
}
