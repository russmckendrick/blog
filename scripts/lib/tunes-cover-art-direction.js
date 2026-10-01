import OpenAI from 'openai'

const DEFAULT_PROMPT_MODEL = 'gpt-5.4'

const TEXT_CONSTRAINT = 'Include no readable text or lettering of any kind: no words, letters, numbers, code, glyphs, captions, titles, logos, watermarks, labels, or signage.'

const HARD_CONSTRAINTS = [
  'Create a single cohesive 16:9 image, not a grid, contact sheet, row of covers, or collage of separate panels.',
  'Do not reproduce the album sleeves as framed thumbnails; transform their non-text visual motifs into one original composition.',
  TEXT_CONSTRAINT,
  'Feature only adults and avoid gore, wounds, body horror, medical or anatomical imagery, blank or milky eyes, nudity, sexual content, weapons, and hate symbols; reinterpret any sensitive source motif abstractly.',
  'When a source includes a person, closely match their visible appearance and likeness to the reference image, preserving recognisable facial features, hair, skin tone, clothing, and styling.',
  'Keep each reference person in the pose, expression, and gaze the sleeve shows, and keep every identifiable face sharp, lit, unobscured, and in focus: no motion blur, long-exposure smearing, steam, fog, shadow, crowding, or shallow depth of field over a reference person\'s face.',
  'Expose the image brightly and cleanly: open, readable shadows and clear colour, with no murky underexposure, crushed blacks, heavy film grain, digital noise, or dust-and-scratches texture.',
  'Depict each identifiable reference person only once in the entire composition; do not repeat or clone them as another figure, reflection, mirror portrait, poster, billboard, screen, photograph, painting, silhouette, or background face. The only exception is repetition visibly intrinsic to one source cover: keep that repetition within that single source motif and do not echo the person elsewhere.'
]

// Photography is the default rendering for a tunes cover, so it is never refused as a
// "recent medium" - only non-photographic media and staging techniques rotate out. A rolling
// ban on the medium and a photographic default cannot coexist: with photography refusable and
// a suggested-media list that was almost entirely paint and print, the four covers that
// followed were ceramic, oil, lithograph, and pastel. Staging words win over camera words so
// "photo collage" or "photographed diorama" still count as the technique, not the camera.
const STAGED_MEDIUM_PATTERN = /\b(collage|diorama|assemblage|montage|shadow[- ]?box|mural|painting|painted|illustration|drawn|drawing)\b/i
const PHOTOGRAPHIC_MEDIUM_PATTERN = /\b(photo\w*|camera|lens|film|wet[- ]plate|daguerreotype|tintype|ambrotype|cyanotype|polaroid|large[- ]format|medium[- ]format|35 ?mm|long[- ]exposure|studio shoot|location shoot|editorial shoot|cinematic)\b/i

export function isPhotographicMedium(value) {
  const text = String(value || '')
  if (STAGED_MEDIUM_PATTERN.test(text)) return false
  return PHOTOGRAPHIC_MEDIUM_PATTERN.test(text)
}

// Once photography became the default, the only lever left was the scene, and the art
// director reached for night every time: 7 to 28 Sep 2026 ran stormy dusk, a dark flooded
// hall, a night railway siding, and a drained pool at dusk, each with a wet floor reflecting
// coloured lights. The chosen lighting is recorded like the medium, and a low-light cover
// forces the next one into daylight or bright, even light.
const LOW_LIGHT_PATTERN = /\b(night\w*|midnight|dusk|twilight|blue[- ]hour|after[- ]?hours|moon\w*|candle\w*|lamplit|torchlit|firelit|dark\w*|dim\w*|low[- ]key|noir|chiaroscuro|neon|stage[- ]lit|stage light\w*|spotlit|spotlight\w*|practical lights?|storm\w*|gloom\w*|murk\w*)\b/i

export function isLowLight(value) {
  return LOW_LIGHT_PATTERN.test(String(value || ''))
}

// The daylight rule fixed the darkness and immediately found the next rut: four of the six
// covers rerun under it on 28 Sep 2026 came back as "bright overcast afternoon". Recent
// lighting is refused on its own axis the way media are. The window is short on purpose -
// bright light has fewer distinct set-ups than media, and refusing a full history window
// would squeeze the director towards night, which the default is steering away from.
export const LIGHTING_REPEAT_WINDOW = 4

// Builds the art director's lighting instructions from the recorded history, newest first:
// a forced daylight rule when the previous cover was low light, then a do-not-repeat list of
// the last few set-ups (collapsed so one repeated phrase cannot fill it).
export function buildLightingBlock(recentLighting = []) {
  const history = (Array.isArray(recentLighting) ? recentLighting : [])
    .map(value => String(value || '').trim())
    .filter(Boolean)
  const blocks = []

  // Only the previous cover decides the forcing rule: one low-light week buys the next one
  // daylight, which is enough to stop a run without banning night outright.
  const previousLighting = history[0] || ''
  if (isLowLight(previousLighting)) {
    blocks.push(`The previous cover was lit as "${previousLighting}". This cover must be lit by daylight or bright, even light - midday or afternoon sun, open shade, bright overcast, golden hour, or a high-key studio - and must not be set at night, dusk, or twilight, or lit mainly by practical lamps, neon, candles, or stage spots, even if the sleeves are dark.`)
  }

  const seen = new Set()
  const recent = []
  for (const value of history.slice(0, LIGHTING_REPEAT_WINDOW)) {
    const key = value.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    recent.push(value)
  }
  if (recent.length > 0) {
    blocks.push(`These lighting set-ups were used on the most recent covers and must not be repeated, even under different wording - change the time of day, the main light source, or the weather, not just the phrasing:\n${recent.map(value => `- ${value}`).join('\n')}\n\nBright light is still the default. Pick a materially different bright set-up - for example low-angle early morning sun, hard midday sun with crisp shadows, golden hour, open shade on a sunny day, sunlight through large windows, a high-key studio, crisp winter light, or seaside glare - whichever genuinely fits this week's covers.`)
  }

  return blocks.join('\n\n')
}

// The Year in Music cover is the one tunes image that must carry lettering: the year itself.
// The old wrapped generator stamped it on as "large centered text" with a glow, which read as
// a title card pasted over a montage. The year now has to exist inside the photographed world
// as a physical thing - built, grown, painted, lit, or arranged - and the art director names
// that treatment so consecutive years do not all reach for the same trick.
export function normalizeYear(value) {
  const text = String(value ?? '').trim()
  return /^\d{4}$/.test(text) ? text : ''
}

// The year's exception to the no-text rule. Every other character stays banned, and the
// exception is worded as "exactly these four digits, once" because an image model told it
// may write something will happily add a caption, a second copy, or a slogan next to it.
export function buildYearTextConstraint(year) {
  const digits = normalizeYear(year)
  if (!digits) return TEXT_CONSTRAINT
  return `The only lettering anywhere in the image is the year "${digits}": those four digits, spelled exactly ${digits.split('').join(' ')}, appearing once, large and legible, as a physical part of the scene rather than an overlay. Include no other readable text or lettering of any kind: no other words, letters, numbers, dates, code, glyphs, captions, titles, logos, watermarks, labels, or signage.`
}

export function buildHardConstraints({ year } = {}) {
  const textConstraint = buildYearTextConstraint(year)
  return HARD_CONSTRAINTS.map(constraint => constraint === TEXT_CONSTRAINT ? textConstraint : constraint)
}

// Art-director brief for the year. The treatment menu is a set of examples, not a rotation:
// recent treatments are refused the same way recent concepts are, so a batch regeneration of
// several years cannot land on five hedge mazes.
export function buildYearBlock(year, recentYearTreatments = []) {
  const digits = normalizeYear(year)
  if (!digits) return ''

  const seen = new Set()
  const recent = (Array.isArray(recentYearTreatments) ? recentYearTreatments : [])
    .map(value => String(value || '').trim())
    .filter(value => {
      const key = value.toLowerCase()
      if (!value || seen.has(key)) return false
      seen.add(key)
      return true
    })

  const blocks = [`This is the header for a Year in Music round-up, not a weekly post. The supplied covers are the albums played most across ${digits}, and the image has to say "${digits}" as clearly as it says which records were in rotation.

Show the year ${digits} as large, legible digits that physically exist inside the scene - something a camera on location could actually photograph. Choose the treatment that belongs to the world you are building rather than a default: for example the digits as huge freestanding letters on a hillside or rooftop, cut into a hedge or topiary, mown or planted into a field, painted across a running track, car park, court, or road seen from above, built from stacked flight cases, speaker cabinets, or vinyl crates, lit as a fairground or theatre marquee, flipped up on a stadium or departure-board display, cast as a long shadow by low sun, carved or poured in concrete, or held up as a card stunt by a crowd in the stands. Never let the digits cover, crop, or crowd an identifiable face.

The year is the lead subject of this cover, not set dressing. On a weekly cover one or two album motifs lead; here the year leads and the sleeves are its supporting cast, arranged around and behind it. Make the digits the first thing the eye reads and big enough to read at thumbnail size: spanning at least half the width of the frame and a substantial share of its height, placed in the upper two-thirds or dead centre rather than tucked along the bottom edge. Choose the viewpoint for the digits first - face-on to an upright treatment, or from high enough above that a ground-level treatment reads flat and square rather than receding in steep perspective - and build the rest of the scene from there. The "prompt" must open with the year: its scale, material, and position come before any album motif.

The year must not be a title overlay, a caption, poster typography, floating 3D text, a glowing graphic stamped over the image, or a design laid on top of a collage. It is a physical object in a real place, lit by the same light as everything else.`]

  if (recent.length > 0) {
    blocks.push(`These ways of showing the year were used on other Year in Music covers and must not be repeated, even with different materials or wording - change what the digits are made of and how they sit in the scene:\n${recent.map(value => `- ${value}`).join('\n')}`)
  }

  return blocks.join('\n\n')
}

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
    const people = String(item?.people || item?.persons || item?.figures || '').trim()
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
      people: people || 'none',
      palette
    }
  })
}

// True when the factual pass saw an actual person on the sleeve - the summariser answers
// "none" (or nothing) otherwise. Those sources get an explicit reference map in the final
// prompt so the image model copies the face from the numbered image instead of inventing one.
export function hasPeople(summary) {
  const text = String(summary?.people || '').trim()
  if (!text) return false
  return !/^(none|no\b|nobody|0\b|n\/a)/i.test(text)
}

// The prompt describes people by appearance, which is how faces get invented: "a voluminous-
// haired woman reclining with two dogs" is enough for the model to draw *a* woman, not the one
// on the sleeve. This block ties every person back to their attached, numbered reference.
export function buildReferenceMap(coverSummaries = []) {
  const entries = (Array.isArray(coverSummaries) ? coverSummaries : [])
    .filter(hasPeople)
    .map(summary => `reference image ${summary.source} shows ${summary.people}`)
  if (entries.length === 0) return ''
  return `Reference map for people (the album images are attached in this numbered order): ${entries.join('; ')}. Copy each of these faces directly from that numbered reference image - same face, hair, expression, and styling - rather than drawing a new person from the description.`
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

export function buildFallbackArtDirection(coverSummaries, _sourceReferences, { year } = {}) {
  const digits = normalizeYear(year)
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
    'Render it as a photographic scene - a real place or built set that a camera could capture - unless the supplied artwork strongly calls for another medium; vary the setting, viewpoint, and lighting rather than the medium.',
    'Light it with bright, open daylight so the colours read clean and saturated.',
    digits ? `Show the year ${digits} as huge freestanding digits standing in the landscape like a hillside sign, lit by the same daylight and photographed as part of the place.` : '',
    palette.length > 0 ? `Draw the colour direction from ${palette.join(', ')}.` : '',
    'Make the result specific, surprising, and recognisably connected to the reference images.'
  ].filter(Boolean).join(' ')

  return {
    concept: digits ? `A unified world built from the albums of ${digits}` : 'A unified world built from this week’s album artwork',
    medium: 'photographic scene',
    lighting: 'bright daylight',
    yearTreatment: digits ? 'freestanding hillside digits' : null,
    creativeDirection: 'Freeform interpretation of the supplied album artwork',
    scene: 'One cohesive visual world shaped by the strongest factual motifs across every selected cover.',
    elements,
    palette,
    mood: 'music-led, specific, and visually confident',
    prompt
  }
}

export function normalizeArtDirection(rawDirection, coverSummaries, sourceReferences, { year } = {}) {
  const fallback = buildFallbackArtDirection(coverSummaries, sourceReferences, { year })
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
    medium: String(rawDirection?.medium || rawDirection?.chosenMedium || rawDirection?.chosen_medium || '')
      .trim() || fallback.medium,
    creativeDirection: String(
      rawDirection?.creativeDirection ||
      rawDirection?.creative_direction ||
      rawDirection?.artDirection ||
      rawDirection?.art_direction ||
      fallback.creativeDirection
    ).trim(),
    scene,
    elements: normalizeElements(rawDirection?.elements || rawDirection?.source_elements, sourceReferences),
    lighting: String(rawDirection?.lighting || rawDirection?.light || '').trim() || fallback.lighting,
    yearTreatment: fallback.yearTreatment
      ? String(rawDirection?.yearTreatment || rawDirection?.year_treatment || '').trim() || fallback.yearTreatment
      : null,
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
Return JSON exactly as {"covers":[{"source":1,"description":"string","signatureMotif":"string","medium":"string","people":"string","palette":["string"]}]}.
There must be one item for every supplied source. "signatureMotif" is the single most recognisable non-text visual element in that source. "people" names who is visibly present as a real person in that image - a count and a short visual description such as "one woman reclining with two dogs" or "five young people looking up" - or exactly "none" when the image shows no person. Do not identify anyone by name.`

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
  avoidMedia = [],
  recentLighting = [],
  year = null,
  avoidYearTreatments = [],
  debug
}) {
  const digits = normalizeYear(year)
  if (!openai) {
    if (debug) console.log('  No OPENAI_API_KEY found; using deterministic art direction')
    return buildFallbackArtDirection(coverSummaries, sourceReferences, { year: digits })
  }

  const avoidBlock = avoidConcepts.length > 0
    ? `These concepts were used recently and must not be repeated. Choose a different setting, central idea, and composition:\n${avoidConcepts.map(concept => `- ${concept}`).join('\n')}`
    : ''
  // Concepts describe settings, so the avoid list above only ever steered *where* a cover was
  // set. Left unconstrained on medium the art director reached for cut-paper collage every
  // single week, so recent media are refused on their own axis. Photography is exempt from
  // that refusal (see isPhotographicMedium) because it is the default, not a rotation slot.
  const refusedMedia = avoidMedia.filter(medium => !isPhotographicMedium(medium))
  const avoidMediaBlock = refusedMedia.length > 0
    ? `These media and staging techniques were used on recent covers and are refused for this one. Do not choose any of them or any close variation, and in particular do not build another diorama, shadow box, assemblage, or cut-paper collage unless this week's artwork makes that genuinely unavoidable:\n${refusedMedia.map(medium => `- ${medium}`).join('\n')}\n\nPhotography itself is never on this list and is always available. Reach for a photographic treatment that is materially different from the recent covers - for example a sunlit editorial location shoot, a high-key studio set, a clean medium-format daylight portrait, a bright macro still life, a wide environmental portrait under open sky, or a golden-hour exterior - whichever genuinely fits this week's covers.`
    : ''
  const lightingBlock = buildLightingBlock(recentLighting)
  const yearBlock = buildYearBlock(digits, avoidYearTreatments)
  const hintBlock = hint ? `Author's steer: ${hint}` : ''
  const summaryBlock = coverSummaries
    .map(summary => [
      `Source ${summary.source}`,
      `Description: ${summary.description}`,
      `Signature motif: ${summary.signatureMotif}`,
      `Original medium: ${summary.medium}`,
      `People: ${summary.people || 'none'}`,
      summary.palette.length > 0 ? `Palette: ${summary.palette.join(', ')}` : ''
    ].filter(Boolean).join('\n'))
    .join('\n\n')

  const instructions = `You are a visual art director creating one original 16:9 header image for ${digits ? `the ${digits} Year in Music post on a music blog` : 'a weekly music blog'}.
You will receive factual visual-research summaries of several album covers. The original images remain attached to the image-generation call in the same numbered order.

Choose the creative direction yourself from those visual findings alone. Lean towards photographic realism by default: one physically plausible place, set, or location that a camera could actually capture, with the album motifs present as real objects, surfaces, weather, and light within it and the sleeve portraits carried into it as they are. A non-photographic medium - painting, printmaking, illustration, textiles, sculpture - is allowed only when this particular set of covers makes a strong case for it, and "creativeDirection" must say what that case is. Do not use or assume any blog-post content and do not rotate through a hidden catalogue of preset styles.

Week-to-week variety comes from the scene, not the medium. A tabletop paper diorama or collage assemblage is the path of least resistance when several sleeves are graphic or illustrated, and leaning on it has already produced a long unbroken run of near-identical covers; swapping to a painting every week is the same failure in a different coat. Vary the location, the staging, the time of day, the light, the viewpoint, and the photographic treatment, and treat any move away from photography as a choice you must actively justify against this week's artwork.

Default to bright, open, well-exposed light: daylight exteriors, sunlit interiors, bright overcast, golden hour, or a high-key studio, so the sleeve colours read clean and saturated at a small size. Night, dusk, stage lighting, and low-key "moody" treatments are the other path of least resistance for rock and alternative sleeves, and leaning on them produced a run of dark, murky covers; use them only when this week's covers genuinely demand it. Do not default to wet, rain-slicked, flooded, or mirror-glossy floors reflecting coloured lights, fog, haze, or smoke as atmosphere - use water or haze only when a sleeve itself shows it. Keep the image clean and crisp: no heavy film grain, faded blacks, or distressed-print texture.

Recognisability is the point of this cover, and people are where it is won or lost. When a source includes a person, stage that sleeve's portrait inside the world rather than recasting the person into a new performance: keep their pose, expression, gaze, hair, styling, and the way the sleeve frames them, and change only where they are and what surrounds them. Do not have them asleep, turned away, mid-motion, or half-hidden by steam, shadow, or crowd unless the sleeve does, and never let the photographic treatment - motion blur, long exposure, fog, shallow focus - touch an identifiable face. The treatment belongs to the environment; the people are the fixed points.

In the final "prompt", name every person by their attached reference rather than by appearance alone - "the woman from reference image 8", "the five people from reference image 7" - using the source numbers you were given. The album images are attached to the image model in that numbered order, and a person described only by looks becomes a new invented face. A code-appended reference map repeats the numbers, so they must match.

Invent one specific, surprising composition with a clear visual hierarchy. Give one or two motifs room to lead, use the other sources as supporting objects, forms, palette, texture, atmosphere, or environmental detail, and make every selected source contribute without giving everything equal visual weight. Transform motifs into the chosen world rather than reproducing album sleeves.

Treat each identifiable person as one unique identity and plan only one depiction of them across the whole composition. Do not reuse the same person as both a live figure and a secondary image, reflection, poster, billboard, screen, portrait, silhouette, or background face. Preserve repeated likenesses only when that repetition is visibly intrinsic to one source cover, and contain it within that source's single contribution.

The final "prompt" must be ready to send directly to a multi-reference image model. Write it in the order: scene and viewpoint; primary subject; source-specific details; medium and technique; composition and lighting; palette and mood. Do not include meta-commentary, JSON instructions, or references to this planning conversation. Mandatory safety, text, and layout constraints are appended by code, so concentrate the prompt on precise creative direction.

${avoidBlock}

${avoidMediaBlock}

${lightingBlock}

${yearBlock}

Return JSON exactly as {"concept":"string","medium":"string","lighting":"string",${digits ? '"yearTreatment":"string",' : ''}"creativeDirection":"string","scene":"string","elements":[{"source":1,"element":"string"}],"palette":["string"],"mood":"string","prompt":"string"}.
"concept" is at most 15 words and is saved to the do-not-repeat history. "medium" is at most 8 words naming only the chosen medium or technique - it is saved to the history, and any non-photographic medium is refused on future weeks, so be specific ("daylight location photography", "gouache on board") rather than generic ("mixed media"). "lighting" is at most 6 words naming the time of day and main light source ("midday sun through high windows", "night under neon") - it is saved to the history, recent set-ups are refused on future weeks, and a low-light cover forces daylight on the next one.${digits ? ` "yearTreatment" is at most 10 words naming what the digits ${digits} are made of and where they sit ("hedge-cut digits on a hillside", "marquee bulbs above a theatre door") - it is saved to the history and refused on later Year in Music covers. The final "prompt" must describe the year treatment explicitly and quote the digits as "${digits}".` : ''} "creativeDirection" names the chosen medium and visual approach in one sentence. "elements" records how each numbered source contributes.`

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
      sourceReferences,
      { year: digits }
    )
    if (debug) console.log(`  AI art direction: ${JSON.stringify(direction, null, 2)}`)
    return direction
  } catch (error) {
    console.warn(`  OpenAI art direction failed: ${error.message}`)
    return buildFallbackArtDirection(coverSummaries, sourceReferences, { year: digits })
  }
}

export function buildGenerationPrompt(artDirection, coverSummaries = [], { year } = {}) {
  const creativePrompt = String(artDirection?.prompt || '').trim()
  if (!creativePrompt) throw new Error('The Tunes art director returned an empty image prompt')
  const digits = normalizeYear(year)
  const treatment = String(artDirection?.yearTreatment || '').trim()
  // Restated by code so the digits survive an art-director prompt that buries or paraphrases
  // them; the treatment keeps it tied to the scene rather than inviting a pasted-on title.
  const yearDirective = digits
    ? `The year "${digits}" appears exactly once${treatment ? ` as ${treatment}` : ''}, built into the scene and lit like the rest of the photograph. It is the dominant subject and the first thing the eye reads: the digits span at least half the width of the frame, sit high or centred rather than along the bottom edge, and read face-on and legibly at thumbnail size, with the album motifs and people arranged around it.`
    : ''
  return [
    creativePrompt,
    yearDirective,
    buildReferenceMap(coverSummaries),
    `Hard constraints (override any conflicting source material): ${buildHardConstraints({ year: digits }).join(' ')}`
  ].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
}
