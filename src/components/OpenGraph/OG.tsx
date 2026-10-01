import React from "react";
import { OG_HEIGHT, OG_WIDTH } from "./dimensions";
import {
  ACCENT_FILL,
  FONT,
  headlineSize,
  imageDataUri,
  INK,
  LOCKUP_ON_PAPER,
  LOCKUP_RATIO,
  MetaLine,
  MIST,
  PAPER,
  resolveCoverPath,
  stripEmoji,
  TINT,
} from "./cardChrome";

async function loadCover(coverImagePath: string): Promise<string | undefined> {
  try {
    // Covers are 2560x1440, so the 2x frame is still within their native
    // resolution; the renderer crops them to the inset frame itself.
    return await imageDataUri(resolveCoverPath(coverImagePath));
  } catch (error) {
    console.error("OG Image - Failed to load:", coverImagePath, error);
    return undefined;
  }
}

// Inset margin around the cover, and the white panel's corner cut
const INSET = 32;
const COVER_RADIUS = 28;
const PANEL_RADIUS = 34;

// The homepage lead, as a card: the cover inset on the white page with
// rounded corners, and the headline on a page-coloured panel cut into its
// bottom-left corner, so the words sit on the page rather than over the art.
// The lockup rides on a white pill in the cover's top-left corner.
function CoverCard({
  title,
  cover,
  meta,
}: {
  title: string;
  cover: string;
  meta: string[];
}) {
  const size = headlineSize(title.length, [60, 54, 48, 42]);
  const coverWidth = OG_WIDTH - INSET * 2;
  const coverHeight = OG_HEIGHT - INSET * 2;
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        position: "relative",
        backgroundColor: PAPER,
        fontFamily: FONT,
      }}
    >
      <img
        src={cover}
        width={coverWidth}
        height={coverHeight}
        style={{
          position: "absolute",
          top: INSET,
          left: INSET,
          width: `${coverWidth}px`,
          height: `${coverHeight}px`,
          objectFit: "cover",
          borderRadius: `${COVER_RADIUS}px`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: INSET + 22,
          left: INSET + 22,
          display: "flex",
          alignItems: "center",
          padding: "11px 18px",
          borderRadius: "999px",
          backgroundColor: PAPER,
        }}
      >
        <img
          src={LOCKUP_ON_PAPER()}
          width={Math.round(26 * LOCKUP_RATIO)}
          height={26}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: INSET,
          bottom: INSET,
          display: "flex",
          flexDirection: "column",
          // Short titles ("AI") still get a substantial panel
          minWidth: "480px",
          maxWidth: "800px",
          padding: "30px 46px 2px 0",
          backgroundColor: PAPER,
          borderTopRightRadius: `${PANEL_RADIUS}px`,
        }}
      >
        <div
          style={{
            fontSize: `${size}px`,
            fontWeight: 800,
            color: INK,
            lineHeight: 1.04,
            letterSpacing: "-0.035em",
          }}
        >
          {title}
        </div>
        {meta.length > 0 && (
          <div style={{ display: "flex", marginTop: "18px" }}>
            <MetaLine items={meta} color={MIST} />
          </div>
        )}
      </div>
    </div>
  );
}

// The coverless card. White page, the lockup top-left, the headline and
// standfirst, and a tint footer band carrying the meta line — the site's
// intro-band grammar.
function Plate({
  title,
  description,
  meta,
}: {
  title: string;
  description?: string;
  meta: string[];
}) {
  const size = headlineSize(title.length, [68, 60, 52, 44]);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        backgroundColor: PAPER,
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          padding: "56px 72px 40px",
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
              fontWeight: 800,
              color: INK,
              lineHeight: 1.04,
              letterSpacing: "-0.04em",
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
                marginTop: "22px",
                maxWidth: "920px",
              }}
            >
              {description}
            </div>
          )}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          height: "88px",
          padding: "0 72px",
          backgroundColor: TINT,
        }}
      >
        <div
          style={{
            display: "flex",
            width: "12px",
            height: "12px",
            borderRadius: "12px",
            backgroundColor: ACCENT_FILL,
          }}
        />
        {meta.length > 0 ? (
          <MetaLine items={meta} color={MIST} />
        ) : (
          <MetaLine items={["russ.cloud"]} color={MIST} />
        )}
      </div>
    </div>
  );
}

export interface OGOptions {
  /** Filesystem path to the post cover. Present cover renders the cover card. */
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
    return <CoverCard title={title} cover={cover} meta={meta} />;
  }

  // The description is only baked into the coverless card. On a post card it
  // would repeat the og:description every platform already prints beneath.
  const raw = rawDescription ? stripEmoji(rawDescription) : undefined;
  const description =
    raw && raw.length > 180 ? `${raw.slice(0, 177).trimEnd()}…` : raw;

  return <Plate title={title} description={description} meta={meta} />;
}
