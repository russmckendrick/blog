import fs from "fs/promises";
import satori from "satori";
import sharp from "sharp";
import type { ReactNode } from "react";
import { OG_HEIGHT, OG_SCALE, OG_WIDTH } from "./dimensions";

// Satori reads TTF/OTF only, so the site's woff2 faces cannot be handed to it
// directly, and it renders a variable font at its default instance — which
// would flatten every weight to 400. These static TTFs are cut from
// src/assets/fonts/schibsted-grotesk-variable-latin.woff2 with fontTools:
//
//   f = TTFont(src)
//   instancer.instantiateVariableFont(f, {"wght": 700}, inplace=True)
//   del f["GPOS"]        # see below
//   f.flavor = None
//   f.save(dest)
//
// GPOS is dropped because satori misapplies kern pairs involving the space
// glyph, which opens a visible double gap after words ending in "n"
// ("Token Use" renders as "Token  Use"). Kerning is no loss at display sizes.
export async function SVG(component: ReactNode) {
  return await satori(component, {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts: [
      {
        name: "Schibsted Grotesk",
        data: await fs.readFile(
          "./src/images/opengraph/fonts/SchibstedGrotesk-Regular.ttf",
        ),
        weight: 400,
      },
      {
        name: "Schibsted Grotesk",
        data: await fs.readFile(
          "./src/images/opengraph/fonts/SchibstedGrotesk-Medium.ttf",
        ),
        weight: 500,
      },
      {
        name: "Schibsted Grotesk",
        data: await fs.readFile(
          "./src/images/opengraph/fonts/SchibstedGrotesk-Bold.ttf",
        ),
        weight: 700,
      },
    ],
  });
}

export async function PNG(component: ReactNode) {
  // sharp rasterises vectors at density/72, so 72 * OG_SCALE renders the same
  // layout at OG_SCALE times the pixel dimensions with no re-tuning.
  return await sharp(Buffer.from(await SVG(component)), { density: 72 * OG_SCALE })
    .png({
      compressionLevel: 9,
      // Truecolour, deliberately: the scrim darkens the cover enough that
      // quantising saves under 5% while dithering the semi-transparent
      // wordmark into visible speckle. Cards land ~1.5MB, well inside the
      // 5MB ceiling X applies to shared images.
      effort: 4
    })
    .toBuffer();
}
