import OpenAI from 'openai'

const DEFAULT_PROMPT_MODEL = 'gpt-5.4'
const ARTIST_SUMMARY_TOKEN_BUDGETS = [6000, 10000]
const SETTING_STRENGTH_RANK = { strong: 3, moderate: 2, weak: 1 }

// Likeness is only as good as the pixels behind it. The 9 Nov 2026 portrait cast its lead from
// an aerial band shot whose faces were about 2% of the frame, and the image model invented a
// face for him. The factual pass now measures the primary adult's face and locates them in the
// frame: faces below MIN_CASTABLE_FACE (fraction of image height) are kept out of the cast
// while enough larger ones exist, and a primary adult who shares their photo with other people,
// or fills less than SOLO_CLOSE_UP_MAX_AREA of it alone, is sent to the image model as a padded
// crop rather than the whole shot. The vision pass over-reads tiny faces (it measured that
// aerial shot at 0.055 and 0.08 on separate runs), so the floor sits above what a distant
// figure is likely to be given.
export const MIN_CASTABLE_FACE = 0.1
const GROUP_CLOSE_UP_MAX_AREA = 0.9
const SOLO_CLOSE_UP_MAX_AREA = 0.4
const CLOSE_UP_PADDING = 0.15

const ARTIST_SUMMARY_FORMAT = {
  type: 'json_schema',
  name: 'artist_photo_summaries',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      sources: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            source: { type: 'integer' },
            description: { type: 'string' },
            primarySubject: { type: 'string' },
            visiblePeople: {
              type: 'array',
              items: { type: 'string' }
            },
            wardrobe: { type: 'string' },
            photoStyle: { type: 'string' },
            setting: { type: 'string' },
            settingStrength: {
              type: 'string',
              enum: ['strong', 'moderate', 'weak']
            },
            faceHeight: { type: 'number' },
            subjectBox: {
              type: 'array',
              items: { type: 'number' }
            }
          },
          required: [
            'source',
            'description',
            'primarySubject',
            'visiblePeople',
            'wardrobe',
            'photoStyle',
            'setting',
            'settingStrength',
            'faceHeight',
            'subjectBox'
          ],
          additionalProperties: false
        }
      }
    },
    required: ['sources'],
    additionalProperties: false
  }
}

const ARTIST_DIRECTION_FORMAT = {
  type: 'json_schema',
  name: 'artist_art_direction',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      selection: {
        type: 'array',
        items: { type: 'integer' }
      },
      locationSource: { type: 'integer' },
      locationEvidence: { type: 'string' },
      concept: { type: 'string' },
      creativeDirection: { type: 'string' },
      scene: { type: 'string' },
      castPlan: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            source: { type: 'integer' },
            person: { type: 'string' },
            placement: { type: 'string' }
          },
          required: ['source', 'person', 'placement'],
          additionalProperties: false
        }
      },
      palette: {
        type: 'array',
        items: { type: 'string' }
      },
      mood: { type: 'string' },
      prompt: { type: 'string' }
    },
    required: [
      'selection',
      'locationSource',
      'locationEvidence',
      'concept',
      'creativeDirection',
      'scene',
      'castPlan',
      'palette',
      'mood',
      'prompt'
    ],
    additionalProperties: false
  }
}

const ARTIST_HARD_CONSTRAINTS = [
  'Create one cohesive photorealistic 16:9 group photograph in a single real-world scene, not a grid, contact sheet, row, montage, or collection of separate panels.',
  'Portray exactly one adult from each attached cast reference image and no one else; when a cast reference shows more than one person, use only the one specifically described cast member. The setting reference contributes the place only and never a person.',
  'Depict each selected person exactly once in the entire composition. Never duplicate or clone anyone as another figure, reflection, mirror portrait, poster, billboard, screen, photograph, painting, silhouette, or background face.',
  'Keep every selected person closely recognisable and faithful to their reference photo, preserving facial features, skin tone, hair, facial hair, eyewear, clothing, styling, and overall likeness.',
  // Two failures bracket these rules. The first six-person trials kept every likeness but read
  // as a collage: each person arrived with their own reference's light and colour cast and
  // nobody shared the scene. Telling the model to give everyone a new pose, expression and
  // eyeline fixed that and lost the people: on 19 Oct to 2 Nov 2026 it drew George Michael and
  // Michael Hutchence laughing over a toast and Kurt Cobain grinning in a huddle, and none of
  // them was recognisable. So the face is locked and the scene is unified around it - through
  // light, grade, bodies and placement, never through a new expression.
  'FACE LOCK: copy each person\'s face from their reference as photographed - the same expression, mouth, eyes, eyewear, and head angle, turned by no more than a few degrees. Never invent a smile, grin, laugh, open mouth, squint, raised brow, or new head tilt that the reference does not show. A neutral or serious reference face stays neutral or serious.',
  'A cast reference fixes the face, not the light or the grade. Never carry over a reference\'s lighting direction, coloured or stage light, colour cast, black-and-white treatment, contrast, grain, sharpness, background fragments, or cut-out edges.',
  'Render the photograph in full natural colour, always - including when the setting reference or any cast reference is black-and-white, monochrome, or tinted. Take the place and the faces from such references and supply true-to-life colour for both.',
  'This is one photograph taken in one exposure through one lens. Light every person with the single light of the location: the same direction, softness, colour temperature, and shadow density on every face, with the location\'s bounce and reflections on skin, hair, and clothing. Give everyone the same colour grade, grain, perspective, and depth of field, sized by their distance from the camera.',
  'Unify the group through bodies and placement, not faces: stand or sit them shoulder to shoulder, overlapping and partly occluding one another, leaning on each other or on the same surface, with contact shadows and real weight on the ground. Turn and place each body so that the gaze their reference already has lands on the camera or on another person.',
  'Do not average, beautify, de-age, substitute, invent, merge, blend, morph, or distort faces or bodies, and do not add a background crowd, extra limbs, or deformed hands.',
  'Frame the group close or medium-close so every face is large, sharp, unobstructed, and richly detailed.',
  'Allow natural, source-grounded readable text or logos on clothing, screens, signs, labels, instruments, or props. Do not add editorial captions, titles, credits, borders, or watermarks.'
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

class ArtistSummaryResponseError extends Error {
  constructor(message, { retryable = false } = {}) {
    super(message)
    this.name = 'ArtistSummaryResponseError'
    this.retryable = retryable
  }
}

function extractResponseRefusal(response) {
  const refusals = []
  for (const outputItem of (Array.isArray(response?.output) ? response.output : [])) {
    for (const contentItem of (Array.isArray(outputItem?.content) ? outputItem.content : [])) {
      if (contentItem?.type === 'refusal' && contentItem.refusal) {
        refusals.push(String(contentItem.refusal).trim())
      }
    }
  }
  return refusals.filter(Boolean).join(' ')
}

export function parseArtistSummaryResponse(response) {
  const status = response?.status || 'unknown'
  const refusal = extractResponseRefusal(response)
  if (refusal) {
    throw new ArtistSummaryResponseError(`response was refused: ${refusal}`)
  }

  if (status === 'incomplete') {
    const reason = response?.incomplete_details?.reason || 'unknown reason'
    throw new ArtistSummaryResponseError(
      `response was incomplete (${reason})`,
      { retryable: true }
    )
  }

  if (status === 'failed' || response?.error) {
    const detail = response?.error?.message || response?.error?.code || 'unknown API error'
    throw new ArtistSummaryResponseError(`response failed: ${detail}`)
  }

  const outputText = String(response?.output_text || '').trim()
  if (!outputText) {
    throw new ArtistSummaryResponseError(
      `response completed with empty output (status: ${status})`,
      { retryable: true }
    )
  }

  try {
    return parseJSONResponse(outputText)
  } catch (error) {
    throw new ArtistSummaryResponseError(
      `response contained invalid JSON (status: ${status}): ${error.message}`,
      { retryable: true }
    )
  }
}

function requireCompleteArtistSummaries(rawSources, sourceReferences) {
  if (!Array.isArray(rawSources)) {
    throw new ArtistSummaryResponseError(
      'structured response did not contain a sources array',
      { retryable: true }
    )
  }

  const expectedSources = sourceReferences.map((reference, index) => reference.source || index + 1)
  const returnedSources = rawSources.map(item => Number(item?.source))
  const missingSources = expectedSources.filter(source => !returnedSources.includes(source))
  const duplicateSources = returnedSources.filter((source, index) => returnedSources.indexOf(source) !== index)
  const incompleteSources = rawSources
    .filter(item => [
      item?.description,
      item?.primarySubject,
      item?.wardrobe,
      item?.photoStyle,
      item?.setting,
      item?.settingStrength
    ].some(value => !String(value || '').trim()))
    .map(item => Number(item?.source))

  if (
    rawSources.length !== expectedSources.length ||
    missingSources.length > 0 ||
    duplicateSources.length > 0 ||
    incompleteSources.length > 0
  ) {
    const details = [
      rawSources.length !== expectedSources.length
        ? `expected ${expectedSources.length} sources but received ${rawSources.length}`
        : '',
      missingSources.length > 0 ? `missing sources ${missingSources.join(', ')}` : '',
      duplicateSources.length > 0 ? `duplicate sources ${[...new Set(duplicateSources)].join(', ')}` : '',
      incompleteSources.length > 0 ? `incomplete sources ${incompleteSources.join(', ')}` : ''
    ].filter(Boolean).join('; ')
    throw new ArtistSummaryResponseError(
      `structured response was incomplete: ${details}`,
      { retryable: true }
    )
  }

  return rawSources
}

function cleanList(value, limit = 8) {
  return (Array.isArray(value) ? value : [])
    .map(item => String(item).trim())
    .filter(Boolean)
    .slice(0, limit)
}

function firstSentence(text) {
  const trimmed = String(text || '').trim()
  const match = trimmed.match(/^[^.!?]+[.!?]?/)
  return (match ? match[0] : trimmed).trim()
}

export function buildArtistSummaryRequestText(imageCount, sourceIndex) {
  return `Return JSON only. Factually analyse all ${imageCount} artist reference photos. The images are attached in this exact order:\n${sourceIndex}`
}

export function buildArtistDirectionRequestText(hintBlock, summaryBlock) {
  return [
    'Return JSON only.',
    hintBlock,
    'Factual artist-photo summaries:',
    summaryBlock
  ].filter(Boolean).join('\n\n')
}

export function normalizeArtistSummaries(rawSources = [], sourceReferences = []) {
  const bySource = new Map()
  for (const [index, item] of (Array.isArray(rawSources) ? rawSources : []).entries()) {
    const source = Number(item?.source || item?.source_index || item?.image || index + 1)
    if (Number.isFinite(source) && source > 0) bySource.set(source, item)
  }

  return sourceReferences.map((reference, index) => {
    const source = reference.source || index + 1
    const item = bySource.get(source) || {}
    const description = String(item?.description || item?.summary || '').trim()
    const primarySubject = String(
      item?.primarySubject ||
      item?.primary_subject ||
      item?.mainPerson ||
      item?.main_person ||
      ''
    ).trim()
    const wardrobe = String(item?.wardrobe || item?.clothing || item?.styling || '').trim()
    const photoStyle = String(item?.photoStyle || item?.photo_style || '').trim()
    const setting = String(
      item?.setting ||
      item?.physicalSetting ||
      item?.physical_setting ||
      ''
    ).trim()
    const rawSettingStrength = String(
      item?.settingStrength ||
      item?.setting_strength ||
      ''
    ).trim().toLowerCase()
    const settingStrength = ['strong', 'moderate', 'weak'].includes(rawSettingStrength)
      ? rawSettingStrength
      : 'weak'

    return {
      source,
      filename: reference.filename,
      artist: reference.artist || '',
      faceHeight: normalizeFraction(item?.faceHeight ?? item?.face_height),
      subjectBox: normalizeBox(item?.subjectBox ?? item?.subject_box),
      description: description || `Reference ${source} is an artist photo; no reliable visual description was returned.`,
      primarySubject: primarySubject || `the most visually prominent adult in reference ${source}`,
      visiblePeople: cleanList(item?.visiblePeople || item?.visible_people || item?.people),
      wardrobe: wardrobe || 'wardrobe not confidently described',
      photoStyle: photoStyle || 'photographic treatment not confidently described',
      setting: setting || 'no distinctive physical setting is clearly visible',
      settingStrength
    }
  })
}

function normalizeFraction(value) {
  if (value == null || value === '') return null
  const number = Number(value)
  if (!Number.isFinite(number)) return null
  const fraction = number > 1 && number <= 100 ? number / 100 : number
  return fraction > 0 && fraction <= 1 ? fraction : null
}

function normalizeBox(value) {
  if (!Array.isArray(value) || value.length !== 4) return null
  const numbers = value.map(Number)
  if (numbers.some(number => !Number.isFinite(number))) return null
  const scaled = numbers.some(number => number > 1) && numbers.every(number => number <= 100)
    ? numbers.map(number => number / 100)
    : numbers
  const [x0, y0, x1, y1] = scaled.map(number => Math.min(1, Math.max(0, number)))
  if (x1 - x0 < 0.02 || y1 - y0 < 0.02) return null
  return [x0, y0, x1, y1]
}

// A photo is castable unless the factual pass measured its primary face as too small to copy.
// Photos with no measurement stay castable rather than being dropped on a missing field.
export function isCastableArtist(summary) {
  return summary?.faceHeight == null || summary.faceHeight >= MIN_CASTABLE_FACE
}

// The padded crop (fractions of the photo) to send as a cast member's reference, or null when
// the primary adult was not located or is a lone subject who already fills the frame.
export function artistCloseUpBox(summary) {
  if (!summary?.subjectBox) return null
  const [x0, y0, x1, y1] = summary.subjectBox
  const shared = (summary.visiblePeople || []).length > 1
  if ((x1 - x0) * (y1 - y0) >= (shared ? GROUP_CLOSE_UP_MAX_AREA : SOLO_CLOSE_UP_MAX_AREA)) return null
  const padX = (x1 - x0) * CLOSE_UP_PADDING
  const padY = (y1 - y0) * CLOSE_UP_PADDING
  return [
    Math.max(0, x0 - padX),
    Math.max(0, y0 - padY),
    Math.min(1, x1 + padX),
    Math.min(1, y1 + padY)
  ]
}

// Sources the cast may be drawn from, in play-rank order. When too few photos have a usable
// face the pool is topped up from the rest, largest face first, rather than casting short.
export function castableSources(artistSummaries = [], sourceReferences = [], featureCount = 1) {
  const bySource = new Map(artistSummaries.map(summary => [Number(summary?.source), summary]))
  const sources = sourceReferences.map(reference => reference.source)
  const castable = sources.filter(source => isCastableArtist(bySource.get(source)))
  if (castable.length >= featureCount) return castable

  const relaxed = sources
    .filter(source => !castable.includes(source))
    .sort((a, b) => (bySource.get(b)?.faceHeight || 0) - (bySource.get(a)?.faceHeight || 0))
    .slice(0, featureCount - castable.length)
  return sources.filter(source => castable.includes(source) || relaxed.includes(source))
}

function strongestLocationSummary(artistSummaries = [], sourceReferences = []) {
  const validSources = new Set(sourceReferences.map(reference => reference.source))
  const candidates = artistSummaries
    .filter(summary => validSources.has(Number(summary?.source)))
    .map(summary => ({
      ...summary,
      source: Number(summary.source),
      strengthRank: SETTING_STRENGTH_RANK[summary.settingStrength] || 0,
      settingLength: String(summary.setting || '').trim().length
    }))
    .sort((a, b) =>
      b.strengthRank - a.strengthRank ||
      b.settingLength - a.settingLength ||
      a.source - b.source
    )

  if (candidates.length > 0) return candidates[0]

  const source = sourceReferences[0]?.source || 1
  return {
    source,
    setting: 'the physical environment visible in the first attached artist photo',
    settingStrength: 'weak'
  }
}

function normalizeLocationSource(rawLocationSource, artistSummaries, sourceReferences) {
  const validSources = new Set(sourceReferences.map(reference => reference.source))
  const requested = Number(rawLocationSource)
  const strongest = strongestLocationSummary(artistSummaries, sourceReferences)
  if (Number.isInteger(requested) && validSources.has(requested)) {
    const requestedSummary = artistSummaries.find(summary => summary.source === requested)
    const requestedRank = SETTING_STRENGTH_RANK[requestedSummary?.settingStrength] || 0
    const strongestRank = SETTING_STRENGTH_RANK[strongest.settingStrength] || 0
    if (requestedRank >= strongestRank) return requested
  }
  return strongest.source
}

// The cast is independent of the location photo: the place comes from whichever photo shows it
// best, the people from whichever photos show their faces best.
function normalizeSelection(rawSelection, sourceReferences, featureCount, artistSummaries = []) {
  const pool = castableSources(artistSummaries, sourceReferences, featureCount)
  const selection = (Array.isArray(rawSelection) ? rawSelection : [])
    .map(item => Number(item?.source ?? item))
    .filter(source => Number.isInteger(source) && pool.includes(source))

  for (const source of pool) {
    if (selection.length >= featureCount) break
    if (!selection.includes(source)) selection.push(source)
  }
  return [...new Set(selection)].slice(0, featureCount)
}

function normalizeCastPlan(rawCast = [], selection = [], artistSummaries = []) {
  const bySource = new Map()
  for (const [index, item] of (Array.isArray(rawCast) ? rawCast : []).entries()) {
    const source = Number(item?.source || item?.source_index || index + 1)
    if (!Number.isFinite(source) || source <= 0) continue
    bySource.set(source, {
      source,
      person: String(item?.person || item?.subject || item?.appearance || '').trim(),
      placement: String(item?.placement || item?.position || item?.action || '').trim()
    })
  }

  return selection.map(source => {
    const item = bySource.get(source) || {}
    return {
      source,
      person: item.person ||
        artistSummaries.find(summary => summary.source === source)?.primarySubject ||
        `the selected adult from source ${source}`,
      placement: item.placement || 'placed naturally within the shared group'
    }
  })
}

export function buildFallbackArtistDirection(artistSummaries, sourceReferences, featureCount) {
  const locationSummary = strongestLocationSummary(artistSummaries, sourceReferences)
  const locationSource = locationSummary.source
  const locationSetting = locationSummary.setting
  const selection = normalizeSelection([], sourceReferences, featureCount, artistSummaries)
  const cast = selection.map(source => {
    const summary = artistSummaries.find(item => item.source === source)
    return {
      source,
      person: summary?.primarySubject || `the selected adult from source ${source}`,
      placement: 'placed naturally with the other musicians in the anchored setting'
    }
  })

  return {
    selection,
    locationSource,
    locationSetting,
    locationEvidence: `Source ${locationSource} has the strongest described physical setting (${locationSummary.settingStrength}).`,
    concept: `Musicians gathered in source ${locationSource}'s location`,
    creativeDirection: 'Naturalistic editorial photography grounded in the strongest uploaded location.',
    scene: `A close, naturally arranged group portrait in this existing physical setting: ${locationSetting}.`,
    cast,
    palette: ['source-faithful environmental colour', 'natural skin tones'],
    mood: 'natural, confident, and grounded in the source photography',
    prompt: `Create a close editorial group photograph in this physical setting: ${locationSetting}. Preserve its recognisable architecture, surfaces, layout, lighting logic, and atmosphere, extending only what would plausibly continue just outside the original frame. Arrange the selected adults at varied depths with natural interaction, preserving each person’s reference appearance and individual styling. Use true-to-life colour, real skin texture, gentle film grain, and a medium-close composition in which every face is clear and detailed.`
  }
}

export function normalizeArtistDirection(rawDirection, artistSummaries, sourceReferences, featureCount) {
  const fallback = buildFallbackArtistDirection(artistSummaries, sourceReferences, featureCount)
  const requestedLocationSource = Number(
    rawDirection?.locationSource || rawDirection?.location_source
  )
  const locationSource = normalizeLocationSource(
    requestedLocationSource,
    artistSummaries,
    sourceReferences
  )
  const locationSummary = artistSummaries.find(summary => summary.source === locationSource)
  const locationSetting = locationSummary?.setting || fallback.locationSetting
  const locationSourceAccepted = requestedLocationSource === locationSource
  const selection = normalizeSelection(
    rawDirection?.selection || rawDirection?.cast || rawDirection?.choose,
    sourceReferences,
    featureCount,
    artistSummaries
  )
  const scene = String(
    locationSourceAccepted
      ? rawDirection?.scene || rawDirection?.setting || fallback.scene
      : fallback.scene
  ).trim()
  const prompt = String(
    locationSourceAccepted
      ? (
          rawDirection?.prompt ||
          rawDirection?.imagePrompt ||
          rawDirection?.image_prompt ||
          rawDirection?.generationPrompt ||
          rawDirection?.generation_prompt ||
          fallback.prompt
        )
      : fallback.prompt
  ).trim()

  return {
    selection,
    locationSource,
    locationSetting,
    locationEvidence: String(
      locationSourceAccepted
        ? (
            rawDirection?.locationEvidence ||
            rawDirection?.location_evidence ||
            fallback.locationEvidence
          )
        : fallback.locationEvidence
    ).trim(),
    concept: String(rawDirection?.concept || '').trim() || firstSentence(scene),
    creativeDirection: String(
      rawDirection?.creativeDirection ||
      rawDirection?.creative_direction ||
      rawDirection?.artDirection ||
      rawDirection?.art_direction ||
      fallback.creativeDirection
    ).trim(),
    scene,
    cast: normalizeCastPlan(rawDirection?.castPlan || rawDirection?.cast_plan || rawDirection?.subjects, selection, artistSummaries),
    palette: cleanList(rawDirection?.palette, 6),
    mood: String(rawDirection?.mood || fallback.mood).trim(),
    prompt: prompt || fallback.prompt
  }
}

export async function summarizeArtistPhotos({
  imageUrls,
  sourceReferences,
  debug,
  client = openai,
  allowDegradedSummaries = process.env.TUNES_ARTIST_ALLOW_DEGRADED_SUMMARIES === '1'
}) {
  if (!client) {
    const error = new Error(
      'OPENAI_API_KEY is required for artist-photo summarisation; set TUNES_ARTIST_ALLOW_DEGRADED_SUMMARIES=1 to explicitly allow filename-based fallback summaries'
    )
    if (!allowDegradedSummaries) throw error
    console.warn(`  ${error.message}`)
    return normalizeArtistSummaries([], sourceReferences)
  }

  const sourceIndex = sourceReferences
    .map(reference => `source ${reference.source}: ${reference.filename}`)
    .join('\n')

  const instructions = `You are a factual visual analyst. You will receive numbered artist reference photos in source order.
Describe only what is visibly present in EACH photo. Record the number of visible adults, their distinguishing facial and physical features, hair, facial hair, eyewear, skin tone, wardrobe, pose, framing, setting, lighting, and photographic treatment.
For "setting", factually describe the visible physical environment and its reusable location cues: architecture, room or outdoor type, surfaces, fixtures, furniture, landscape, spatial layout, and ambient conditions. Use "settingStrength" to rate how clearly that photo establishes a reproducible location: "strong" for a distinctive, substantially visible environment; "moderate" for useful but partial environmental context; "weak" for a plain, obscured, tightly cropped, or indeterminate background.
For a group or band photo, "primarySubject" must factually describe the single most visually prominent adult well enough for another model to select that person later. Do not identify or name anyone, rank artistic merit, cast the final image, or invent a scene.
Ignore and never transcribe printed words, logos, labels, or branding.
"faceHeight" is the height of the primary adult's face (chin to top of head) as a fraction of the image height - for example 0.03 for a distant figure in a wide shot, 0.45 for a close portrait. "subjectBox" is [x0, y0, x1, y1] as fractions of the image width and height (0 to 1, origin top-left) enclosing only the primary adult's head, hair, shoulders and upper body, as tightly as possible without cutting into them. Measure the image as supplied.
Return JSON exactly as {"sources":[{"source":1,"description":"string","primarySubject":"string","visiblePeople":["string"],"wardrobe":"string","photoStyle":"string","setting":"string","settingStrength":"strong|moderate|weak","faceHeight":0.2,"subjectBox":[0,0,1,1]}]}.
There must be exactly one item for every supplied source.`

  let lastError
  let attemptsMade = 0
  for (const [attempt, maxOutputTokens] of ARTIST_SUMMARY_TOKEN_BUDGETS.entries()) {
    attemptsMade = attempt + 1
    try {
      if (debug) {
        console.log(
          `  Artist-photo summarisation attempt ${attempt + 1}/${ARTIST_SUMMARY_TOKEN_BUDGETS.length} (max output tokens: ${maxOutputTokens})`
        )
      }

      const response = await client.responses.create({
        model: process.env.OPENAI_TUNES_ARTIST_SUMMARY_MODEL || process.env.OPENAI_TUNES_ARTIST_MODEL || process.env.OPENAI_TUNES_COVER_MODEL || process.env.OPENAI_MODEL || DEFAULT_PROMPT_MODEL,
        instructions,
        input: [
          {
            type: 'message',
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: buildArtistSummaryRequestText(imageUrls.length, sourceIndex)
              },
              ...imageUrls.map(url => ({
                type: 'input_image',
                image_url: url,
                detail: 'auto'
              }))
            ]
          }
        ],
        reasoning: { effort: 'low' },
        text: {
          verbosity: 'low',
          format: ARTIST_SUMMARY_FORMAT
        },
        max_output_tokens: maxOutputTokens
      })

      const parsed = parseArtistSummaryResponse(response)
      const summaries = normalizeArtistSummaries(
        requireCompleteArtistSummaries(parsed?.sources, sourceReferences),
        sourceReferences
      )
      if (debug) console.log(`  Artist summaries: ${JSON.stringify(summaries, null, 2)}`)
      return summaries
    } catch (error) {
      lastError = error
      const canRetry = error?.retryable && attempt < ARTIST_SUMMARY_TOKEN_BUDGETS.length - 1
      if (!canRetry) break
      console.warn(
        `  OpenAI artist-photo summarisation ${error.message}; retrying with ${ARTIST_SUMMARY_TOKEN_BUDGETS[attempt + 1]} max output tokens`
      )
    }
  }

  const failure = new Error(
    `OpenAI artist-photo summarisation failed after ${attemptsMade} attempt${attemptsMade === 1 ? '' : 's'}: ${lastError?.message || 'unknown error'}`
  )
  if (allowDegradedSummaries) {
    console.warn(
      `  ${failure.message}; using filename-based summaries because TUNES_ARTIST_ALLOW_DEGRADED_SUMMARIES=1`
    )
    return normalizeArtistSummaries([], sourceReferences)
  }
  throw failure
}

export async function designArtistArtDirection({
  artistSummaries,
  sourceReferences,
  imageUrls = [],
  featureCount,
  hint = '',
  avoidConcepts = [],
  debug,
  client = openai
}) {
  if (!client) {
    if (debug) console.log('  No OPENAI_API_KEY found; using deterministic artist art direction')
    return buildFallbackArtistDirection(artistSummaries, sourceReferences, featureCount)
  }

  const hintBlock = hint
    ? `Author's steer for non-location aspects only (ignore any requested new venue or location): ${hint}`
    : ''
  const avoidBlock = avoidConcepts.length > 0
    ? `These concepts were used recently and must not be repeated. Vary the central idea, framing, and lighting while still using only the strongest uploaded location:\n${avoidConcepts.map(concept => `- ${concept}`).join('\n')}`
    : ''
  const castable = castableSources(artistSummaries, sourceReferences, featureCount)
  const summaryBlock = artistSummaries
    .map(summary => [
      `Source ${summary.source}`,
      `Description: ${summary.description}`,
      `Primary adult: ${summary.primarySubject}`,
      summary.visiblePeople.length > 0 ? `Visible people: ${summary.visiblePeople.join('; ')}` : '',
      `Wardrobe: ${summary.wardrobe}`,
      `Original photo: ${summary.photoStyle}`,
      `Physical setting: ${summary.setting}`,
      `Setting strength: ${summary.settingStrength}`,
      castable.includes(summary.source)
        ? 'Castable: yes'
        : 'Castable: no - the face is too small to copy; usable as the location photo only'
    ].filter(Boolean).join('\n'))
    .join('\n\n')

  const instructions = `You are a portrait photographer's casting director and art director creating one original 16:9 group photograph for a weekly music blog.
You will receive factual visual-research summaries and the original artist photos in matching source order. The selected original photos will be attached again to the final image-generation call.

The place and the people are chosen separately.

First compare the uploaded photos and select the ONE photo with the strongest clearly visible, distinctive physical location. Return its source number as "locationSource" and briefly explain the visible evidence in "locationEvidence". It is attached to the final call as a setting-only reference: nobody in it appears in the portrait unless their source is also in "selection", and it does not have to be.

Then choose exactly ${featureCount} distinct source numbers for "selection", only from sources marked "Castable: yes". Prefer photos whose face is large, sharp, evenly lit and unobstructed, then an intimate, visually varied cast. Every selected source contributes exactly one adult. When a source shows more than one person, the cast member is always the "Primary adult" from its summary - the image model receives a close crop of that person, so describe that adult and no other.

The location photo is the sole location authority. Recreate and plausibly extend its visible physical environment for the group portrait. Preserve its recognisable architecture, spatial layout, surfaces, fixtures, furniture or landscape, ambient conditions, and lighting logic. You may infer only what would naturally continue immediately outside its frame. Never invent a new venue, substitute a stock scene, combine settings from multiple photos, or move the cast to a diner, restaurant, bar, studio, rehearsal room, street, stage, or any other location unless that exact type of location is visibly established by "locationSource".

The location photo fixes the place, not the camera distance. If it is a wide, distant, or aerial view, bring the camera in within that same place so the group is framed medium-close and every face is large.

Choose the remaining photographic direction from these visual findings alone: candid or posed behaviour, viewpoint, lens character, composition, depth, colour treatment, styling, and mood. Do not use or assume blog-post content and do not rotate through a hidden catalogue of preset shoot styles or colour treatments. Avoid an evenly spaced lineup or crowd.

Plan one shared real-world moment with varied posture and depth. It must read as one photograph taken in one exposure, never as people cut from separate photos and placed side by side - but the faces are locked. Each person keeps the expression, gaze direction, and head angle of their reference photo, because the image model stops drawing a recognisable person the moment it is asked for a new expression. So do not script laughter, toasts, conversation, singing, or any action that needs a face to change. Choose a moment that suits the faces exactly as photographed - most often a close, relaxed group portrait in the location - and make it cohere through bodies and light: people shoulder to shoulder, overlapping, leaning on each other or on the same surface, placed and turned so the gaze each already has lands on the camera or on another person. Name the single light of the location and describe it falling on everyone alike. Each "placement" says where that person is, what their body is doing, and where their existing gaze lands. Treat each cast member as one unique identity and depict them exactly once. Never reuse someone as another figure, reflection, mirror portrait, poster, billboard, screen, photograph, painting, silhouette, or background face. Do not add unselected people.

The final "prompt" must be ready to send directly to a multi-reference image model. Make it a precise photorealistic photography prompt ordered as: scene and viewpoint; cast and behaviour; composition and lens; lighting; colour treatment and mood. Describe selected people by visible appearance rather than using source numbers in the final prompt, because only selected photos will be reattached in a new order. Mandatory likeness, duplication, text, layout, and quality constraints are appended by code.

${avoidBlock}

Return JSON exactly as {"selection":[1,2],"locationSource":1,"locationEvidence":"string","concept":"string","creativeDirection":"string","scene":"string","castPlan":[{"source":1,"person":"string","placement":"string"}],"palette":["string"],"mood":"string","prompt":"string"}.
"selection" contains exactly ${featureCount} distinct castable source numbers and need not include "locationSource". "concept" is at most 15 words and is saved to do-not-repeat history. "creativeDirection" names the photographic approach in one sentence. "castPlan" has exactly one entry per selected source.`

  try {
    const response = await client.responses.create({
      model: process.env.OPENAI_TUNES_ARTIST_DIRECTION_MODEL || process.env.OPENAI_TUNES_ARTIST_MODEL || process.env.OPENAI_TUNES_COVER_MODEL || process.env.OPENAI_MODEL || DEFAULT_PROMPT_MODEL,
      instructions,
      input: [
        {
          type: 'message',
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: buildArtistDirectionRequestText(hintBlock, summaryBlock)
            },
            ...imageUrls.map(url => ({
              type: 'input_image',
              image_url: url,
              detail: 'auto'
            }))
          ]
        }
      ],
      reasoning: { effort: 'low' },
      text: {
        verbosity: 'low',
        format: ARTIST_DIRECTION_FORMAT
      },
      max_output_tokens: 2200
    })

    const direction = normalizeArtistDirection(
      parseJSONResponse(response.output_text || ''),
      artistSummaries,
      sourceReferences,
      featureCount
    )
    if (debug) console.log(`  Artist art direction: ${JSON.stringify(direction, null, 2)}`)
    return direction
  } catch (error) {
    console.warn(`  OpenAI artist art direction failed: ${error.message}`)
    return buildFallbackArtistDirection(artistSummaries, sourceReferences, featureCount)
  }
}

// References are attached as the cast first, in selection order, then the location photo last.
// The location photo is always attached whole, even when its artist is also cast, because a
// cast member's reference may be a close crop that no longer shows the place.
export function remapArtistPromptReferences(prompt, selectedSources = [], locationSource = null) {
  const referenceBySource = new Map(
    selectedSources.map((source, index) => [Number(source), index + 1])
  )
  const location = Number(locationSource)
  if (Number.isInteger(location) && !referenceBySource.has(location)) {
    referenceBySource.set(location, selectedSources.length + 1)
  }

  return String(prompt || '').replace(
    /\b(?:source|reference(?: image)?)\s+(\d+)\b/gi,
    (match, sourceText) => {
      const reference = referenceBySource.get(Number(sourceText))
      return reference ? `attached reference image ${reference}` : match
    }
  )
}

export function buildArtistGenerationPrompt(artDirection, selectedSources = []) {
  const locationSource = Number(artDirection?.locationSource)
  if (!Number.isInteger(locationSource) || locationSource <= 0) {
    throw new Error(
      `The Tunes artist art director returned no usable location source (${artDirection?.locationSource || 'unknown'})`
    )
  }
  const locationSetting = String(artDirection?.locationSetting || '').trim()
  if (!locationSetting) {
    throw new Error('The Tunes artist art director returned no source-grounded location setting')
  }

  const castCount = selectedSources.length
  const locationReference = castCount + 1
  const locationIsCast = selectedSources.map(Number).includes(locationSource)
  const creativePrompt = remapArtistPromptReferences(artDirection?.prompt, selectedSources, locationSource).trim()
  if (!creativePrompt) throw new Error('The Tunes artist art director returned an empty image prompt')
  const castBySource = new Map(
    (Array.isArray(artDirection?.cast) ? artDirection.cast : [])
      .map(item => [Number(item?.source), item])
  )
  const attachedCastPlan = selectedSources
    .map((source, index) => {
      const castMember = castBySource.get(Number(source))
      if (!castMember) return ''
      return `Attached reference image ${index + 1}: portray only ${castMember.person}; ${castMember.placement}.`
    })
    .filter(Boolean)
    .join(' ')
  const locationPeople = locationIsCast
    ? 'It is a setting reference only: the one cast member from that photo has their own cast reference above, and nobody else visible in it appears.'
    : 'It is a setting reference only: nobody visible in it appears in the portrait.'

  return [
    `LOCATION ANCHOR — HIGHEST PRIORITY: Attached reference image ${locationReference}, the last one, is the sole authority for the physical setting: ${locationSetting}. ${locationPeople} Recreate that recognisable location faithfully and stage every selected person there. Preserve its visible architecture, spatial layout, surfaces, fixtures, furniture or landscape, ambient conditions, and lighting logic. Extend only what would plausibly continue immediately beyond the photographed frame. Do not invent, replace, genericise, relocate, or combine this setting with any other reference location. Ignore any conflicting location in the creative direction. Take the place from it, not its camera distance: if it is a wide, distant, or aerial view, move the camera in within that same place.`,
    creativePrompt,
    attachedCastPlan ? `Attached cast plan: ${attachedCastPlan}` : '',
    `Hard constraints (override any conflicting creative direction): ${ARTIST_HARD_CONSTRAINTS.join(' ')}`,
    `This generation has ${castCount} attached cast reference image${castCount === 1 ? '' : 's'} (image${castCount === 1 ? '' : 's'} 1${castCount > 1 ? ` to ${castCount}` : ''}) followed by one setting reference, and the final image must contain exactly ${castCount} visible adult${castCount === 1 ? '' : 's'} total, no more and no fewer. Omit any person described in the creative direction who does not have an attached cast reference.`
  ].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
}
