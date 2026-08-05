import React from "react";
import sharp from "sharp";
import { OG_HEIGHT, OG_SCALE, OG_WIDTH } from "./dimensions";
import {
  headlineSize,
  HAIRLINE,
  INK,
  LOCKUP_ON_PAPER,
  LOCKUP_ON_SCRIM,
  LOCKUP_RATIO,
  MetaLine,
  MIST,
  NIGHT,
  NIGHT_INK,
  NIGHT_MIST,
  PAPER,
  resolveCoverPath,
  stripEmoji,
} from "./cardChrome";

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
