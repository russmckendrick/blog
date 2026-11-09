import OpenAI from 'openai'

const DEFAULT_PROMPT_MODEL = 'gpt-5.4'

const TEXT_CONSTRAINT = 'Include no readable text or lettering of any kind: no words, letters, numbers, code, glyphs, captions, titles, logos, watermarks, labels, or signage.'

// The image model dresses any bright, saturated, daylight scene with plants on its own: the
// 9 Nov 2026 prompt never mentioned a flower, and the cover still came back framed in
// geraniums and ivy. Ten of the thirteen covers from 17 Aug to 9 Nov 2026 had flowers,
// foliage, lawns, or hedges filling the edges or the floor. The art director is told the same
// thing, but the guard has to sit here too because the plants were never in its prompt.
const GREENERY_CONSTRAINT = 'Add no incidental plants: no flowers, potted plants, planters, climbing vines, ivy, hanging foliage, hedges, lawns, flower beds, or greenery framing the edges or carpeting the floor, unless the description above explicitly asks for that plant as part of a source motif or the year treatment. Dress the scene with the materials of the place itself - stone, metal, concrete, wood, fabric, glass, water, equipment - rather than vegetation.'

const HARD_CONSTRAINTS = [
  'Create a single cohesive 16:9 image, not a grid, contact sheet, row of covers, or collage of separate panels.',
  'Do not reproduce the album sleeves as framed thumbnails, and do not get round that by copying a sleeve flat onto a mural, banner, poster, billboard, tapestry, wall panel, screen, or floor graphic; transform their non-text visual motifs into one original composition.',
  TEXT_CONSTRAINT,
  'Feature only adults and avoid gore, wounds, body horror, medical or anatomical imagery, blank or milky eyes, nudity, sexual content, weapons, and hate symbols; reinterpret any sensitive source motif abstractly.',
  'When a source includes a person, closely match their visible appearance and likeness to the reference image, preserving recognisable facial features, hair, skin tone, clothing, and styling, and their apparent age: every person is shown as the adult they are on the sleeve, never younger, smoothed, or more boyish or girlish.',
  'Keep each reference person in the pose, expression, and gaze the sleeve shows, and keep every identifiable face sharp, lit, unobscured, and in focus: no motion blur, long-exposure smearing, steam, fog, shadow, crowding, or shallow depth of field over a reference person\'s face.',
  'Expose the image brightly and cleanly: open, readable shadows and clear colour, with no murky underexposure, crushed blacks, heavy film grain, digital noise, or dust-and-scratches texture.',
  GREENERY_CONSTRAINT,
  'Everyone in the picture is photographed in the same place, at the same moment, under the same light as the rest of the scene, in full colour and with the same lens and grain: do not carry over a sleeve\'s own backdrop, studio lighting, backlit flare, monochrome, colour cast, or print texture onto the person.',
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

// With concept, medium, and lighting all rotating, the composition was the one axis left free,
// and it never moved: every cover from Aug to Nov 2026 was "a wide 16:9 view from slightly
// elevated" across a symmetrical set-piece with six to eight sleeves arranged around it, so
// pool, gym, rooftop, and museum all read as the same exhibition. The chosen composition is
// recorded like the lighting and recent ones are refused.
export const COMPOSITION_REPEAT_WINDOW = 4

// The first fix for the tableau found the next rut at once: four test renders of 19 Oct to
// 9 Nov 2026 all looked down a passage - an underpass, a hangar door, a backstage corridor, a
// school hallway - because the framing menu offered "a view through a doorway" and the director
// counts corridor, tunnel, and loading bay as different places. Passages are one family: they
// are left off the menu, and a recent passage cover refuses the family outright.
const PASSAGE_PATTERN = /\b(corridors?|hallways?|halls? ?way|tunnels?|underpass\w*|passages?|passageways?|alley\w*|lanes?|aisles?|doorways?|door ?frames?|loading[- ]bays?|through (?:a|an|the) (?:door|opening|gap|arch\w*)|deep diagonal|recedes?|receding|vanishing point)\b/i
export const PASSAGE_REPEAT_WINDOW = 3

export function isPassage(value) {
  return PASSAGE_PATTERN.test(String(value || ''))
}

export function buildCompositionBlock(recentCompositions = []) {
  const history = (Array.isArray(recentCompositions) ? recentCompositions : [])
    .map(value => String(value || '').trim())
    .filter(Boolean)
  const seen = new Set()
  const recent = []
  for (const value of history.slice(0, COMPOSITION_REPEAT_WINDOW)) {
    const key = value.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    recent.push(value)
  }

  const blocks = ['The wide, slightly elevated, symmetrical tableau - one central set-piece with every source arranged around it like an exhibition - is the composition this blog has used almost every week, and it is the main reason the covers look alike. Do not use it. A deep passage is the other rut: a corridor, hallway, tunnel, underpass, alley, aisle, or a view through a doorway or loading bay running away into the distance. Use one only when the sleeves leave no alternative. Choose the space and the camera deliberately for this week\'s covers - for example a wide open exterior where the people are small against sky, water, or land; straight down from above; a low angle looking up at a subject against open sky; a flat, face-on view of a room, wall, stage, or shopfront with little depth; a long-lens shot that stacks layers of a street or crowd together; a close crop where one subject fills most of the frame; a high vantage over a square, beach, car park, or field; or a single subject placed off-centre in a lot of open space.']
  if (history.slice(0, PASSAGE_REPEAT_WINDOW).some(isPassage)) {
    blocks.push('A recent cover already looked down a passage. This cover must not be set in or framed through a corridor, hallway, tunnel, underpass, alley, lane, aisle, doorway, or loading bay, under any wording: choose an open or face-on space.')
  }
  if (recent.length > 0) {
    blocks.push(`These compositions were used on the most recent covers and must not be repeated, even under different wording - change the camera height, the distance, or where the main subject sits in the frame:\n${recent.map(value => `- ${value}`).join('\n')}`)
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
    const moderationRisk = normalizeModerationRisk(item?.moderationRisk ?? item?.moderation_risk)
    const peopleBox = normalizeBox(item?.peopleBox ?? item?.people_box)
    const faceHeight = normalizeFraction(item?.faceHeight ?? item?.face_height)
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
      moderationRisk,
      peopleBox,
      faceHeight,
      palette
    }
  })
}

// Faces are copied from the attached sleeves, and a sleeve whose faces are tiny gives the model
// almost nothing to copy: on the 9 Nov 2026 GPT Image 2.6 renders the Pet Shop Boys (heads about
// a tenth of the sleeve) and the small tinted figure on Sweet Inspiration came back as generic
// strangers. So the factual pass also locates the people and measures the largest face, and
// before anything is sent: faces below MIN_CASTABLE_FACE are not castable at all, and cast
// faces below CLOSE_UP_BELOW get a padded close-up crop attached as an extra reference.
export const MIN_CASTABLE_FACE = 0.04
export const CLOSE_UP_BELOW = 0.25
const CLOSE_UP_PADDING = 0.2

function normalizeFraction(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return null
  const fraction = number > 1 && number <= 100 ? number / 100 : number
  return fraction > 0 && fraction <= 1 ? fraction : null
}

function normalizeBox(value) {
  const raw = Array.isArray(value)
    ? value
    : value && typeof value === 'object'
      ? [value.x0 ?? value.left, value.y0 ?? value.top, value.x1 ?? value.right, value.y1 ?? value.bottom]
      : null
  if (!raw || raw.length !== 4) return null
  const numbers = raw.map(Number)
  if (numbers.some(number => !Number.isFinite(number))) return null
  const scaled = numbers.some(number => number > 1) && numbers.every(number => number <= 100)
    ? numbers.map(number => number / 100)
    : numbers
  const [x0, y0, x1, y1] = scaled.map(number => Math.min(1, Math.max(0, number)))
  if (x1 - x0 < 0.02 || y1 - y0 < 0.02) return null
  return [x0, y0, x1, y1]
}

// A person-sleeve is castable unless the factual pass measured its largest face as too small to
// copy. Sleeves with no measurement stay castable rather than being dropped on a missing field.
export function isCastable(summary) {
  if (!hasPeople(summary)) return false
  return summary.faceHeight == null || summary.faceHeight >= MIN_CASTABLE_FACE
}

// The padded crop (fractions of the reference image) to attach as a close-up for a cast
// sleeve, or null when its faces are already large enough or the people were not located.
export function closeUpBox(summary) {
  if (!summary?.peopleBox || summary.faceHeight == null || summary.faceHeight >= CLOSE_UP_BELOW) return null
  const [x0, y0, x1, y1] = summary.peopleBox
  const padX = (x1 - x0) * CLOSE_UP_PADDING
  const padY = (y1 - y0) * CLOSE_UP_PADDING
  return [
    Math.max(0, x0 - padX),
    Math.max(0, y0 - padY),
    Math.min(1, x1 + padX),
    Math.min(1, y1 + padY)
  ]
}

// The image model refuses some sleeves outright - ZZ Top's Greatest Hits, with its models in
// lingerie-style outfits posed around a film camera, sank the first two attempts of the 9 Nov
// 2026 cover on both GPT Image 2.5 and 2.6, and each refusal costs a full art-direction and
// generation round trip. The factual pass already looks at every sleeve, so it also flags
// content a safety filter is likely to refuse, and flagged sleeves are dropped before the
// image call. "none" (or nothing) means no risk; anything else is the reason.
export function normalizeModerationRisk(value) {
  if (value === true) return 'flagged'
  const text = String(value ?? '').trim()
  if (!text || /^(none|no\b|false|0\b|n\/a|low\b)/i.test(text)) return ''
  return text
}

// Splits summaries into kept and flagged, renumbering the kept ones 1..n so the source numbers
// still match the order the remaining images are attached in. `keepIndexes` are positions in
// the original list, used to filter the matching image URLs and paths. Never drops below
// `minKeep`: a week where too much is flagged keeps its least-bad sleeves and lets the
// backend's own refusal-and-fallback handling decide.
export function dropModerationRisks(coverSummaries = [], { minKeep = 2 } = {}) {
  const summaries = Array.isArray(coverSummaries) ? coverSummaries : []
  const flaggedIndexes = summaries
    .map((summary, index) => (summary?.moderationRisk ? index : -1))
    .filter(index => index >= 0)
  if (flaggedIndexes.length === 0 || summaries.length - flaggedIndexes.length < minKeep) {
    return { kept: summaries, keepIndexes: summaries.map((_, index) => index), dropped: [] }
  }

  const flagged = new Set(flaggedIndexes)
  const keepIndexes = summaries.map((_, index) => index).filter(index => !flagged.has(index))
  return {
    kept: keepIndexes.map((index, position) => ({ ...summaries[index], source: position + 1 })),
    keepIndexes,
    dropped: flaggedIndexes.map(index => summaries[index])
  }
}

// The 9 Nov 2026 test render on GPT Image 2.6 put four sleeves' people into one underpass, each
// in its own station and keeping its sleeve's lighting, and it read as a cut-out montage. Two
// cast sources is the most a single photographed moment carries; the other sleeves' people are
// left out entirely, and the reference map only names the cast.
export const MAX_CAST = 2

export function normalizeCast(rawCast, coverSummaries = []) {
  const withPeople = new Set((Array.isArray(coverSummaries) ? coverSummaries : []).filter(isCastable).map(summary => summary.source))
  const cast = []
  for (const value of Array.isArray(rawCast) ? rawCast : []) {
    const source = Number(value?.source ?? value)
    if (withPeople.has(source) && !cast.includes(source)) cast.push(source)
  }
  return cast.slice(0, MAX_CAST)
}

// Source numbers whose people the prompt describes ("the woman from reference image 4") without
// casting them. Used to send the brief back once rather than ship a crowded montage.
const PERSON_REFERENCE_PATTERN = /\b(?:person|people|man|men|woman|women|band|group|figures?|members?|couple|singer|musicians?|trio|duo|quartet)\s+(?:from|in|of)\s+reference image (\d+)/gi

export function findUncastPeople(prompt, cast = [], coverSummaries = []) {
  const withPeople = new Set((Array.isArray(coverSummaries) ? coverSummaries : []).filter(hasPeople).map(summary => summary.source))
  const castSet = new Set(cast)
  const found = new Set()
  for (const match of String(prompt || '').matchAll(PERSON_REFERENCE_PATTERN)) {
    const source = Number(match[1])
    if (withPeople.has(source) && !castSet.has(source)) found.add(source)
  }
  return [...found]
}

// The flat-copy rule in the hard constraints never held, because the art director wrote the
// copies into its own prompt and argued round the rule: the chained test renders of 19 Oct to
// 9 Nov 2026 asked for "a painted wall mural", "a freestanding painted green circular
// backdrop", and "a real painted panel ... adapted as venue decor rather than a copied album
// cover". Any clause that ties a numbered reference to a flat or displayed surface is caught
// here and the brief is sent back, the same way over-casting is.
const FLAT_COPY_PATTERN = /\b(murals?|backdrops?|banners?|posters?|billboards?|tapestr(?:y|ies)|decals?|stickers?|signs?|signage|emblems?|plaques?|tiles?|painted|painting|paintings|printed|prints?|stencil\w*|wallpaper|flags?|pennants?|logos?|framed|canvas(?:es)?|artworks?|graphics?|panels?|insignia|badges?|medallions?)\b/i
const REFERENCE_NUMBER_PATTERN = /reference image (\d+)/gi

// A clause can mention paint and a reference without one being the other ("the man from
// reference image 2 sits on a painted concrete floor"), so the surface word has to sit within
// a few words of the reference it is attached to.
const FLAT_COPY_WINDOW = 12

export function findFlatCopies(prompt) {
  const clauses = String(prompt || '').split(/(?<=[.;:])\s+|,\s+/)
  const found = []
  for (const clause of clauses) {
    const words = clause.split(/\s+/)
    const flatAt = []
    const refAt = []
    words.forEach((word, index) => {
      if (FLAT_COPY_PATTERN.test(word.replace(/[^a-z-]/gi, ''))) flatAt.push(index)
      if (/^image$/i.test(word) && /^reference$/i.test(words[index - 1] || '')) {
        const source = Number(String(words[index + 1] || '').replace(/\D/g, ''))
        if (source > 0) refAt.push({ index, source })
      }
    })
    for (const { index, source } of refAt) {
      if (flatAt.some(at => Math.abs(at - index) <= FLAT_COPY_WINDOW) && !found.includes(source)) found.push(source)
    }
  }
  return found
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
// `cast`, when given, limits the map to the sources the art director chose to show and adds an
// explicit exclusion, so the people on the other attached sleeves are not drawn in as extras.
export function buildReferenceMap(coverSummaries = [], cast = null, closeUps = []) {
  const people = (Array.isArray(coverSummaries) ? coverSummaries : []).filter(hasPeople)
  const castSet = Array.isArray(cast) ? new Set(cast) : null
  const shown = castSet ? people.filter(summary => castSet.has(summary.source)) : people
  const omitted = castSet ? people.filter(summary => !castSet.has(summary.source)) : []
  const parts = []
  if (shown.length > 0) {
    const closeUpBySource = new Map((Array.isArray(closeUps) ? closeUps : []).map(item => [item.source, item.reference]))
    const describe = summary => {
      const closeUp = closeUpBySource.get(summary.source)
      return closeUp
        ? `reference image ${summary.source} shows ${summary.people}, and reference image ${closeUp} is an enlarged close-up of those same people - take their faces from reference image ${closeUp}`
        : `reference image ${summary.source} shows ${summary.people}`
    }
    parts.push(`Reference map for people (the album images are attached in this numbered order): ${shown.map(describe).join('; ')}. Copy each of these faces directly from that numbered reference image - same face, bone structure, hair, expression, and styling - rather than drawing a new person from the description.`)
  }
  if (omitted.length > 0) {
    parts.push(`Nobody from reference image${omitted.length > 1 ? 's' : ''} ${omitted.map(summary => summary.source).join(', ')} appears in the picture: use those images only for colour, setting, and objects, and add no figures, faces, or silhouettes from them.`)
  }
  return parts.join(' ')
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
    'Frame it asymmetrically, with the lead motif off-centre in plenty of open space rather than a symmetrical tableau.',
    digits ? `Show the year ${digits} as huge freestanding digits standing in the landscape like a hillside sign, lit by the same daylight and photographed as part of the place.` : '',
    palette.length > 0 ? `Draw the colour direction from ${palette.join(', ')}.` : '',
    'Make the result specific, surprising, and recognisably connected to the reference images.'
  ].filter(Boolean).join(' ')

  const cast = coverSummaries.filter(hasPeople).slice(0, 1).map(summary => summary.source)
  return {
    cast,
    concept: digits ? `A unified world built from the albums of ${digits}` : 'A unified world built from this week’s album artwork',
    medium: 'photographic scene',
    lighting: 'bright daylight',
    composition: 'off-centre subject, deep open space',
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
    cast: Array.isArray(rawDirection?.cast) ? normalizeCast(rawDirection.cast, coverSummaries) : (prompt ? null : fallback.cast),
    elements: normalizeElements(rawDirection?.elements || rawDirection?.source_elements, sourceReferences),
    lighting: String(rawDirection?.lighting || rawDirection?.light || '').trim() || fallback.lighting,
    composition: String(rawDirection?.composition || rawDirection?.framing || '').trim() || fallback.composition,
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
Return JSON exactly as {"covers":[{"source":1,"description":"string","signatureMotif":"string","medium":"string","people":"string","peopleBox":[0,0,1,1],"faceHeight":0.1,"moderationRisk":"string","palette":["string"]}]}.
There must be one item for every supplied source. "signatureMotif" is the single most recognisable non-text visual element in that source. "people" names who is visibly present as a real person in that image - a count and a short visual description such as "one woman reclining with two dogs" or "five young people looking up" - or exactly "none" when the image shows no person. Do not identify anyone by name.
When "people" is not "none": "peopleBox" is [x0, y0, x1, y1] as fractions of the image width and height (0 to 1, origin top-left) tightly enclosing the heads and shoulders of every real person shown, and "faceHeight" is the height of the largest real face (chin to top of head) as a fraction of the image height - for example 0.06 for small heads in a wide group shot, 0.45 for a close portrait. Measure the image as supplied. When "people" is "none", set "peopleBox" to null and "faceHeight" to 0.
"moderationRisk" is exactly "none" unless the image contains something a strict image-generation safety filter is likely to refuse when the sleeve is supplied as a reference: nudity or partial nudity, lingerie, swimwear, or other revealing clothing worn in a sexualised way, suggestive or sexualised posing, sexual content, gore or graphic injury, weapons pointed or in use, drug use, hate symbols, or anyone who may be a minor shown in a sensitive way. When it applies, give a short factual reason such as "women in lingerie-style outfits in suggestive poses". Ordinary band portraits, stage shots, casual clothing, and abstract or illustrated imagery are "none".`

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
      max_output_tokens: 2600,
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
  recentCompositions = [],
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
  const compositionBlock = buildCompositionBlock(recentCompositions)
  const yearBlock = buildYearBlock(digits, avoidYearTreatments)
  const hintBlock = hint ? `Author's steer: ${hint}` : ''
  const summaryBlock = coverSummaries
    .map(summary => [
      `Source ${summary.source}`,
      `Description: ${summary.description}`,
      `Signature motif: ${summary.signatureMotif}`,
      `Original medium: ${summary.medium}`,
      `People: ${summary.people || 'none'}`,
      hasPeople(summary) && !isCastable(summary) ? 'Castable: no - the faces on this sleeve are too small to reproduce recognisably; do not cast its people' : '',
      summary.palette.length > 0 ? `Palette: ${summary.palette.join(', ')}` : ''
    ].filter(Boolean).join('\n'))
    .join('\n\n')

  const instructions = `You are a visual art director creating one original 16:9 header image for ${digits ? `the ${digits} Year in Music post on a music blog` : 'a weekly music blog'}.
You will receive factual visual-research summaries of several album covers. The original images remain attached to the image-generation call in the same numbered order.

Choose the creative direction yourself from those visual findings alone. Lean towards photographic realism by default: one physically plausible place, set, or location that a camera could actually capture, with the album motifs present as real objects, surfaces, weather, and light within it and the sleeve portraits carried into it as they are. A non-photographic medium - painting, printmaking, illustration, textiles, sculpture - is allowed only when this particular set of covers makes a strong case for it, and "creativeDirection" must say what that case is. Do not use or assume any blog-post content and do not rotate through a hidden catalogue of preset styles.

Week-to-week variety comes from the scene, not the medium. A tabletop paper diorama or collage assemblage is the path of least resistance when several sleeves are graphic or illustrated, and leaning on it has already produced a long unbroken run of near-identical covers; swapping to a painting every week is the same failure in a different coat. Vary the location, the staging, the time of day, the light, the viewpoint, and the photographic treatment, and treat any move away from photography as a choice you must actively justify against this week's artwork.

Default to bright, open, well-exposed light: daylight exteriors, sunlit interiors, bright overcast, golden hour, or a high-key studio, so the sleeve colours read clean and saturated at a small size. Bright and saturated does not mean lush: do not dress the scene with flowers, potted plants, vines, ivy, hedges, lawns, or gardens. Flowers and foliage have crept into almost every recent cover as filler and made them look alike. Use a plant only when a sleeve itself shows it (or, on a Year in Music cover, when the digits themselves are grown or cut from it), and keep it inside that contribution rather than spreading it across the scene. Prefer locations that are not gardens, parks, courtyards, or meadows unless a sleeve puts you there. Night, dusk, stage lighting, and low-key "moody" treatments are the other path of least resistance for rock and alternative sleeves, and leaning on them produced a run of dark, murky covers; use them only when this week's covers genuinely demand it. Do not default to wet, rain-slicked, flooded, or mirror-glossy floors reflecting coloured lights, fog, haze, or smoke as atmosphere - use water or haze only when a sleeve itself shows it. Keep the image clean and crisp: no heavy film grain, faded blacks, or distressed-print texture.

Cohesion comes first. The picture must read as one real photograph of one moment in one place - something a photographer could have walked up to and shot - not a set of stations where each sleeve gets its own corner, alcove, prop, or figure. Decide what is happening in the scene before deciding what goes in it. It is fine, and usually better, for several sources to contribute nothing but colour, light, material, or weather, and for one or two to contribute nothing at all; a cover that finds a place for every sleeve reads as an exhibition, not a picture.

Cast at most ${MAX_CAST} sources as people. People are where a cover is won or lost, and every extra group of sleeve people becomes another pasted-in island. Choose the one or two portraits that best suit the moment and leave the others' people out entirely: a sleeve whose people are not cast may still lend its palette, setting, or an object, but nobody from it appears. List the cast in "cast" by source number.

Recognisability is the point for the people you do cast. Stage that sleeve's portrait inside the world rather than recasting the person into a new performance: keep their pose, expression, gaze, hair, and styling, and change where they are, what surrounds them, and the light falling on them - they are standing in this scene's light, not the sleeve's studio. Do not have them asleep, turned away, mid-motion, or half-hidden by steam, shadow, or crowd unless the sleeve does, and never let the photographic treatment - motion blur, long exposure, fog, shallow focus - touch an identifiable face. The treatment belongs to the environment; the people are the fixed points.

In the final "prompt", name every cast person by their attached reference rather than by appearance alone - "the woman from reference image 8", "the five people from reference image 7" - using the source numbers you were given. The album images are attached to the image model in that numbered order, and a person described only by looks becomes a new invented face. A code-appended reference map repeats the numbers, so they must match.

Invent one specific, surprising composition with a clear visual hierarchy. Pick two, at most three, sources to lead as people or major objects. The rest contribute something smaller and folded into the place itself - its palette, a material, a texture, the weather, the light, one prop that belongs there - not another figure, niche, plaque, or set-piece. Transform motifs into the chosen world rather than reproducing album sleeves. No sleeve may appear as a picture on a surface - not a mural, painted wall, painted floor or court marking, backdrop, banner, flag, poster, sign, emblem, plaque, tile, decal, framed picture, or painted panel - however it is justified, "adapted as decor" included. Graphic, abstract, and illustrated sleeves are where this goes wrong, because they have no object to borrow. Translate them into the physical world instead: their colours become the paint of a car, an awning, a shirt, stage gels, or light through coloured glass; their shapes become a real object, a piece of furniture, a sculpture, a shadow, or a building's form; or they contribute only palette. If a graphic sleeve has no natural physical form in this scene, let it contribute colour alone.

Treat each identifiable person as one unique identity and plan only one depiction of them across the whole composition. Do not reuse the same person as both a live figure and a secondary image, reflection, poster, billboard, screen, portrait, silhouette, or background face. Preserve repeated likenesses only when that repetition is visibly intrinsic to one source cover, and contain it within that source's single contribution.

The final "prompt" must be ready to send directly to a multi-reference image model. Write it in the order: scene and viewpoint; primary subject; source-specific details; medium and technique; composition and lighting; palette and mood. Do not include meta-commentary, JSON instructions, or references to this planning conversation. Mandatory safety, text, and layout constraints are appended by code, so concentrate the prompt on precise creative direction.

${avoidBlock}

${avoidMediaBlock}

${lightingBlock}

${compositionBlock}

${yearBlock}

Return JSON exactly as {"concept":"string","medium":"string","lighting":"string","composition":"string",${digits ? '"yearTreatment":"string",' : ''}"creativeDirection":"string","scene":"string","cast":[1],"elements":[{"source":1,"element":"string"}],"palette":["string"],"mood":"string","prompt":"string"}.
"concept" is at most 15 words and is saved to the do-not-repeat history. "medium" is at most 8 words naming only the chosen medium or technique - it is saved to the history, and any non-photographic medium is refused on future weeks, so be specific ("daylight location photography", "gouache on board") rather than generic ("mixed media"). "lighting" is at most 6 words naming the time of day and main light source ("midday sun through high windows", "night under neon") - it is saved to the history, recent set-ups are refused on future weeks, and a low-light cover forces daylight on the next one. "composition" is at most 8 words naming the camera position and framing ("low angle, lone figure off-centre", "top-down over a crowded floor") - it is saved to the history and recent ones are refused on future weeks.${digits ? ` "yearTreatment" is at most 10 words naming what the digits ${digits} are made of and where they sit ("hedge-cut digits on a hillside", "marquee bulbs above a theatre door") - it is saved to the history and refused on later Year in Music covers. The final "prompt" must describe the year treatment explicitly and quote the digits as "${digits}".` : ''} "creativeDirection" names the chosen medium and visual approach in one sentence. "elements" records how each numbered source contributes; leave out any source that contributes nothing. "cast" lists the source numbers whose people appear, at most ${MAX_CAST}, or is empty.`

  const requestText = buildArtDirectionRequestText(hintBlock, summaryBlock)
  const requestDirection = async correction => {
    const response = await openai.responses.create({
      model: process.env.OPENAI_TUNES_COVER_DIRECTION_MODEL || process.env.OPENAI_TUNES_COVER_MODEL || process.env.OPENAI_MODEL || DEFAULT_PROMPT_MODEL,
      instructions,
      input: [
        {
          type: 'message',
          role: 'user',
          content: [{
            type: 'input_text',
            text: correction ? `${requestText}\n\n${correction}` : requestText
          }]
        }
      ],
      text: { format: { type: 'json_object' } },
      max_output_tokens: 1900,
      temperature: 0.9
    })
    return normalizeArtDirection(
      parseJSONResponse(response.output_text || ''),
      coverSummaries,
      sourceReferences,
      { year: digits }
    )
  }

  try {
    let direction = await requestDirection()
    // The cast limit and the no-flat-copies rule are the two the director most readily talks
    // itself out of, and either one turns a cover into a montage. Send it back once with the
    // specific sources named; a second miss ships with a warning.
    const problemsWith = candidate => {
      const problems = []
      const uncast = candidate.cast ? findUncastPeople(candidate.prompt, candidate.cast, coverSummaries) : []
      if (uncast.length > 0) {
        problems.push(`it cast ${candidate.cast.length ? `source${candidate.cast.length > 1 ? 's' : ''} ${candidate.cast.join(', ')}` : 'nobody'} but still placed people from source${uncast.length > 1 ? 's' : ''} ${uncast.join(', ')} in the scene`)
      }
      const flat = findFlatCopies(candidate.prompt)
      if (flat.length > 0) {
        problems.push(`it shows source${flat.length > 1 ? 's' : ''} ${flat.join(', ')} as a picture on a surface (mural, painted wall or floor, backdrop, banner, sign, emblem, panel, or similar)`)
      }
      return problems
    }
    const problems = problemsWith(direction)
    if (problems.length > 0) {
      if (debug) console.log(`  Art director brief rejected (${problems.join('; ')}); asking again`)
      direction = await requestDirection(`Your previous answer was rejected: ${problems.join('; and ')}. Answer again with at most ${MAX_CAST} cast sources and no people from any other source, no sleeve shown as a picture on any surface - translate graphic sleeves into real objects, materials, colour, or light, or let them contribute palette only - and one cohesive moment rather than a station for each sleeve.`)
      const remaining = problemsWith(direction)
      if (remaining.length > 0) console.warn(`  Art director brief still has problems: ${remaining.join('; ')}`)
    }
    if (debug) console.log(`  AI art direction: ${JSON.stringify(direction, null, 2)}`)
    return direction
  } catch (error) {
    console.warn(`  OpenAI art direction failed: ${error.message}`)
    return buildFallbackArtDirection(coverSummaries, sourceReferences, { year: digits })
  }
}

export function buildGenerationPrompt(artDirection, coverSummaries = [], { year, closeUps = [] } = {}) {
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
    buildReferenceMap(coverSummaries, Array.isArray(artDirection?.cast) ? artDirection.cast : null, closeUps),
    `Hard constraints (override any conflicting source material): ${buildHardConstraints({ year: digits }).join(' ')}`
  ].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
}
