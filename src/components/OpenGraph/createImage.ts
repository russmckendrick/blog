import fs from "fs/promises";
import satori from "satori";
import sharp from "sharp";

export async function SVG(component: JSX.Element) {
  return await satori(component, {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: "Inter",
        data: await fs.readFile(
          "./src/images/opengraph/fonts/Inter-Regular.ttf",
        ),
        weight: 400,
      },
      {
        name: "Inter",
        data: await fs.readFile(
          "./src/images/opengraph/fonts/Inter-ExtraBold.ttf",
        ),
        weight: 800,
      },
    ],
  });
}

export async function PNG(component: JSX.Element) {
  return await sharp(Buffer.from(await SVG(component)))
    .png()
    .toBuffer();
}