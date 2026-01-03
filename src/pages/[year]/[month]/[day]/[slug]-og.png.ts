import type { APIRoute, InferGetStaticPropsType } from "astro";
import { getCollection } from "astro:content";
import { createUrlFriendlySlug } from "../../../../utils/url";
import OG from "../../../../components/OpenGraph/OG";
import { PNG } from "../../../../components/OpenGraph/createImage";
import path from "path";
import fs from "fs";

export async function getStaticPaths() {
  const blogPosts = await getCollection("blog");
  const tunesPosts = await getCollection("tunes");
  const allPosts = [...blogPosts, ...tunesPosts];

  return allPosts.map((post) => {
    const date = post.data.pubDate;
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const slug = createUrlFriendlySlug(post.data.title);
    const isTune = post.collection === 'tunes';

    // Get cover image - we need the filesystem path, not the optimized URL
    let coverImagePath: string | undefined;
    const coverImage = post.data.cover?.image;

    if (coverImage) {
      if (typeof coverImage === 'string') {
        // Legacy string paths (if any)
        coverImagePath = coverImage;
      } else if (typeof coverImage === 'object') {
        // Image objects from image() schema
        // The image object has fsPath property in newer Astro versions
        // Or we reconstruct from the pattern
        const imageSrc = (coverImage as any).fsPath || (coverImage as any).src;

        if (imageSrc) {
          if (path.isAbsolute(imageSrc)) {
            // Already an absolute path (newer Astro dev mode)
            coverImagePath = imageSrc;
          } else if (imageSrc.includes('/@fs')) {
            // Older Astro dev mode format
            coverImagePath = imageSrc.split('?')[0].replace('/@fs', '');
          } else if (imageSrc.startsWith('/_astro')) {
            // Build mode - reconstruct original path from post slug
            // Pattern: src/assets/YYYY-MM-DD-slug/{blog|tunes}-cover-YYYY-MM-DD-slug.[ext]
            const postSlug = `${year}-${month}-${day}-${slug}`;
            const assetsDir = path.join(process.cwd(), 'src/assets', postSlug);
            const coverPrefix = isTune ? 'tunes-cover' : 'blog-cover';
            const baseName = `${coverPrefix}-${postSlug}`;

            // Try common extensions
            const extensions = ['.png', '.jpg', '.jpeg', '.webp'];

            for (const ext of extensions) {
              const tryPath = path.join(assetsDir, baseName + ext);
              if (fs.existsSync(tryPath)) {
                coverImagePath = tryPath;
                break;
              }
            }
          }
        }
      }
    }

    return {
      params: {
        year,
        month,
        day,
        slug,
      },
      props: {
        title: post.data.title,
        description: post.data.description,
        coverImagePath: coverImagePath,
      },
    };
  });
}

type Props = InferGetStaticPropsType<typeof getStaticPaths>;

import crypto from 'node:crypto';

// Ensure cache directory exists
const CACHE_DIR = path.join(process.cwd(), 'node_modules/.cache/og-images');
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

export const GET: APIRoute = async function get({ props }) {
  const { title, description, coverImagePath } = props as Props;

  // Generate a hash based on the content
  const hash = crypto.createHash('md5');
  hash.update(JSON.stringify({ title, description }));

  // Add cover image content hash if it exists
  if (coverImagePath && fs.existsSync(coverImagePath)) {
    const fileBuffer = fs.readFileSync(coverImagePath);
    hash.update(fileBuffer);
  } else if (coverImagePath) {
    // If path exists but file doesn't (weird case), just hash the path
    hash.update(coverImagePath);
  }

  const digest = hash.digest('hex');
  const cacheFile = path.join(CACHE_DIR, `${digest}.png`);

  let pngBuffer: Buffer;

  if (fs.existsSync(cacheFile)) {
    console.log(`OG - Serving cached image for: ${title}`);
    pngBuffer = fs.readFileSync(cacheFile);
  } else {
    console.log(`OG - Generating new image for: ${title}`);
    pngBuffer = await PNG(OG(title, description, coverImagePath));
    fs.writeFileSync(cacheFile, pngBuffer);
  }

  return new Response(new Uint8Array(pngBuffer), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable"
    },
  });
};