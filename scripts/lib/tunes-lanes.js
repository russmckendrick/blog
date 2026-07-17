// Weekly creative-direction lanes for the tunes cover, plus the deterministic rotation
// helpers shared with the artist portrait flow. Every fixed stylistic steer that used to be
// hardcoded into the cover prompt (photorealistic, cinematic, bright-and-saturated, one
// staged scene) now lives in a lane, so the medium, composition, and palette genuinely
// change week to week while the week's ~7 album motifs stay recognisable in all of them.
//
// Lane shape:
//   id / label            - stable identifier and human name
//   kind                  - 'photo' | 'print'; selects the negative-term set and how the
//                           art director is told to treat motifs
//   medium                - one line handed to the Stage A art director ("The final image
//                           will be ...") so the scene is designed natively in that medium
//   styleDirective        - the style-first opening sentence of the final image prompt
//   motifTreatment        - how the album motifs are rendered in this medium (always
//                           recognisable - spot-the-albums is the point of the image)
//   composition           - the composition grammar for the week
//   paletteTreatment      - colour handling (replaces the old always-vivid mandate)
//   lighting              - true when the weekly LIGHTING_DIRECTIONS rotation applies
//                           (photo lanes only; print lanes carry their own treatment)
//   negatives             - extra lane-specific negative terms
//   pipeline              - [{ role: 'compose', backend?, fallback? }, optional
//                           { role: 'restyle', backend, params }]. A compose stage without
//                           a backend resolves to the tunes-config.yaml defaults.

export const MS_PER_WEEK = 604800000

// Distinct salts keep each rotating list on an independent schedule - without them the
// lane, lighting, and shoot indices would advance in lockstep and repeat the same pairings.
export const LANE_SALT = 0x1a2b
export const LIGHTING_SALT = 0x3c4d
export const SHOOT_SALT = 0x5e6f
export const COLOUR_SALT = 0x7081

// The seed is the post date as epoch-milliseconds. Weekly post dates are exactly one
// MS_PER_WEEK apart, and MS_PER_WEEK is divisible by 14, so a plain `seed % length` maps
// EVERY week to the same residue. Bucketing by weeks-since-epoch advances the index by one
// each week. Small non-timestamp seeds (e.g. a CLI --seed for testing) fall back to a
// direct value so they still vary.
export function weekBucket(seed) {
  const value = Math.abs(Math.trunc(Number.isFinite(seed) ? seed : 0))
  return value >= MS_PER_WEEK ? Math.floor(value / MS_PER_WEEK) : value
}

// Small deterministic PRNG so rotation order can be reshuffled per epoch without Math.random.
function mulberry32(a) {
  return function next() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Pick one entry from a list for the given week bucket. Every entry appears exactly once
// per cycle of list.length weeks, and the order is re-dealt each cycle (per-epoch
// Fisher-Yates), so lists of different lengths never fall into repeating pairings the way
// plain `bucket % length` on both would (e.g. gcd(12, 8) locking each lane to the same
// lighting forever).
export function epochShuffledPick(list, bucket, salt) {
  if (!Array.isArray(list) || list.length === 0) return undefined
  const epoch = Math.floor(bucket / list.length)
  const rng = mulberry32((Math.imul(epoch + 1, 2654435761) ^ salt) | 0)
  const order = [...list.keys()]
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return list[order[bucket % list.length]]
}

// Time-of-day rotation for photo lanes. Print lanes carry their own light in the lane
// definition, and the after-dark look now has a whole lane of its own (neon-noir), so this
// list is daylight only - it exists to stop photo weeks converging on generic night scenes.
export const LIGHTING_DIRECTIONS = [
  'bright midday sunlight under a clear blue sky, crisp hard shadows and vivid daylight colour',
  'warm golden-hour light just before sunset, long shadows and a glowing amber sidelight',
  'soft bright overcast daylight, gentle even shadows and rich, true-to-life colour',
  'fresh early-morning light with a low sun, clean cool highlights and long soft shadows',
  'bright interior daylight pouring through large windows, airy and naturally lit',
  'a vivid sunny afternoon with strong directional sun, saturated colour and sparkling highlights',
  'deep blue-hour twilight just after sunset, a saturated blue sky with warm artificial lights starting to glow',
  'dramatic stormlight with sun breaking through, bright shafts of light against dark cloud'
]

export function pickLightingDirection(seed) {
  return epochShuffledPick(LIGHTING_DIRECTIONS, weekBucket(seed), LIGHTING_SALT)
}

// Shoot grammar for the artist group portrait. These describe the KIND of photograph
// (behaviour, camera position, moment), not just a backdrop - left to itself the model
// re-shoots the same evenly-spaced publicity lineup in front of a new wall every week, so
// most entries explicitly break the lineup.
// Every entry keeps faces toward the camera, well lit, and large in frame - likeness is the
// whole point of the portrait, so no silhouettes, no walking-away shots, no hidden faces.
export const SHOOT_DIRECTIONS = [
  'a candid mid-action rehearsal photograph taken from just in front while the group plays and talks - absorbed in the music rather than posing, faces bright and close',
  'the group walking toward the camera down the middle of a city street, mid-stride, coats moving, caught like a film still',
  'the group squeezed onto a battered dressing-room sofa under bulb-lit mirrors, shot straight on and close, faces bright',
  'the group at the front of a stage during soundcheck, lit warmly from the side, shot close from the empty floor looking up at them',
  'a wide fisheye close huddle - the group crammed into frame inches from the lens, laughing, distorted at the edges',
  'a long-lens candid across a busy street, the group facing the camera compressed against shopfronts, strangers blurring past in the foreground',
  'the group mid-laughter around a diner booth table, shot from the far end of the table, faces catching the window light',
  'the group crossing a zebra crossing toward the camera, shot square-on from across the road',
  'a record-shop scene - the group gathered close around one record they are debating, shot from just across the crate, faces lit by the window',
  'a rooftop at golden hour, the group leaning back against the parapet facing the camera, skyline behind them',
  'a high-key white studio caught between takes - mid-conversation, adjusting a jacket, tuning up, relaxed and close to the lens',
  'a windswept seafront, the group huddled together on the sea wall facing the camera, hair and coats blowing',
  'a 1970s film-grain interior with wood panelling and warm tungsten light, the group lounging across mismatched furniture like a gatefold sleeve, all faces visible',
  'a greenhouse full of plants, the group gathered close at a potting bench facing the camera, soft diffused daylight on their faces',
  'a warehouse stage under coloured concert light and haze, the group shot close from the front row, faces clearly lit',
  'a graffiti-covered back alley, the group mid-conversation walking toward a doorway camera - candid, not posed'
]

export function pickShootDirection(seed) {
  return epochShuffledPick(SHOOT_DIRECTIONS, weekBucket(seed), SHOOT_SALT)
}

// Colour treatment rotation for the artist portrait. Each entry REPLACES the old fixed
// "bright, vivid, richly saturated" clause, so a black-and-white or pastel week is not
// simultaneously told to be punchy and saturated. These are pure grade/film-stock language
// with no time-of-day words - the shoot direction owns the lighting, and the two lists
// rotate independently, so a treatment that named its own light would contradict it.
export const COLOUR_TREATMENTS = [
  {
    id: 'natural-daylight',
    direction: 'natural true-to-life colour, clean, honest, and unforced'
  },
  {
    id: 'kodachrome',
    direction: 'warm Kodachrome film colour - rich reds, golden skin tones, gentle contrast and subtle grain'
  },
  {
    id: 'cross-process',
    direction: 'cross-processed slide-film colour - shifted greens and cyans, blown warm highlights, punchy contrast'
  },
  {
    id: 'overcast-pastel',
    direction: 'soft muted pastel grade, gentle and calm rather than saturated'
  },
  {
    id: 'punchy-editorial',
    direction: 'bright, vivid, richly saturated editorial colour with luminous highlights and punchy contrast'
  },
  {
    id: 'bw-filmgrain',
    direction: 'black-and-white photography with silver film grain, deep blacks and bright highlights, no colour at all'
  }
]

export function pickColourTreatment(seed) {
  return epochShuffledPick(COLOUR_TREATMENTS, weekBucket(seed), COLOUR_SALT)
}

// The old weekly formula, banned in every lane: it is exactly what made months of covers
// read as the same image (posed ensemble + giant sculpture + props on plinths). Lanes whose
// own composition legitimately needs one of these terms (macro's tabletop world, the gig
// poster's dominant central motif) get a trimmed list so the prompt never argues with itself.
const ANTI_CLICHE_POSED = 'a posed group of people arranged for the camera'
const ANTI_CLICHE_TABLES = 'objects displayed on tables, trays, or plinths'
const ANTI_CLICHE_SCULPTURE = 'one giant central sculpture as the centrepiece of the scene'
const ANTI_CLICHE = [ANTI_CLICHE_POSED, ANTI_CLICHE_TABLES, ANTI_CLICHE_SCULPTURE]

export const LANES = [
  {
    id: 'documentary-street',
    label: 'Documentary street photo',
    kind: 'photo',
    medium: 'a candid 35mm documentary photograph, shot like honest street reportage',
    styleDirective: 'Create one candid 35mm documentary street photograph - honest reportage with natural imperfection, subtle film grain, and real life caught mid-moment.',
    motifTreatment: 'Let each album motif appear as a real thing genuinely found in the location - painted on a shutter, carried by a passer-by, stacked outside a shop, perched on a wire - discovered by the camera, never staged for it.',
    composition: 'An off-centre, imperfect frame caught mid-moment: subjects moving through the shot, half-glimpsed details, layered foreground and background life.',
    paletteTreatment: 'true-to-life colour with the natural palette of the place, accented by the boldest colours from the sleeves',
    lighting: true,
    negatives: [],
    antiCliche: ANTI_CLICHE,
    pipeline: [{ role: 'compose' }]
  },
  {
    id: 'macro-detail',
    label: 'Extreme macro',
    kind: 'photo',
    medium: 'an extreme close-up macro photograph of one small, intricate world',
    styleDirective: 'Create one extreme macro photograph - a single tabletop-scale world seen from inches away with razor-thin depth of field.',
    motifTreatment: 'Shrink each album motif into a tiny, exquisitely detailed object or texture inside this one miniature world - carved, folded, grown, or resting among the others.',
    composition: 'One dominant close subject filling the frame, the remaining motifs dissolving into soft bokeh layers behind it.',
    paletteTreatment: 'rich naturalistic colour with luminous highlights where the light catches edges and textures',
    lighting: true,
    negatives: [],
    // The lane's whole premise is a tabletop-scale world with one dominant subject, so the
    // tables/sculpture bans would argue with its own composition.
    antiCliche: [ANTI_CLICHE_POSED],
    pipeline: [{ role: 'compose' }]
  },
  {
    id: 'analog-rehearsal-room',
    label: 'Analog rehearsal-room documentary',
    kind: 'photo',
    medium: 'a candid analog 35mm documentary photograph of adult musicians actively rehearsing in a real working room',
    styleDirective: 'Create one candid analog 35mm photograph of adult musicians caught mid-rehearsal in a lived-in practice room - genuine musical concentration, natural interaction, fine film grain, mixed practical light, and subtle movement in hands or drumsticks while faces and instruments remain crisp; nobody is posing or looking at the camera.',
    motifTreatment: 'Translate the album motifs into believable parts of the same rehearsal: the musicians and their styling, instrument finishes and shapes, the room architecture, worn furnishings, cables, cases, lighting, and atmosphere. Blend the motifs across the whole scene instead of assigning each one a separate displayed object, poster, or emblem.',
    composition: 'One continuous wide rehearsal room photographed unobtrusively from a doorway or back corner, with layered foreground equipment, musicians playing together through the middle ground, and room depth behind them; active, asymmetric, and loosely framed like a real moment rather than a band portrait.',
    paletteTreatment: 'muted analog colour drawn from the sleeves, with warm tungsten and cool fluorescent practical light, soft highlight bloom, subdued blacks, and natural skin tones',
    lighting: false,
    negatives: ['posed band portrait', 'publicity photo', 'live concert stage', 'musicians looking at camera', 'symmetrical lineup', 'empty recording studio', 'pristine equipment showroom', 'album-cover posters', 'separate displayed symbols'],
    antiCliche: ANTI_CLICHE,
    pipeline: [{ role: 'compose' }]
  },
  {
    id: 'neon-noir',
    label: 'Neon noir night',
    kind: 'photo',
    medium: 'a cinematic night photograph in a neon-lit city, wet and reflective',
    styleDirective: 'Create one cinematic neon-noir night photograph - wet streets, glowing wordless signs, deep shadow and electric colour.',
    motifTreatment: 'Reimagine each album motif as something real in the night city - a neon shape, a reflection in the wet street, a figure under a lamp, a lit shopfront display, a shadow thrown on brick.',
    composition: 'A low cinematic angle with layered depth: a dark foreground shape, a clear midground subject, and glowing colour behind.',
    paletteTreatment: 'saturated artificial colour - neon pinks, electric blues, sodium ambers - cutting through deep black shadow',
    lighting: false,
    negatives: [],
    antiCliche: ANTI_CLICHE,
    pipeline: [{ role: 'compose' }]
  },
  {
    id: 'miniature-diorama',
    label: 'Miniature diorama',
    kind: 'photo',
    medium: 'a photograph of a handmade miniature diorama, shot with tilt-shift focus',
    styleDirective: 'Create one photograph of a handcrafted miniature diorama - a tiny physical model world built by hand and photographed with tilt-shift focus.',
    motifTreatment: 'Build each album motif as a tiny handmade model - hand-built foam hills, paper trees, clay figures, matchstick structures - clearly crafted and clearly miniature, yet instantly recognisable.',
    composition: 'An elevated three-quarter view over one small self-contained world, tilt-shift blur softening the edges of the frame.',
    paletteTreatment: 'warm toy-like colour, like stained wood, felt, and modelling clay',
    lighting: true,
    negatives: [],
    antiCliche: ANTI_CLICHE,
    pipeline: [{ role: 'compose', backend: 'nano-banana', fallback: 'gpt-image-2' }]
  },
  {
    id: 'risograph',
    label: 'Risograph poster',
    kind: 'print',
    medium: 'a two- or three-colour risograph print with visible grain and slight misregistration',
    styleDirective: 'Create one bold risograph print - flat layered shapes, coarse riso grain, overlapping translucent inks slightly out of register, paper texture showing through.',
    motifTreatment: 'Redraw each album motif as bold flat printed shapes in the limited ink colours - simplified but instantly recognisable silhouettes and forms.',
    composition: 'An asymmetric poster composition with one strong diagonal flow, motifs at varied scales, and generous negative space.',
    paletteTreatment: 'strictly two or three ink colours pulled from the sleeves, overprinting where they overlap, on off-white paper',
    lighting: false,
    negatives: [],
    antiCliche: ANTI_CLICHE,
    pipeline: [
      { role: 'compose', backend: 'nano-banana', fallback: 'gpt-image-2' },
      { role: 'restyle', backend: 'recraft-i2i', params: { style: 'digital_illustration/grain', strength: 0.35 } }
    ]
  },
  {
    id: 'screenprint-gigposter',
    label: 'Screenprint gig poster',
    kind: 'print',
    medium: 'a hand-pulled screenprinted gig poster with thick flat inks and halftone shading',
    styleDirective: 'Create one heavy-ink screenprinted gig poster - thick flat colour, hard confident shapes, halftone dots for shading, and absolutely no lettering.',
    motifTreatment: 'Turn each album motif into a bold screenprinted graphic element - chunky shapes, halftone tone, crisp knockouts - each one readable at a glance.',
    composition: 'One dominant central motif with the others orbiting it, tight and punchy like a classic gig poster.',
    paletteTreatment: 'three or four flat saturated ink colours on paper',
    lighting: false,
    negatives: [],
    // The gig poster wants one dominant central motif, so the central-sculpture ban is dropped.
    antiCliche: [ANTI_CLICHE_POSED, ANTI_CLICHE_TABLES],
    pipeline: [
      { role: 'compose', backend: 'nano-banana', fallback: 'gpt-image-2' },
      { role: 'restyle', backend: 'recraft-i2i', params: { style: 'digital_illustration/2d_art_poster', strength: 0.4 } }
    ]
  },
  {
    id: 'retro-sci-fi-paperback',
    label: 'Retro science-fiction paperback',
    kind: 'print',
    medium: 'a richly painted 1960s or 1970s science-fiction paperback illustration with vintage airbrush texture and aged print grain',
    styleDirective: 'Create one richly detailed retro science-fiction paperback painting from the 1960s or 1970s - hand-painted gouache, oils, and soft airbrush gradients, strange cosmic scale, aged print grain, and absolutely no lettering or border.',
    motifTreatment: 'Reimagine each album motif as something that belongs in the same speculative world - alien terrain, colossal machinery, celestial phenomena, unusual flora, explorers, or distant structures - painted consistently and still recognisable.',
    composition: 'One panoramic otherworldly scene with a dramatic foreground anchor, a clear horizon, immense environmental scale, and layered depth into a strange sky; never a book-cover frame or a collection of separate vignettes.',
    paletteTreatment: 'luminous vintage-pulp colour drawn from the sleeves - deep indigo shadows, radiant horizon light, and a few saturated cosmic accents softened by aged print',
    lighting: false,
    negatives: ['book mockup', 'book-cover border', 'blank title area', 'modern glossy concept art', 'flat vector shapes'],
    antiCliche: ANTI_CLICHE,
    pipeline: [{ role: 'compose', backend: 'nano-banana', fallback: 'gpt-image-2' }]
  },
  {
    id: 'painterly-gouache',
    label: 'Gouache painting',
    kind: 'print',
    medium: 'a gouache painting with matte opaque paint and visible brushwork',
    styleDirective: 'Create one gouache painting - matte opaque paint, confident visible brushstrokes, soft blends and chalky texture, like a mid-century book illustration.',
    motifTreatment: 'Paint each album motif into the scene as a naturally belonging painted element - loose and gestural but unmistakable.',
    composition: 'A classic painterly composition - a landscape, interior, or figure study with a clear focal hierarchy.',
    paletteTreatment: 'mixed painterly colour drawn from the sleeves, warm lights against cool shadows',
    lighting: false,
    negatives: [],
    antiCliche: ANTI_CLICHE,
    pipeline: [{ role: 'compose', backend: 'nano-banana', fallback: 'gpt-image-2' }]
  },
  {
    id: 'long-exposure-light',
    label: 'Long-exposure light photography',
    kind: 'photo',
    medium: 'a real long-exposure night photograph made in-camera with moving light, illuminated architecture, and reflections',
    styleDirective: 'Create one genuine long-exposure night photograph - a locked-off camera, real environmental depth, continuous moving light trails, luminous reflections, and crisp stationary surfaces anchoring the frame.',
    motifTreatment: 'Build each album motif into the same physical night-time location: express suitable shapes through deliberate continuous light trails, projections, illuminated structures, reflections, or moving figures, while keeping solid subjects tangible and recognisable.',
    composition: 'One deep-perspective night scene anchored by a strong real location, with connected light paths sweeping through foreground, middle ground, and distance rather than isolated glowing symbols floating on black.',
    paletteTreatment: 'deep natural night tones with two or three luminous colours drawn from the sleeves, bright light trails, controlled highlights, and reflective colour',
    lighting: false,
    negatives: ['daylight scene', 'flat black background', 'floating neon icons', 'random light scribbles', 'laser-show stage', 'digital glow effects'],
    antiCliche: ANTI_CLICHE,
    pipeline: [{ role: 'compose' }]
  },
  {
    id: 'vintage-travel-poster',
    label: 'Vintage travel poster',
    kind: 'print',
    medium: 'a mid-century travel-poster illustration with simplified geometry and stylised light',
    styleDirective: 'Create one mid-century travel poster illustration - simplified geometry, stylised light, smooth gradient skies, flat confident shapes, and absolutely no lettering.',
    motifTreatment: 'Stylise each album motif into the poster world - as landmarks, vehicles, figures, flora, or emblems drawn in the same simplified poster language.',
    composition: 'One heroic vista with a strong horizon, a big sky, and clear foreground, middle-ground, and background bands.',
    paletteTreatment: 'warm faded lithograph colours - cream, teal, coral, ochre - tuned to the sleeves',
    lighting: false,
    negatives: [],
    antiCliche: ANTI_CLICHE,
    pipeline: [
      { role: 'compose', backend: 'nano-banana', fallback: 'gpt-image-2' },
      { role: 'restyle', backend: 'ideogram-remix', params: { style: 'DESIGN', strength: 0.75 } }
    ]
  },
  {
    id: 'zine-photocollage',
    label: 'Zine photo-collage',
    kind: 'print',
    medium: 'a photocopied zine collage with halftone texture and cut-and-paste energy',
    styleDirective: 'Create one DIY zine photo-collage - xeroxed halftone fragments, torn edges, tape marks, high-contrast photocopy grain, punk cut-and-paste energy.',
    motifTreatment: 'Paste each album motif in as a torn photocopied fragment or hand-cut shape - degraded, rough, but clearly recognisable.',
    composition: 'A chaotic but balanced paste-up around one anchor image, fragments overlapping at odd angles.',
    paletteTreatment: 'high-contrast black-and-white photocopy with one loud spot colour',
    lighting: false,
    // The medium IS a collage, so the shared anti-collage negative is skipped for this lane.
    collageMedium: true,
    negatives: [],
    antiCliche: ANTI_CLICHE,
    pipeline: [{ role: 'compose', backend: 'nano-banana', fallback: 'gpt-image-2' }]
  }
]

const LANES_BY_ID = new Map(LANES.map(lane => [lane.id, lane]))

export function listLanes() {
  return LANES
}

// Loose lookup: case-insensitive, ignores punctuation, so --lane=RisoGraph works.
export function getLane(value) {
  const key = String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  if (!key) return null
  for (const lane of LANES) {
    if (lane.id.replace(/[^a-z0-9]/g, '') === key) return lane
  }
  return null
}

// Weekly lane rotation. `laneIds` optionally restricts rotation to a configured subset
// (settings.cover_lanes); unknown ids in the subset are ignored, and an empty result falls
// back to the full list so a bad config cannot kill the weekly post.
export function pickLane(seed, { laneIds = null } = {}) {
  let pool = LANES
  if (Array.isArray(laneIds) && laneIds.length > 0) {
    const subset = laneIds.map(getLane).filter(Boolean)
    if (subset.length > 0) pool = subset
  }
  return epochShuffledPick(pool, weekBucket(seed), LANE_SALT)
}

export function pipelineStage(lane, role) {
  return lane?.pipeline?.find(stage => stage.role === role) || null
}
