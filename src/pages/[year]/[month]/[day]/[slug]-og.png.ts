import type { APIRoute, InferGetStaticPropsType } from "astro";
import { getCollection } from "astro:content";
import { createUrlFriendlySlug } from "../../../../utils/url";
import OG from "../../../../components/OpenGraph/OG";
import { PNG } from "../../../../components/OpenGraph/createImage";

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

    // Get cover image path if it exists
    const coverImage = post.data.cover?.image;

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
        coverImage: coverImage || undefined,
      },
    };
  });
}

type Props = InferGetStaticPropsType<typeof getStaticPaths>;

export const GET: APIRoute = async function get({ props }) {
  const { title, description, coverImage } = props as Props;
  const png = await PNG(OG(title, description, coverImage));
  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
    },
  });
};