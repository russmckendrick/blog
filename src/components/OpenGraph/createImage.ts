import fs from "node:fs/promises";
import path from "node:path";
import { Renderer } from "@takumi-rs/core";
import { fromJsx } from "@takumi-rs/helpers/jsx";
import sharp from "sharp";
import type { ReactNode } from "react";
import { OG_HEIGHT, OG_SCALE, OG_WIDTH } from "./dimensions";

// One renderer per process. It owns the font, glyph and decoded-image caches,
// and dedupes font registration by buffer identity, so every card after the
// first skips the font parse.
const renderer = new Renderer();

// The site's own variable face, straight from src/assets/fonts. Registered
// without a weight so the wght axis stays live and the cards' fontWeight
// 400/500/700 map onto it directly — no static instances, no fontTools.
// Resolved from the working directory like every other OG asset: in the
// production bundle import.meta.url points into dist/, where no font lives.
const fonts = fs
  .readFile(
    path.join(
      process.cwd(),
      "src/assets/fonts/schibsted-grotesk-variable-latin.woff2",
    ),
  )
  .then((data) => [{ name: "Schibsted Grotesk", data }]);

const width = OG_WIDTH * OG_SCALE;
const height = OG_HEIGHT * OG_SCALE;

export async function PNG(component: ReactNode): Promise<Buffer> {
  const { node, css } = await fromJsx(component);
  // Takumi takes width/height in output pixels and devicePixelRatio as the
  // CSS-to-device scale, so this lays the card out at 1200x630 and rasterises
  // everything, text and embedded images alike, at OG_SCALE times that.
  const pixels = await renderer.render(node, {
    width,
    height,
    devicePixelRatio: OG_SCALE,
    format: "raw",
    fonts: await fonts,
    css,
  });
  // Takumi's own PNG encoder favours speed over size, so the raw pixels go
  // through sharp for the encode.
  const image = sharp(pixels, { raw: { width, height, channels: 4 } }).removeAlpha();
  const truecolour = await image
    .png({ compressionLevel: 9, palette: false })
    .toBuffer();
  if (truecolour.length <= PNG_BUDGET) return truecolour;
  return image.png({ compressionLevel: 9, palette: true, effort: 4 }).toBuffer();
}

// Cards are truecolour unless that busts this budget, in which case they are
// quantised to a 256-colour palette. Quantising is invisible under a scrim —
// photographic cards are exactly the ones that exceed the budget, and they
// have always shipped as palette PNGs — but on a paper card the artwork uses
// up the palette and the paper takes the nearest entry, which shows as tinted
// polygons and spikes. Those cards fit the budget with room to spare.
//
// `palette: false` is load-bearing above: sharp reads any palette option
// (`effort`, `quality`, `colours`, `dither`) as opting in to quantisation,
// which is how the old `effort: 4` quietly made every card a palette PNG.
// The budget sits well under the 5MB ceiling X applies to shared images.
const PNG_BUDGET = 2.5 * 1024 * 1024;
