import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildArtDirectionRequestText,
  buildLightingBlock,
  buildCoverSummaryRequestText,
  buildFallbackArtDirection,
  buildGenerationPrompt,
  buildReferenceMap,
  hasPeople,
  isLowLight,
  isPhotographicMedium,
  LIGHTING_REPEAT_WINDOW,
  normalizeArtDirection,
  normalizeCoverSummaries
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
  assert.match(prompt, /expose the image brightly/i)
  assert.match(prompt, /heavy film grain/i)
  assert.match(prompt, /each identifiable reference person only once/i)
  assert.match(prompt, /reflection, mirror portrait, poster, billboard/i)
  assert.doesNotMatch(prompt, /creative-direction lane/i)
  assert.doesNotMatch(prompt, /Reference map/i, 'no map when the factual pass saw nobody')
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
  assert.match(block, /Bright light is still the default/)
  assert.doesNotMatch(block, /previous cover was lit as/i, 'no forcing rule after a daylight cover')
})

test('a low-light previous cover forces daylight on top of the repeat list', () => {
  const block = buildLightingBlock(['dusk under practical bulbs', 'night under practical lights'])

  assert.match(block, /previous cover was lit as "dusk under practical bulbs"/i)
  assert.match(block, /must be lit by daylight/i)
  assert.match(block, /- dusk under practical bulbs\n- night under practical lights/)
})

test('no lighting history means no lighting block', () => {
  assert.equal(buildLightingBlock([]), '')
  assert.equal(buildLightingBlock([null, '  ']), '')
})
