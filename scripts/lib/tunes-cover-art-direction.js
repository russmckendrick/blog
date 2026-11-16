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
  'Do not reproduce the album sleeves as framed thumbnails, posters, record covers, or pictures on a screen, monitor, or television. A sleeve\'s abstract graphics, shapes, patterns, and colours may be painted onto the walls, doors, floor, or objects of the place as part of its decoration, without any lettering. Show no sleeve\'s faces, heads, or figures as a picture, mural, display, sign, relief, or silhouette anywhere; transform the sleeves\' non-text visual motifs into one original composition.',
  TEXT_CONSTRAINT,
  'Feature only adults and avoid gore, wounds, body horror, medical or anatomical imagery, blank or milky eyes, nudity, sexual content, weapons, and hate symbols; reinterpret any sensitive source motif abstractly.',
  'When a source includes a person, closely match their visible appearance and likeness to the reference image, preserving recognisable facial features, hair, skin tone, clothing, and styling, and their apparent age: every person is shown as the adult they are on the sleeve, never younger, smoothed, or more boyish or girlish.',
  'Keep each reference person in the pose, expression, and gaze the sleeve shows, and keep every identifiable face sharp, lit, unobscured, and in focus: no motion blur, long-exposure smearing, steam, fog, shadow, crowding, or shallow depth of field over a reference person\'s face.',
  'Expose the image cleanly whatever the light: every person\'s face well lit and readable, shadows that hold detail, and clear colour, with no murky underexposure, crushed blacks, heavy film grain, digital noise, or dust-and-scratches texture.',
  GREENERY_CONSTRAINT,
  'Everyone in the picture is photographed in the same place, at the same moment, under the same light as the rest of the scene, in full colour and with the same lens and grain: do not carry over a sleeve\'s own backdrop, studio lighting, backlit flare, monochrome, colour cast, or print texture onto the person. Each person stands inside the scene at the scale of the space around them, never as an oversized cropped head or bust looming at the edge of the frame over a distant scene, and never washed in red, blue, or other coloured light.',
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

// Builds the art director's lighting instructions from the recorded history, newest first: a
// do-not-repeat list of the last few set-ups (collapsed so one repeated phrase cannot fill
// it). Which kind of place the cover is set in is a separate axis - see buildSettingBlock.
export function buildLightingBlock(recentLighting = []) {
  const history = (Array.isArray(recentLighting) ? recentLighting : [])
    .map(value => String(value || '').trim())
    .filter(Boolean)

  const seen = new Set()
  const recent = []
  for (const value of history.slice(0, LIGHTING_REPEAT_WINDOW)) {
    const key = value.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    recent.push(value)
  }
  if (recent.length === 0) return ''

  return `These lighting set-ups were used on the most recent covers and must not be repeated, even under different wording - change the time of day, the main light source, or the weather, not just the phrasing:\n${recent.map(value => `- ${value}`).join('\n')}\n\nPick a materially different set-up inside the setting you choose, worked out from this week's sleeves and the place you are building rather than from a stock list.`
}

// The daylight rule and its bright-only menu fixed the murky September run and built the
// opposite rut: all fourteen covers from 17 Aug to 16 Nov 2026 were "daylight location
// photography", ten of them outdoors, ending in a top-down view of a sunlit concrete yard with
// the cast too small to recognise. Where a cover is set is now its own recorded axis with four
// families, and a family that has run twice in a row, or filled three of the last five covers,
// is refused. Night keeps its one-week limit from the old rule.
export const SETTING_FAMILIES = ['exterior', 'interior', 'studio', 'night']
export const SETTING_WINDOW = 5

const STUDIO_LIGHT_PATTERN = /\b(studio|high[- ]key|seamless|backdrop|softbox|strobe|cyclorama)\b/i
const INTERIOR_LIGHT_PATTERN = /\b(interiors?|indoors?|windows?|skylights?|rooms?|halls?|hangars?|lamps?|lamplight|tungsten|fluorescent|ceiling|chandeliers?)\b/i

// The setting family of a cover. An explicit "setting" wins; history written before the field
// existed is read from its lighting phrase instead. Empty when there is nothing to read.
export function settingFamily(setting, lighting = '') {
  const explicit = String(setting || '').trim().toLowerCase()
  if (/\bstudio\b/.test(explicit)) return 'studio'
  if (/\b(night|low[- ]?light|after dark)\b/.test(explicit)) return 'night'
  if (/\b(interior|indoors?|inside)\b/.test(explicit)) return 'interior'
  if (/\b(exterior|outdoors?|outside)\b/.test(explicit)) return 'exterior'

  const light = String(lighting || '').trim()
  if (!light) return ''
  if (isLowLight(light)) return 'night'
  if (STUDIO_LIGHT_PATTERN.test(light)) return 'studio'
  if (INTERIOR_LIGHT_PATTERN.test(light)) return 'interior'
  return 'exterior'
}

// Families the next cover may not use, from the recent ones newest first.
export function refusedSettings(recentFamilies = []) {
  const recent = (Array.isArray(recentFamilies) ? recentFamilies : []).filter(Boolean)
  const refused = new Set()
  if (recent[0] === 'night') refused.add('night')
  if (recent.length >= 2 && recent[0] === recent[1]) refused.add(recent[0])
  const window = recent.slice(0, SETTING_WINDOW)
  for (const family of SETTING_FAMILIES) {
    if (window.filter(value => value === family).length >= 3) refused.add(family)
  }
  return SETTING_FAMILIES.filter(family => refused.has(family))
}

// Definitions only, on purpose. The first version listed example places after each one ("a
// bar, kitchen, rehearsal room ...", "a seamless or painted backdrop") and the director treated
// them as a menu: the first three renders under it were a bar, a white seamless studio, and the
// same bar again. Preset catalogues are what this pipeline keeps removing - the family is a
// constraint, the place has to come from the sleeves.
const SETTING_DESCRIPTIONS = {
  exterior: 'outdoors, in daylight',
  interior: 'indoors, in a real place, lit by daylight coming in or by the room\'s own lights',
  studio: 'a photographer\'s studio or a purpose-built set, under controlled light',
  night: 'after dark or in low light, indoors or out, with every cast face properly lit and the picture still clean and readable'
}

export function buildSettingBlock(recentFamilies = []) {
  const recent = (Array.isArray(recentFamilies) ? recentFamilies : []).filter(Boolean)
  const refused = refusedSettings(recent)
  const window = recent.slice(0, SETTING_WINDOW)
  const unused = SETTING_FAMILIES.filter(family => !window.includes(family) && !refused.includes(family))
  const blocks = [`Every cover is set in one of four kinds of place, and you name the one you chose in "setting":\n${SETTING_FAMILIES.map(family => `- ${family}: ${SETTING_DESCRIPTIONS[family]}`).join('\n')}\n\nNone of them is the default, and none comes with a stock location. The setting only says what kind of place it is; the actual place is yours to invent from what this week's sleeves show - their rooms, objects, streets, landscapes, and moods - and should be somewhere these covers have not been before. Outdoor daylight has been used for most recent covers and has made them look alike, so do not reach for it out of habit.`]
  if (window.length > 0) {
    blocks.push(`The most recent covers were set, newest first: ${window.join(', ')}.`)
  }
  if (refused.length > 0) {
    blocks.push(`This cover must not be ${refused.map(family => `"${family}"`).join(' or ')}: ${refused.length > 1 ? 'those settings have' : 'that setting has'} been used too often or too recently. Do not get round it with a half-way place: anywhere open to the sky and lit by the sun is still an exterior.`)
  }
  if (unused.length > 0 && window.length > 0) {
    blocks.push(`Not used recently: ${unused.join(', ')}. Prefer one of these when the sleeves suit it.`)
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

// Refusing exact compositions left the camera height free, and the 27 Jul to 12 Oct 2026
// backfill put nine of twelve covers at a "low angle" under different framings. Camera height
// is its own family: when two of the last three covers share one, it is refused outright.
const LOW_CAMERA_PATTERN = /\b(low[- ]angle|low[- ]vantage|ground[- ]level|knee[- ]height|worm'?s?[- ]eye|looking up)\b/i
const HIGH_CAMERA_PATTERN = /\b(high[- ]angle|high[- ]vantage|elevated|overhead|top[- ]down|bird'?s?[- ]eye|from above|looking down|aerial)\b/i
export const CAMERA_HEIGHT_WINDOW = 3

export function cameraHeight(value) {
  const text = String(value || '')
  if (LOW_CAMERA_PATTERN.test(text)) return 'low'
  if (HIGH_CAMERA_PATTERN.test(text)) return 'high'
  return ''
}

export function overusedCameraHeight(recentCompositions = []) {
  const heights = (Array.isArray(recentCompositions) ? recentCompositions : [])
    .slice(0, CAMERA_HEIGHT_WINDOW)
    .map(cameraHeight)
    .filter(Boolean)
  for (const height of ['low', 'high']) {
    if (heights.filter(value => value === height).length >= 2) return height
  }
  return ''
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

  const blocks = ['The wide, slightly elevated, symmetrical tableau - one central set-piece with every source arranged around it like an exhibition - is the composition this blog has used almost every week, and it is the main reason the covers look alike. Do not use it. A deep passage is the other rut: a corridor, hallway, tunnel, underpass, alley, aisle, or a view through a doorway or loading bay running away into the distance. Use one only when the sleeves leave no alternative. Choose the space and the camera deliberately for this week\'s covers - for example an eye-level, three-quarter-length environmental portrait with the place wrapped around the people; a flat, face-on view with little depth and the people in the near ground; a close crop where one subject fills most of the frame; a long-lens shot that stacks layers of the scene together; a low angle looking up at a subject; or a subject placed off-centre beside open space. These are camera positions, not locations. When people are cast the camera is close enough, and level enough, to read their faces: never straight down from above, never a high or distant vantage where they are small. Top-down and wide, distant views are for covers with nobody in them.']
  if (history.slice(0, PASSAGE_REPEAT_WINDOW).some(isPassage)) {
    blocks.push('A recent cover already looked down a passage. This cover must not be set in or framed through a corridor, hallway, tunnel, underpass, alley, lane, aisle, doorway, or loading bay, under any wording: choose an open or face-on space.')
  }
  const height = overusedCameraHeight(history)
  if (height === 'low') {
    blocks.push('Most recent covers were shot from a low angle looking up. This cover must not be: no low angle, ground-level, or looking-up camera under any wording. Shoot from eye level, or from above.')
  } else if (height === 'high') {
    blocks.push('Most recent covers were shot from above. This cover must not be: no high angle, elevated vantage, overhead, or top-down camera under any wording. Shoot from eye level, or from low down.')
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

// Added only when the cover has a cast: a reference face cannot survive being rendered a few
// pixels high, whatever the prompt says about likeness.
const CAST_FRAMING_CONSTRAINT = 'Photograph the reference people from roughly eye level, at three-quarter length or closer, in the near or middle ground, so each of their faces is large, sharp, and clearly recognisable in the final frame: never from directly above, and never as small distant figures.'

// Nobody is in the picture unless a reference shows their face. The 26 Oct 2026 redo drew a
// drummer behind the cast: he is on the sleeve, but half hidden behind his kit, so the image
// model finished him with a face of its own. An extra nobody asked for and a sleeve figure
// "completed" from a glimpse are the same failure - an invented person - so both are ruled out,
// and a cover with no cast has no people at all.
const CAST_ONLY_CONSTRAINT = 'The only people anywhere in the image are the reference people named in the reference map, and of those only the ones whose faces are clearly visible in their reference. Add no one else: no extra band members, musicians, staff, bystanders, passers-by, crowd, audience, background or out-of-focus figures, and no hands, arms, legs, or shadows of unseen people. Never complete a person who is hidden, cropped, turned away, blurred, or only partly visible in a reference with an invented face or body - leave that person out entirely.'
const NO_PEOPLE_CONSTRAINT = 'The image contains no people at all: no figures, faces, hands, limbs, silhouettes, reflections, or shadows of people, in the foreground or the background.'

export function buildHardConstraints({ year, hasCast = false, cast = undefined } = {}) {
  const textConstraint = buildYearTextConstraint(year)
  const constraints = HARD_CONSTRAINTS.map(constraint => constraint === TEXT_CONSTRAINT ? textConstraint : constraint)
  const castSize = Array.isArray(cast) ? cast.length : (hasCast ? 1 : null)
  if (castSize === 0) return [...constraints, NO_PEOPLE_CONSTRAINT]
  if (castSize > 0) return [...constraints, CAST_ONLY_CONSTRAINT, CAST_FRAMING_CONSTRAINT]
  return [...constraints, CAST_ONLY_CONSTRAINT]
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
    const place = normalizePlace(item?.place ?? item?.location ?? item?.setting)
    const moderationRisk = normalizeModerationRisk(item?.moderationRisk ?? item?.moderation_risk)
    const peopleBox = normalizeBox(item?.peopleBox ?? item?.people_box)
    const faceHeight = normalizeFraction(item?.faceHeight ?? item?.face_height)
    const rawFaceBoxes = item?.faceBoxes ?? item?.face_boxes
    const faceBoxes = (Array.isArray(rawFaceBoxes) ? rawFaceBoxes : []).map(normalizeBox).filter(Boolean).slice(0, 8)
    const peopleCount = normalizeCount(item?.peopleCount ?? item?.people_count)
    const minors = normalizeFlag(item?.minors ?? item?.children ?? item?.child)
    const strength = normalizeStrength(item?.strength ?? item?.visualStrength ?? item?.visual_strength)
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
      place,
      moderationRisk,
      peopleBox,
      faceHeight,
      faceBoxes,
      peopleCount,
      minors,
      strength,
      palette
    }
  })
}

// Faces are copied from the attached sleeves, and a sleeve whose faces are tiny gives the model
// almost nothing to copy: on the 9 Nov 2026 GPT Image 2.6 renders the Pet Shop Boys (heads about
// a tenth of the sleeve) and the small tinted figure on Sweet Inspiration came back as generic
// strangers. So the factual pass also locates the people and measures the largest face, and
// before anything is sent: faces below MIN_CASTABLE_FACE are not castable at all, and cast
// faces below CLOSE_UP_BELOW get padded close-up crops attached as extra references.
//
// The first floor (4%) was far too low. The 16 Nov 2026 cover cast a compilation sleeve of four
// full-length figures with faces at 8% and got four near-identical strangers back, so the floor
// now matches the artist portrait's 10%, and a group of four or more needs larger faces still
// because every extra likeness dilutes the rest.
export const MIN_CASTABLE_FACE = 0.1
export const LARGE_GROUP = 4
export const MIN_GROUP_FACE = 0.15
export const CLOSE_UP_BELOW = 0.25
const CLOSE_UP_PADDING = 0.2
const FACE_CLOSE_UP_PADDING = 0.6
export const MAX_FACE_CLOSE_UPS = 3

function normalizeFraction(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return null
  const fraction = number > 1 && number <= 100 ? number / 100 : number
  return fraction > 0 && fraction <= 1 ? fraction : null
}

// The place a sleeve is photographed in, or '' when it shows none (a plain backdrop, a graphic,
// a close crop). A sleeve whose people cannot be cast often has the best location of the week:
// the 16 Nov 2026 runs marked a famous living-room sleeve "do not cast" and then used it for
// one guitar. Its room, empty of its people, is exactly what a cover can be set in.
function normalizePlace(value) {
  const text = String(value ?? '').trim()
  if (!text || /^(none|no\b|n\/a|unknown|plain|blank)/i.test(text)) return ''
  return text
}

export function hasPlace(summary) {
  return Boolean(summary?.place)
}

function normalizeCount(value) {
  const number = Math.round(Number(value))
  return Number.isFinite(number) && number > 0 ? number : null
}

function normalizeFlag(value) {
  if (value === true) return true
  return /^(true|yes|child|children|minor|minors)\b/i.test(String(value ?? '').trim())
}

// 1 (almost nothing to photograph: lettering, a flat field) to 5 (a striking, instantly
// recognisable image). Null when the factual pass did not rate it.
function normalizeStrength(value) {
  const number = Math.round(Number(value))
  return Number.isFinite(number) && number >= 1 ? Math.min(5, number) : null
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

// Why a sleeve's people cannot be cast, or '' when they can. A sleeve with no measurement stays
// castable rather than being dropped on a missing field. A child is never cast: the image model
// is told to show adults only, so the 16 Nov 2026 cover's girl with enlarged eyes could only
// ever come back as somebody else, and a child's likeness is not ours to restage anyway.
export function uncastableReason(summary) {
  if (!hasPeople(summary)) return 'nobody is shown'
  if (summary.minors) return 'it shows a child, and children are never cast'
  const face = summary.faceHeight
  if (face != null && face < MIN_CASTABLE_FACE) return 'the faces on this sleeve are too small to reproduce recognisably'
  if (face != null && (summary.peopleCount || 0) >= LARGE_GROUP && face < MIN_GROUP_FACE) {
    return 'it is a large group with small faces, which comes back as strangers'
  }
  return ''
}

export function isCastable(summary) {
  return uncastableReason(summary) === ''
}

// The padded crop (fractions of the reference image) to attach as a close-up for a cast
// sleeve, or null when its faces are already large enough or the people were not located.
export function closeUpBox(summary) {
  if (!summary?.peopleBox || summary.faceHeight == null || summary.faceHeight >= CLOSE_UP_BELOW) return null
  return padBox(summary.peopleBox, CLOSE_UP_PADDING)
}

function padBox([x0, y0, x1, y1], padding) {
  const padX = (x1 - x0) * padding
  const padY = (y1 - y0) * padding
  return [
    Math.max(0, x0 - padX),
    Math.max(0, y0 - padY),
    Math.min(1, x1 + padX),
    Math.min(1, y1 + padY)
  ]
}

// Every close-up to attach for a cast sleeve. One crop of the whole group still leaves each
// face small, so when the factual pass located every face of a small cast (up to
// MAX_FACE_CLOSE_UPS people) each one gets its own head-and-shoulders crop, left to right.
// Otherwise it falls back to the single group crop.
export function closeUpBoxes(summary) {
  if (!summary || summary.faceHeight == null || summary.faceHeight >= CLOSE_UP_BELOW) return []
  const faces = Array.isArray(summary.faceBoxes) ? summary.faceBoxes : []
  const expected = summary.peopleCount || faces.length
  if (faces.length >= 1 && faces.length <= MAX_FACE_CLOSE_UPS && faces.length === expected) {
    return [...faces]
      .sort((a, b) => a[0] - b[0])
      .map(box => padBox(box, FACE_CLOSE_UP_PADDING))
  }
  const group = closeUpBox(summary)
  return group ? [group] : []
}

// Which sleeves are sent to the art director and the image model. Until 16 Nov 2026 this was
// decided before anything had looked at the pictures, on saturation, contrast, and how
// text-like the edges were: that week it threw away the one sleeve with two large, clean
// faces and kept a near-black square. The factual pass now reads every candidate, and the
// score leads with what is in the picture: how striking it is, then whether it has faces
// big enough to copy. Play rank and the pixel score only separate near-ties.
export function contentScore(summary, { rank = 0, pixelScore = 0 } = {}) {
  const strength = summary?.strength ?? 3
  let score = strength * 12
  if (isCastable(summary)) {
    score += 10 + (Math.min(summary.faceHeight ?? MIN_CASTABLE_FACE, 0.5) * 60)
  }
  score += Math.max(0, 12 - rank)
  score += Math.max(-10, Math.min(10, pixelScore * 0.1))
  return score
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
const FLAT_COPY_PATTERN = /\b(murals?|backdrops?|banners?|posters?|billboards?|tapestr(?:y|ies)|decals?|stickers?|signs?|signage|emblems?|plaques?|tiles?|painted|painting|paintings|printed|prints?|stencil\w*|wallpaper|flags?|pennants?|logos?|framed|canvas(?:es)?|artworks?|graphics?|panels?|insignia|badges?|medallions?|screens?|monitors?|televisions?|tvs?|reliefs?)\b/i
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

// The 5 Oct 2026 redo asked for "a computer terminal ... its screen showing four stylized
// yellow-green heads" and "one hanging black profile-shaped sign" - the Man-Machine sleeve on
// a monitor and a portrait as a cut-out - without either sitting near a reference number, so
// findFlatCopies never saw them. Any sentence that puts faces or figures on a display, sign,
// or cut-out is a sleeve shown as a picture, whichever source it came from.
const DISPLAY_PATTERN = /^(screens?|monitors?|displays?|televisions?|tvs?|signs?|signage|cut-?outs?|billboards?|posters?|placards?|murals?|reliefs?|carv(?:ed|ing|ings))$/i
const DEPICTED_FIGURE_PATTERN = /^(faces?|heads?|figures?|portraits?|profiles?|profile-shaped|silhouettes?|busts?|likeness(?:es)?)$/i
const DISPLAY_FIGURE_WINDOW = 8

export function findPicturedFigures(prompt) {
  const found = []
  for (const sentence of String(prompt || '').split(/(?<=[.;])\s+/)) {
    const words = sentence.split(/\s+/).map(word => word.replace(/[^a-z-]/gi, ''))
    const displays = []
    const figures = []
    words.forEach((word, index) => {
      if (DISPLAY_PATTERN.test(word)) displays.push(index)
      if (DEPICTED_FIGURE_PATTERN.test(word)) figures.push(index)
    })
    if (displays.some(at => figures.some(figure => Math.abs(figure - at) <= DISPLAY_FIGURE_WINDOW))) {
      found.push(sentence.trim().slice(0, 120))
    }
  }
  return found
}

// The 7 Sep 2026 redo put Jim Morrison "in the extreme right foreground, shoulders-up ...
// strongly tinted by real red light" in front of a distant desert scene: an oversized cropped
// head keeping its sleeve's red cast, which reads as two pictures stuck together. A cast
// person placed at the frame's far edge, or washed in coloured light, is sent back.
const LOOMING_PATTERN = /\b(?:extreme|far)\s+(?:left\s+|right\s+)?foreground\b|\b(?:tinted|bathed|washed|gelled|drenched|flooded)\b[^.;]{0,40}?\b(?:red|blue|green|magenta|purple|pink|orange|amber|neon|colou?red)\b/i

export function findLoomingCast(prompt, cast = []) {
  const castSet = new Set((Array.isArray(cast) ? cast : []).map(Number))
  const found = []
  for (const sentence of String(prompt || '').split(/(?<=[.;])\s+/)) {
    if (!LOOMING_PATTERN.test(sentence)) continue
    for (const match of sentence.matchAll(REFERENCE_NUMBER_PATTERN)) {
      const source = Number(match[1])
      if (castSet.has(source) && !found.includes(source)) found.push(source)
    }
  }
  return found
}

// The 16 Nov 2026 cover put its cast on a concrete yard seen "almost straight down from above":
// four full-length figures a few dozen pixels tall, which no reference can make recognisable.
// A cover with people in it is shot close and level enough to read their faces.
const DISTANT_COMPOSITION_PATTERN = /\b(top[- ]down|overhead|straight down|bird'?s?[- ]eye|aerial|drone|from above|looking down|high[- ](?:angle|vantage)|elevated|distant|far[- ]off|figures? small|small figures?|tiny)\b/i
const DISTANT_PROMPT_PATTERN = /\b(top[- ]down|straight down|bird'?s?[- ]eye|aerial|drone|from (?:high )?above|looking down (?:on|onto|at|over)|small (?:against|within|in the)|tiny figures?|in the far distance)\b/i

export function isDistantCast(direction) {
  if (!Array.isArray(direction?.cast) || direction.cast.length === 0) return false
  if (DISTANT_COMPOSITION_PATTERN.test(String(direction.composition || ''))) return true
  return DISTANT_PROMPT_PATTERN.test(firstSentence(direction.prompt))
}

// The no-text rule is a hard constraint, but the director can still write lettering into its
// own prompt: a 16 Nov 2026 render turned a sleeve's back tattoo into "black tattoo-style
// lettering painted across a bare plaster panel", and the image model duly drew a slab of
// blackletter. Any request for lettering on a weekly cover is sent back. Year in Music covers
// are exempt, because their digits are lettering by design.
const LETTERING_PATTERN = /\b(lettering|letters|letterforms?|typography|typographic|calligraph\w*|blackletter|inscri\w+|handwriting|handwritten|graffiti|slogans?|monograms?|initials|captions?|spell(?:s|ed|ing) out)\b/i

export function findLettering(prompt) {
  const found = []
  for (const sentence of String(prompt || '').split(/(?<=[.;])\s+/)) {
    // "no lettering", "without any text" and the like are the director agreeing with the rule.
    if (LETTERING_PATTERN.test(sentence) && !/\b(no|not|never|without|free of|avoid\w*)\b[^.;]{0,40}$/i.test(sentence.slice(0, sentence.search(LETTERING_PATTERN)))) {
      found.push(sentence.trim().slice(0, 120))
    }
  }
  return found
}

// People the director writes in who are not the cast: a bartender, a drummer, a crowd. Sentences
// that only rule them out ("no extra people") are the director agreeing with the rule.
const EXTRA_PEOPLE_PATTERN = /\b(drummers?|guitarists?|bassists?|singers?|bartenders?|barmaids?|waiters?|waitress(?:es)?|roadies?|technicians?|photographers?|crew|staff|dancers?|crowds?|audiences?|onlookers?|bystanders?|passers?-?by|pedestrians?|customers?|patrons?|drinkers?|extras|strangers?|other (?:people|figures?|band members?|musicians?)|another (?:person|figure|man|woman)|background figures?)\b/i

export function findExtraPeople(prompt) {
  const found = []
  for (const sentence of String(prompt || '').split(/(?<=[.;])\s+/)) {
    const at = sentence.search(EXTRA_PEOPLE_PATTERN)
    if (at < 0) continue
    if (/reference image \d+/i.test(sentence)) continue
    if (/\b(no|not|never|without|free of|nobody|avoid\w*)\b[^.;]{0,60}$/i.test(sentence.slice(0, at))) continue
    found.push(sentence.trim().slice(0, 120))
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
    const closeUpsBySource = new Map()
    for (const item of Array.isArray(closeUps) ? closeUps : []) {
      if (!closeUpsBySource.has(item.source)) closeUpsBySource.set(item.source, [])
      closeUpsBySource.get(item.source).push(item.reference)
    }
    const describe = summary => {
      const references = closeUpsBySource.get(summary.source) || []
      if (references.length === 1) {
        return `reference image ${summary.source} shows ${summary.people}, and reference image ${references[0]} is an enlarged close-up of those same people - take their faces from reference image ${references[0]}`
      }
      if (references.length > 1) {
        return `reference image ${summary.source} shows ${summary.people}, and reference images ${references.join(', ')} are enlarged close-ups of those same people, one face each from left to right - take each face from its own close-up`
      }
      return `reference image ${summary.source} shows ${summary.people}`
    }
    parts.push(`Reference map for people (the album images are attached in this numbered order): ${shown.map(describe).join('; ')}. Copy each of these faces directly from that numbered reference image - same face, bone structure, hair, expression, and styling - rather than drawing a new person from the description.`)
  }
  if (omitted.length > 0) {
    parts.push(`Nobody from reference image${omitted.length > 1 ? 's' : ''} ${omitted.map(summary => summary.source).join(', ')} appears in the picture: use those images only for colour, setting, and objects, and add no figures, faces, or silhouettes from them.`)
  }
  return parts.join(' ')
}

// How much of the picture a sleeve gets. The 16 Nov 2026 cover gave every sleeve its own prop
// and read as a prop shop; the first fix made everything but the lead "colour only" and the
// redo was one sleeve restaged with nothing else recognisable in it. The answer is a
// hierarchy: one or two leads, a few supports that are each a real, recognisable thing at a
// smaller scale, and the rest colour.
export const ELEMENT_ROLES = ['lead', 'support', 'colour']
export const MAX_LEADS = 2
export const MIN_SUPPORTS = 2
export const MAX_SUPPORTS = 4

function normalizeRole(value) {
  const text = String(value || '').trim().toLowerCase()
  if (/^lead/.test(text)) return 'lead'
  if (/^support/.test(text)) return 'support'
  if (/^(colou?r|palette|light|material)/.test(text)) return 'colour'
  return null
}

// What is wrong with the balance of a brief's elements, given how many sleeves it had to work
// with. Briefs with no roles at all (the deterministic fallback, old sidecars) are not judged.
export function findHierarchyProblems(elements = [], sourceCount = 0) {
  const withRoles = (Array.isArray(elements) ? elements : []).filter(item => item?.role)
  if (withRoles.length === 0) return []
  // Counted by sleeve, not by element: the first render under this rule met its quota of
  // supports with three things from the sleeve that was already a lead.
  const sourcesWith = role => new Set(withRoles.filter(item => item.role === role).map(item => item.source))
  const leadSources = sourcesWith('lead')
  const leads = leadSources.size
  const supports = [...sourcesWith('support')].filter(source => !leadSources.has(source)).length
  const wanted = Math.min(MIN_SUPPORTS, Math.max(0, sourceCount - 1))
  const problems = []
  if (leads === 0) problems.push('no source leads the picture')
  if (leads > MAX_LEADS) problems.push(`${leads} sources lead the picture, and at most ${MAX_LEADS} may`)
  if (supports < wanted) problems.push(`only ${supports} source${supports === 1 ? '' : 's'} besides the lead contribute${supports === 1 ? 's' : ''} something recognisable, so the cover is one sleeve restaged; at least ${wanted} more must each appear as a real, recognisable supporting element`)
  if (supports > MAX_SUPPORTS) problems.push(`${supports} sources each get a supporting element, which reads as a prop shop; at most ${MAX_SUPPORTS} may`)
  return problems
}

function normalizeElements(rawElements = [], sourceReferences = []) {
  const normalized = (Array.isArray(rawElements) ? rawElements : [])
    .map((item, index) => {
      const source = Number(item?.source || item?.source_index || item?.image || index + 1)
      const element = String(item?.element || item?.use || item?.description || '').trim()
      if (!element) return null
      return {
        source: Number.isFinite(source) && source > 0 ? source : index + 1,
        role: normalizeRole(item?.role),
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

  const cast = coverSummaries.filter(isCastable).slice(0, 1).map(summary => summary.source)
  return {
    cast,
    concept: digits ? `A unified world built from the albums of ${digits}` : 'A unified world built from this week’s album artwork',
    medium: 'photographic scene',
    setting: 'exterior',
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
    setting: settingFamily(rawDirection?.setting, rawDirection?.lighting || rawDirection?.light) || fallback.setting,
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
Return JSON exactly as {"covers":[{"source":1,"description":"string","signatureMotif":"string","medium":"string","strength":3,"place":"string","people":"string","peopleCount":0,"minors":false,"peopleBox":[0,0,1,1],"faceHeight":0.1,"faceBoxes":[[0,0,1,1]],"moderationRisk":"string","palette":["string"]}]}.
There must be one item for every supplied source. "signatureMotif" is the single most recognisable non-text visual element in that source. "people" names who is visibly present as a real person in that image - a count and a short visual description such as "one woman reclining with two dogs" or "five young people looking up" - or exactly "none" when the image shows no person. Do not identify anyone by name.
"strength" rates, from 1 to 5, how much there is to photograph once the lettering is ignored: 5 is a striking, instantly recognisable image with a clear subject - a strong portrait, a staged scene, a vivid object; 3 is a clear but ordinary picture; 1 is almost nothing but lettering, a logo, a flat colour field, or a near-black square. Rate what is visibly there, not how famous the record is.
"place" describes the real location the image is set in, with its defining features - the kind of room or landscape, its architecture, furniture, surfaces, and light - in one sentence, described as if empty of people. It is exactly "none" when the image shows no real place: a plain or studio backdrop, a graphic or illustration, a collage, or a crop too tight to show where it is.
"peopleCount" is the number of real people shown (0 when "people" is "none"). "minors" is true when any real person shown appears to be a child or young teenager, otherwise false.
When "people" is not "none": "faceBoxes" lists one [x0, y0, x1, y1] box per real face, tightly enclosing that face from chin to top of hair, in the same fractions, left to right, for up to 8 faces; a person seen only from behind has no face box. "peopleBox" is [x0, y0, x1, y1] as fractions of the image width and height (0 to 1, origin top-left) tightly enclosing the heads and shoulders of every real person shown, and "faceHeight" is the height of the largest real face (chin to top of head) as a fraction of the image height - for example 0.06 for small heads in a wide group shot, 0.45 for a close portrait. Measure the image as supplied. When "people" is "none", set "peopleBox" to null, "faceBoxes" to [], and "faceHeight" to 0.
"moderationRisk" is exactly "none" unless the image clearly contains something an image-generation safety filter would refuse outright when the sleeve is supplied as a reference. Only these count: exposed genitals, buttocks, or female breasts (photographed or illustrated); lingerie, swimwear, or revealing clothing worn in a sexualised way, or suggestive, sexualised posing; sexual content; gore or graphic injury; a violent act shown in progress against a person, or a weapon pointed at someone; drugs being injected, snorted, or prepared; hate symbols; or a child shown nude, sexualised, or harmed. When it applies, give a short factual reason such as "women in lingerie-style outfits in suggestive poses". Most sleeves are "none". In particular these are "none": a shirtless man or bare-chested performer, bare shoulders, arms, legs, or midriffs in ordinary clothing, smoking or a cigarette, drinking, children or teenagers shown ordinarily, band portraits, stage shots, tattoos, dark or gothic imagery, skulls, and abstract or illustrated figures without explicit nudity. When unsure, answer "none" - an unnecessary flag throws the sleeve away.`

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
      max_output_tokens: Math.max(2600, imageUrls.length * 420),
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
  recentSettings = [],
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
    ? `These media and staging techniques were used on recent covers and are refused for this one. Do not choose any of them or any close variation, and in particular do not build another diorama, shadow box, assemblage, or cut-paper collage unless this week's artwork makes that genuinely unavoidable:\n${refusedMedia.map(medium => `- ${medium}`).join('\n')}\n\nPhotography itself is never on this list and is always available. Reach for a photographic treatment that is materially different from the recent covers and genuinely fits this week's sleeves.`
    : ''
  const lightingBlock = buildLightingBlock(recentLighting)
  const settingBlock = buildSettingBlock(recentSettings)
  const refused = refusedSettings(recentSettings)
  const compositionBlock = buildCompositionBlock(recentCompositions)
  const yearBlock = buildYearBlock(digits, avoidYearTreatments)
  const hintBlock = hint ? `Author's steer: ${hint}` : ''
  const summaryBlock = coverSummaries
    .map(summary => [
      `Source ${summary.source}`,
      `Description: ${summary.description}`,
      `Signature motif: ${summary.signatureMotif}`,
      `Original medium: ${summary.medium}`,
      summary.strength ? `Visual strength: ${summary.strength} of 5` : '',
      summary.place ? `Place: ${summary.place}` : '',
      `People: ${summary.people || 'none'}`,
      hasPeople(summary) && isCastable(summary) ? `Castable: yes${summary.faceHeight ? ` - largest face is ${Math.round(summary.faceHeight * 100)}% of the sleeve height` : ''}` : '',
      hasPeople(summary) && !isCastable(summary) ? `Castable: no - ${uncastableReason(summary)}; do not cast or depict its people${summary.place ? ', but its place is fully available as the location' : ''}` : '',
      summary.palette.length > 0 ? `Palette: ${summary.palette.join(', ')}` : ''
    ].filter(Boolean).join('\n'))
    .join('\n\n')

  const instructions = `You are a visual art director creating one original 16:9 header image for ${digits ? `the ${digits} Year in Music post on a music blog` : 'a weekly music blog'}.
You will receive factual visual-research summaries of several album covers. The original images remain attached to the image-generation call in the same numbered order.

Choose the creative direction yourself from those visual findings alone. Lean towards photographic realism by default: one physically plausible place, set, or location that a camera could actually capture, with the album motifs present as real objects, surfaces, weather, and light within it and the sleeve portraits carried into it as they are. A non-photographic medium - painting, printmaking, illustration, textiles, sculpture - is allowed only when this particular set of covers makes a strong case for it, and "creativeDirection" must say what that case is. Do not use or assume any blog-post content and do not rotate through a hidden catalogue of preset styles.

Week-to-week variety comes from the scene, not the medium. A tabletop paper diorama or collage assemblage is the path of least resistance when several sleeves are graphic or illustrated, and leaning on it has already produced a long unbroken run of near-identical covers; swapping to a painting every week is the same failure in a different coat. Vary the location, the staging, the time of day, the light, the viewpoint, and the photographic treatment, and treat any move away from photography as a choice you must actively justify against this week's artwork.

Light the picture well, wherever it is set. Outdoor daylight is not the default and neither is night: the setting rules below decide which kinds of place are open this week, and an interior, a studio, or a lit night scene is as good a choice as a sunny exterior. Whatever you choose, the cast's faces are properly lit and the sleeve colours read clean at a small size - a night or interior cover is lit like a good editorial photograph, not left murky. Do not dress the scene with flowers, potted plants, vines, ivy, hedges, lawns, or gardens. Flowers and foliage have crept into many recent covers as filler and made them look alike. Use a plant only when a sleeve itself shows it (or, on a Year in Music cover, when the digits themselves are grown or cut from it), and keep it inside that contribution rather than spreading it across the scene. Prefer locations that are not gardens, parks, courtyards, or meadows unless a sleeve puts you there. Do not default to wet, rain-slicked, flooded, or mirror-glossy floors reflecting coloured lights, fog, haze, or smoke as atmosphere - use water or haze only when a sleeve itself shows it. Keep the image clean and crisp: no heavy film grain, faded blacks, or distressed-print texture.

Cohesion comes first. The picture must read as one real photograph of one moment in one place - something a photographer could have walked up to and shot - not a set of stations where each sleeve gets its own corner, alcove, prop, or figure. Decide what is happening in the scene before deciding what goes in it. It is fine, and usually better, for several sources to contribute nothing but colour, light, material, or weather, and for one or two to contribute nothing at all; a cover that finds a place for every sleeve reads as an exhibition, not a picture.

Cast at most ${MAX_CAST} sources as people. People are where a cover is won or lost, and every extra group of sleeve people becomes another pasted-in island. Choose the one or two portraits that best suit the moment and leave the others' people out entirely: a sleeve whose people are not cast may still lend its palette, setting, or an object, but nobody from it appears. List the cast in "cast" by source number.

Cast the strongest portraits, not the most convenient ones. Each summary says whether its people are castable and how large the largest face is: a face can only be copied when there is enough of it, so prefer the sleeves with the largest faces and the fewest people, and never cast a sleeve marked "Castable: no" - its people do not appear in any form, and neither does a stand-in for them. Never cast or depict a child. When a week's best portrait is available, build the picture around it instead of around whichever sleeve suggests the cleverest location. A cover with one well-copied person beats a cover with two groups of strangers, and a cover with nobody in it beats both when no sleeve has a usable face.

A sleeve's people and its place are separate things. When a summary has a "Place", that location can be the cover's location whether or not its people are castable: rebuild that room, street, or landscape as a real place - its architecture, furniture, surfaces, and light, recognisable to anyone who knows the sleeve - with none of the sleeve's own people in it, and stage this week's cast there. A sleeve marked "Castable: no" with a strong place is often the best location you have, so do not write it off as a single borrowed prop. A sleeve used this way takes the "lead" role as the place, alongside the cast sleeve as the other lead. Take the location from one sleeve only; do not merge two sleeves' places.

Lead with the strongest sleeves. "Visual strength" rates how much each sleeve gives you to photograph; the picture is built from the high-rated ones, and a weak sleeve contributes colour or nothing.

Recognisability is the point for the people you do cast. Stage that sleeve's portrait inside the world rather than recasting the person into a new performance: keep their pose, expression, gaze, hair, and styling, and change where they are, what surrounds them, and the light falling on them - they are standing in this scene's light, not the sleeve's studio. Do not have them asleep, turned away, mid-motion, or half-hidden by steam, shadow, or crowd unless the sleeve does, and never let the photographic treatment - motion blur, long exposure, fog, shallow focus - touch an identifiable face. The treatment belongs to the environment; the people are the fixed points. Place them inside the scene at the scale of the space around them - three-quarter length or closer, in the near or middle ground, sharing the ground and the light with everything else - not as an oversized cropped head looming at the edge of the frame over a distant view, and not washed in the sleeve's coloured light. A close crop is fine only when that person is the whole picture. Point the camera at the cast the way the sleeve's camera did - front-on if the sleeve is front-on - so their pose and gaze still make sense: never look straight down on them, and never put them so far away that their faces are a few pixels high.

In the final "prompt", name every cast person by their attached reference rather than by appearance alone - "the woman from reference image 8", "the five people from reference image 7" - using the source numbers you were given. The album images are attached to the image model in that numbered order, and a person described only by looks becomes a new invented face. A code-appended reference map repeats the numbers, so they must match.

Invent one specific, surprising composition with a clear visual hierarchy. The sleeves do not contribute equally, and they do not contribute nothing. Give every source you use one of three roles. "lead": one source, at most ${MAX_LEADS}, that the picture is built around - the cast, or the main subject or place. "support": ${MIN_SUPPORTS} to ${MAX_SUPPORTS} further sources that each appear as one real, recognisable thing taken from that sleeve - an object on a table, a piece of furniture, something worn or held, an animal, a fixture, a detail of the room - clearly smaller and quieter than the lead, placed where such a thing would plausibly be, and noticed on a second look. Each support is a different sleeve: several things from one sleeve count once, a lead sleeve's extra details do not count as supports, and lending a colour is the colour role, not a support. Someone who knows the record should be able to spot it. "colour": the remaining sources, which lend only palette, material, or light, or are left out. A cover where only one sleeve is recognisable is that sleeve restaged, not a picture of the week; a cover where every sleeve gets its own prop - a machine for one, a carving for another, a star for a third - is a prop shop. Aim between them: one clear subject and a few finds around it.

The image model is told to avoid gore, wounds, body horror, medical or anatomical imagery, blank or milky eyes, nudity, weapons, and hate symbols, so do not write any of them into the scene. A sleeve built on such a motif - a resuscitation dummy, an operating table, a skull, a gun - contributes its colours only; do not restage it as a prop. Transform motifs into the chosen world rather than reproducing album sleeves. A sleeve's graphics may be part of the place: its abstract shapes, patterns, and colours can be painted across a wall, a door, a floor, or an object as that place's own decoration, as long as it carries no lettering and is not the whole sleeve hung up as a framed picture, poster, or record cover or shown on a screen. What never appears as a picture is a person: a sleeve's faces and figures are real cast people or they are absent - not a mural, portrait, poster, cut-out, relief, or image on a screen.

Nobody is in the picture except the cast. Write no one else into the scene - no bartender, drummer, band, crowd, passer-by, or background figure - and when you cast a sleeve, cast only the people whose faces are clearly visible on it: say which ones ("the man in front from reference image 2") and leave out anyone the sleeve shows hidden, cropped, turned away, or blurred, because the image model will invent a face for them. When "cast" is empty the scene has no people at all. Graphic, abstract, illustrated, and lettering-led sleeves are where this goes wrong, because they have no object to borrow. They make good supports when their motif is already a thing - a snake, a flame, a bird, a flower, a globe, a lamp - which can simply be there, real and at its natural size. When the motif is only a shape, a pattern, or an emblem, it can be painted onto a surface of the place as a support, or the sleeve takes the colour role. Lettering is never carried over. Never invent a contraption, sculpture, or piece of equipment just to stand in for a logo or emblem.

Treat each identifiable person as one unique identity and plan only one depiction of them across the whole composition. Do not reuse the same person as both a live figure and a secondary image, reflection, poster, billboard, screen, portrait, silhouette, or background face. Preserve repeated likenesses only when that repetition is visibly intrinsic to one source cover, and contain it within that source's single contribution.

The final "prompt" must be ready to send directly to a multi-reference image model. Write it in the order: scene and viewpoint; primary subject; source-specific details; medium and technique; composition and lighting; palette and mood. Do not include meta-commentary, JSON instructions, or references to this planning conversation. Mandatory safety, text, and layout constraints are appended by code, so concentrate the prompt on precise creative direction.

${avoidBlock}

${avoidMediaBlock}

${settingBlock}

${lightingBlock}

${compositionBlock}

${yearBlock}

Return JSON exactly as {"concept":"string","medium":"string","setting":"string","lighting":"string","composition":"string",${digits ? '"yearTreatment":"string",' : ''}"creativeDirection":"string","scene":"string","cast":[1],"elements":[{"source":1,"role":"lead","element":"string"}],"palette":["string"],"mood":"string","prompt":"string"}.
"concept" is at most 15 words and is saved to the do-not-repeat history. "medium" is at most 8 words naming only the chosen medium or technique - it is saved to the history, and any non-photographic medium is refused on future weeks, so be specific ("daylight location photography", "gouache on board") rather than generic ("mixed media"). "setting" is exactly one of "exterior", "interior", "studio", or "night" - it is saved to the history and a setting used too often is refused on future weeks. "lighting" is at most 6 words naming the time of day and main light source ("window light across a bar", "softbox on grey seamless", "street lamps after rain") - it is saved to the history and recent set-ups are refused on future weeks. "composition" is at most 8 words naming the camera position and framing ("low angle, lone figure off-centre", "top-down over a crowded floor") - it is saved to the history and recent ones are refused on future weeks.${digits ? ` "yearTreatment" is at most 10 words naming what the digits ${digits} are made of and where they sit ("hedge-cut digits on a hillside", "marquee bulbs above a theatre door") - it is saved to the history and refused on later Year in Music covers. The final "prompt" must describe the year treatment explicitly and quote the digits as "${digits}".` : ''} "creativeDirection" names the chosen medium and visual approach in one sentence. "elements" records how each numbered source contributes, with its "role" as exactly "lead", "support", or "colour"; leave out any source that contributes nothing. Every "support" element must also be written into the "prompt" as a concrete thing with a place in the scene. "cast" lists the source numbers whose people appear, at most ${MAX_CAST}, or is empty.`

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
      // Graphics painted onto the place are allowed; a sleeve with people on it copied flat
      // onto a surface is a picture of those people, which is not.
      const flat = findFlatCopies(candidate.prompt).filter(source => hasPeople(coverSummaries.find(summary => summary.source === source)))
      if (flat.length > 0) {
        problems.push(`it shows source${flat.length > 1 ? 's' : ''} ${flat.join(', ')}, a sleeve with people on it, as a picture on a surface (mural, painted wall, backdrop, banner, sign, panel, or similar)`)
      }
      const extras = findExtraPeople(candidate.prompt)
      if (extras.length > 0) {
        problems.push(`it writes in people who are not the cast ("${extras[0]}") - nobody appears except the cast`)
      }
      const pictured = findPicturedFigures(candidate.prompt)
      if (pictured.length > 0) {
        problems.push(`it shows faces or figures on a screen, sign, cut-out, or carving ("${pictured[0]}")`)
      }
      const looming = findLoomingCast(candidate.prompt, candidate.cast)
      if (looming.length > 0) {
        problems.push(`it puts the person from source${looming.length > 1 ? 's' : ''} ${looming.join(', ')} at the extreme edge of the frame or under coloured light, which reads as a pasted-in cut-out`)
      }
      const lettering = digits ? [] : findLettering(candidate.prompt)
      if (lettering.length > 0) {
        problems.push(`it asks for lettering, which the cover may not contain ("${lettering[0]}") - a sleeve's lettering or tattoo contributes colour or nothing`)
      }
      if (isDistantCast(candidate)) {
        problems.push(`it casts people but shoots them from above or from far away ("${candidate.composition}"), so their faces are too small to recognise`)
      }
      problems.push(...findHierarchyProblems(candidate.elements, coverSummaries.length).map(problem => `the balance is wrong: ${problem}`))
      if (refused.includes(candidate.setting)) {
        problems.push(`it is set as "${candidate.setting}", which is refused this week`)
      }
      return problems
    }
    const problems = problemsWith(direction)
    if (problems.length > 0) {
      if (debug) console.log(`  Art director brief rejected (${problems.join('; ')}); asking again`)
      direction = await requestDirection(`Your previous answer was rejected: ${problems.join('; and ')}. Answer again with at most ${MAX_CAST} cast sources and no people from any other source, no sleeve's people shown as a picture on any surface, screen, sign, or carving, nobody in the scene except the cast, no lettering, cast people standing in the scene at its own scale and in its own light, photographed from eye level at three-quarter length or closer,${refused.length > 0 ? ` a setting that is not ${refused.join(' or ')},` : ''} one or two lead sources with ${MIN_SUPPORTS} to ${MAX_SUPPORTS} others each present as a real, recognisable supporting element, and one cohesive moment rather than a station for each sleeve.`)
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
  const cast = Array.isArray(artDirection?.cast) ? artDirection.cast : null
  return [
    creativePrompt,
    yearDirective,
    buildReferenceMap(coverSummaries, cast, closeUps),
    `Hard constraints (override any conflicting source material): ${buildHardConstraints({ year: digits, cast: cast ?? undefined }).join(' ')}`
  ].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
}
