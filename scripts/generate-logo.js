#!/usr/bin/env node

/**
 * Logo Lockup Generator
 *
 * Bakes the russ.cloud wordmark — "russ" in Poppins ExtraBold, ".cloud" in
 * Poppins Light, plus the block-cursor geometry — into SVG outline path data so
 * the header logo ships as pure vector artwork without loading Poppins as a
 * webfont. Also refreshes the mark-only public/favicon.svg from the canonical
 * mark artwork in public/images/logo.svg.
 *
 * Outputs (both committed, never hand-edited):
 *   - src/data/logo-lockup.json  consumed by src/components/layout/Logo.astro
 *   - public/favicon.svg         the mark alone, preamble stripped
 *
 * The Poppins TTFs (SIL OFL) are fetched once from the google/fonts repo and
 * cached in node_modules/.cache/logo-poppins/. Re-run only if the wordmark
 * design changes: pnpm run generate-logo
 */

import opentype from 'opentype.js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(__filename), '..');

const CACHE_DIR = path.join(PROJECT_ROOT, 'node_modules/.cache/logo-poppins');
const OUTPUT_JSON = path.join(PROJECT_ROOT, 'src/data/logo-lockup.json');
const MARK_SVG = path.join(PROJECT_ROOT, 'public/images/logo.svg');
const FAVICON_SVG = path.join(PROJECT_ROOT, 'public/favicon.svg');

const FONT_BASE_URL = 'https://raw.githubusercontent.com/google/fonts/main/ofl/poppins';
const FONT_HEAVY = 'Poppins-ExtraBold.ttf'; // "russ"
const FONT_LIGHT = 'Poppins-Light.ttf';     // ".cloud"

// Geometry from the reference mock (russcloud-logo-final.html), 100 units = 1em.
const EM = 100;
const MARK_BOX = 105;     // 1.05em square for the monitor mark
const GAP = 42;           // 0.42em between mark and wordmark
const TRACKING = -3;      // -0.03em letter-spacing, applied after every glyph
const CURSOR_WIDTH = 20;  // 0.2em (widened from the mock's 0.16em)
const CURSOR_HEIGHT = 90; // 0.9em, bottom flush with the visual bottom of the "d"
const CURSOR_GAP = 10;    // 0.1em margin between the final "d" and the cursor (mock had 0.04em)
const CURSOR_DROP = 4;    // 0.04em of undershoot below the "d" so the caret reads anchored, not floating
const CURSOR_RADIUS = 2;  // ~1px at the mock's 52px reference size
const MARK_HEIGHT_PX = 28; // rendered mark height in the masthead (parity with the old h-7 img)

const MARK_VIEWBOX = { width: 441, height: 415 };

const round = (value, places = 2) => {
  const f = 10 ** places;
  return Math.round(value * f) / f;
};

async function ensureFont(filename) {
  const cached = path.join(CACHE_DIR, filename);
  try {
    return await fs.readFile(cached);
  } catch {
    // Not cached yet - fall through to download
  }

  const url = `${FONT_BASE_URL}/${filename}`;
  console.log(`Downloading ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${filename}: HTTP ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.mkdir(CACHE_DIR, { recursive: true });
  await fs.writeFile(cached, buffer);
  return buffer;
}

async function loadFont(filename) {
  const buffer = await ensureFont(filename);
  return opentype.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
}

/**
 * Lay out one wordmark segment glyph by glyph, mirroring CSS text layout:
 * advance + kerning within the segment, with letter-spacing (TRACKING) applied
 * after every glyph including the last - exactly what the browser does to a
 * span, which is why the cursor gap nets CURSOR_GAP + TRACKING after the "d".
 * Returns one SVG path "d" string per glyph plus the pen position after the
 * segment.
 */
function layoutSegment(font, text, startX, baselineY) {
  const scale = EM / font.unitsPerEm;
  const glyphs = font.stringToGlyphs(text);
  const paths = [];
  const bboxes = [];
  let x = startX;

  glyphs.forEach((glyph, i) => {
    const glyphPath = glyph.getPath(x, baselineY, EM);
    paths.push(glyphPath.toPathData(1));
    bboxes.push(glyphPath.getBoundingBox());
    x += glyph.advanceWidth * scale;
    if (i < glyphs.length - 1) {
      x += font.getKerningValue(glyph, glyphs[i + 1]) * scale;
    }
    x += TRACKING;
  });

  return { paths, bboxes, endX: x };
}

async function main() {
  const [heavy, light] = await Promise.all([loadFont(FONT_HEAVY), loadFont(FONT_LIGHT)]);

  // Baseline: the 1em text line box (line-height: 1 in the mock) vertically
  // centred against the MARK_BOX square, with the font's hhea content area
  // centred in the line box - the same placement browsers use.
  const scale = EM / heavy.unitsPerEm;
  const ascender = heavy.tables.hhea.ascender * scale;
  const descender = heavy.tables.hhea.descender * scale; // negative
  const contentHeight = ascender - descender;
  const baselineY = round((MARK_BOX - EM) / 2 + (EM - contentHeight) / 2 + ascender, 2);
  console.log(`Metrics: ascender ${ascender}, descender ${descender}, baseline y ${baselineY}`);

  const russ = layoutSegment(heavy, 'russ', MARK_BOX + GAP, baselineY);
  const dotCloud = layoutSegment(light, '.cloud', round(russ.endX, 2), baselineY);

  // Round letterforms overshoot the mathematical baseline (the "d" bowl in
  // Poppins Light bottoms out ~0.9 units below it); a crisp rect stopping at
  // the baseline reads as floating, so take the measured bottom of the final
  // "d" and sink the caret CURSOR_DROP below it for a visually anchored edge.
  const dBottom = dotCloud.bboxes[dotCloud.bboxes.length - 1].y2;
  const caret = {
    x: round(dotCloud.endX + CURSOR_GAP, 2),
    y: round(dBottom + CURSOR_DROP - CURSOR_HEIGHT, 2),
    width: CURSOR_WIDTH,
    height: CURSOR_HEIGHT,
    rx: CURSOR_RADIUS
  };

  const width = round(caret.x + CURSOR_WIDTH, 2);
  const minY = Math.min(0, caret.y);
  const height = round(MARK_BOX - minY, 2);
  const pxPerUnit = MARK_HEIGHT_PX / MARK_BOX;

  // Letterbox the 441x415 mark artwork into the MARK_BOX square, centred.
  const markScale = round(MARK_BOX / MARK_VIEWBOX.width, 6);
  const markOffsetY = round((MARK_BOX - MARK_VIEWBOX.height * markScale) / 2, 2);

  const lockup = {
    generatedBy: 'scripts/generate-logo.js',
    viewBox: `0 ${minY} ${width} ${height}`,
    width: round(width * pxPerUnit, 2),
    height: round(height * pxPerUnit, 2),
    mark: { transform: `translate(0 ${markOffsetY}) scale(${markScale})` },
    wordmark: {
      russ: russ.paths.join(' '),
      dot: dotCloud.paths[0],
      cloud: dotCloud.paths.slice(1).join(' ')
    },
    caret
  };

  await fs.writeFile(OUTPUT_JSON, `${JSON.stringify(lockup, null, 2)}\n`);
  console.log(`Wrote ${path.relative(PROJECT_ROOT, OUTPUT_JSON)} (${width}x${height} units, renders ${lockup.width}x${lockup.height}px)`);

  // Favicon: the mark alone, with the XML/DOCTYPE preamble stripped.
  const markSource = await fs.readFile(MARK_SVG, 'utf8');
  const svgStart = markSource.indexOf('<svg');
  if (svgStart === -1) {
    throw new Error(`No <svg> element found in ${MARK_SVG}`);
  }
  await fs.writeFile(FAVICON_SVG, `${markSource.slice(svgStart).trim()}\n`);
  console.log(`Wrote ${path.relative(PROJECT_ROOT, FAVICON_SVG)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
