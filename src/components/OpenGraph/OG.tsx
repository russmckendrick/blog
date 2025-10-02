import React from "react";
import fs from "fs";
import path from "path";

export default function OG(
  title: string = "Russ McKendrick - Blog",
  description?: string,
  coverImagePath?: string,
) {
  // Convert cover image to base64 if it exists
  let backgroundStyle;

  if (coverImagePath) {
    try {
      const imagePath = path.join(process.cwd(), 'public', coverImagePath);
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const imageUrl = `data:image/png;base64,${base64Image}`;

      backgroundStyle = {
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.6)), url(${imageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      };
    } catch (error) {
      // If image fails to load, use gradient
      backgroundStyle = {
        background: "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
      };
    }
  } else {
    backgroundStyle = {
      background: "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
    };
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        ...backgroundStyle,
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
          src={(() => {
            const logoPath = path.join(process.cwd(), 'src/images/opengraph/logo.png');
            const logoBuffer = fs.readFileSync(logoPath);
            return `data:image/png;base64,${logoBuffer.toString('base64')}`;
          })()}
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
  );
}