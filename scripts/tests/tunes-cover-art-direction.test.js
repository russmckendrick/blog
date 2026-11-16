import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildArtDirectionRequestText,
  buildCompositionBlock,
  buildLightingBlock,
  buildCoverSummaryRequestText,
  buildFallbackArtDirection,
  buildGenerationPrompt,
  buildReferenceMap,
  buildSettingBlock,
  buildYearBlock,
  cameraHeight,
  closeUpBox,
  closeUpBoxes,
  CLOSE_UP_BELOW,
  contentScore,
  dropModerationRisks,
  isCastable,
  isDistantCast,
  isPassage,
  MIN_CASTABLE_FACE,
  refusedSettings,
  settingFamily,
  uncastableReason,
  findExtraPeople,
  findFlatCopies,
  findLettering,
  findHierarchyProblems,
  findLoomingCast,
  findPicturedFigures,
  findUncastPeople,
  MAX_CAST,
  normalizeCast,
  normalizeModerationRisk,
  hasPeople,
  hasPlace,
  isLowLight,
  isPhotographicMedium,
  COMPOSITION_REPEAT_WINDOW,
  LIGHTING_REPEAT_WINDOW,
  normalizeArtDirection,
  normalizeCoverSummaries,
  normalizeYear,
  overusedCameraHeight
} from '../lib/tunes-cover-art-direction.js'
import {
  formatTunesPostContext,
  normalizeTunesPostContext,
  parseTunesPostContext
} from '../lib/tunes-post-context.js'

const sourceReferences = [
  {
    source: 1,
    filename: 'first-album.jpg',
    album: 'First Album',
    artist: 'First Artist',
    plays: 24
  },
  {
    source: 2,
    filename: 'second-album.jpg',
    album: 'Second Album',
    artist: 'Second Artist',
    plays: 18
  }
]

test('explicitly requests JSON in both Responses API input messages', () => {
  assert.match(buildCoverSummaryRequestText(2, 'source 1: first.jpg'), /json/i)
  assert.match(buildArtDirectionRequestText('', 'Source 1'), /json/i)
})

test('normalizes weekly generator tuple context', () => {
  const context = normalizeTunesPostContext({
    title: 'Week in Music',
    summary: 'A varied week.',
    topArtists: [['First Artist', 24]],
    topAlbums: [[['First Artist', 'First Album'], 18]]
  })

  assert.deepEqual(context.topArtists, [{ artist: 'First Artist', plays: 24 }])
  assert.deepEqual(context.topAlbums, [{ artist: 'First Artist', album: 'First Album', plays: 18 }])
  assert.match(formatTunesPostContext(context), /First Album by First Artist \(18 plays\)/)
})

test('parses reusable context from a rendered Tunes post', () => {
  const context = parseTunesPostContext(`---
title: "A Musical Week"
description: "A concise weekly summary."
---

## Top Artists (2)

- [First Artist](https://example.com/artist) (24 plays)

## Top Albums (2)

- [First Album](https://example.com/album) by [First Artist](https://example.com/artist) (18 plays)
`)

  assert.equal(context.title, 'A Musical Week')
  assert.equal(context.summary, 'A concise weekly summary.')
  assert.deepEqual(context.topArtists[0], { artist: 'First Artist', plays: 24 })
  assert.deepEqual(context.topAlbums[0], {
    artist: 'First Artist',
    album: 'First Album',
    plays: 18
  })
})

test('keeps one factual summary per source and fills missing observations safely', () => {
  const summaries = normalizeCoverSummaries([
    {
      source: 1,
      description: 'A silver bird crosses a red sun.',
      signatureMotif: 'silver bird',
      medium: 'screen print',
      palette: ['silver', 'red']
    }
  ], sourceReferences)

  assert.equal(summaries.length, 2)
  assert.equal(summaries[0].signatureMotif, 'silver bird')
  assert.equal(summaries[1].source, 2)
  assert.match(summaries[1].description, /no reliable non-text visual description/)
  assert.match(summaries[1].signatureMotif, /Second Album/)
})

test('normalizes freeform art direction and appends only hard generation constraints', () => {
  const summaries = normalizeCoverSummaries([], sourceReferences)
  const direction = normalizeArtDirection({
    concept: 'Silver birds over a painted sea',
    creativeDirection: 'Layered linocut with hand-painted colour',
    scene: 'A silver bird crosses a rough red horizon.',
    elements: [
      { source: 1, element: 'silver bird' },
      { source: 2, element: 'wave texture' }
    ],
    palette: ['silver', 'red', 'navy'],
    mood: 'restless and nocturnal',
    prompt: 'A hand-cut linocut seascape seen from a low shoreline viewpoint.'
  }, summaries, sourceReferences)
  const prompt = buildGenerationPrompt(direction)

  assert.equal(direction.creativeDirection, 'Layered linocut with hand-painted colour')
  assert.match(prompt, /^A hand-cut linocut/)
  assert.match(prompt, /Hard constraints/)
  assert.match(prompt, /no readable text/i)
  assert.match(prompt, /closely match their visible appearance and likeness/i)
  // Re-posing a person into a new performance (asleep, mid-turn, smeared by long exposure)
  // makes the image model invent a face, so pose and a sharp unobscured face are hard rules.
  assert.match(prompt, /pose, expression, and gaze the sleeve shows/i)
  assert.match(prompt, /sharp, lit, unobscured, and in focus/i)
  assert.match(prompt, /expose the image cleanly whatever the light/i)
  assert.doesNotMatch(prompt, /expose the image brightly/i, 'bright-only exposure is gone')
  assert.doesNotMatch(prompt, /three-quarter length or closer/i, 'no cast, no cast-framing rule')
  assert.match(prompt, /heavy film grain/i)
  assert.match(prompt, /each identifiable reference person only once/i)
  assert.match(prompt, /reflection, mirror portrait, poster, billboard/i)
  assert.doesNotMatch(prompt, /creative-direction lane/i)
  assert.doesNotMatch(prompt, /Reference map for people/i, 'no map when the factual pass saw nobody')
})

test('ties every person on a sleeve back to its numbered reference image', () => {
  const summaries = normalizeCoverSummaries([
    { source: 1, description: 'A glitchy abstract', people: 'none' },
    { source: 2, description: 'A woman with dogs', people: 'one woman reclining with two dogs' }
  ], sourceReferences)

  assert.equal(hasPeople(summaries[0]), false)
  assert.equal(hasPeople(summaries[1]), true)
  assert.equal(hasPeople({ people: 'No people visible' }), false)
  assert.equal(hasPeople({}), false)

  const map = buildReferenceMap(summaries)
  assert.match(map, /reference image 2 shows one woman reclining with two dogs/)
  assert.doesNotMatch(map, /reference image 1/)

  const prompt = buildGenerationPrompt({ prompt: 'A platform at night.' }, summaries)
  assert.match(prompt, /^A platform at night\. Reference map for people/)
  assert.match(prompt, /Copy each of these faces directly from that numbered reference image/)
  assert.match(prompt, /Hard constraints/)
})

test('photographic media are exempt from the recent-media refusal', () => {
  for (const medium of [
    'wet-plate photography',
    'editorial location photograph',
    'large-format film',
    'long-exposure night photography',
    'cinematic studio shoot'
  ]) {
    assert.ok(isPhotographicMedium(medium), `${medium} should count as photographic`)
  }
})

test('staged and painted media are still refused, even when they mention a camera', () => {
  for (const medium of [
    'oil on canvas',
    'color lithograph',
    'pastel mural',
    'glazed ceramic mural',
    'cut-paper and photo collage',
    'mixed-media diorama photographed like a stage set'
  ]) {
    assert.ok(!isPhotographicMedium(medium), `${medium} should not count as photographic`)
  }
})

test('the deterministic fallback leans photographic rather than refusing a photograph', () => {
  const summaries = normalizeCoverSummaries([], sourceReferences)
  const direction = buildFallbackArtDirection(summaries, sourceReferences)

  assert.equal(direction.medium, 'photographic scene')
  assert.match(direction.prompt, /photographic scene/i)
  assert.doesNotMatch(direction.prompt, /do not default to a generic photograph/i)
})

test('classifies night, dusk, and stage lighting as low light', () => {
  for (const lighting of [
    'night under practical lights',
    'dusk under practical bulbs',
    'stormy dusk sky',
    'dark interior, glowing window',
    'neon after-hours club',
    'candlelit cellar',
    'low-key stage spotlight'
  ]) {
    assert.ok(isLowLight(lighting), `${lighting} should count as low light`)
  }
})

test('daylight, overcast, and high-key studio light are not low light', () => {
  for (const lighting of [
    'midday sun through high windows',
    'bright overcast seafront',
    'golden hour exterior',
    'high-key studio',
    'open shade on a sunny afternoon',
    '',
    null
  ]) {
    assert.ok(!isLowLight(lighting), `${lighting} should not count as low light`)
  }
})

test('records the chosen lighting and falls back to daylight when it is missing', () => {
  const summaries = normalizeCoverSummaries([], sourceReferences)
  const chosen = normalizeArtDirection({ lighting: 'golden hour exterior', prompt: 'A pier.' }, summaries, sourceReferences)
  const missing = normalizeArtDirection({ prompt: 'A pier.' }, summaries, sourceReferences)

  assert.equal(chosen.lighting, 'golden hour exterior')
  assert.equal(missing.lighting, 'bright daylight')
  assert.match(buildFallbackArtDirection(summaries, sourceReferences).prompt, /bright, open daylight/i)
})

test('refuses the last few lighting set-ups, collapsed and newest first', () => {
  const block = buildLightingBlock([
    'bright overcast pool light',
    'bright overcast afternoon',
    'afternoon skylight and sun',
    'Bright overcast afternoon',
    'late morning window daylight'
  ])

  assert.match(block, /must not be repeated/i)
  assert.match(block, /- bright overcast pool light\n- bright overcast afternoon\n- afternoon skylight and sun/)
  assert.doesNotMatch(block, /Bright overcast afternoon/, 'case-only repeats collapse')
  assert.doesNotMatch(block, /late morning window daylight/, `only the last ${LIGHTING_REPEAT_WINDOW} weeks are refused`)
  assert.match(block, /materially different set-up inside the setting you choose/)
  assert.doesNotMatch(block, /Bright light is still the default/, 'the bright-only menu is gone')
})

test('the lighting block no longer forces daylight after a low-light cover', () => {
  const block = buildLightingBlock(['dusk under practical bulbs', 'night under practical lights'])

  assert.doesNotMatch(block, /must be lit by daylight/i)
  assert.match(block, /- dusk under practical bulbs\n- night under practical lights/)
})

test('reads the setting family from the field, or from old lighting phrases', () => {
  assert.equal(settingFamily('Interior'), 'interior')
  assert.equal(settingFamily('studio set', 'hard midday sun'), 'studio', 'an explicit setting wins')
  assert.equal(settingFamily('', 'hard midday sun'), 'exterior')
  assert.equal(settingFamily(null, 'bright overcast rooftop daylight'), 'exterior')
  assert.equal(settingFamily(null, 'sunlight through tall windows'), 'interior')
  assert.equal(settingFamily(null, 'high-key studio'), 'studio')
  assert.equal(settingFamily(null, 'night under neon'), 'night')
  assert.equal(settingFamily(null, ''), '')
})

test('refuses a setting used twice running or three times in five, and night twice in a row', () => {
  assert.deepEqual(refusedSettings(['exterior', 'exterior', 'interior']), ['exterior'])
  assert.deepEqual(refusedSettings(['interior', 'exterior', 'studio', 'exterior', 'exterior']), ['exterior'])
  assert.deepEqual(refusedSettings(['night', 'exterior', 'interior']), ['night'])
  assert.deepEqual(refusedSettings(['interior', 'exterior', 'studio']), [])
  assert.deepEqual(refusedSettings([]), [])
})

test('the setting block offers all four families and names the refused and unused ones', () => {
  const block = buildSettingBlock(['exterior', 'exterior', 'interior', 'interior', 'exterior'])
  for (const family of ['exterior', 'interior', 'studio', 'night']) assert.match(block, new RegExp(`- ${family}:`))
  assert.match(block, /None of them is the default/)
  // Example places turned the families into a menu: bar, seamless studio, the same bar again.
  assert.doesNotMatch(block, /\b(bar|kitchen|launderette|seamless|backdrop|rooftop|seafront|shopfront)\b/i)
  assert.doesNotMatch(buildLightingBlock(['hard midday sun']), /\b(bar|kitchen|softbox|seamless|tungsten|club)\b/i)
  assert.doesNotMatch(buildCompositionBlock([]), /\b(bar|shopfront|stage)\b/i)
  assert.match(block, /must not be "exterior"/)
  assert.match(block, /Not used recently: studio, night/)
  assert.doesNotMatch(buildSettingBlock([]), /must not be/)
})

test('records the chosen setting, read from the lighting when the director omits it', () => {
  const summaries = normalizeCoverSummaries([], sourceReferences)
  assert.equal(normalizeArtDirection({ prompt: 'x', setting: 'night', lighting: 'street lamps' }, summaries, sourceReferences).setting, 'night')
  assert.equal(normalizeArtDirection({ prompt: 'x', lighting: 'window light across a bar' }, summaries, sourceReferences).setting, 'interior')
  assert.equal(normalizeArtDirection({ prompt: 'x' }, summaries, sourceReferences).setting, 'exterior')
})

test('no lighting history means no lighting block', () => {
  assert.equal(buildLightingBlock([]), '')
  assert.equal(buildLightingBlock([null, '  ']), '')
})

test('a Year in Music prompt allows exactly the year and builds it into the scene', () => {
  const summaries = normalizeCoverSummaries([], sourceReferences)
  const direction = normalizeArtDirection({
    concept: 'Rooftop record yard',
    yearTreatment: 'digits stacked from vinyl crates on a rooftop',
    prompt: 'A rooftop record yard in hard midday sun.'
  }, summaries, sourceReferences, { year: '2025' })
  const prompt = buildGenerationPrompt(direction, summaries, { year: 2025 })

  assert.equal(direction.yearTreatment, 'digits stacked from vinyl crates on a rooftop')
  assert.match(prompt, /The year "2025" appears exactly once as digits stacked from vinyl crates on a rooftop/)
  assert.match(prompt, /only lettering anywhere in the image is the year "2025"/)
  assert.match(prompt, /spelled exactly 2 0 2 5/)
  // The first year cover painted the digits small and foreshortened on the floor; scale,
  // placement, and viewpoint are now restated by code rather than left to the art director.
  assert.match(prompt, /dominant subject and the first thing the eye reads/)
  assert.match(prompt, /at least half the width of the frame/)
  assert.match(prompt, /no other words, letters, numbers, dates/)
  assert.doesNotMatch(prompt, /Include no readable text or lettering of any kind/, 'the blanket ban is swapped, not stacked')
})

test('weekly prompts keep the blanket text ban and carry no year', () => {
  const summaries = normalizeCoverSummaries([], sourceReferences)
  const direction = normalizeArtDirection({ prompt: 'A pier at noon.' }, summaries, sourceReferences)
  const prompt = buildGenerationPrompt(direction, summaries)

  assert.equal(direction.yearTreatment, null)
  assert.match(prompt, /Include no readable text or lettering of any kind/)
  assert.doesNotMatch(prompt, /The year "/)
})

test('a missing year treatment falls back to a physical one, never an overlay', () => {
  const summaries = normalizeCoverSummaries([], sourceReferences)
  const fallback = buildFallbackArtDirection(summaries, sourceReferences, { year: '2023' })
  assert.match(fallback.prompt, /year 2023 as huge freestanding digits/)
  assert.equal(normalizeArtDirection({ prompt: 'x' }, summaries, sourceReferences, { year: '2023' }).yearTreatment, fallback.yearTreatment)
})

test('the year brief refuses overlays and recent treatments case-insensitively', () => {
  assert.equal(buildYearBlock(''), '')
  assert.equal(normalizeYear('25'), '')
  assert.equal(normalizeYear(2024), '2024')

  const block = buildYearBlock('2022', ['Hedge maze digits', 'hedge maze digits', 'marquee bulbs'])
  assert.match(block, /physically exist inside the scene/)
  assert.match(block, /must not be a title overlay/)
  assert.match(block, /The year is the lead subject of this cover/)
  assert.match(block, /must open with the year/)
  assert.equal(block.match(/hedge maze digits/gi).length, 1)
  assert.match(block, /- marquee bulbs/)
})

test('always refuses the symmetrical tableau and lists only the recent compositions', () => {
  const block = buildCompositionBlock([
    'low angle, lone figure off-centre',
    'Low angle, lone figure off-centre',
    'top-down over a crowded floor',
    'long lens through a doorway',
    'close cropped interior',
    'wide elevated frontal tableau'
  ])
  assert.match(block, /symmetrical tableau/)
  assert.equal(block.match(/low angle, lone figure off-centre/gi).length, 1, 'repeats collapse')
  assert.doesNotMatch(block, /wide elevated frontal tableau/, `only the last ${COMPOSITION_REPEAT_WINDOW} are refused`)
  assert.match(buildCompositionBlock([]), /symmetrical tableau/)
  assert.doesNotMatch(buildCompositionBlock([]), /most recent covers/)
})

test('hard constraints refuse incidental plants and sleeve murals', () => {
  const prompt = buildGenerationPrompt({ prompt: 'A stone courtyard at noon.' }, [])
  assert.match(prompt, /no flowers, potted plants/)
  assert.match(prompt, /framed thumbnails, posters, record covers/)
  assert.match(prompt, /may be painted onto the walls, doors, floor/, 'sleeve graphics on surfaces are allowed')
  assert.match(prompt, /faces, heads, or figures as a picture, mural/, 'pictures of sleeve people are not')
})

test('records the chosen composition, with a fallback when the director omits it', () => {
  const summaries = normalizeCoverSummaries([], [{ source: 1, filename: 'a.png', album: 'A' }])
  const refs = [{ source: 1, filename: 'a.png', album: 'A' }]
  assert.equal(normalizeArtDirection({ prompt: 'x', composition: 'top-down over a floor' }, summaries, refs).composition, 'top-down over a floor')
  assert.ok(normalizeArtDirection({ prompt: 'x' }, summaries, refs).composition)
})

test('reads the moderation flag as empty unless the summary gives a reason', () => {
  assert.equal(normalizeModerationRisk('none'), '')
  assert.equal(normalizeModerationRisk('None.'), '')
  assert.equal(normalizeModerationRisk(undefined), '')
  assert.equal(normalizeModerationRisk(false), '')
  assert.equal(normalizeModerationRisk(true), 'flagged')
  assert.equal(normalizeModerationRisk('women in lingerie-style outfits'), 'women in lingerie-style outfits')
})

test('drops flagged sleeves and renumbers the rest to match the attached order', () => {
  const summaries = normalizeCoverSummaries([
    { source: 1, description: 'a purple shape', moderationRisk: 'none' },
    { source: 2, description: 'models posed round a film camera', moderationRisk: 'women in lingerie-style outfits in suggestive poses' },
    { source: 3, description: 'pigeons over flats' }
  ], [
    { source: 1, filename: 'a.jpg', album: 'A' },
    { source: 2, filename: 'zz.jpg', album: 'Greatest Hits' },
    { source: 3, filename: 'c.jpg', album: 'C' }
  ])
  const { kept, keepIndexes, dropped } = dropModerationRisks(summaries)
  assert.deepEqual(keepIndexes, [0, 2])
  assert.deepEqual(kept.map(item => [item.source, item.filename]), [[1, 'a.jpg'], [2, 'c.jpg']])
  assert.deepEqual(dropped.map(item => item.filename), ['zz.jpg'])
})

test('keeps every sleeve rather than fall below the minimum', () => {
  const summaries = [
    { source: 1, filename: 'a.jpg', moderationRisk: 'x' },
    { source: 2, filename: 'b.jpg', moderationRisk: '' }
  ]
  const { kept, dropped } = dropModerationRisks(summaries, { minKeep: 2 })
  assert.equal(kept.length, 2)
  assert.equal(dropped.length, 0)
})

const CAST_SUMMARIES = [
  { source: 1, people: 'none' },
  { source: 2, people: 'four people standing together' },
  { source: 3, people: 'one woman crouching in a box' },
  { source: 4, people: 'one man with head bowed' }
]

test('keeps the cast to sources with people, deduped and capped', () => {
  assert.deepEqual(normalizeCast([1, 3, '3', 2, 4], CAST_SUMMARIES), [3, 2])
  assert.equal(normalizeCast([2, 3, 4], CAST_SUMMARIES).length, MAX_CAST)
  assert.deepEqual(normalizeCast(undefined, CAST_SUMMARIES), [])
})

test('the reference map names only the cast and excludes the rest', () => {
  const map = buildReferenceMap(CAST_SUMMARIES, [3])
  assert.match(map, /reference image 3 shows one woman/)
  assert.doesNotMatch(map, /reference image 2 shows/)
  assert.match(map, /Nobody from reference images 2, 4 appears/)
  assert.match(buildReferenceMap(CAST_SUMMARIES), /reference image 2 shows.*reference image 4 shows/, 'no cast keeps every person')
})

test('spots people from uncast sources in the prompt', () => {
  const prompt = 'The woman from reference image 3 crouches in an alcove; the man from reference image 4 bows by a cross; pigeons from reference image 1 wheel overhead.'
  assert.deepEqual(findUncastPeople(prompt, [3], CAST_SUMMARIES), [4])
  assert.deepEqual(findUncastPeople(prompt, [3, 4], CAST_SUMMARIES), [])
})

test('every person is lit by the scene, not the sleeve', () => {
  assert.match(buildGenerationPrompt({ prompt: 'x' }, []), /same light as the rest of the scene/)
})

test('reads the people box and face height from the summary, tolerating percentages', () => {
  const [summary] = normalizeCoverSummaries([
    { source: 1, people: 'two men side by side', peopleBox: [55, 20, 85, 45], faceHeight: 8 }
  ], [{ source: 1, filename: 'psb.jpg', album: 'Discography' }])
  assert.deepEqual(summary.peopleBox, [0.55, 0.2, 0.85, 0.45])
  assert.equal(summary.faceHeight, 0.08)
  const [none] = normalizeCoverSummaries([{ source: 1, people: 'none', peopleBox: null, faceHeight: 0 }], [{ source: 1, filename: 'x.jpg' }])
  assert.equal(none.peopleBox, null)
  assert.equal(none.faceHeight, null)
})

test('faces too small to copy are not castable; unmeasured ones still are', () => {
  assert.equal(isCastable({ source: 1, people: 'a crowd', faceHeight: MIN_CASTABLE_FACE / 2 }), false)
  assert.equal(isCastable({ source: 1, people: 'two men', faceHeight: 0.08 }), false, 'the 16 Nov 2026 compilation sleeve')
  assert.equal(isCastable({ source: 1, people: 'two men', faceHeight: 0.3 }), true)
  assert.equal(isCastable({ source: 1, people: 'two men', faceHeight: null }), true)
  assert.deepEqual(normalizeCast([1, 2], [
    { source: 1, people: 'a crowd', faceHeight: 0.02 },
    { source: 2, people: 'one woman', faceHeight: 0.3 }
  ]), [2])
})

test('small cast faces get a padded close-up box; large ones do not', () => {
  const box = closeUpBox({ peopleBox: [0.5, 0.2, 0.9, 0.5], faceHeight: 0.08 })
  assert.ok(box[0] < 0.5 && box[1] < 0.2 && box[2] > 0.9 && box[3] > 0.5)
  assert.ok(box.every(value => value >= 0 && value <= 1))
  assert.equal(closeUpBox({ peopleBox: [0.1, 0.1, 0.9, 0.9], faceHeight: CLOSE_UP_BELOW + 0.1 }), null)
  assert.equal(closeUpBox({ peopleBox: null, faceHeight: 0.05 }), null)
})

test('the reference map points the cast at their close-up', () => {
  const map = buildReferenceMap([{ source: 6, people: 'two men side by side' }], [6], [{ source: 6, reference: 9 }])
  assert.match(map, /reference image 9 is an enlarged close-up of those same people - take their faces from reference image 9/)
})

test('corridors, underpasses, and doorway views count as one passage family', () => {
  for (const value of ['through doorway, deep diagonal view', 'low angle through underpass opening', 'view through doorway, diagonal depth', 'school hallway at dawn', 'loading bay looking out']) {
    assert.equal(isPassage(value), true, value)
  }
  for (const value of ['top-down over a crowded floor', 'low angle, lone figure off-centre', 'wide beach, figures small']) {
    assert.equal(isPassage(value), false, value)
  }
})

test('a recent passage cover refuses the whole family, and the menu no longer offers doorways', () => {
  assert.doesNotMatch(buildCompositionBlock([]), /for example[^.]*through a doorway/)
  assert.doesNotMatch(buildCompositionBlock([]), /must not be set in or framed through a corridor/)
  assert.match(buildCompositionBlock(['top-down over a market', 'view through doorway, diagonal depth']), /must not be set in or framed through a corridor/)
})

test('catches sleeves written in as murals, backdrops, and painted panels', () => {
  const prompt = 'A bright studio room with a painted concrete floor; a large freestanding painted green circular backdrop from reference image 1; a metallic robotic skull head from reference image 3 on a stand; a neon-green skeleton from reference image 4 rendered as a painted wall mural under the real hoop. Behind the band, a real painted panel carries the burst motif from reference image 6, adapted as venue decor.'
  assert.deepEqual(findFlatCopies(prompt), [1, 4, 6])
})

test('leaves real objects, materials, and unreferenced paint alone', () => {
  const prompt = 'A low angle on a car park with freshly painted white lines; a glossy purple sculpture shaped like the form from reference image 2 rests on a crate; the woman from reference image 5 wears the orange and red of reference image 1 as a silk shirt.'
  assert.deepEqual(findFlatCopies(prompt), [])
})

test('catches sleeve faces shown on a screen or as a cut-out sign', () => {
  // From the 5 Oct 2026 redo: the Man-Machine sleeve on a monitor and a portrait as a sign.
  const prompt = 'A repair kiosk at midday. The counter holds a gray computer terminal from reference image 6, its screen showing four stylized yellow-green heads on a black field. Fold in reference image 2 through red cables and one hanging black profile-shaped sign.'
  assert.equal(findPicturedFigures(prompt).length, 2)
})

test('leaves real screens, signs, and people near them alone', () => {
  const prompt = 'A bright rooftop at noon; a freestanding matte-black geometric cutout structure rises beside the water tank. The man from reference image 3 leans on a railing near a blank sign, and a small television glows blue on a crate.'
  assert.deepEqual(findPicturedFigures(prompt), [])
})

test('catches a cast person looming at the frame edge or washed in coloured light', () => {
  // From the 7 Sep 2026 redo, which read as two pictures stuck together.
  const prompt = 'A disused desert airstrip; in the extreme right foreground, the young man from reference image 1 appears shoulders-up, strongly tinted by real red light. Far off, a rider crosses the dust.'
  assert.deepEqual(findLoomingCast(prompt, [1]), [1])
  assert.deepEqual(findLoomingCast(prompt, [2]), [], 'only cast sources count')
  assert.deepEqual(findLoomingCast('The band from reference image 4 stands on the court in bright midday sun.', [4]), [])
})

test('reads camera height from a composition and refuses a repeated one', () => {
  assert.equal(cameraHeight('low angle, diagonal action'), 'low')
  assert.equal(cameraHeight('ground-level side view, wide frame'), 'low')
  assert.equal(cameraHeight('high vantage over open hangar'), 'high')
  assert.equal(cameraHeight('telephoto rooftop view, stacked layers'), '')
  assert.equal(overusedCameraHeight(['low angle, close subject left', 'telephoto rooftop', 'low angle, counter corner crop']), 'low')
  assert.equal(overusedCameraHeight(['low angle', 'eye-level face-on', 'high angle over counter']), '')
  assert.match(buildCompositionBlock(['low angle, off-centre figure', 'low angle, diagonal action']), /must not be: no low angle/)
  assert.doesNotMatch(buildCompositionBlock(['face-on room interior', 'low angle, off-centre figure']), /must not be: no low angle/)
})

test('children and large groups with small faces are never cast', () => {
  const [girl, group, duo] = normalizeCoverSummaries([
    { source: 1, people: 'one young girl leaning forward', peopleCount: 1, minors: true, faceHeight: 0.24 },
    { source: 2, people: 'five young men in a living room', peopleCount: 5, minors: false, faceHeight: 0.11 },
    { source: 3, people: 'two men side by side', peopleCount: 2, minors: 'false', faceHeight: 0.4 }
  ], [1, 2, 3].map(source => ({ source, filename: `${source}.jpg`, album: `Album ${source}` })))
  assert.match(uncastableReason(girl), /child/)
  assert.match(uncastableReason(group), /large group/)
  assert.equal(uncastableReason(duo), '')
  assert.deepEqual(normalizeCast([1, 2, 3], [girl, group, duo]), [3])
})

test('ranks sleeves by what is in them, not by pixels', () => {
  const duo = { people: 'two men', peopleCount: 2, faceHeight: 0.4, strength: 4 }
  const black = { people: 'none', strength: 1 }
  // The portrait was played least and has the worse pixel score; it still wins.
  assert.ok(contentScore(duo, { rank: 9, pixelScore: 29 }) > contentScore(black, { rank: 5, pixelScore: 40 }))
  assert.ok(contentScore({ people: 'none', strength: 5 }) > contentScore({ people: 'none', strength: 2 }))
  assert.ok(contentScore({ people: 'none' }, { rank: 0 }) > contentScore({ people: 'none' }, { rank: 6 }), 'play rank separates ties')
})

test('a small cast gets one close-up per face, left to right; otherwise the group crop', () => {
  const summary = { people: 'two men', peopleCount: 2, faceHeight: 0.12, peopleBox: [0.2, 0.2, 0.8, 0.6], faceBoxes: [[0.6, 0.25, 0.7, 0.4], [0.3, 0.25, 0.4, 0.4]] }
  const boxes = closeUpBoxes(summary)
  assert.equal(boxes.length, 2)
  assert.ok(boxes[0][0] < boxes[1][0], 'sorted left to right')
  assert.ok(boxes[1][0] < 0.6 && boxes[1][2] > 0.7, 'padded round the face')
  assert.equal(closeUpBoxes({ ...summary, faceBoxes: [summary.faceBoxes[0]] }).length, 1, 'a missing face falls back to the group')
  assert.deepEqual(closeUpBoxes({ ...summary, faceBoxes: [summary.faceBoxes[0]] })[0], closeUpBox(summary))
  assert.deepEqual(closeUpBoxes({ ...summary, faceHeight: 0.4 }), [])
  const map = buildReferenceMap([{ source: 2, people: 'two men' }], [2], [{ source: 2, reference: 9 }, { source: 2, reference: 10 }])
  assert.match(map, /reference images 9, 10 are enlarged close-ups of those same people, one face each from left to right/)
})

test('a cast is never shot from above or from far away', () => {
  assert.equal(isDistantCast({ cast: [1], composition: 'top-down over concrete apron', prompt: 'x' }), true)
  assert.equal(isDistantCast({ cast: [1], composition: 'eye level, off-centre', prompt: 'Almost straight down from above onto a loading apron. The men stand in a line.' }), true)
  assert.equal(isDistantCast({ cast: [], composition: 'top-down over concrete apron', prompt: 'x' }), false, 'fine with nobody in it')
  assert.equal(isDistantCast({ cast: [2], composition: 'face-on room, subject right', prompt: 'A bar at eye level under overhead lamps.' }), false)
  const prompt = buildGenerationPrompt({ prompt: 'A bar.', cast: [2] }, [{ source: 2, people: 'two men' }])
  assert.match(prompt, /three-quarter length or closer/)
})

test('one or two sleeves lead, a few support, and the rest lend colour', () => {
  const roles = list => list.map((role, index) => ({ source: index + 1, role, element: 'x' }))
  assert.deepEqual(findHierarchyProblems(roles(['lead', 'support', 'support', 'colour', 'colour']), 8), [])
  assert.match(findHierarchyProblems(roles(['lead', 'colour', 'colour', 'colour']), 8)[0], /one sleeve restaged/)
  assert.match(findHierarchyProblems(roles(['lead', 'support', 'support', 'support', 'support', 'support']), 8)[0], /prop shop/)
  assert.match(findHierarchyProblems(roles(['lead', 'lead', 'lead', 'support', 'support']), 8)[0], /at most 2 may/)
  assert.match(findHierarchyProblems(roles(['support', 'support']), 8)[0], /no source leads/)
  assert.deepEqual(findHierarchyProblems(roles(['lead', 'support']), 2), [], 'a two-sleeve week needs one support')
  assert.deepEqual(findHierarchyProblems([{ source: 1, element: 'x' }], 8), [], 'briefs without roles are not judged')
  const direction = normalizeArtDirection({ prompt: 'x', elements: [{ source: 1, role: 'Lead', element: 'a man' }, { source: 2, role: 'palette only', element: 'blue' }] }, normalizeCoverSummaries([], sourceReferences), sourceReferences)
  assert.deepEqual(direction.elements.map(item => item.role), ['lead', 'colour'])
})

test('supports are counted by sleeve, and a lead sleeve cannot also fill them', () => {
  // The first 16 Nov render under the hierarchy: three "supports" from the sleeve already leading.
  const elements = [
    { source: 1, role: 'lead' }, { source: 5, role: 'lead' },
    { source: 5, role: 'support' }, { source: 5, role: 'support' }, { source: 4, role: 'support' }
  ]
  assert.match(findHierarchyProblems(elements, 8)[0], /only 1 source besides the lead/)
  assert.deepEqual(findHierarchyProblems([...elements, { source: 3, role: 'support' }], 8), [])
})

test('catches lettering the director writes into its own prompt', () => {
  assert.equal(findLettering('A studio set. Black tattoo-style lettering is painted across a bare plaster panel leaning near the edge.').length, 1)
  assert.deepEqual(findLettering('A studio set with a guitar by the door; no lettering or signage anywhere.'), [])
  assert.deepEqual(findLettering('The man raises a glass beside a worn globe.'), [])
})

test('a sleeve keeps its place even when its people cannot be cast', () => {
  const [room, graphic] = normalizeCoverSummaries([
    { source: 1, people: 'five men posed around a living room', peopleCount: 5, faceHeight: 0.11, place: 'a bay-windowed living room with bare floorboards and a fireplace' },
    { source: 2, people: 'none', place: 'None' }
  ], sourceReferences)
  assert.equal(isCastable(room), false)
  assert.equal(hasPlace(room), true)
  assert.match(room.place, /living room/)
  assert.equal(hasPlace(graphic), false)
  assert.equal(graphic.place, '')
})

test('nobody appears except the cast, and hidden sleeve figures are not completed', () => {
  const summaries = [{ source: 1, people: 'two people, one man in front and one partially hidden drummer behind' }]
  const withCast = buildGenerationPrompt({ prompt: 'A rehearsal set.', cast: [1] }, summaries)
  assert.match(withCast, /The only people anywhere in the image are the reference people/)
  assert.match(withCast, /Never complete a person who is hidden, cropped, turned away/)
  const noCast = buildGenerationPrompt({ prompt: 'An empty rehearsal set.', cast: [] }, summaries)
  assert.match(noCast, /The image contains no people at all/)
  assert.doesNotMatch(noCast, /three-quarter length or closer/)

  assert.equal(findExtraPeople('The man from reference image 1 stands at the bar. A bartender polishes glasses behind him.').length, 1)
  assert.equal(findExtraPeople('A small crowd gathers at the back of the room.').length, 1)
  assert.deepEqual(findExtraPeople('Controlled studio photography, no collage, no extra people.'), [])
  assert.deepEqual(findExtraPeople('The singer from reference image 2 leans on an amp beside a drum kit.'), [])
})
