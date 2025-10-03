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

    // Get cover image - we need the filesystem path, not the optimized URL
    let coverImagePath: string | undefined;
    const coverImage = post.data.cover?.image;

    if (coverImage) {
      if (typeof coverImage === 'string') {
        // Tunes collection has string paths
        coverImagePath = coverImage;
      } else if (typeof coverImage === 'object') {
        // Blog collection has image objects
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
            // Pattern: src/assets/YYYY-MM-DD-slug/blog-cover-YYYY-MM-DD-slug.[ext]
            const postSlug = `${year}-${month}-${day}-${slug}`;
            const assetsDir = path.join(process.cwd(), 'src/assets', postSlug);
            const baseName = `blog-cover-${postSlug}`;

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

export const GET: APIRoute = async function get({ props }) {
  const { title, description, coverImagePath } = props as Props;
  const png = await PNG(OG(title, description, coverImagePath));
  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
    },
  });
};