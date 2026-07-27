import assert from 'node:assert/strict'
import test from 'node:test'
import {
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

test('reattaches candidate photos and forces the chosen location source into the cast first', async () => {
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

  assert.deepEqual(direction.selection, [2, 1])
  assert.equal(direction.locationSource, 2)
  assert.match(direction.locationSetting, /tiled railway platform/)
  assert.equal(mock.calls.length, 1)
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
  assert.deepEqual(direction.selection, [2, 1])
  assert.match(direction.prompt, /tiled railway platform/)
  assert.doesNotMatch(direction.prompt, /rehearsal room/i)

  const normalized = normalizeArtistDirection({
    selection: [1, 3],
    locationSource: 1,
    locationEvidence: 'Source 1 was requested despite its weak setting.',
    prompt: 'Create a group portrait.'
  }, summaries, sourceReferences, 2)
  assert.equal(normalized.locationSource, 2)
  assert.deepEqual(normalized.selection, [2, 1])
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
  assert.equal(direction.selection[0], direction.locationSource)
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
  assert.match(prompt, /Attached reference image 1 is the sole authority for the physical setting/)
  assert.match(prompt, /Do not invent, replace, genericise, relocate, or combine this setting/)
  assert.match(prompt, /attached reference image 2 turns toward/)
  assert.match(prompt, /Attached reference image 1: portray only the long-haired adult/)
  assert.match(prompt, /each selected person exactly once/i)
  assert.match(prompt, /reflection, mirror portrait, poster, billboard/i)
  assert.match(prompt, /exactly one adult from each attached reference image/i)
  assert.match(prompt, /no one else/i)
})

test('final artist prompt fails when the location anchor was removed from the retry cast', () => {
  assert.throws(
    () => buildArtistGenerationPrompt({
      locationSource: 2,
      locationSetting: 'a tiled railway platform',
      prompt: 'Create a group portrait.'
    }, [1, 3]),
    /does not include its required location source 2/
  )
})
