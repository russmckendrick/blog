import React from "react";
import fs from "fs";
import path from "path";

export default function OG(
  title: string = "Russ McKendrick - Blog",
  description?: string,
  coverImagePath?: string | { src: string; width: number; height: number; format: string },
) {
  // Convert cover image to base64 if it exists
  let coverImageBase64: string | undefined;

  if (coverImagePath) {
    try {
      let imagePath: string;

      // Check if it's an Astro image object
      if (typeof coverImagePath === 'object' && 'src' in coverImagePath) {
        // Extract the file path from the Astro image src
        // Format: /@fs/Users/...path...?origWidth=1400&origHeight=800&origFormat=png
        const srcPath = coverImagePath.src;
        const cleanPath = srcPath.split('?')[0]; // Remove query params
        imagePath = cleanPath.replace('/@fs', ''); // Remove /@fs prefix
      } else if (typeof coverImagePath === 'string') {
        // Handle string paths
        if (coverImagePath.includes('../../assets/')) {
          const assetPath = coverImagePath.replace('../../assets/', 'src/assets/');
          imagePath = path.join(process.cwd(), assetPath);
        } else if (coverImagePath.startsWith('/')) {
          imagePath = path.join(process.cwd(), 'public', coverImagePath);
        } else {
          imagePath = path.join(process.cwd(), 'public', coverImagePath);
        }
      } else {
        throw new Error('Invalid coverImagePath format');
      }

      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      // Detect image format from extension
      const ext = path.extname(imagePath).toLowerCase();
      const mimeType = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
      coverImageBase64 = `data:${mimeType};base64,${base64Image}`;
    } catch (error) {
      // If image fails to load, no cover image
      console.error('OG Image - Failed to load:', error);
      coverImageBase64 = undefined;
    }
  }

  const logoBase64 = (() => {
    const logoPath = path.join(process.cwd(), 'src/images/opengraph/logo.png');
    const logoBuffer = fs.readFileSync(logoPath);
    return `data:image/png;base64,${logoBuffer.toString('base64')}`;
  })();

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        position: "relative",
      }}
    >
      {/* Cover image if available */}
      {coverImageBase64 && (
        <img
          src={coverImageBase64}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      )}

      {/* Dark overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: coverImageBase64
            ? "linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.75))"
            : "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
        }}
      />

      {/* Content layer */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          padding: "60px",
          position: "relative",
        }}
      >
        {/* Logo at top */}
        <div
          style={{
            display: "flex",
            marginBottom: "auto",
          }}
        >
          <img
            src={logoBase64}
            width={120}
            height={120}
            style={{
              objectFit: "contain",
            }}
          />
        </div>

        {/* Title and blue accent bar */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "24px",
            alignItems: "flex-start",
          }}
        >
          {/* Vertical blue accent bar */}
          <div
            style={{
              width: "12px",
              minHeight: "200px",
              background: "#3b82f6",
              borderRadius: "6px",
              flexShrink: 0,
            }}
          />

          {/* Text content */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0px",
              flex: 1,
            }}
          >
            {/* Title */}
            <h1
              style={{
                fontSize: "56px",
                fontWeight: "bold",
                color: "white",
                fontFamily: "Inter",
                lineHeight: 1.15,
                margin: 0,
                padding: 0,
                maxWidth: "100%",
                wordBreak: "break-word",
              }}
            >
              {title}
            </h1>

            {/* Description */}
            {description && (
              <p
                style={{
                  fontSize: "28px",
                  fontWeight: "normal",
                  color: "#f3f4f6",
                  fontFamily: "Inter",
                  lineHeight: 1.4,
                  margin: "24px 0 0 0",
                  padding: 0,
                  maxWidth: "100%",
                  wordBreak: "break-word",
                }}
              >
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}