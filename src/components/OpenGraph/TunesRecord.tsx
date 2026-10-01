import React from "react";
import crypto from "node:crypto";
import fs from "node:fs";
import { OG_HEIGHT, OG_WIDTH } from "./dimensions";
import {
  ACCENT_FILL,
  FONT,
  HAIRLINE,
  imageDataUri,
  INK,
  LOCKUP_ON_PAPER,
  LOCKUP_RATIO,
  MetaLine,
  MIST,
  PAPER,
  resolvePublicAsset,
  stripEmoji,
} from "./cardChrome";

// Card geometry. The sleeve sits left on paper and the record slides out from
// behind it to the right; the words then fill the column the disc stops short
// of. These four numbers are load-bearing — the text column is positioned off
// the right edge of the card, so widening the disc silently pushes it under the
// headline rather than reflowing anything.
const SLEEVE = 392;
const SLEEVE_X = 60;
const DISC = 372;
const DISC_OVERLAP = 128; // how far the disc hides behind the sleeve
const LABEL = 132;
const TEXT_COLUMN = 446;

const SLEEVE_Y = (OG_HEIGHT - SLEEVE) / 2;
const DISC_X = SLEEVE_X + SLEEVE - DISC_OVERLAP;
const DISC_Y = (OG_HEIGHT - DISC) / 2;

/**
 * Reads a square source image (album art, artist portrait) and returns it as a
 * data URI for one slot on the card. The renderer fits it to the slot.
 */
async function loadSquare(imagePath: string): Promise<string | undefined> {
  try {
    return await imageDataUri(resolvePublicAsset(imagePath));
  } catch (error) {
    console.error("OG Image - Failed to load:", imagePath, error);
    return undefined;
  }
}

/**
 * Digests the bytes of the images a card is built from.
 *
 * This belongs in the caller's cache key. Album art and artist portraits are
 * refetched by scripts/backfill-tunes-images.js, and without the digest a
 * replaced image leaves every card built from it stale — the card still renders
 * and still looks right, so the mistake is invisible until it ships.
 */
export function artDigest(paths: (string | null | undefined)[]): string {
  const hash = crypto.createHash("md5");
  for (const p of paths) {
    if (!p) {
      // NUL keeps a missing slot distinct from an absent one in the digest;
      // written as an escape so the source stays text.
      hash.update("\u0000");
      continue;
    }
    try {
      hash.update(fs.readFileSync(resolvePublicAsset(p)));
    } catch {
      // A missing file is itself part of the identity: if it later appears, the
      // digest changes and the card is rebuilt.
      hash.update(`missing:${p}`);
    }
  }
  return hash.digest("hex");
}

// Titles here are album and artist names rather than post headlines, so they
// run short and the ladder can start larger than the Plate's.
function titleSize(length: number): number {
  if (length > 58) return 30;
  if (length > 42) return 35;
  if (length > 26) return 41;
  return 50;
}

export interface TunesRecordOptions {
  /** "Album" or "Artist" — the rubric above the name. */
  eyebrow: string;
  /** Public-relative path to the image on the sleeve. */
  artPath: string;
  /** Public-relative path for the record label. Defaults to the sleeve art. */
  labelPath?: string | null;
  /** Second line under the name, e.g. the artist or the album count. */
  subtitle?: string;
  /** Rubric at the foot, under the hairline. */
  meta?: string[];
}

/**
 * The tunes card: sleeve, record, words.
 *
 * Returns undefined when the sleeve art cannot be read, which is the caller's
 * signal to fall back to the shared section cover — 68 albums and 26 artists in
 * the index have no image at all.
 */
export default async function TunesRecord(
  rawTitle: string,
  options: TunesRecordOptions,
) {
  const art = await loadSquare(options.artPath);
  if (!art) return undefined;

  const label =
    (options.labelPath ? await loadSquare(options.labelPath) : undefined) ?? art;

  const title = stripEmoji(rawTitle);
  const subtitle = options.subtitle ? stripEmoji(options.subtitle) : undefined;
  const meta = (options.meta ?? []).map(stripEmoji).filter(Boolean);

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        backgroundColor: PAPER,
        fontFamily: FONT,
        position: "relative",
      }}
    >
      {/* The record, drawn first so the sleeve covers its left edge */}
      <div
        style={{
          position: "absolute",
          top: DISC_Y,
          left: DISC_X,
          width: `${DISC}px`,
          height: `${DISC}px`,
          borderRadius: `${DISC}px`,
          backgroundColor: "#0B0B0C",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 10px 30px rgba(30, 28, 24, 0.22)",
        }}
      >
        <div
          style={{
            display: "flex",
            width: `${DISC - 54}px`,
            height: `${DISC - 54}px`,
            borderRadius: `${DISC}px`,
            border: "1px solid rgba(255, 255, 255, 0.10)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              width: `${DISC - 118}px`,
              height: `${DISC - 118}px`,
              borderRadius: `${DISC}px`,
              border: "1px solid rgba(255, 255, 255, 0.08)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {label && (
              <img
                src={label}
                width={LABEL}
                height={LABEL}
                style={{
                  width: `${LABEL}px`,
                  height: `${LABEL}px`,
                  borderRadius: `${LABEL}px`,
                  objectFit: "cover",
                }}
              />
            )}
          </div>
        </div>
      </div>

      <img
        src={art}
        width={SLEEVE}
        height={SLEEVE}
        style={{
          position: "absolute",
          top: SLEEVE_Y,
          left: SLEEVE_X,
          width: `${SLEEVE}px`,
          height: `${SLEEVE}px`,
          borderRadius: "3px",
          objectFit: "cover",
          boxShadow: "0 12px 34px rgba(30, 28, 24, 0.26)",
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
          alignItems: "flex-end",
          padding: "48px 60px 52px",
        }}
      >
        <img
          src={LOCKUP_ON_PAPER()}
          width={Math.round(32 * LOCKUP_RATIO)}
          height={32}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            width: `${TEXT_COLUMN}px`,
          }}
        >
          {/* Text blocks stay block-level: as flex containers their text would
              lay out as one unwrappable item and run off the card. */}
          <div
            style={{
              fontSize: "17px",
              fontWeight: 700,
              color: INK,
              backgroundColor: ACCENT_FILL,
              padding: "6px 14px",
              borderRadius: "999px",
            }}
          >
            {options.eyebrow}
          </div>
          <div
            style={{
              fontSize: `${titleSize(title.length)}px`,
              fontWeight: 800,
              color: INK,
              lineHeight: 1.06,
              letterSpacing: "-0.035em",
              marginTop: "14px",
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                fontSize: "25px",
                color: MIST,
                lineHeight: 1.25,
                marginTop: "12px",
              }}
            >
              {subtitle}
            </div>
          )}
          {meta.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                marginTop: "22px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: "100%",
                  height: "1px",
                  backgroundColor: HAIRLINE,
                  marginBottom: "16px",
                }}
              />
              <MetaLine items={meta} color={MIST} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
