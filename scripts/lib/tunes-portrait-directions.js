// Deterministic weekly variety for the Tunes artist portrait. Header-cover
// creative direction is chosen by AI from album-cover summaries; these rotations
// remain because the portrait has a deliberately fixed photographic format.

export const MS_PER_WEEK = 604800000

const SHOOT_SALT = 0x5e6f
const COLOUR_SALT = 0x7081

// Weekly post dates are exactly one MS_PER_WEEK apart, so bucket timestamp seeds
// before choosing from a rotation. Small CLI test seeds remain useful as-is.
export function weekBucket(seed) {
  const value = Math.abs(Math.trunc(Number.isFinite(seed) ? seed : 0))
  return value >= MS_PER_WEEK ? Math.floor(value / MS_PER_WEEK) : value
}

function mulberry32(a) {
  return function next() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Every entry appears once per cycle, with the order re-dealt each cycle so
// rotations of different lengths do not lock into repeating pairings.
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

// Shoot grammar varies behaviour, camera position, and moment while keeping
// faces large, visible, and well lit for likeness fidelity.
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

// These replace one another rather than accumulating contradictory colour and
// film-stock directions.
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
