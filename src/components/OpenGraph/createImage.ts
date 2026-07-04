import fs from "fs/promises";
import satori from "satori";
import sharp from "sharp";
import type { ReactNode } from "react";

export async function SVG(component: ReactNode) {
  return await satori(component, {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: "Source Serif 4",
        data: await fs.readFile(
          "./src/images/opengraph/fonts/SourceSerif4-Regular.ttf",
        ),
        weight: 400,
      },
      {
        name: "Source Serif 4",
        data: await fs.readFile(
          "./src/images/opengraph/fonts/SourceSerif4-Bold.ttf",
        ),
        weight: 700,
      },
      {
        name: "IBM Plex Mono",
        data: await fs.readFile(
          "./src/images/opengraph/fonts/IBMPlexMono-Medium.ttf",
        ),
        weight: 500,
      },
    ],
  });
}

export async function PNG(component: ReactNode) {
  return await sharp(Buffer.from(await SVG(component)))
    .png({
      compressionLevel: 8, // Slightly reduced from 9
      quality: 80,         // Good balance
      effort: 3            // Lower effort = much faster generation (1-10 range)
    })
    .toBuffer();
}
