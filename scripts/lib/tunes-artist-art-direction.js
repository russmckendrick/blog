import OpenAI from 'openai'

const DEFAULT_PROMPT_MODEL = 'gpt-5.4'

const ARTIST_HARD_CONSTRAINTS = [
  'Create one cohesive photorealistic 16:9 group photograph in a single real-world scene, not a grid, contact sheet, row, montage, or collection of separate panels.',
  'Portray exactly one adult from each attached reference image and no one else; when a reference shows a band, use only the one specifically described cast member.',
  'Depict each selected person exactly once in the entire composition. Never duplicate or clone anyone as another figure, reflection, mirror portrait, poster, billboard, screen, photograph, painting, silhouette, or background face.',
  'Keep every selected person closely recognisable and faithful to their reference photo, preserving facial features, skin tone, hair, facial hair, eyewear, clothing, styling, and overall likeness.',
  'Do not invent, merge, blend, morph, or distort faces or bodies, and do not add a background crowd, extra limbs, or deformed hands.',
  'Frame the group close or medium-close so every face is large, sharp, unobstructed, and richly detailed.',
  'Include no readable text or lettering of any kind: no words, letters, numbers, code, glyphs, captions, titles, logos, watermarks, labels, or signage.'
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
    const photoStyle = String(item?.photoStyle || item?.photo_style || item?.setting || '').trim()

    return {
      source,
      filename: reference.filename,
      artist: reference.artist || '',
      description: description || `Reference ${source} is an artist photo; no reliable visual description was returned.`,
      primarySubject: primarySubject || `the most visually prominent adult in reference ${source}`,
      visiblePeople: cleanList(item?.visiblePeople || item?.visible_people || item?.people),
      wardrobe: wardrobe || 'wardrobe not confidently described',
      photoStyle: photoStyle || 'photographic treatment not confidently described'
    }
  })
}

function normalizeSelection(rawSelection, sourceReferences, featureCount) {
  const validSources = new Set(sourceReferences.map(reference => reference.source))
  const requested = (Array.isArray(rawSelection) ? rawSelection : [])
    .map(item => Number(item?.source ?? item))
    .filter(source => Number.isInteger(source) && validSources.has(source))
  const selection = [...new Set(requested)].slice(0, featureCount)

  for (const reference of sourceReferences) {
    if (selection.length >= featureCount) break
    if (!selection.includes(reference.source)) selection.push(reference.source)
  }
  return selection
}

function normalizeCastPlan(rawCast = [], selection = []) {
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
      person: item.person || `the selected adult from source ${source}`,
      placement: item.placement || 'placed naturally within the shared group'
    }
  })
}

export function buildFallbackArtistDirection(artistSummaries, sourceReferences, featureCount) {
  const selection = sourceReferences.slice(0, featureCount).map(reference => reference.source)
  const cast = selection.map(source => {
    const summary = artistSummaries.find(item => item.source === source)
    return {
      source,
      person: summary?.primarySubject || `the selected adult from source ${source}`,
      placement: 'gathered naturally with the other musicians'
    }
  })

  return {
    selection,
    concept: 'Musicians sharing a candid window-lit rehearsal break',
    creativeDirection: 'Naturalistic editorial photography with an intimate candid composition.',
    scene: 'A close, naturally arranged group of adult musicians sharing one candid moment in a softly window-lit rehearsal room.',
    cast,
    palette: ['natural skin tones', 'warm wood', 'soft daylight'],
    mood: 'relaxed, confident, and music-led',
    prompt: 'Create a close, candid editorial photograph of the selected adult musicians sharing a relaxed rehearsal-room break in soft window light. Arrange them at varied depths with natural interaction and an unforced visual hierarchy, preserving each person’s reference appearance and individual styling. Use true-to-life colour, real skin texture, gentle film grain, and a medium-close composition in which every face is clear and detailed.'
  }
}

export function normalizeArtistDirection(rawDirection, artistSummaries, sourceReferences, featureCount) {
  const fallback = buildFallbackArtistDirection(artistSummaries, sourceReferences, featureCount)
  const selection = normalizeSelection(
    rawDirection?.selection || rawDirection?.cast || rawDirection?.choose,
    sourceReferences,
    featureCount
  )
  const scene = String(rawDirection?.scene || rawDirection?.setting || fallback.scene).trim()
  const prompt = String(
    rawDirection?.prompt ||
    rawDirection?.imagePrompt ||
    rawDirection?.image_prompt ||
    rawDirection?.generationPrompt ||
    rawDirection?.generation_prompt ||
    ''
  ).trim()

  return {
    selection,
    concept: String(rawDirection?.concept || '').trim() || firstSentence(scene),
    creativeDirection: String(
      rawDirection?.creativeDirection ||
      rawDirection?.creative_direction ||
      rawDirection?.artDirection ||
      rawDirection?.art_direction ||
      fallback.creativeDirection
    ).trim(),
    scene,
    cast: normalizeCastPlan(rawDirection?.castPlan || rawDirection?.cast_plan || rawDirection?.subjects, selection),
    palette: cleanList(rawDirection?.palette, 6),
    mood: String(rawDirection?.mood || fallback.mood).trim(),
    prompt: prompt || fallback.prompt
  }
}

export async function summarizeArtistPhotos({ imageUrls, sourceReferences, debug }) {
  if (!openai) {
    if (debug) console.log('  No OPENAI_API_KEY found; using filename-based artist summaries')
    return normalizeArtistSummaries([], sourceReferences)
  }

  const sourceIndex = sourceReferences
    .map(reference => `source ${reference.source}: ${reference.filename}`)
    .join('\n')

  const instructions = `You are a factual visual analyst. You will receive numbered artist reference photos in source order.
Describe only what is visibly present in EACH photo. Record the number of visible adults, their distinguishing facial and physical features, hair, facial hair, eyewear, skin tone, wardrobe, pose, framing, setting, lighting, and photographic treatment.
For a group or band photo, "primarySubject" must factually describe the single most visually prominent adult well enough for another model to select that person later. Do not identify or name anyone, rank artistic merit, cast the final image, or invent a scene.
Ignore and never transcribe printed words, logos, labels, or branding.
Return JSON exactly as {"sources":[{"source":1,"description":"string","primarySubject":"string","visiblePeople":["string"],"wardrobe":"string","photoStyle":"string"}]}.
There must be exactly one item for every supplied source.`

  try {
    const response = await openai.responses.create({
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
      text: { format: { type: 'json_object' } },
      max_output_tokens: 2200,
      temperature: 0.2
    })

    const summaries = normalizeArtistSummaries(
      parseJSONResponse(response.output_text || '')?.sources,
      sourceReferences
    )
    if (debug) console.log(`  Artist summaries: ${JSON.stringify(summaries, null, 2)}`)
    return summaries
  } catch (error) {
    console.warn(`  OpenAI artist-photo summarisation failed: ${error.message}`)
    return normalizeArtistSummaries([], sourceReferences)
  }
}

export async function designArtistArtDirection({
  artistSummaries,
  sourceReferences,
  featureCount,
  hint = '',
  avoidConcepts = [],
  debug
}) {
  if (!openai) {
    if (debug) console.log('  No OPENAI_API_KEY found; using deterministic artist art direction')
    return buildFallbackArtistDirection(artistSummaries, sourceReferences, featureCount)
  }

  const hintBlock = hint ? `Author's steer: ${hint}` : ''
  const avoidBlock = avoidConcepts.length > 0
    ? `These concepts were used recently and must not be repeated. Choose a different location, central idea, framing, and lighting:\n${avoidConcepts.map(concept => `- ${concept}`).join('\n')}`
    : ''
  const summaryBlock = artistSummaries
    .map(summary => [
      `Source ${summary.source}`,
      `Description: ${summary.description}`,
      `Primary adult: ${summary.primarySubject}`,
      summary.visiblePeople.length > 0 ? `Visible people: ${summary.visiblePeople.join('; ')}` : '',
      `Wardrobe: ${summary.wardrobe}`,
      `Original photo: ${summary.photoStyle}`
    ].filter(Boolean).join('\n'))
    .join('\n\n')

  const instructions = `You are a portrait photographer's casting director and art director creating one original 16:9 group photograph for a weekly music blog.
You will receive factual visual-research summaries of artist photos. The selected original photos will be attached to the final image-generation call.

Choose exactly ${featureCount} distinct source numbers for "selection". Prefer an intimate, visually varied cast. Every selected source contributes exactly one adult; when a source shows a band, choose and describe only one specific adult from it.

Choose the complete photographic direction yourself from these visual findings alone: location, era, candid or posed behaviour, viewpoint, lens character, composition, depth, time of day, lighting, colour treatment, styling, and mood. Do not use or assume blog-post content and do not rotate through a hidden catalogue of preset shoot styles or colour treatments. Avoid a generic studio, industrial-loft promo, evenly spaced lineup, or crowd.

Plan one shared real-world moment with varied posture, depth, interaction, and attention. Treat each cast member as one unique identity and depict them exactly once. Never reuse someone as another figure, reflection, mirror portrait, poster, billboard, screen, photograph, painting, silhouette, or background face. Do not add unselected people.

The final "prompt" must be ready to send directly to a multi-reference image model. Make it a precise photorealistic photography prompt ordered as: scene and viewpoint; cast and behaviour; composition and lens; lighting; colour treatment and mood. Describe selected people by visible appearance rather than using source numbers in the final prompt, because only selected photos will be reattached in a new order. Mandatory likeness, duplication, text, layout, and quality constraints are appended by code.

${avoidBlock}

Return JSON exactly as {"selection":[1,2],"concept":"string","creativeDirection":"string","scene":"string","castPlan":[{"source":1,"person":"string","placement":"string"}],"palette":["string"],"mood":"string","prompt":"string"}.
"selection" contains exactly ${featureCount} distinct source numbers. "concept" is at most 15 words and is saved to do-not-repeat history. "creativeDirection" names the photographic approach in one sentence. "castPlan" has exactly one entry per selected source.`

  try {
    const response = await openai.responses.create({
      model: process.env.OPENAI_TUNES_ARTIST_DIRECTION_MODEL || process.env.OPENAI_TUNES_ARTIST_MODEL || process.env.OPENAI_TUNES_COVER_MODEL || process.env.OPENAI_MODEL || DEFAULT_PROMPT_MODEL,
      instructions,
      input: [
        {
          type: 'message',
          role: 'user',
          content: [{
            type: 'input_text',
            text: buildArtistDirectionRequestText(hintBlock, summaryBlock)
          }]
        }
      ],
      text: { format: { type: 'json_object' } },
      max_output_tokens: 2200,
      temperature: 0.9
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

export function remapArtistPromptReferences(prompt, selectedSources = []) {
  const referenceBySource = new Map(
    selectedSources.map((source, index) => [Number(source), index + 1])
  )

  return String(prompt || '').replace(
    /\b(?:source|reference(?: image)?)\s+(\d+)\b/gi,
    (match, sourceText) => {
      const reference = referenceBySource.get(Number(sourceText))
      return reference ? `attached reference image ${reference}` : match
    }
  )
}

export function buildArtistGenerationPrompt(artDirection, selectedSources = []) {
  const creativePrompt = remapArtistPromptReferences(artDirection?.prompt, selectedSources).trim()
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

  return [
    creativePrompt,
    attachedCastPlan ? `Attached cast plan: ${attachedCastPlan}` : '',
    `Hard constraints (override any conflicting creative direction): ${ARTIST_HARD_CONSTRAINTS.join(' ')}`,
    `This generation has ${selectedSources.length} attached cast reference image${selectedSources.length === 1 ? '' : 's'}; omit any person described in the creative direction who does not have an attached reference.`
  ].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
}
