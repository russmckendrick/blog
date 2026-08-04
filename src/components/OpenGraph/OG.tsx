import React from "react";
import path from "path";
import sharp from "sharp";
import lockup from "../../data/logo-lockup.json";
import { OG_HEIGHT, OG_SCALE, OG_WIDTH } from "./dimensions";

// Reading Room palette (light theme values from src/styles/global.css)
const PAPER = "#FBFAF7";
const INK = "#1E1C18";
const MIST = "#6F6A61";
const HAIRLINE = "#ECE8E1";

// The scrim is the Night edition's paper rather than a neutral black, so the
// two editions of the site are made of the same material.
const NIGHT = "22, 20, 17";
const NIGHT_INK = "#FFFFFF";
const NIGHT_MIST = "rgba(255, 255, 255, 0.82)";

// Satori ships no emoji font, so pictographs render as tofu — and they
// don't belong on the card anyway.
const stripEmoji = (text: string) =>
  text
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();

// The header lockup, rebuilt as a standalone SVG so the card carries the same
// brand mark as the masthead. Path data comes from the same generated JSON
// Logo.astro reads; only the fills differ, because the card has to sit on both
// paper and a photographic scrim. Regenerate the paths with `pnpm run generate-logo`.
interface MarkFills {
  base: string;
  shadow: string;
  body: string;
  screen: string;
  clouds: string;
}

const markPaths = (f: MarkFills) =>
  `<path d="m418.92 348.36h-145.52v52.916h19.844c3.655 0 6.62 2.96 6.62 6.615 0 3.65-2.965 6.614-6.616 6.614h-145.52c-3.65 0-6.614-2.96-6.614-6.614 0-3.652 2.96-6.615 6.613-6.615h19.843v-52.916h-145.52c-12.173 0-22.046-9.873-22.046-22.047v-39.69h440.96v39.69c0 12.174-9.873 22.047-22.048 22.047z" fill="${f.base}"/><rect x="167.57" y="348.36" width="105.83" height="8.82" fill="${f.shadow}"/><path d="m22.047 0h396.87c12.175 0 22.048 9.874 22.048 22.05v264.58h-440.96v-264.58c0-12.172 9.87-22.047 22.046-22.047l1e-3 -1e-3z" fill="${f.body}"/><path d="m22.047 22.049h396.87v242.53h-396.87v-242.53zm207.25 295.45c0 4.87-3.947 8.82-8.818 8.82-4.87 0-8.82-3.95-8.82-8.82s3.95-8.82 8.82-8.82 8.82 3.95 8.82 8.82h-2e-3z" fill="${f.screen}"/><path d="m340.68 88.842c-32.724 0.207-64.258 9.87-96.377 13.732-13.406 1.613-27.223 2.008-40.65 0.51-17.854-1.995-35.14-7.29-52.98-9.664-15.946-2.12-32.09-4.336-48.136-4.425-28.04-0.16-55.16 8.133-82.647 12.61 0 7.595-1.634 17.343 2.476 22.682 4.24 5.506 11.39 10.542 13.245 18.003 4.4 17.696 10.65 35.043 18.63 51.673 3.88 8.08 11.208 13.715 19.387 17.597 19.694 9.346 43.004 10.72 64.61 7.78 30.768-4.185 47.46-25.992 60.195-50.908 4.767-10.13 5.3-21.82 11.576-31.076 3.73-5.497 12.388-3.183 18.576-3.203 6.19-0.02 11.434 9.704 13.355 16.175 6.795 22.902 18.127 47.2 40.65 59.2 33.632 17.92 86.616 14.567 108.44-17.75 8.54-12.648 10.9-27.994 15.183-42.314 2.61-8.716 4.94-19.11 14.215-23.902 3.744-1.934 1.117-9.652 1.67-14.138 0.6-4.89 1.763-9.213-5.6-10.173-12.842-1.675-25.3-6.77-38.443-8.493-12.455-1.634-24.66-3.997-37.366-3.917l-6e-3 1e-3zm-216.34 8.138c9.29-0.056 18.538 0.586 27.567 2.39 53.794 10.748 54.88 31.683 32.736 74.965-18.046 35.265-55.426 44.102-93.093 35.65-17.363-3.9-29.236-15.348-34.836-31.026-5.91-16.547-10.38-34.128-9.368-51.52 1.35-23.29 29.24-26.562 49.21-28.683 9.16-0.973 18.49-1.723 27.78-1.78l4e-3 4e-3zm196.42 0c9.29 0.056 18.62 0.806 27.783 1.78 19.97 2.12 47.86 5.394 49.215 28.684 1.012 17.39-3.458 34.972-9.368 51.52-5.6 15.677-17.473 27.126-34.836 31.023-37.666 8.458-75.05-0.38-93.093-35.65-22.145-43.28-21.058-64.215 32.736-74.963 9.03-1.804 18.28-2.446 27.568-2.39l-5e-3 -4e-3z" fill="${f.clouds}"/>`;

const LOCKUP_RATIO = lockup.width / lockup.height;

function lockupDataUri(
  mark: MarkFills,
  russ: string,
  cloud: string,
  punct: string,
) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${lockup.viewBox}"><g transform="${lockup.mark.transform}">${markPaths(mark)}</g><path d="${lockup.wordmark.russ}" fill="${russ}"/><path d="${lockup.wordmark.dot}" fill="${punct}"/><path d="${lockup.wordmark.cloud}" fill="${cloud}"/><rect x="${lockup.caret.x}" y="${lockup.caret.y}" width="${lockup.caret.width}" height="${lockup.caret.height}" rx="${lockup.caret.rx}" fill="${punct}"/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

// On paper the mark keeps its own palette and the dot and caret take its screen
// blue, exactly as Logo.astro sets --logo-punct.
const LOCKUP_ON_PAPER = () =>
  lockupDataUri(
    {
      base: "#BDC3C7",
      shadow: "#95A5A5",
      body: "#2C3E50",
      screen: "#35495E",
      clouds: "#2B3E51",
    },
    INK,
    MIST,
    "#35495E",
  );

// Over photography the mark's own navy silts up against the scrim, so it is
// reversed out to a flat white monitor. The cloud artwork is dropped rather
// than knocked back: at 32px any contrast between the two cloud shapes reads
// as a pair of spectacles, and the silhouette alone carries the mark.
const LOCKUP_ON_SCRIM = () =>
  lockupDataUri(
    {
      base: "rgba(255, 255, 255, 0.72)",
      shadow: "rgba(255, 255, 255, 0.5)",
      body: "#FFFFFF",
      screen: "#FFFFFF",
      clouds: "#FFFFFF",
    },
    NIGHT_INK,
    "rgba(255, 255, 255, 0.72)",
    "#BDC3C7",
  );

function resolveCoverPath(coverImagePath: string): string {
  if (path.isAbsolute(coverImagePath)) return coverImagePath;
  if (coverImagePath.includes("../../assets/")) {
    return path.join(
      process.cwd(),
      coverImagePath.replace("../../assets/", "src/assets/"),
    );
  }
  // Both the leading-slash and bare forms are public/ relative.
  return path.join(process.cwd(), "public", coverImagePath);
}

async function loadCover(coverImagePath: string): Promise<string | undefined> {
  try {
    const imagePath = resolveCoverPath(coverImagePath);
    // Covers are 2560x1440, so the scaled frame is still within their native
    // resolution. Re-encoding as JPEG keeps the embedded base64 well below
    // libxml2's 10MB parse limit.
    const resized = await sharp(imagePath)
      .resize(OG_WIDTH * OG_SCALE, OG_HEIGHT * OG_SCALE, {
        fit: "cover",
        position: "centre",
      })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();
    return `data:image/jpeg;base64,${resized.toString("base64")}`;
  } catch (error) {
    console.error("OG Image - Failed to load:", coverImagePath, error);
    return undefined;
  }
}

// Headlines are set as large as they can be without the block outgrowing the
// space above the meta line. Roughly 30 characters fit a line at 50px.
function headlineSize(length: number, ladder: number[]): number {
  if (length > 110) return ladder[3];
  if (length > 78) return ladder[2];
  if (length > 52) return ladder[1];
  return ladder[0];
}

function MetaLine({ items, color }: { items: string[]; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: "12px",
        fontSize: "21px",
        fontWeight: 500,
        color,
      }}
    >
      {items.flatMap((item, i) =>
        i === 0
          ? [<span key={i}>{item}</span>]
          : [
              <span key={`sep-${i}`} style={{ opacity: 0.5 }}>
                ·
              </span>,
              <span key={i}>{item}</span>,
            ],
      )}
    </div>
  );
}

// Cover art fills the frame; the words are reversed out of a scrim so nothing
// depends on the artwork behaving.
function Scrim({
  title,
  cover,
  meta,
}: {
  title: string;
  cover: string;
  meta: string[];
}) {
  const size = headlineSize(title.length, [66, 58, 50, 44]);
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        position: "relative",
        fontFamily: "Schibsted Grotesk",
      }}
    >
      <img
        src={cover}
        width={OG_WIDTH}
        height={OG_HEIGHT}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: `${OG_WIDTH}px`,
          height: `${OG_HEIGHT}px`,
          objectFit: "cover",
        }}
      />
      {/* Vertical scrim: anchors the lockup at the top and the words at the foot */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: `${OG_WIDTH}px`,
          height: `${OG_HEIGHT}px`,
          display: "flex",
          backgroundImage: `linear-gradient(180deg, rgba(${NIGHT}, 0.72) 0%, rgba(${NIGHT}, 0.28) 34%, rgba(${NIGHT}, 0.55) 68%, rgba(${NIGHT}, 0.93) 100%)`,
        }}
      />
      {/* Horizontal scrim: protects the text column when the art is busy on the left */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: `${OG_WIDTH}px`,
          height: `${OG_HEIGHT}px`,
          display: "flex",
          backgroundImage: `linear-gradient(90deg, rgba(${NIGHT}, 0.42) 0%, rgba(${NIGHT}, 0) 58%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: `${OG_WIDTH}px`,
          height: `${OG_HEIGHT}px`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "46px 60px 48px",
        }}
      >
        <img
          src={LOCKUP_ON_SCRIM()}
          width={Math.round(32 * LOCKUP_RATIO)}
          height={32}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxWidth: "900px",
          }}
        >
          <div
            style={{
              fontSize: `${size}px`,
              fontWeight: 700,
              color: NIGHT_INK,
              lineHeight: 1.1,
              letterSpacing: "-0.018em",
            }}
          >
            {title}
          </div>
          {meta.length > 0 && (
            <div style={{ display: "flex", marginTop: "22px" }}>
              <MetaLine items={meta} color={NIGHT_MIST} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// The coverless card — tag, book, glossary and tunes hubs. Paper ground, so the
// standfirst earns its place here in a way it never did over the art.
function Plate({
  title,
  description,
  meta,
}: {
  title: string;
  description?: string;
  meta: string[];
}) {
  const size = headlineSize(title.length, [64, 56, 48, 42]);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        backgroundColor: PAPER,
        fontFamily: "Schibsted Grotesk",
        padding: "56px 72px 52px",
      }}
    >
      <img
        src={LOCKUP_ON_PAPER()}
        width={Math.round(34 * LOCKUP_RATIO)}
        height={34}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontSize: `${size}px`,
            fontWeight: 700,
            color: INK,
            lineHeight: 1.13,
            letterSpacing: "-0.016em",
          }}
        >
          {title}
        </div>
        {description && (
          <div
            style={{
              fontSize: "25px",
              fontWeight: 400,
              color: MIST,
              lineHeight: 1.42,
              marginTop: "24px",
              maxWidth: "920px",
            }}
          >
            {description}
          </div>
        )}
      </div>
      {meta.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              width: "100%",
              height: "1px",
              backgroundColor: HAIRLINE,
              marginBottom: "18px",
            }}
          />
          <MetaLine items={meta} color={MIST} />
        </div>
      )}
    </div>
  );
}

export interface OGOptions {
  /** Filesystem path to the post cover. Present cover renders the scrim card. */
  coverImagePath?: string;
  /** Rubric under the headline, e.g. date, reading time, lead tag. */
  meta?: string[];
}

export default async function OG(
  rawTitle: string = "Russ McKendrick - Blog",
  rawDescription?: string,
  options: OGOptions = {},
) {
  const title = stripEmoji(rawTitle);
  const meta = (options.meta ?? []).map(stripEmoji).filter(Boolean);

  const cover = options.coverImagePath
    ? await loadCover(options.coverImagePath)
    : undefined;

  if (cover) {
    return <Scrim title={title} cover={cover} meta={meta} />;
  }

  // The description is only baked into the coverless card. On a post card it
  // would repeat the og:description every platform already prints beneath.
  const raw = rawDescription ? stripEmoji(rawDescription) : undefined;
  const description =
    raw && raw.length > 180 ? `${raw.slice(0, 177).trimEnd()}…` : raw;

  return <Plate title={title} description={description} meta={meta} />;
}
