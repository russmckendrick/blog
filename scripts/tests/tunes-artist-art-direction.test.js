import assert from 'node:assert/strict'
import test from 'node:test'
import {
  artistCloseUpBox,
  castableSources,
  isCastableArtist,
  buildArtistDirectionRequestText,
  buildFallbackArtistDirection,
  buildArtistGenerationPrompt,
  buildArtistSummaryRequestText,
  designArtistArtDirection,
  normalizeArtistDirection,
  normalizeArtistSummaries,
  summarizeArtistPhotos
} from '../lib/tunes-artist-art-direction.js'

const sourceReferences = [
  { source: 1, filename: 'first-artist.jpg', artist: 'First Artist' },
  { source: 2, filename: 'second-band.jpg', artist: 'Second Band' },
  { source: 3, filename: 'third-artist.jpg', artist: 'Third Artist' }
]

function completeSummaryResponse() {
  return {
    status: 'completed',
    incomplete_details: null,
    output: [],
    output_text: JSON.stringify({
      sources: sourceReferences.map(reference => ({
        source: reference.source,
        description: `One adult is visible in source ${reference.source}.`,
        primarySubject: `the adult in source ${reference.source}`,
        visiblePeople: ['one adult'],
        wardrobe: 'dark clothing',
        photoStyle: 'editorial portrait',
        setting: `visible physical setting for source ${reference.source}`,
        settingStrength: reference.source === 2 ? 'strong' : 'weak'
      }))
    })
  }
}

function mockOpenAI(responses) {
  const calls = []
  return {
    calls,
    client: {
      responses: {
        async create(options) {
          calls.push(options)
          const response = responses.shift()
          if (response instanceof Error) throw response
          return response
        }
      }
    }
  }
}

function completeDirectionResponse() {
  return {
    status: 'completed',
    output: [],
    output_text: JSON.stringify({
      selection: [1, 3],
      locationSource: 2,
      locationEvidence: 'Source 2 shows a distinctive tiled railway platform and canopy.',
      concept: 'Tiled platform gathering',
      creativeDirection: 'Candid location-led editorial photography.',
      scene: 'The selected musicians gather on the tiled railway platform from source 2.',
      castPlan: [
        { source: 2, person: 'the adult from source 2', placement: 'beneath the original canopy' },
        { source: 1, person: 'the adult from source 1', placement: 'alongside them on the platform' }
      ],
      palette: ['weathered cream tiles', 'deep green metalwork'],
      mood: 'observational and grounded',
      prompt: 'Photograph the selected adults together on the tiled railway platform visible in source 2.'
    })
  }
}

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
      photoStyle: 'high-contrast studio portrait',
      setting: 'plain seamless backdrop',
      settingStrength: 'weak'
    }
  ], sourceReferences)

  assert.equal(summaries.length, 3)
  assert.equal(summaries[0].primarySubject, 'adult with short dark hair and round glasses')
  assert.match(summaries[1].description, /no reliable visual description/)
})

test('retries an incomplete summary response with a larger budget and strict structured output', async (t) => {
  t.mock.method(console, 'warn', () => {})
  const mock = mockOpenAI([
    {
      status: 'incomplete',
      incomplete_details: { reason: 'max_output_tokens' },
      output: [],
      output_text: ''
    },
    completeSummaryResponse()
  ])

  const summaries = await summarizeArtistPhotos({
    imageUrls: ['https://example.com/1.jpg', 'https://example.com/2.jpg', 'https://example.com/3.jpg'],
    sourceReferences,
    client: mock.client
  })

  assert.equal(summaries.length, 3)
  assert.equal(mock.calls.length, 2)
  assert.deepEqual(mock.calls.map(call => call.max_output_tokens), [6000, 10000])
  assert.equal(mock.calls[0].reasoning.effort, 'low')
  assert.equal(mock.calls[0].text.verbosity, 'low')
  assert.equal(mock.calls[0].text.format.type, 'json_schema')
  assert.equal(mock.calls[0].text.format.strict, true)
})

test('retries an empty completed summary response', async (t) => {
  t.mock.method(console, 'warn', () => {})
  const mock = mockOpenAI([
    {
      status: 'completed',
      incomplete_details: null,
      output: [],
      output_text: ''
    },
    completeSummaryResponse()
  ])

  const summaries = await summarizeArtistPhotos({
    imageUrls: ['https://example.com/1.jpg', 'https://example.com/2.jpg', 'https://example.com/3.jpg'],
    sourceReferences,
    client: mock.client
  })

  assert.equal(summaries.length, 3)
  assert.equal(mock.calls.length, 2)
})

test('surfaces a refusal without retrying or inventing summaries', async () => {
  const mock = mockOpenAI([{
    status: 'completed',
    incomplete_details: null,
    output_text: '',
    output: [{
      type: 'message',
      content: [{
        type: 'refusal',
        refusal: 'I cannot analyse these images.'
      }]
    }]
  }])

  await assert.rejects(
    summarizeArtistPhotos({
      imageUrls: ['https://example.com/1.jpg', 'https://example.com/2.jpg', 'https://example.com/3.jpg'],
      sourceReferences,
      client: mock.client,
      allowDegradedSummaries: false
    }),
    /response was refused: I cannot analyse these images/
  )
  assert.equal(mock.calls.length, 1)
})

test('fails closed after repeated empty summary responses', async (t) => {
  t.mock.method(console, 'warn', () => {})
  const emptyResponse = {
    status: 'completed',
    incomplete_details: null,
    output: [],
    output_text: ''
  }
  const mock = mockOpenAI([{ ...emptyResponse }, { ...emptyResponse }])

  await assert.rejects(
    summarizeArtistPhotos({
      imageUrls: ['https://example.com/1.jpg', 'https://example.com/2.jpg', 'https://example.com/3.jpg'],
      sourceReferences,
      client: mock.client,
      allowDegradedSummaries: false
    }),
    /failed after 2 attempts: response completed with empty output/
  )
  assert.equal(mock.calls.length, 2)
})

test('reattaches candidate photos and keeps the location photo out of the cast unless selected', async () => {
  const mock = mockOpenAI([completeDirectionResponse()])
  const imageUrls = [
    'https://example.com/first.jpg',
    'https://example.com/second.jpg',
    'https://example.com/third.jpg'
  ]
  const summaries = normalizeArtistSummaries([
    {
      source: 1,
      description: 'A tight portrait.',
      primarySubject: 'an adult with short hair',
      visiblePeople: ['one adult'],
      wardrobe: 'dark jacket',
      photoStyle: 'tight editorial crop',
      setting: 'plain blurred wall',
      settingStrength: 'weak'
    },
    {
      source: 2,
      description: 'An adult on a tiled railway platform.',
      primarySubject: 'an adult with round glasses',
      visiblePeople: ['one adult'],
      wardrobe: 'long coat',
      photoStyle: 'wide environmental portrait',
      setting: 'weathered tiled railway platform beneath a green metal canopy',
      settingStrength: 'strong'
    },
    {
      source: 3,
      description: 'An adult beside a partial brick wall.',
      primarySubject: 'an adult with long hair',
      visiblePeople: ['one adult'],
      wardrobe: 'denim jacket',
      photoStyle: 'medium portrait',
      setting: 'partial brick wall',
      settingStrength: 'moderate'
    }
  ], sourceReferences)

  const direction = await designArtistArtDirection({
    artistSummaries: summaries,
    sourceReferences,
    imageUrls,
    featureCount: 2,
    client: mock.client
  })

  assert.deepEqual(direction.selection, [1, 3])
  assert.equal(direction.locationSource, 2)
  assert.match(direction.locationSetting, /tiled railway platform/)
  assert.equal(mock.calls.length, 1)
  assert.match(mock.calls[0].instructions, /need not include "locationSource"/)
  assert.match(mock.calls[0].input[0].content[0].text, /Castable: yes/)
  assert.equal(mock.calls[0].text.format.type, 'json_schema')
  assert.equal(mock.calls[0].text.format.strict, true)
  assert.equal('temperature' in mock.calls[0], false)
  const content = mock.calls[0].input[0].content
  assert.deepEqual(
    content.filter(item => item.type === 'input_image').map(item => item.image_url),
    imageUrls
  )
})

test('deterministic artist direction uses the strongest uploaded setting', () => {
  const summaries = normalizeArtistSummaries([
    {
      source: 1,
      setting: 'plain wall',
      settingStrength: 'weak'
    },
    {
      source: 2,
      setting: 'distinctive tiled railway platform beneath an iron canopy',
      settingStrength: 'strong'
    },
    {
      source: 3,
      setting: 'partial backstage curtain',
      settingStrength: 'moderate'
    }
  ], sourceReferences)

  const direction = buildFallbackArtistDirection(summaries, sourceReferences, 2)

  assert.equal(direction.locationSource, 2)
  assert.deepEqual(direction.selection, [1, 2])
  assert.match(direction.prompt, /tiled railway platform/)
  assert.doesNotMatch(direction.prompt, /rehearsal room/i)

  const normalized = normalizeArtistDirection({
    selection: [1, 3],
    locationSource: 1,
    locationEvidence: 'Source 1 was requested despite its weak setting.',
    prompt: 'Create a group portrait.'
  }, summaries, sourceReferences, 2)
  assert.equal(normalized.locationSource, 2)
  assert.deepEqual(normalized.selection, [1, 3])
  assert.match(normalized.locationEvidence, /Source 2/)
  assert.match(normalized.prompt, /tiled railway platform/)
})

test('normalizes an exact distinct cast and autonomous art direction', () => {
  const summaries = normalizeArtistSummaries([], sourceReferences)
  const direction = normalizeArtistDirection({
    selection: [3, 3, 2],
    locationSource: 3,
    locationEvidence: 'Source 3 clearly shows a station platform and canopy.',
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
  assert.equal(direction.locationSource, 3)
  assert.equal(direction.cast.length, 2)
  assert.equal(direction.creativeDirection, 'Candid medium-format night photography')
})

test('final artist prompt remaps references and forbids duplicates and extra people', () => {
  const prompt = buildArtistGenerationPrompt({
    locationSource: 3,
    locationSetting: 'a rain-dark station platform beneath a metal canopy',
    prompt: 'Source 3 stands nearest the camera while source 2 turns toward them.',
    cast: [
      { source: 3, person: 'the long-haired adult', placement: 'nearest the camera' },
      { source: 2, person: 'the bespectacled adult', placement: 'under the canopy light' }
    ]
  }, [3, 2])

  assert.match(prompt, /attached reference image 1 stands nearest/)
  assert.match(prompt, /Attached reference image 3, the last one, is the sole authority for the physical setting/)
  assert.match(prompt, /the one cast member from that photo has their own cast reference/)
  assert.match(prompt, /not its camera distance/)
  assert.match(prompt, /Do not invent, replace, genericise, relocate, or combine this setting/)
  assert.match(prompt, /attached reference image 2 turns toward/)
  assert.match(prompt, /Attached reference image 1: portray only the long-haired adult/)
  assert.match(prompt, /each selected person exactly once/i)
  assert.match(prompt, /reflection, mirror portrait, poster, billboard/i)
  assert.match(prompt, /exactly one adult from each attached cast reference image/i)
  assert.match(prompt, /2 attached cast reference images \(images 1 to 2\) followed by one setting reference/)
  assert.match(prompt, /exactly 2 visible adults total, no more and no fewer/i)
  assert.match(prompt, /allow natural, source-grounded readable text or logos/i)
  assert.match(prompt, /do not add editorial captions, titles, credits, borders, or watermarks/i)
  assert.match(prompt, /no one else/i)
  assert.match(prompt, /FACE LOCK: copy each person's face from their reference as photographed/)
  assert.match(prompt, /Never invent a smile, grin, laugh/)
  assert.match(prompt, /single light of the location/)
  assert.match(prompt, /full natural colour, always/)
  assert.match(prompt, /Unify the group through bodies and placement, not faces/)
})

test('final artist prompt attaches an uncast location photo as a setting-only reference', () => {
  const prompt = buildArtistGenerationPrompt({
    locationSource: 2,
    locationSetting: 'a tiled railway platform',
    prompt: 'The two adults wait on the platform from source 2.',
    cast: [
      { source: 1, person: 'the short-haired adult', placement: 'by the bench' },
      { source: 3, person: 'the long-haired adult', placement: 'under the canopy' }
    ]
  }, [1, 3])

  assert.match(prompt, /Attached reference image 3, the last one, is the sole authority/)
  assert.match(prompt, /nobody visible in it appears in the portrait/)
  assert.match(prompt, /platform from attached reference image 3/)
  assert.match(prompt, /exactly 2 visible adults total/)
})

test('final artist prompt fails without a usable location source', () => {
  assert.throws(
    () => buildArtistGenerationPrompt({
      locationSetting: 'a tiled railway platform',
      prompt: 'Create a group portrait.'
    }, [1, 3]),
    /no usable location source/
  )
})

test('keeps photos with tiny faces out of the cast while larger ones exist', () => {
  const summaries = normalizeArtistSummaries([
    { source: 1, setting: 'concrete plaza seen from above', settingStrength: 'strong', faceHeight: 0.02 },
    { source: 2, setting: 'plain wall', settingStrength: 'weak', faceHeight: 0.4 },
    { source: 3, setting: 'plain wall', settingStrength: 'weak' }
  ], sourceReferences)

  assert.equal(isCastableArtist(summaries[0]), false)
  assert.equal(isCastableArtist(summaries[1]), true)
  assert.equal(isCastableArtist(summaries[2]), true)
  assert.deepEqual(castableSources(summaries, sourceReferences, 2), [2, 3])

  const direction = normalizeArtistDirection({
    selection: [1, 2],
    locationSource: 1,
    prompt: 'Create a group portrait.'
  }, summaries, sourceReferences, 2)
  assert.equal(direction.locationSource, 1)
  assert.deepEqual(direction.selection, [2, 3])

  // A thin week lets the tiny face back in rather than casting short.
  assert.deepEqual(castableSources(summaries, sourceReferences, 3), [1, 2, 3])
})

test('crops a cast member who is only part of their photo', () => {
  const [band, soloist, unlocated] = normalizeArtistSummaries([
    { source: 1, subjectBox: [0.4, 0.2, 0.6, 0.6] },
    { source: 2, visiblePeople: ['one adult'], subjectBox: [0.2, 0.05, 0.8, 0.9] },
    { source: 3, subjectBox: [0, 0, 0, 0] }
  ], sourceReferences)
  const [trio] = normalizeArtistSummaries([
    { source: 1, visiblePeople: ['adult 1', 'adult 2', 'adult 3'], subjectBox: [0.2, 0.05, 0.8, 0.9] }
  ], sourceReferences)

  const box = artistCloseUpBox(band)
  assert.deepEqual(box.map(value => Number(value.toFixed(2))), [0.37, 0.14, 0.63, 0.66])
  assert.equal(artistCloseUpBox(soloist), null)
  assert.notEqual(artistCloseUpBox(trio), null)
  assert.equal(unlocated.subjectBox, null)
  assert.equal(artistCloseUpBox(unlocated), null)
})
