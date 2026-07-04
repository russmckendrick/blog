import React from "react";
import fs from "fs";
import path from "path";
import sharp from "sharp";

// Print Edition palette (light theme values from src/styles/global.css)
const PAPER = "#F6F6F6";
const INK = "#1A1A1A";
const INK_MUTED = "#555555";
const ACCENT = "#BF3B00";
const RULE = "rgba(0, 0, 0, 0.14)";

// Satori ships no emoji font, so pictographs render as tofu — and they
// don't belong on the print-style card anyway.
const stripEmoji = (text: string) =>
  text
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();

export default async function OG(
  rawTitle: string = "Russ McKendrick - Blog",
  rawDescription?: string,
  coverImagePath?: string,
) {
  const title = stripEmoji(rawTitle);
  const description = rawDescription ? stripEmoji(rawDescription) : undefined;
  console.log('OG function called with:', { title, description, coverImagePath });

  // Convert cover image to base64 if it exists
  let coverImageBase64: string | undefined;

  if (coverImagePath && typeof coverImagePath === 'string') {
    try {
      // coverImagePath is already an absolute filesystem path or relative path
      let imagePath: string;

      if (path.isAbsolute(coverImagePath)) {
        // Already absolute
        imagePath = coverImagePath;
      } else if (coverImagePath.includes('../../assets/')) {
        // Relative from content file
        const assetPath = coverImagePath.replace('../../assets/', 'src/assets/');
        imagePath = path.join(process.cwd(), assetPath);
      } else if (coverImagePath.startsWith('/')) {
        // Absolute from public
        imagePath = path.join(process.cwd(), 'public', coverImagePath);
      } else {
        // Relative from public
        imagePath = path.join(process.cwd(), 'public', coverImagePath);
      }

      console.log('OG - Loading image from:', imagePath);
      console.log('OG - File exists:', fs.existsSync(imagePath));

      // Resize to the right-hand plate size and re-encode as JPEG to keep the
      // embedded base64 well below libxml2's 10MB parse limit.
      const resized = await sharp(imagePath)
        .resize(560, 630, { fit: "cover", position: "centre" })
        .jpeg({ quality: 80, mozjpeg: true })
        .toBuffer();
      coverImageBase64 = `data:image/jpeg;base64,${resized.toString('base64')}`;
      console.log('OG - Image loaded, base64 length:', resized.toString('base64').length);
    } catch (error) {
      // If image fails to load, no cover image
      console.error('OG Image - Failed to load:', coverImagePath, error);
      coverImageBase64 = undefined;
    }
  }

  const logoBase64 = (() => {
    const logoPath = path.join(process.cwd(), 'src/images/opengraph/logo.png');
    const logoBuffer = fs.readFileSync(logoPath);
    return `data:image/png;base64,${logoBuffer.toString('base64')}`;
  })();

  // Scale the headline down as titles get longer
  const titleSize = title.length > 90 ? 42 : title.length > 60 ? 48 : title.length > 35 ? 56 : 64;
  const shortDescription = description && description.length > 180
    ? `${description.slice(0, 177).trimEnd()}…`
    : description;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        backgroundColor: PAPER,
        fontFamily: "Source Serif 4",
      }}
    >
      {/* Heavy editorial rule across the top of the page */}
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "12px",
          backgroundColor: INK,
          flexShrink: 0,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flex: 1,
          width: "100%",
        }}
      >
        {/* Text column on paper */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: "48px 52px 44px 56px",
            minWidth: 0,
          }}
        >
          {/* Masthead rubric */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "18px",
            }}
          >
            <img
              src={logoBase64}
              width={56}
              height={56}
              style={{
                objectFit: "contain",
              }}
            />
            <span
              style={{
                fontFamily: "IBM Plex Mono",
                fontSize: "24px",
                fontWeight: 500,
                letterSpacing: "3px",
                color: ACCENT,
              }}
            >
              RUSS.CLOUD
            </span>
          </div>

          {/* Headline + standfirst */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              flex: 1,
              paddingTop: "24px",
              paddingBottom: "24px",
            }}
          >
            <h1
              style={{
                fontSize: `${titleSize}px`,
                fontWeight: 700,
                color: INK,
                lineHeight: 1.12,
                letterSpacing: "-0.5px",
                margin: 0,
                padding: 0,
                maxWidth: "100%",
                wordBreak: "break-word",
              }}
            >
              {title}
            </h1>

            {shortDescription && (
              <p
                style={{
                  fontSize: "25px",
                  fontWeight: 400,
                  color: INK_MUTED,
                  lineHeight: 1.45,
                  margin: "26px 0 0 0",
                  padding: 0,
                  maxWidth: "100%",
                  wordBreak: "break-word",
                }}
              >
                {shortDescription}
              </p>
            )}
          </div>

          {/* Closing rule, print-style */}
          <div
            style={{
              display: "flex",
              width: "88px",
              height: "4px",
              backgroundColor: INK,
              flexShrink: 0,
            }}
          />
        </div>

        {/* Cover plate, hairline-framed, edge to edge */}
        {coverImageBase64 && (
          <div
            style={{
              display: "flex",
              width: "480px",
              height: "100%",
              flexShrink: 0,
              borderLeft: `1px solid ${RULE}`,
            }}
          >
            <img
              src={coverImageBase64}
              width={480}
              height={618}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
