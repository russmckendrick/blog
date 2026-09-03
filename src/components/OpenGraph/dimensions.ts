// Card geometry, kept dependency-free so BaseHead can declare og:image:width
// and og:image:height without pulling the renderer into every page's module
// graph.
//
// The card is laid out at the 1200x630 OpenGraph standard and rasterised at a
// multiple of it: createImage.ts hands OG_SCALE to Takumi as the device pixel
// ratio, so text, chrome and embedded covers all come out at the larger size.
export const OG_WIDTH = 1200
export const OG_HEIGHT = 630

// Bumping this sharpens every card and costs deploy weight: cards are roughly
// 3.4x heavier at 2 than at 1. Anything above 2 needs a check that photographic
// cards stay under the 5MB ceiling X applies to shared images.
export const OG_SCALE = 2
