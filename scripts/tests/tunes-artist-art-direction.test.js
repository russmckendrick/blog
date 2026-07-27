import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildArtistDirectionRequestText,
  buildArtistGenerationPrompt,
  buildArtistSummaryRequestText,
  normalizeArtistDirection,
  normalizeArtistSummaries
} from '../lib/tunes-artist-art-direction.js'

const sourceReferences = [
  { source: 1, filename: 'first-artist.jpg', artist: 'First Artist' },
  { source: 2, filename: 'second-band.jpg', artist: 'Second Band' },
  { source: 3, filename: 'third-artist.jpg', artist: 'Third Artist' }
]

test('explicitly requests JSON in both artist Responses API input messages', () => {
  assert.match(buildArtistSummaryRequestText(3, 'source 1: first.jpg'), /json/i)
  assert.match(buildArtistDirectionRequestText('', 'Source 1'), /json/i)
})

test('keeps one factual artist summary per source', () => {
  const summaries = normalizeArtistSummaries([
    {
      source: 1,
      description: 'One adult in a close studio portrait.',
      primarySubject: 'adult with short dark hair and round glasses',
      visiblePeople: ['one adult'],
      wardrobe: 'black jacket',
      photoStyle: 'high-contrast studio portrait'
    }
  ], sourceReferences)

  assert.equal(summaries.length, 3)
  assert.equal(summaries[0].primarySubject, 'adult with short dark hair and round glasses')
  assert.match(summaries[1].description, /no reliable visual description/)
})

test('normalizes an exact distinct cast and autonomous art direction', () => {
  const summaries = normalizeArtistSummaries([], sourceReferences)
  const direction = normalizeArtistDirection({
    selection: [3, 3, 2],
    concept: 'Rainy station-platform conversation',
    creativeDirection: 'Candid medium-format night photography',
    scene: 'Three musicians wait together beneath a station canopy.',
    castPlan: [
      { source: 3, person: 'the long-haired adult', placement: 'nearest the camera' },
      { source: 2, person: 'the bespectacled adult', placement: 'under the canopy light' }
    ],
    palette: ['navy', 'amber'],
    mood: 'quietly electric',
    prompt: 'Source 3 stands nearest the camera while source 2 turns toward them.'
  }, summaries, sourceReferences, 2)

  assert.deepEqual(direction.selection, [3, 2])
  assert.equal(direction.cast.length, 2)
  assert.equal(direction.creativeDirection, 'Candid medium-format night photography')
})

test('final artist prompt remaps references and forbids duplicates and extra people', () => {
  const prompt = buildArtistGenerationPrompt({
    prompt: 'Source 3 stands nearest the camera while source 2 turns toward them.',
    cast: [
      { source: 3, person: 'the long-haired adult', placement: 'nearest the camera' },
      { source: 2, person: 'the bespectacled adult', placement: 'under the canopy light' }
    ]
  }, [3, 2])

  assert.match(prompt, /attached reference image 1 stands nearest/)
  assert.match(prompt, /attached reference image 2 turns toward/)
  assert.match(prompt, /Attached reference image 1: portray only the long-haired adult/)
  assert.match(prompt, /each selected person exactly once/i)
  assert.match(prompt, /reflection, mirror portrait, poster, billboard/i)
  assert.match(prompt, /exactly one adult from each attached reference image/i)
  assert.match(prompt, /no one else/i)
})
