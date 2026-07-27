import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildArtDirectionRequestText,
  buildCoverSummaryRequestText,
  buildGenerationPrompt,
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
  assert.match(prompt, /each identifiable reference person only once/i)
  assert.match(prompt, /reflection, mirror portrait, poster, billboard/i)
  assert.doesNotMatch(prompt, /creative-direction lane/i)
})
