<page>
---
title: Overview · Cloudflare Images docs
description: Streamline your image infrastructure with Cloudflare Images. Store,
  transform, and deliver images efficiently using Cloudflare's global network.
lastUpdated: 2025-03-14T16:33:10.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/
  md: https://developers.cloudflare.com/images/index.md
---

Store, transform, optimize, and deliver images at scale

Available on all plans

Cloudflare Images provides an end-to-end solution designed to help you streamline your image infrastructure from a single API and runs on [Cloudflare's global network](https://www.cloudflare.com/network/).

There are two different ways to use Images:

* **Efficiently store and deliver images.** You can upload images into Cloudflare Images and dynamically deliver multiple variants of the same original image.
* **Optimize images that are stored outside of Images** You can make transformation requests to optimize any publicly available image on the Internet.

Cloudflare Images is available on both [Free and Paid plans](https://developers.cloudflare.com/images/pricing/). By default, all users have access to the Images Free plan, which includes limited usage of the transformations feature to optimize images in remote sources.

Image Resizing is now available as transformations

All Image Resizing features are available as transformations with Images. Each unique transformation is billed only once per 30 days.

If you are using a legacy plan with Image Resizing, visit the [dashboard](https://dash.cloudflare.com/) to switch to an Imagesplan.

***

## Features

### Storage

Use Cloudflare’s edge network to store your images.

[Use Storage](https://developers.cloudflare.com/images/upload-images/)

### Direct creator upload

Accept uploads directly and securely from your users by generating a one-time token.

[Use Direct creator upload](https://developers.cloudflare.com/images/upload-images/direct-creator-upload/)

### Variants

Add up to 100 variants to specify how images should be resized for various use cases.

[Create variants by transforming images](https://developers.cloudflare.com/images/transform-images)

### Signed URLs

Control access to your images by using signed URL tokens.

[Serve private images](https://developers.cloudflare.com/images/manage-images/serve-images/serve-private-images)

***

## More resources

[Community Forum](https://community.cloudflare.com/c/developers/images/63)

Engage with other users and the Images team on Cloudflare support forum.

</page>

<page>
---
title: 404 - Page Not Found · Cloudflare Images docs
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/404/
  md: https://developers.cloudflare.com/images/404/index.md
---

# 404

Check the URL, try using our [search](https://developers.cloudflare.com/search/) or try our LLM-friendly [llms.txt directory](https://developers.cloudflare.com/llms.txt).

</page>

<page>
---
title: Demos and architectures · Cloudflare Images docs
description: Learn how you can use Images within your existing architecture.
lastUpdated: 2024-08-13T19:56:56.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/demos/
  md: https://developers.cloudflare.com/images/demos/index.md
---

Learn how you can use Images within your existing architecture.

## Demos

Explore the following demo applications for Images.

* [Wildebeest:](https://github.com/cloudflare/wildebeest) Wildebeest is an ActivityPub and Mastodon-compatible server whose goal is to allow anyone to operate their Fediverse server and identity on their domain without needing to keep infrastructure, with minimal setup and maintenance, and running in minutes.

## Reference architectures

Explore the following reference architectures that use Images:

[Optimizing image delivery with Cloudflare image resizing and R2](https://developers.cloudflare.com/reference-architecture/diagrams/content-delivery/optimizing-image-delivery-with-cloudflare-image-resizing-and-r2/)

[Learn how to get a scalable, high-performance solution to optimizing image delivery.](https://developers.cloudflare.com/reference-architecture/diagrams/content-delivery/optimizing-image-delivery-with-cloudflare-image-resizing-and-r2/)

[Fullstack applications](https://developers.cloudflare.com/reference-architecture/diagrams/serverless/fullstack-application/)

[A practical example of how these services come together in a real fullstack application architecture.](https://developers.cloudflare.com/reference-architecture/diagrams/serverless/fullstack-application/)

</page>

<page>
---
title: Examples · Cloudflare Images docs
lastUpdated: 2025-04-03T11:41:17.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/examples/
  md: https://developers.cloudflare.com/images/examples/index.md
---

[Transcode images](https://developers.cloudflare.com/images/examples/transcode-from-workers-ai/)

Transcode an image from Workers AI before uploading to R2

[Watermarks](https://developers.cloudflare.com/images/examples/watermark-from-kv/)

Draw a watermark from KV on an image from R2

</page>

<page>
---
title: Getting started · Cloudflare Images docs
description: In this guide, you will get started with Cloudflare Images and make
  your first API request.
lastUpdated: 2025-05-29T18:16:56.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/get-started/
  md: https://developers.cloudflare.com/images/get-started/index.md
---

In this guide, you will get started with Cloudflare Images and make your first API request.

## Prerequisites

Before you make your first API request, ensure that you have a Cloudflare Account ID and an API token.

Refer to [Find zone and account IDs](https://developers.cloudflare.com/fundamentals/account/find-account-and-zone-ids/) for help locating your Account ID and [Create an API token](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/) to learn how to create an access your API token.

## Make your first API request

```bash
curl --request POST \
  --url https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/images/v1 \
  --header 'Authorization: Bearer <API_TOKEN>' \
  --header 'Content-Type: multipart/form-data' \
  --form file=@./<YOUR_IMAGE.IMG>
```

## Enable transformations on your zone

You can dynamically optimize images that are stored outside of Cloudflare Images and deliver them using [transformation URLs](https://developers.cloudflare.com/images/transform-images/transform-via-url/).

Cloudflare will automatically cache every transformed image on our global network so that you store only the original image at your origin.

To enable transformations on your zone:

1. Log in to the [Cloudflare dashboard](https://dash.cloudflare.com/login) and select your account.
2. Go to **Images** > **Transformations**.
3. Go to the specific zone where you want to enable transformations.
4. Select **Enable for zone**. This will allow you to optimize and deliver remote images.

Note

With **Resize images from any origin** unchecked, only the initial URL passed will be checked. Any redirect returned will be followed, including if it leaves the zone, and the resulting image will be transformed.

Note

If you are using transformations in a Worker, you need to include the appropriate logic in your Worker code to prevent resizing images from any origin. Unchecking this option in the dash does not apply to transformation requests coming from Cloudflare Workers.

</page>

<page>
---
title: Images API Reference · Cloudflare Images docs
lastUpdated: 2024-12-16T22:33:26.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/images-api/
  md: https://developers.cloudflare.com/images/images-api/index.md
---


</page>

<page>
---
title: Manage uploaded images · Cloudflare Images docs
lastUpdated: 2024-08-30T16:09:27.000Z
chatbotDeprioritize: true
source_url:
  html: https://developers.cloudflare.com/images/manage-images/
  md: https://developers.cloudflare.com/images/manage-images/index.md
---

* [Apply blur](https://developers.cloudflare.com/images/manage-images/blur-variants/)
* [Browser TTL](https://developers.cloudflare.com/images/manage-images/browser-ttl/)
* [Configure webhooks](https://developers.cloudflare.com/images/manage-images/configure-webhooks/)
* [Create variants](https://developers.cloudflare.com/images/manage-images/create-variants/)
* [Enable flexible variants](https://developers.cloudflare.com/images/manage-images/enable-flexible-variants/)
* [Delete variants](https://developers.cloudflare.com/images/manage-images/delete-variants/)
* [Edit images](https://developers.cloudflare.com/images/manage-images/edit-images/)
* [Serve images](https://developers.cloudflare.com/images/manage-images/serve-images/)
* [Export images](https://developers.cloudflare.com/images/manage-images/export-images/)
* [Delete images](https://developers.cloudflare.com/images/manage-images/delete-images/)

</page>

<page>
---
title: Platform · Cloudflare Images docs
lastUpdated: 2024-11-12T19:01:32.000Z
chatbotDeprioritize: true
source_url:
  html: https://developers.cloudflare.com/images/platform/
  md: https://developers.cloudflare.com/images/platform/index.md
---

* [Changelog](https://developers.cloudflare.com/images/platform/changelog/)

</page>

<page>
---
title: Cloudflare Polish · Cloudflare Images docs
description: Cloudflare Polish is a one-click image optimization product that
  automatically optimizes images in your site. Polish strips metadata from
  images and reduces image size through lossy or lossless compression to
  accelerate the speed of image downloads.
lastUpdated: 2024-08-13T19:56:56.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/polish/
  md: https://developers.cloudflare.com/images/polish/index.md
---

Cloudflare Polish is a one-click image optimization product that automatically optimizes images in your site. Polish strips metadata from images and reduces image size through lossy or lossless compression to accelerate the speed of image downloads.

When an image is fetched from your origin, our systems automatically optimize it in Cloudflare's cache. Subsequent requests for the same image will get the smaller, faster, optimized version of the image, improving the speed of your website.

![Example of Polish compression's quality.](https://developers.cloudflare.com/_astro/polish.DBlbPZoO_GT9cH.webp)

## Comparison

* **Polish** automatically optimizes all images served from your origin server. It keeps the same image URLs, and does not require changing markup of your pages.
* **Cloudflare Images** API allows you to create new images with resizing, cropping, watermarks, and other processing applied. These images get their own new URLs, and you need to embed them on your pages to take advantage of this service. Images created this way are already optimized, and there is no need to apply Polish to them.

## Availability

| | Free | Pro | Business | Enterprise |
| - | - | - | - | - |
| Availability | No | Yes | Yes | Yes |

</page>

<page>
---
title: Pricing · Cloudflare Images docs
description: By default, all users are on the Images Free plan. The Free plan
  includes access to the transformations feature, which lets you optimize images
  stored outside of Images, like in R2.
lastUpdated: 2025-07-15T08:29:55.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/pricing/
  md: https://developers.cloudflare.com/images/pricing/index.md
---

By default, all users are on the Images Free plan. The Free plan includes access to the transformations feature, which lets you optimize images stored outside of Images, like in R2.

The Paid plan allows transformations, as well as access to storage in Images.

Pricing is dependent on which features you use. The table below shows which metrics are used for each use case.

| Use case | Metrics | Availability |
| - | - | - |
| Optimize images stored outside of Images | Images Transformed | Free and Paid plans |
| Optimized images that are stored in Cloudflare Images | Images Stored, Images Delivered | Only Paid plans |

## Images Free

On the Free plan, you can request up to 5,000 unique transformations each month for free.

Once you exceed 5,000 unique transformations:

* Existing transformations in cache will continue to be served as expected.
* New transformations will return a `9422` error. If your source image is from the same domain where the transformation is served, then you can use the [`onerror` parameter](https://developers.cloudflare.com/images/transform-images/transform-via-url/#onerror) to redirect to the original image.
* You will not be charged for exceeding the limits in the Free plan.

To request more than 5,000 unique transformations each month, you can purchase an Images Paid plan.

## Images Paid

When you purchase an Images Paid plan, you can choose your own storage or add storage in Images.

| Metric | Pricing |
| - | - |
| Images Transformed | First 5,000 unique transformations included + $0.50 / 1,000 unique transformations / month |
| Images Stored | $5 / 100,000 images stored / month |
| Images Delivered | $1 / 100,000 images delivered / month |

If you optimize an image stored outside of Images, then you will be billed only for Images Transformed.

Alternatively, Images Stored and Images Delivered apply only to images that are stored in your Images bucket. When you optimize an image that is stored in Images, then this counts toward Images Delivered — not Images Transformed.

## Metrics

### Images Transformed

A unique transformation is a request to transform an original image based on a set of [supported parameters](https://developers.cloudflare.com/images/transform-images/transform-via-url/#options). This metric is used only when optimizing images that are stored outside of Images.

For example, if you transform `thumbnail.jpg` as 100x100, then this counts as 1 unique transformation. If you transform the same `thumbnail.jpg` as 200x200, then this counts as a separate unique transformation.

You are billed for the number of unique transformations that are counted during each billing period.

Unique transformations are counted over a 30-day sliding window. For example, if you request `width=100/thumbnail.jpg` on June 30, then this counts once for that billing period. If you request the same transformation on July 1, then this will not count as a billable request, since the same transformation was already requested within the last 30 days.

The `format` parameter counts as only 1 billable transformation, even if multiple copies of an image are served. In other words, if `width=100,format=auto/thumbnail.jpg` is served to some users as AVIF and to others as WebP, then this counts as 1 unique transformation instead of 2.

### Images Stored

Storage in Images is available only with an Images Paid plan. You can purchase storage in increments of $5 for every 100,000 images stored per month.

You can create predefined variants to specify how an image should be resized, such as `thumbnail` as 100x100 and `hero` as 1600x500.

Only uploaded images count toward Images Stored; defining variants will not impact your storage limit.

### Images Delivered

For images that are stored in Images, you will incur $1 for every 100,000 images delivered per month. This metric does not include transformed images that are stored in remote sources.

Every image requested by the browser counts as 1 billable request.

#### Example

A retail website has a product page that uses Images to serve 10 images. If the page was visited 10,000 times this month, then this results in 100,000 images delivered — or $1.00 in billable usage.

</page>

<page>
---
title: Reference · Cloudflare Images docs
lastUpdated: 2024-08-30T13:02:26.000Z
chatbotDeprioritize: true
source_url:
  html: https://developers.cloudflare.com/images/reference/
  md: https://developers.cloudflare.com/images/reference/index.md
---

* [Troubleshooting](https://developers.cloudflare.com/images/reference/troubleshooting/)
* [Security](https://developers.cloudflare.com/images/reference/security/)

</page>

<page>
---
title: Transform images · Cloudflare Images docs
description: Transformations let you optimize and manipulate images stored
  outside of the Cloudflare Images product. Transformed images are served from
  one of your zones on Cloudflare.
lastUpdated: 2025-07-08T19:32:52.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/transform-images/
  md: https://developers.cloudflare.com/images/transform-images/index.md
---

Transformations let you optimize and manipulate images stored outside of the Cloudflare Images product. Transformed images are served from one of your zones on Cloudflare.

To transform an image, you must [enable transformations for your zone](https://developers.cloudflare.com/images/get-started/#enable-transformations-on-your-zone).

You can transform an image by using a [specially-formatted URL](https://developers.cloudflare.com/images/transform-images/transform-via-url/) or [through Workers](https://developers.cloudflare.com/images/transform-images/transform-via-workers/).

## Supported formats and limitations

### Supported input formats

* JPEG
* PNG
* GIF (including animations)
* WebP (including animations)
* SVG
* HEIC

Note

Cloudflare can ingest HEIC images for decoding, but they must be served in web-safe formats such as AVIF, WebP, JPG, or PNG.

### Supported output formats

* JPEG
* PNG
* GIF (including animations)
* WebP (including animations)
* SVG
* AVIF

### Supported features

Transformations can:

* Resize and generate JPEG and PNG images, and optionally AVIF or WebP.
* Save animations as GIF or animated WebP.
* Support ICC color profiles in JPEG and PNG images.
* Preserve JPEG metadata (metadata of other formats is discarded).
* Convert the first frame of GIF/WebP animations to a still image.

## SVG files

Cloudflare Images can deliver SVG files. However, as this is an [inherently scalable format](https://www.w3.org/TR/SVG2/), Cloudflare does not resize SVGs.

As such, Cloudflare Images variants cannot be used to resize SVG files. Variants, named or flexible, are intended to transform bitmap (raster) images into whatever size you want to serve them.

You can, nevertheless, use variants to serve SVGs, using any named variant as a placeholder to allow your image to be delivered. For example:

```txt
https://imagedelivery.net/<ACCOUNT_HASH>/<SVG_ID>/public
```

Cloudflare recommends you use named variants with SVG files. If you use flexible variants, all your parameters will be ignored. In either case, Cloudflare applies SVG sanitizing to your files.

You can also use image transformations to sanitize SVG files stored in your origin. However, as stated above, transformations will ignore all transform parameters, as Cloudflare does not resize SVGs.

### Sanitized SVGs

Cloudflare sanitizes SVG files with `svg-hush` before serving them. This open-source tool developed by Cloudflare is intended to make SVGs as safe as possible. Because SVG files are XML documents, they can have links or JavaScript features that may pose a security concern. As such, `svg-hush` filters SVGs and removes any potential risky features, such as:

* **Scripting**: Prevents SVG files from being used for cross-site scripting attacks. Although browsers do not allow scripts in the `<img>` tag, they do allow scripting when SVG files are opened directly as a top-level document.
* **Hyperlinks to other documents**: Makes SVG files less attractive for SEO spam and phishing.
* **References to cross-origin resources**: Stops third parties from tracking who is viewing the image.

SVG files can also contain embedded images in other formats, like JPEG and PNG, in the form of [Data URLs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs). Cloudflare treats these embedded images just like other images that we process, and optimizes them too. Cloudflare does not support SVG files embedded in SVG recursively, though.

Cloudflare still uses Content Security Policy (CSP) headers to disable unwanted features, but filtering acts as a defense-in-depth in case these headers are lost (for instance, if the image was saved as a file and served elsewhere).

`svg-hush` is open-source. It is written in Rust and can filter SVG files in a streaming fashion without buffering, so it is fast enough for filtering on the fly.

For more information about `svg-hush`, refer to [Cloudflare GitHub repository](https://github.com/cloudflare/svg-hush).

### Format limitations

Since some image formats require longer computational times than others, Cloudflare has to find a proper balance between the time it takes to generate an image and to transfer it over the Internet.

Resizing requests might not be fulfilled with the format the user expects due to these trade-offs Cloudflare has to make. Images differ in size, transformations, codecs and all of these different aspects influence what compression codecs are used.

Cloudflare tries to choose the requested codec, but we operate on a best-effort basis and there are limits that our system needs to follow to satisfy all customers.

AVIF encoding, in particular, can be an order of magnitude slower than encoding to other formats. Cloudflare will fall back to WebP or JPEG if the image is too large to be encoded quickly.

#### Limits per format

Hard limits refers to the maximum image size to process. Soft limits refers to the limits existing when the system is overloaded.

| File format | Hard limits on the longest side (width or height) | Soft limits on the longest side (width or height) |
| - | - | - |
| AVIF | 1,200 pixels1 | 640 pixels |
| Other | 12,000 pixels | N/A |
| WebP | N/A | 2,560 pixels for lossy; 1920 pixels for lossless |

1Hard limit is 1,600 pixels when `format=avif` is explicitly used with [image transformations](https://developers.cloudflare.com/images/transform-images/).

All images have to be less than 70 MB. The maximum image area is limited to 100 megapixels (for example, 10,000 x 10,000 pixels large).

GIF/WebP animations are limited to a total of 50 megapixels (the sum of sizes of all frames). Animations that exceed this will be passed through unchanged without applying any transformations. Note that GIF is an outdated format and has very inefficient compression. High-resolution animations will be slow to process and will have very large file sizes. For video clips, Cloudflare recommends using [video formats like MP4 and WebM instead](https://developers.cloudflare.com/stream/).

Important

SVG files are passed through without resizing. This format is inherently scalable and does not need resizing. Cloudflare does not support the HEIC (HEIF) format and does not plan to support it.

AVIF format is supported on a best-effort basis. Images that cannot be compressed as AVIF will be served as WebP instead.

#### Progressive JPEG

While you can use the `format=jpeg` option to generate images in an interlaced progressive JPEG format, we will fallback to the baseline JPEG format for small and large images specified when:

* The area calculated by width x height is less than 150 x 150.
* The area calculated by width x height is greater than 3000 x 3000.

For example, a 50 x 50 tiny image is always formatted by `baseline-jpeg` even if you specify progressive jpeg (`format=jpeg`).

</page>

<page>
---
title: Tutorials · Cloudflare Images docs
lastUpdated: 2025-04-03T11:41:17.000Z
chatbotDeprioritize: true
source_url:
  html: https://developers.cloudflare.com/images/tutorials/
  md: https://developers.cloudflare.com/images/tutorials/index.md
---

* [Optimize mobile viewing](https://developers.cloudflare.com/images/tutorials/optimize-mobile-viewing/)
* [Transform user-uploaded images before uploading to R2](https://developers.cloudflare.com/images/tutorials/optimize-user-uploaded-image/)

</page>

<page>
---
title: Upload images · Cloudflare Images docs
description: Cloudflare Images allows developers to upload images using
  different methods, for a wide range of use cases.
lastUpdated: 2025-07-08T19:32:52.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/upload-images/
  md: https://developers.cloudflare.com/images/upload-images/index.md
---

Cloudflare Images allows developers to upload images using different methods, for a wide range of use cases.

## Supported image formats

You can upload the following image formats to Cloudflare Images:

* PNG
* GIF (including animations)
* JPEG
* WebP (Cloudflare Images also supports uploading animated WebP files)
* SVG
* HEIC

Note

Cloudflare can ingest HEIC images for decoding, but they must be served in web-safe formats such as AVIF, WebP, JPG, or PNG.

## Dimensions and sizes

These are the maximum allowed sizes and dimensions Cloudflare Images supports:

* Maximum image dimension is 12,000 pixels.
* Maximum image area is limited to 100 megapixels (for example, 10,000×10,000 pixels).
* Image metadata is limited to 1024 bytes.
* Images have a 10 megabyte (MB) size limit.
* Animated GIFs/WebP, including all frames, are limited to 50 megapixels (MP).

</page>

<page>
---
title: Transcode images · Cloudflare Images docs
description: Transcode an image from Workers AI before uploading to R2
lastUpdated: 2025-04-03T11:41:17.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/examples/transcode-from-workers-ai/
  md: https://developers.cloudflare.com/images/examples/transcode-from-workers-ai/index.md
---

```js
const stream = await env.AI.run(
  "@cf/bytedance/stable-diffusion-xl-lightning",
  {
    prompt: YOUR_PROMPT_HERE
  }
);


// Convert to AVIF
const image = (
  await env.IMAGES.input(stream)
    .output({format: "image/avif"})
).response();


const fileName = "image.avif";


// Upload to R2
await env.R2.put(fileName, image.body);
```

</page>

<page>
---
title: Watermarks · Cloudflare Images docs
description: Draw a watermark from KV on an image from R2
lastUpdated: 2025-04-03T11:41:17.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/examples/watermark-from-kv/
  md: https://developers.cloudflare.com/images/examples/watermark-from-kv/index.md
---

```ts
interface Env {
    BUCKET: R2Bucket,
    NAMESPACE: KVNamespace,
    IMAGES: ImagesBinding,
}
export default {
    async fetch(request, env, ctx): Promise<Response> {
        const watermarkKey = "my-watermark";
        const sourceKey = "my-source-image";


        const cache = await caches.open("transformed-images");
        const cacheKey = new URL(sourceKey + "/" + watermarkKey, request.url);
        const cacheResponse = await cache.match(cacheKey);


        if (cacheResponse) {
            return cacheResponse;
        }


        let watermark = await env.NAMESPACE.get(watermarkKey, "stream");
        let source = await env.BUCKET.get(sourceKey);


        if (!watermark || !source) {
            return new Response("Not found", { status: 404 });
        }


        const result = await env.IMAGES.input(source.body)
            .draw(watermark)
            .output({ format: "image/jpeg" });


        const response = result.response();


        ctx.waitUntil(cache.put(cacheKey, response.clone()));


        return result.response();
  },
} satisfies ExportedHandler<Env>;
```

</page>

<page>
---
title: Apply blur · Cloudflare Images docs
description: You can apply blur to image variants by creating a specific variant
  for this effect first or by editing a previously created variant. Note that
  you cannot blur an SVG file.
lastUpdated: 2024-08-13T19:56:56.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/manage-images/blur-variants/
  md: https://developers.cloudflare.com/images/manage-images/blur-variants/index.md
---

You can apply blur to image variants by creating a specific variant for this effect first or by editing a previously created variant. Note that you cannot blur an SVG file.

Refer to [Resize images](https://developers.cloudflare.com/images/manage-images/create-variants/) for help creating variants. You can also refer to the API to learn how to use blur using flexible variants.

To blur an image:

1. Log in to the [Cloudflare dashboard](https://dash.cloudflare.com/login) and select your account.
2. Select **Images** > **Variants**.
3. Find the variant you want to blur and select **Edit** > **Customization Options**.
4. Use the slider to adjust the blurring effect. You can use the preview image to see how strong the blurring effect will be.
5. Select **Save**.

The image should now display the blurred effect.

</page>

<page>
---
title: Browser TTL · Cloudflare Images docs
description: Browser TTL controls how long an image stays in a browser's cache
  and specifically configures the cache-control response header.
lastUpdated: 2024-08-13T19:56:56.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/manage-images/browser-ttl/
  md: https://developers.cloudflare.com/images/manage-images/browser-ttl/index.md
---

Browser TTL controls how long an image stays in a browser's cache and specifically configures the `cache-control` response header.

### Default TTL

By default, an image's TTL is set to two days to meet user needs, such as re-uploading an image under the same [Custom ID](https://developers.cloudflare.com/images/upload-images/upload-custom-path/).

## Custom setting

You can use two custom settings to control the Browser TTL, an account or a named variant. To adjust how long a browser should keep an image in the cache, set the TTL in seconds, similar to how the `max-age` header is set. The value should be an interval between one hour to one year.

### Browser TTL for an account

Setting the Browser TTL per account overrides the default TTL.

```bash
curl --request PATCH 'https://api.cloudflare.com/client/v4/accounts/{account_id}/images/v1/config' \
--header "Authorization: Bearer <API_TOKEN>" \
--header "Content-Type: application/json" \
--data '{
  "browser_ttl": 31536000
}'
```

When the Browser TTL is set to one year for all images, the response for the `cache-control` header is essentially `public`, `max-age=31536000`, `stale-while-revalidate=7200`.

### Browser TTL for a named variant

Setting the Browser TTL for a named variant is a more granular option that overrides all of the above when creating or updating an image variant, specifically the `browser_ttl` option in seconds.

```bash
curl 'https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_TAG>/images/v1/variants' \
--header "Authorization: Bearer <API_TOKEN>" \
--header "Content-Type: application/json" \
--data '{
  "id":"avatar",
  "options": {
    "width":100,
    "browser_ttl": 86400
  }
}'
```

When the Browser TTL is set to one day for images requested with this variant, the response for the `cache-control` header is essentially `public`, `max-age=86400`, `stale-while-revalidate=7200`.

Note

[Private images](https://developers.cloudflare.com/images/manage-images/serve-images/serve-private-images/) do not respect default or custom TTL settings. The private images cache time is set according to the expiration time and can be as short as one hour.

</page>

<page>
---
title: Configure webhooks · Cloudflare Images docs
description: You can set up webhooks to receive notifications about your upload
  workflow. This will send an HTTP POST request to a specified endpoint when an
  image either successfully uploads or fails to upload.
lastUpdated: 2024-10-28T15:41:58.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/manage-images/configure-webhooks/
  md: https://developers.cloudflare.com/images/manage-images/configure-webhooks/index.md
---

You can set up webhooks to receive notifications about your upload workflow. This will send an HTTP POST request to a specified endpoint when an image either successfully uploads or fails to upload.

Currently, webhooks are supported only for [direct creator uploads](https://developers.cloudflare.com/images/upload-images/direct-creator-upload/).

To receive notifications for direct creator uploads:

1. Log in to the [Cloudflare dashboard](https://dash.cloudflare.com/login) and select your account.
2. Go to **Notifications** > **Destinations**.
3. From the Webhooks card, select **Create**.
4. Enter information for your webhook and select **Save and Test**. The new webhook will appear in the **Webhooks** card and can be attached to notifications.
5. Next, go to **Notifications** > **All Notifications** and select **Add**.
6. Under the list of products, locate **Images** and select **Select**.
7. Give your notification a name and optional description.
8. Under the **Webhooks** field, select the webhook that you recently created.
9. Select **Save**.

</page>

<page>
---
title: Create variants · Cloudflare Images docs
description: Variants let you specify how images should be resized for different
  use cases. By default, images are served with a public variant, but you can
  create up to 100 variants to fit your needs. Follow these steps to create a
  variant.
lastUpdated: 2025-04-07T16:12:42.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/manage-images/create-variants/
  md: https://developers.cloudflare.com/images/manage-images/create-variants/index.md
---

Variants let you specify how images should be resized for different use cases. By default, images are served with a `public` variant, but you can create up to 100 variants to fit your needs. Follow these steps to create a variant.

Note

Cloudflare Images can deliver SVG files but will not resize them because it is an inherently scalable format. Resize via the Cloudflare dashboard.

1. Log in to the [Cloudflare dashboard](https://dash.cloudflare.com/login) and select your account.
2. Select **Images** > **Variants**.
3. Name your variant and select **Add New Variant**.
4. Define variables for your new variant, such as resizing options, type of fit, and specific metadata options.

## Resize via the API

Make a `POST` request to [create a variant](https://developers.cloudflare.com/api/resources/images/subresources/v1/subresources/variants/methods/create/).

```bash
curl "https://api.cloudflare.com/client/v4/accounts/{account_id}/images/v1/variants" \
--header "Authorization: Bearer <API_TOKEN>" \
--header "Content-Type: application/json" \
--data '{"id":"<NAME_OF_THE_VARIANT>","options":{"fit":"scale-down","metadata":"none","width":1366,"height":768},"neverRequireSignedURLs":true}
```

## Fit options

The `Fit` property describes how the width and height dimensions should be interpreted. The chart below describes each of the options.

| Fit Options | Behavior |
| - | - |
| Scale down | The image is shrunk in size to fully fit within the given width or height, but will not be enlarged. |
| Contain | The image is resized (shrunk or enlarged) to be as large as possible within the given width or height while preserving the aspect ratio. |
| Cover | The image is resized to exactly fill the entire area specified by width and height and will be cropped if necessary. |
| Crop | The image is shrunk and cropped to fit within the area specified by the width and height. The image will not be enlarged. For images smaller than the given dimensions, it is the same as `scale-down`. For images larger than the given dimensions, it is the same as `cover`. |
| Pad | The image is resized (shrunk or enlarged) to be as large as possible within the given width or height while preserving the aspect ratio. The extra area is filled with a background color (white by default). |

## Metadata options

Variants allow you to choose what to do with your image’s metadata information. From the **Metadata** dropdown, choose:

* Strip all metadata
* Strip all metadata except copyright
* Keep all metadata

## Public access

When the **Always allow public access** option is selected, particular variants will always be publicly accessible, even when images are made private through the use of [signed URLs](https://developers.cloudflare.com/images/manage-images/serve-images/serve-private-images).

</page>

<page>
---
title: Delete images · Cloudflare Images docs
description: You can delete an image from the Cloudflare Images storage using
  the dashboard or the API.
lastUpdated: 2024-12-16T22:33:26.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/manage-images/delete-images/
  md: https://developers.cloudflare.com/images/manage-images/delete-images/index.md
---

You can delete an image from the Cloudflare Images storage using the dashboard or the API.

## Delete images via the Cloudflare dashboard

1. Log in to the [Cloudflare dashboard](https://dash.cloudflare.com/login) and select your account.
2. Select **Images**.
3. Find the image you want to remove and select **Delete**.
4. (Optional) To delete more than one image, select the checkbox next to the images you want to delete and then **Delete selected**.

Your image will be deleted from your account.

## Delete images via the API

Make a `DELETE` request to the [delete image endpoint](https://developers.cloudflare.com/api/resources/images/subresources/v1/methods/delete/). `{image_id}` must be fully URL encoded in the API call URL.

```bash
curl --request DELETE https://api.cloudflare.com/client/v4/accounts/{account_id}/images/v1/{image_id} \
--header "Authorization: Bearer <API_TOKEN>"
```

After the image has been deleted, the response returns `"success": true`.

</page>

<page>
---
title: Delete variants · Cloudflare Images docs
description: You can delete variants via the Images dashboard or API. The only
  variant you cannot delete is public.
lastUpdated: 2024-08-13T19:56:56.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/manage-images/delete-variants/
  md: https://developers.cloudflare.com/images/manage-images/delete-variants/index.md
---

You can delete variants via the Images dashboard or API. The only variant you cannot delete is public.

Warning

Deleting a variant is a global action that will affect other images that contain that variant.

## Delete variants via the Cloudflare dashboard

1. Log in to the [Cloudflare dashboard](https://dash.cloudflare.com/login) and select your account.
2. Select **Images** > **Variants**.
3. Find the variant you want to remove and select **Delete**.

## Delete variants via the API

Make a `DELETE` request to the delete variant endpoint.

```bash
curl --request DELETE https://api.cloudflare.com/client/v4/account/{account_id}/images/v1/variants/{variant_name} \
--header "Authorization: Bearer <API_TOKEN>"
```

After the variant has been deleted, the response returns `"success": true.`

</page>

<page>
---
title: Edit images · Cloudflare Images docs
description: "The Edit option provides you available options to modify a
  specific image. After choosing to edit an image, you can:"
lastUpdated: 2024-08-13T19:56:56.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/manage-images/edit-images/
  md: https://developers.cloudflare.com/images/manage-images/edit-images/index.md
---

The Edit option provides you available options to modify a specific image. After choosing to edit an image, you can:

* Require signed URLs to use with that particular image.
* Use a cURL command you can use as an example to access the image.
* Use fully-formed URLs for all the variants configured in your account.

To edit an image:

1. Log in to the [Cloudflare dashboard](https://dash.cloudflare.com/login) and select your account.
2. In **Account Home**, select **Images**.
3. Locate the image you want to modify and select **Edit**.

</page>

<page>
---
title: Enable flexible variants · Cloudflare Images docs
description: Flexible variants allow you to create variants with dynamic
  resizing which can provide more options than regular variants allow. This
  option is not enabled by default.
lastUpdated: 2024-12-16T22:33:26.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/manage-images/enable-flexible-variants/
  md: https://developers.cloudflare.com/images/manage-images/enable-flexible-variants/index.md
---

Flexible variants allow you to create variants with dynamic resizing which can provide more options than regular variants allow. This option is not enabled by default.

## Enable flexible variants via the Cloudflare dashboard

1. Log in to the [Cloudflare dashboard](https://dash.cloudflare.com/login) and select your account.
2. Select **Images** > **Variants**.
3. Enable **Flexible variants**.

## Enable flexible variants via the API

Make a `PATCH` request to the [Update a variant endpoint](https://developers.cloudflare.com/api/resources/images/subresources/v1/subresources/variants/methods/edit/).

```bash
curl --request PATCH https://api.cloudflare.com/client/v4/accounts/{account_id}/images/v1/config \
--header "Authorization: Bearer <API_TOKEN>" \
--header "Content-Type: application/json" \
--data '{"flexible_variants": true}'
```

After activation, you can use [transformation parameters](https://developers.cloudflare.com/images/transform-images/transform-via-url/#options) on any Cloudflare image. For example,

`https://imagedelivery.net/{account_hash}/{image_id}/w=400,sharpen=3`

Note that flexible variants cannot be used for images that require a [signed delivery URL](https://developers.cloudflare.com/images/manage-images/serve-images/serve-private-images).

</page>

<page>
---
title: Export images · Cloudflare Images docs
description: Cloudflare Images supports image exports via the Cloudflare
  dashboard and API which allows you to get the original version of your image.
lastUpdated: 2024-08-13T19:56:56.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/manage-images/export-images/
  md: https://developers.cloudflare.com/images/manage-images/export-images/index.md
---

Cloudflare Images supports image exports via the Cloudflare dashboard and API which allows you to get the original version of your image.

## Export images via the Cloudflare dashboard

1. Log in to the [Cloudflare dashboard](https://dash.cloudflare.com/login) and select your account.
2. Select **Images**.
3. Find the image or images you want to export.
4. To export a single image, select **Export** from its menu. To export several images, select the checkbox next to each image and then select **Export selected**.

Your images are downloaded to your machine.

## Export images via the API

Make a `GET` request as shown in the example below. `<IMAGE_ID>` must be fully URL encoded in the API call URL.

`GET accounts/<ACCOUNT_ID>/images/v1/<IMAGE_ID>/blob`

</page>

<page>
---
title: Serve images · Cloudflare Images docs
lastUpdated: 2024-08-30T16:09:27.000Z
chatbotDeprioritize: true
source_url:
  html: https://developers.cloudflare.com/images/manage-images/serve-images/
  md: https://developers.cloudflare.com/images/manage-images/serve-images/index.md
---

* [Serve uploaded images](https://developers.cloudflare.com/images/manage-images/serve-images/serve-uploaded-images/)
* [Serve images from custom domains](https://developers.cloudflare.com/images/manage-images/serve-images/serve-from-custom-domains/)
* [Serve private images](https://developers.cloudflare.com/images/manage-images/serve-images/serve-private-images/)

</page>

<page>
---
title: Changelog · Cloudflare Images docs
description: Subscribe to RSS
lastUpdated: 2025-02-13T19:35:19.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/platform/changelog/
  md: https://developers.cloudflare.com/images/platform/changelog/index.md
---

[Subscribe to RSS](https://developers.cloudflare.com/images/platform/changelog/index.xml)

## 2024-04-04

**Images upload widget**

Use the upload widget to integrate Cloudflare Images into your application by embedding the script into a static HTML page or installing a package that works with your preferred framework. To try out the upload widget, [sign up for the closed beta](https://forms.gle/vBu47y3638k8fkGF8).

## 2024-04-04

**Face cropping**

Crop and resize images of people's faces at scale using the existing gravity parameter and saliency detection, which sets the focal point of an image based on the most visually interesting pixels. To apply face cropping to your image optimization, [sign up for the closed beta](https://forms.gle/2bPbuijRoqGi6Qn36).

## 2024-01-15

**Cloudflare Images and Images Resizing merge**

Cloudflare Images and Images Resizing merged to create a more centralized and unified experience for Cloudflare Images. To learn more about the merge, refer to the [blog post](https://blog.cloudflare.com/merging-images-and-image-resizing/).

</page>

<page>
---
title: Activate Polish · Cloudflare Images docs
description: Images in the cache must be purged or expired before seeing any
  changes in Polish settings.
lastUpdated: 2024-08-13T19:56:56.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/polish/activate-polish/
  md: https://developers.cloudflare.com/images/polish/activate-polish/index.md
---

Images in the [cache must be purged](https://developers.cloudflare.com/cache/how-to/purge-cache/) or expired before seeing any changes in Polish settings.

Warning

Do not activate Polish and [image transformations](https://developers.cloudflare.com/images/transform-images/) simultaneously. Image transformations already apply lossy compression, which makes Polish redundant.

1. Log in to the [Cloudflare dashboard](https://dash.cloudflare.com/) and select the account and domain where you want to activate Polish.
2. Go to **Speed** > **Optimization** > **Image Optimization**.
3. Under **Polish**, select *Lossy* or *Lossless* from the drop-down menu. [*Lossy*](https://developers.cloudflare.com/images/polish/compression/#lossy) gives greater file size savings.
4. (Optional) Select **WebP**. Enable this option if you want to further optimize PNG and JPEG images stored in the origin server, and serve them as WebP files to browsers that support this format.

To ensure WebP is not served from cache to a browser without WebP support, disable any WebP conversion utilities at your origin web server when using Polish.

Note

To use this feature on specific hostnames - instead of across your entire zone - use a [configuration rule](https://developers.cloudflare.com/rules/configuration-rules/).

</page>

<page>
---
title: Cf-Polished statuses · Cloudflare Images docs
description: Learn about Cf-Polished statuses in Cloudflare Images. Understand
  how to handle missing headers, optimize image formats, and troubleshoot common
  issues.
lastUpdated: 2025-04-02T16:11:44.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/polish/cf-polished-statuses/
  md: https://developers.cloudflare.com/images/polish/cf-polished-statuses/index.md
---

If a `Cf-Polished` header is not returned, try [using single-file cache purge](https://developers.cloudflare.com/cache/how-to/purge-cache) to purge the image. The `Cf-Polished` header may also be missing if the origin is sending non-image `Content-Type`, or non-cacheable `Cache-Control`.

* `input_too_large`: The input image is too large or complex to process, and needs a lower resolution. Cloudflare recommends using PNG or JPEG images that are less than 4,000 pixels in any dimension, and smaller than 20 MB.
* `not_compressed` or `not_needed`: The image was fully optimized at the origin server and no compression was applied.
* `webp_bigger`: Polish attempted to convert to WebP, but the WebP image was not better than the original format. Because the WebP version does not exist, the status is set on the JPEG/PNG version of the response. Refer to [the reasons why Polish chooses not to use WebP](https://developers.cloudflare.com/images/polish/no-webp/).
* `cannot_optimize` or `internal_error`: The input image is corrupted or incomplete at the origin server. Upload a new version of the image to the origin server.
* `format_not_supported`: The input image format is not supported (for example, BMP or TIFF) or the origin server is using additional optimization software that is not compatible with Polish. Try converting the input image to a web-compatible format (like PNG or JPEG) and/or disabling additional optimization software at the origin server.
* `vary_header_present`: The origin web server has sent a `Vary` header with a value other than `accept-encoding`. If the origin web server is attempting to support WebP, disable WebP at the origin web server and let Polish perform the WebP conversion. Polish will still work if `accept-encoding` is the only header listed within the `Vary` header. Polish skips image URLs processed by [Cloudflare Images](https://developers.cloudflare.com/images/transform-images/).

</page>

<page>
---
title: Polish compression · Cloudflare Images docs
description: Learn about Cloudflare's Polish compression options, including
  Lossless, Lossy, and WebP, to optimize image file sizes while managing
  metadata effectively.
lastUpdated: 2025-04-02T16:11:44.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/polish/compression/
  md: https://developers.cloudflare.com/images/polish/compression/index.md
---

With Lossless and Lossy modes, Cloudflare attempts to strip as much metadata as possible. However, Cloudflare cannot guarantee stripping all metadata because other factors, such as caching status, might affect which metadata is finally sent in the response.

Warning

Polish may not be applied to origin responses that contain a `Vary` header. The only accepted `Vary` header is `Vary: Accept-Encoding`.

## Compression options

### Off

Polish is disabled and no compression is applied. Disabling Polish does not revert previously polished images to original, until they expire or are purged from the cache.

### Lossless

The Lossless option attempts to reduce file sizes without changing any of the image pixels, keeping images identical to the original. It removes most metadata, like EXIF data, and losslessly recompresses image data. JPEG images may be converted to progressive format. On average, lossless compression reduces file sizes by 21 percent compared to unoptimized image files.

The Lossless option prevents conversion of JPEG to WebP, because this is always a lossy operation.

### Lossy

The Lossy option applies significantly better compression to images than the Lossless option, at a cost of small quality loss. When uncompressed, some of the redundant information from the original image is lost. On average, using Lossy mode reduces file sizes by 48 percent.

This option also removes metadata from images. The Lossy option mainly affects JPEG images, but PNG images may also be compressed in a lossy way, or converted to JPEG when this improves compression.

### WebP

When enabled, in addition to other optimizations, Polish creates versions of images converted to the WebP format.

WebP compression is quite effective on PNG images, reducing file sizes by approximately 26 percent. It may reduce file sizes of JPEG images by around 17 percent, but this [depends on several factors](https://developers.cloudflare.com/images/polish/no-webp/). WebP is supported in all browsers except for Internet Explorer and KaiOS. You can learn more in our [blog post](https://blog.cloudflare.com/a-very-webp-new-year-from-cloudflare/).

The WebP version is served only when the `Accept` header from the browser includes WebP, and the WebP image is significantly smaller than the lossy or lossless recompression of the original format:

```txt
Accept: image/avif,image/webp,image/*,*/*;q=0.8
```

Polish only converts standard image formats *to* the WebP format. If the origin server serves WebP images, Polish will not convert them, and will not optimize them.

#### File size, image quality, and WebP

Lossy formats like JPEG and WebP are able to generate files of any size, and every image could theoretically be made smaller. However, reduction in file size comes at a cost of reduction in image quality. Reduction of file sizes below each format's optimal size limit causes disproportionally large losses in quality. Re-encoding of files that are already optimized reduces their quality more than it reduces their file size.

Cloudflare will not convert from JPEG to WebP when the conversion would make the file bigger, or would reduce image quality by more than it would save in file size.

If you choose the Lossless Polish setting, then WebP will be used very rarely. This is due to the fact that, in this mode, WebP is only adequate for PNG images, and cannot improve compression for JPEG images.

Although WebP compresses better than JPEG on average, there are exceptions, and in some occasions JPEG compresses better than WebP. Cloudflare tries to detect these cases and keep the JPEG format.

If you serve low-quality JPEG images at the origin (quality setting 60 or lower), it may not be beneficial to convert them to WebP. This is because low-quality JPEG images have blocky edges and noise caused by compression, and these distortions increase file size of WebP images. We recommend serving high-quality JPEG images (quality setting between 80 and 90) at your origin server to avoid this issue.

If your server or Content Management System (CMS) has a built-in image converter or optimizer, it may interfere with Polish. It does not make sense to apply lossy optimizations twice to images, because quality degradation will be larger than the savings in file size.

## Polish interaction with Image optimization

Polish will not be applied to URLs using image transformations. Resized images already have lossy compression applied where possible, so they do not need the optimizations provided by Polish. Use the `format=auto` option to allow use of WebP and AVIF formats.

</page>

<page>
---
title: WebP may be skipped · Cloudflare Images docs
description: >-
  Polish avoids converting images to the WebP format when such conversion would
  increase the file size, or significantly degrade image quality.

  Polish also optimizes JPEG images, and the WebP format is not always better
  than a well-optimized JPEG.
lastUpdated: 2024-08-13T19:56:56.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/polish/no-webp/
  md: https://developers.cloudflare.com/images/polish/no-webp/index.md
---

Polish avoids converting images to the WebP format when such conversion would increase the file size, or significantly degrade image quality. Polish also optimizes JPEG images, and the WebP format is not always better than a well-optimized JPEG.

To enhance the use of WebP in Polish, enable the [Lossy option](https://developers.cloudflare.com/images/polish/compression/#lossy). When you create new JPEG images, save them with a slightly higher quality than usually necessary. We recommend JPEG quality settings between 85 and 95, but not higher. This gives Polish enough headroom for lossy conversion to WebP and optimized JPEG.

## In the **lossless** mode, it is not feasible to convert JPEG to WebP

WebP is actually a name for two quite different image formats: WebP-lossless (similar to PNG) and WebP-VP8 (similar to JPEG).

When the [Lossless option](https://developers.cloudflare.com/images/polish/compression/#lossless) is enabled, Polish will not perform any optimizations that change image pixels. This allows Polish to convert only between lossless image formats, such as PNG, GIF, and WebP-lossless. JPEG images will not be converted though, because the WebP-VP8 format does not support the conversion from JPEG without quality loss, and the WebP-lossless format does not compress images as heavily as JPEG.

In the lossless mode, Polish can still apply lossless optimizations to JPEG images. This is a unique feature of the JPEG format that does not have an equivalent in WebP.

## Low-quality JPEG images do not convert well to WebP

When JPEG files are already heavily compressed (for example, saved with a low quality setting like `q=50`, or re-saved many times), the conversion to WebP may not be beneficial, and may actually increase the file size. This is because lossy formats add distortions to images (for example, JPEG makes images blocky and adds noise around sharp edges), and the WebP format can not tell the difference between details of the image it needs to preserve and unwanted distortions caused by a previous compression. This forces WebP to wastefully use bytes on keeping the added noise and blockyness, which increases the file size, and makes compression less beneficial overall.

Polish never makes files larger. When we see that the conversion to WebP increases the file size, we skip it, and keep the smaller original file format.

## For some images conversion to WebP can degrade quality too much

The WebP format, in its more efficient VP8 mode, always loses some quality when compressing images. This means that the conversion from JPEG always makes WebP images look slightly worse. Polish ensures that file size savings from the conversion outweigh the quality loss.

Lossy WebP has a significant limitation: it can only keep one shade of color per 4 pixels. The color information is always stored at half of the image resolution. In high-resolution photos this degradation is rarely noticeable. However, in images with highly saturated colors and sharp edges, this limitation can result in the WebP format having noticeably pixelated or smudged edges.

Additionally, the WebP format applies smoothing to images. This feature hides blocky distortions that are a characteristic of low-quality JPEG images, but on the other hand it can cause loss of fine textures and details in high-quality images, making them look airbrushed.

Polish tries to avoid degrading images for too little gain. Polish keeps the JPEG format when it has about the same size as WebP, but better quality.

## Sometimes older formats are better than WebP

The WebP format has an advantage over JPEG when saving images with soft or blurry content, and when using low quality settings. WebP has fewer advantages when storing high-quality images with fine textures or noise. Polish applies optimizations to JPEG images too, and sometimes well-optimized JPEG is simply better than WebP, and gives a better quality and smaller file size at the same time. We try to detect these cases, and keep the JPEG format when it works better. Sometimes animations with little motion are more efficient as GIF than animated WebP.

The WebP format does not support progressive rendering. With [HTTP/2 prioritization](https://developers.cloudflare.com/speed/optimization/protocol/enhanced-http2-prioritization/) enabled, progressive JPEG images may appear to load quicker, even if their file sizes are larger.

## Beware of compression that is not better, only more of the same

With a lossy format like JPEG or WebP, it is always possible to take an existing image, save it with a slightly lower quality, and get an image that looks *almost* the same, but has a smaller file size. It is the [heap paradox](https://en.wikipedia.org/wiki/Sorites_paradox): you can remove a grain of sand from a heap, and still have a heap of sand. There is no point when you can not make the heap smaller, except when there is no sand left. It is always possible to make an image with a slightly lower quality, all the way until all the accumulated losses degrade the image beyond recognition.

Avoid applying multiple lossy optimization tools to images, before or after Polish. Multiple lossy operations degrade quality disproportionally more than what they save in file sizes.

For this reason Polish will not create the smallest possible file sizes. Instead, Polish aims to maximize the quality to file size ratio, to create the smallest possible files while preserving good quality. The quality level we stop at is carefully chosen to minimize visual distortion, while still having a high compression ratio.

</page>

<page>
---
title: Security · Cloudflare Images docs
description: To further ensure the security and efficiency of image optimization
  services, you can adopt Cloudflare products that safeguard against malicious
  activities.
lastUpdated: 2025-04-03T20:17:30.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/reference/security/
  md: https://developers.cloudflare.com/images/reference/security/index.md
---

To further ensure the security and efficiency of image optimization services, you can adopt Cloudflare products that safeguard against malicious activities.

Cloudflare security products like [Cloudflare WAF](https://developers.cloudflare.com/waf/), [Cloudflare Bot Management](https://developers.cloudflare.com/bots/get-started/bot-management/) and [Cloudflare Rate Limiting](https://developers.cloudflare.com/waf/rate-limiting-rules/) can enhance the protection of your image optimization requests against abuse. This proactive approach ensures a reliable and efficient experience for all legitimate users.

</page>

<page>
---
title: Troubleshooting · Cloudflare Images docs
description: "Does the response have a Cf-Resized header? If not, then resizing
  has not been attempted. Possible causes:"
lastUpdated: 2025-04-01T17:11:03.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/reference/troubleshooting/
  md: https://developers.cloudflare.com/images/reference/troubleshooting/index.md
---

## Requests without resizing enabled

Does the response have a `Cf-Resized` header? If not, then resizing has not been attempted. Possible causes:

* The feature is not enabled in the Cloudflare Dashboard.
* There is another Worker running on the same request. Resizing is "forgotten" as soon as one Worker calls another. Do not use Workers scoped to the entire domain `/*`.
* Preview in the Editor in Cloudflare Dashboard does not simulate image resizing. You must deploy the Worker and test from another browser tab instead.

***

## Error responses from resizing

When resizing fails, the response body contains an error message explaining the reason, as well as the `Cf-Resized` header containing `err=code`:

* 9401 — The required arguments in `{cf:image{…}}` options are missing or are invalid. Try again. Refer to [Fetch options](https://developers.cloudflare.com/images/transform-images/transform-via-workers/#fetch-options) for supported arguments.
* 9402 — The image was too large or the connection was interrupted. Refer to [Supported formats and limitations](https://developers.cloudflare.com/images/transform-images/) for more information.
* 9403 — A [request loop](https://developers.cloudflare.com/images/transform-images/transform-via-workers/#prevent-request-loops) occurred because the image was already resized or the Worker fetched its own URL. Verify your Worker path and image path on the server do not overlap.
* 9406 & 9419 — The image URL is a non-HTTPS URL or the URL has spaces or unescaped Unicode. Check your URL and try again.
* 9407 — A lookup error occurred with the origin server's domain name. Check your DNS settings and try again.
* 9404 — The image does not exist on the origin server or the URL used to resize the image is wrong. Verify the image exists and check the URL.
* 9408 — The origin server returned an HTTP 4xx status code and may be denying access to the image. Confirm your image settings and try again.
* 9509 — The origin server returned an HTTP 5xx status code. This is most likely a problem with the origin server-side software, not the resizing.
* 9412 — The origin server returned a non-image, for example, an HTML page. This usually happens when an invalid URL is specified or server-side software has printed an error or presented a login page.
* 9413 — The image exceeds the maximum image area of 100 megapixels. Use a smaller image and try again.
* 9420 — The origin server redirected to an invalid URL. Confirm settings at your origin and try again.
* 9421 — The origin server redirected too many times. Confirm settings at your origin and try again.
* 9422 - The transformation request is rejected because the usage limit was reached. If you need to request more than 5,000 unique transformations, upgrade to an Images Paid plan.
* 9432 — The Images Binding is not available using legacy billing. Your account is using the legacy Image Resizing subscription. To bind Images to your Worker, you will need to update your plan to the Images subscription in the dashboard.
* 9504, 9505, & 9510 — The origin server could not be contacted because the origin server may be down or overloaded. Try again later.
* 9523 — The `/cdn-cgi/image/` resizing service could not perform resizing. This may happen when an image has invalid format. Use correctly formatted image and try again.
* 9524 — The `/cdn-cgi/image/` resizing service could not perform resizing. This may happen when an image URL is intercepted by a Worker. As an alternative you can [resize within the Worker](https://developers.cloudflare.com/images/transform-images/transform-via-workers/). This can also happen when using a `pages.dev` URL of a [Cloudflare Pages](https://developers.cloudflare.com/pages/) project. In that case, you can use a [Custom Domain](https://developers.cloudflare.com/pages/configuration/custom-domains/) instead.
* 9520 — The image format is not supported. Refer to [Supported formats and limitations](https://developers.cloudflare.com/images/transform-images/) to learn about supported input and output formats.
* 9522 — The image exceeded the processing limit. This may happen briefly after purging an entire zone or when files with very large dimensions are requested. If the problem persists, contact support.
* 9422, 9424, 9516, 9517, 9518, 9522 & 9523 — Internal errors. Please contact support if you encounter these errors.

***

## Limits

* Maximum image size is 100 megapixels (meaning 10.000×10.000 pixels large). Maximum file size is 100 MB. GIF/WebP animations are limited to 50 megapixels total (sum of sizes of all frames).
* Image Resizing is not compatible with [Bringing Your Own IPs (BYOIP)](https://developers.cloudflare.com/byoip/).
* When Polish can't optimize an image the Response Header `Warning: cf-images 299 "original is smaller"` is returned.

***

## Authorization and cookies are not supported

Image requests to the origin will be anonymized (no cookies, no auth, no custom headers). This is because we have to have one public cache for resized images, and it would be unsafe to share images that are personalized for individual visitors.

However, in cases where customers agree to store such images in public cache, Cloudflare supports resizing images through Workers [on authenticated origins](https://developers.cloudflare.com/images/transform-images/transform-via-workers/).

***

## Caching and purging

Changes to image dimensions or other resizing options always take effect immediately — no purging necessary.

Image requests consists of two parts: running Worker code, and image processing. The Worker code is always executed and uncached. Results of image processing are cached for one hour or longer if origin server's `Cache-Control` header allows. Source image is cached using regular caching rules. Resizing follows redirects internally, so the redirects are cached too.

Because responses from Workers themselves are not cached at the edge, purging of *Worker URLs* does nothing. Resized image variants are cached together under their source’s URL. When purging, use the (full-size) source image’s URL, rather than URLs of the Worker that requested resizing.

If the origin server sends an `Etag` HTTP header, the resized images will have an `Etag` HTTP header that has a format `cf-<gibberish>:<etag of the original image>`. You can compare the second part with the `Etag` header of the source image URL to check if the resized image is up to date.

</page>

<page>
---
title: Bind to Workers API · Cloudflare Images docs
description: A binding connects your Worker to external resources on the
  Developer Platform, like Images, R2 buckets, or KV Namespaces.
lastUpdated: 2025-04-03T14:52:48.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/transform-images/bindings/
  md: https://developers.cloudflare.com/images/transform-images/bindings/index.md
---

A [binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/) connects your [Worker](https://developers.cloudflare.com/workers/) to external resources on the Developer Platform, like [Images](https://developers.cloudflare.com/images/transform-images/transform-via-workers/), [R2 buckets](https://developers.cloudflare.com/r2/buckets/), or [KV Namespaces](https://developers.cloudflare.com/kv/concepts/kv-namespaces/).

You can bind the Images API to your Worker to transform, resize, and encode images without requiring them to be accessible through a URL.

For example, when you allow Workers to interact with Images, you can:

* Transform an image, then upload the output image directly into R2 without serving to the browser.
* Optimize an image stored in R2 by passing the blob of bytes representing the image, instead of fetching the public URL for the image.
* Resize an image, overlay the output over a second image as a watermark, then resize this output into a final result.

Bindings can be configured in the Cloudflare dashboard for your Worker or in the `wrangler.toml` file in your project's directory.

## Setup

The Images binding is enabled on a per-Worker basis.

You can define variables in the `wrangler.toml` file of your Worker project's directory. These variables are bound to external resources at runtime, and you can then interact with them through this variable.

To bind Images to your Worker, add the following to the end of your `wrangler.toml` file:

* wrangler.jsonc

  ```jsonc
  {
    "images": {
      "binding": "IMAGES", // i.e. available in your Worker on env.IMAGES
    },
  }
  ```

* wrangler.toml

  ```toml
  [images]
  binding = "IMAGES"
  ```

Within your Worker code, you can interact with this binding by using `env.IMAGES.input()` to build an object that can manipulate the image (passed as a `ReadableStream`).

## Methods

### `.transform()`

* Defines how an image should be optimized and manipulated through [parameters](https://developers.cloudflare.com/images/transform-images/transform-via-workers/#fetch-options) such as `width`, `height`, and `blur`.

### `.draw()`

* Allows [drawing an image](https://developers.cloudflare.com/images/transform-images/draw-overlays/) over another image.
* The drawn image can be a stream, or another image returned from `.input()` that has been manipulated.
* The overlaid image can be manipulated using `opacity`, `repeat`, `top`, `left`, `bottom`, and `right`. To apply other parameters, you can pass a child `.transform()` function inside this method.

For example, to draw a resized watermark on an image:

```ts
// Fetch the watermark from Workers Assets, R2, KV etc
const watermark: ReadableStream = ...


// Fetch the main image
const image: ReadableStream = ...


const response = (
  await env.IMAGES.input(image)
    .draw(
        env.IMAGES.input(watermark)
          .transform({ width: 32, height: 32}),
        { bottom: 32, right: 32 }
    )
    .output({ format: "image/avif" })
).response()


return response;
```

### `.output()`

* Defines the [output format](https://developers.cloudflare.com/images/transform-images/) for the transformed image such as AVIF, WebP, and JPEG.

For example, to rotate, resize, and blur an image, then output the image as AVIF:

```ts
const info = await env.IMAGES.info(stream);
// stream contains a valid image, and width/height is available on the info object


const response = (
  await env.IMAGES.input(stream)
    .transform({ rotate: 90 })
    .transform({ width: 128 })
    .transform({ blur: 20 })
    .output({ format: "image/avif" })
).response();


return response;
```

### `.info()`

* Outputs information about the image, such as `format`, `fileSize`, `width`, and `height`.

Responses from the Images binding are not automatically cached. Workers lets you interact directly with the Cache API to customize cache behavior using Workers. You can implement logic in your script to store transformations in Cloudflare’s cache.

## Interact with your Images binding locally

The Images API can be used in local development through [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/), the command-line interface for Workers. Using the Images binding in local development will not incur usage charges.

Wrangler supports two different versions of the Images API:

* A high-fidelity version that supports all features that are available through the Images API. This is the same version that Cloudflare runs globally in production.
* A low-fidelity offline version that supports only a subset of features, such as resizing and rotation.

To test the high-fidelity version of Images, you can run `wrangler dev`:

```txt
npx wrangler dev
```

This creates a local-only environment that mirrors the production environment where Cloudflare runs the Images API. You can test your Worker with all available transformation features before deploying to production.

To test the low-fidelity offline version of Images, add the `--experimental-images-local-mode` flag:

```txt
npm wrangler dev --experimental-images-local-mode
```

Currently, this version supports only `width`, `height`, `rotate`, and `format`.

When testing with the [Workers Vitest integration](https://developers.cloudflare.com/workers/testing/vitest-integration/), the low-fidelity offline version is used by default, to avoid hitting the Cloudflare API in tests.

</page>

<page>
---
title: Control origin access · Cloudflare Images docs
description: You can serve resized images without giving access to the original
  image. Images can be hosted on another server outside of your zone, and the
  true source of the image can be entirely hidden. The origin server may require
  authentication to disclose the original image, without needing visitors to be
  aware of it. Access to the full-size image may be prevented by making it
  impossible to manipulate resizing parameters.
lastUpdated: 2025-02-03T14:37:08.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/transform-images/control-origin-access/
  md: https://developers.cloudflare.com/images/transform-images/control-origin-access/index.md
---

You can serve resized images without giving access to the original image. Images can be hosted on another server outside of your zone, and the true source of the image can be entirely hidden. The origin server may require authentication to disclose the original image, without needing visitors to be aware of it. Access to the full-size image may be prevented by making it impossible to manipulate resizing parameters.

All these behaviors are completely customizable, because they are handled by custom code of a script running [on the edge in a Cloudflare Worker](https://developers.cloudflare.com/images/transform-images/transform-via-workers/).

```js
export default {
  async fetch(request, env, ctx) {
    // Here you can compute arbitrary imageURL and
    // resizingOptions from any request data ...
    return fetch(imageURL, { cf: { image: resizingOptions } });
  },
};
```

This code will be run for every request, but the source code will not be accessible to website visitors. This allows the code to perform security checks and contain secrets required to access the images in a controlled manner.

The examples below are only suggestions, and do not have to be followed exactly. You can compute image URLs and resizing options in many other ways.

Warning

When testing image transformations, make sure you deploy the script and test it from a regular web browser window. The preview in the dashboard does not simulate transformations.

## Hiding the image server

```js
export default {
  async fetch(request, env, ctx) {
    const resizingOptions = {
      /* resizing options will be demonstrated in the next example */
    };


    const hiddenImageOrigin = "https://secret.example.com/hidden-directory";
    const requestURL = new URL(request.url);
    // Append the request path such as "/assets/image1.jpg" to the hiddenImageOrigin.
    // You could also process the path to add or remove directories, modify filenames, etc.
    const imageURL = hiddenImageOrigin + requestURL.path;
    // This will fetch image from the given URL, but to the website's visitors this
    // will appear as a response to the original request. Visitor’s browser will
    // not see this URL.
    return fetch(imageURL, { cf: { image: resizingOptions } });
  },
};
```

## Preventing access to full-size images

On top of protecting the original image URL, you can also validate that only certain image sizes are allowed:

```js
export default {
  async fetch(request, env, ctx) {
  const imageURL = … // detail omitted in this example, see the previous example


  const requestURL = new URL(request.url)
  const resizingOptions = {
    width: requestURL.searchParams.get("width"),
  }
  // If someone tries to manipulate your image URLs to reveal higher-resolution images,
  // you can catch that and refuse to serve the request (or enforce a smaller size, etc.)
  if (resizingOptions.width > 1000) {
    throw Error("We don’t allow viewing images larger than 1000 pixels wide")
  }
  return fetch(imageURL, {cf:{image:resizingOptions}})
},};
```

## Avoid image dimensions in URLs

You do not have to include actual pixel dimensions in the URL. You can embed sizes in the Worker script, and select the size in some other way — for example, by naming a preset in the URL:

```js
export default {
  async fetch(request, env, ctx) {
    const requestURL = new URL(request.url);
    const resizingOptions = {};


    // The regex selects the first path component after the "images"
    // prefix, and the rest of the path (e.g. "/images/first/rest")
    const match = requestURL.path.match(/images\/([^/]+)\/(.+)/);


    // You can require the first path component to be one of the
    // predefined sizes only, and set actual dimensions accordingly.
    switch (match && match[1]) {
      case "small":
        resizingOptions.width = 300;
        break;
      case "medium":
        resizingOptions.width = 600;
        break;
      case "large":
        resizingOptions.width = 900;
        break;
      default:
        throw Error("invalid size");
    }


    // The remainder of the path may be used to locate the original
    // image, e.g. here "/images/small/image1.jpg" would map to
    // "https://storage.example.com/bucket/image1.jpg" resized to 300px.
    const imageURL = "https://storage.example.com/bucket/" + match[2];
    return fetch(imageURL, { cf: { image: resizingOptions } });
  },
};
```

## Authenticated origin

Cloudflare image transformations cache resized images to aid performance. Images stored with restricted access are generally not recommended for resizing because sharing images customized for individual visitors is unsafe. However, in cases where the customer agrees to store such images in public cache, Cloudflare supports resizing images through Workers. At the moment, this is supported on authenticated AWS, Azure, Google Cloud, SecureAuth origins and origins behind Cloudflare Access.

```js
// generate signed headers (application specific)
const signedHeaders = generatedSignedHeaders();


fetch(private_url, {
  headers: signedHeaders
  cf: {
    image: {
      format: "auto",
      "origin-auth": "share-publicly"
     }
  }
})
```

When using this code, the following headers are passed through to the origin, and allow your request to be successful:

* `Authorization`
* `Cookie`
* `x-amz-content-sha256`
* `x-amz-date`
* `x-ms-date`
* `x-ms-version`
* `x-sa-date`
* `cf-access-client-id`
* `cf-access-client-secret`

For more information, refer to:

* [AWS docs](https://docs.aws.amazon.com/AmazonS3/latest/API/sig-v4-authenticating-requests.html)
* [Azure docs](https://docs.microsoft.com/en-us/rest/api/storageservices/List-Containers2#request-headers)
* [Google Cloud docs](https://cloud.google.com/storage/docs/aws-simple-migration)
* [Cloudflare Zero Trust docs](https://developers.cloudflare.com/cloudflare-one/identity/service-tokens/)
* [SecureAuth docs](https://docs.secureauth.com/2104/en/authentication-api-guide.html)

</page>

<page>
---
title: Draw overlays and watermarks · Cloudflare Images docs
description: You can draw additional images on top of a resized image, with
  transparency and blending effects. This enables adding of watermarks, logos,
  signatures, vignettes, and other effects to resized images.
lastUpdated: 2025-04-07T16:12:42.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/transform-images/draw-overlays/
  md: https://developers.cloudflare.com/images/transform-images/draw-overlays/index.md
---

You can draw additional images on top of a resized image, with transparency and blending effects. This enables adding of watermarks, logos, signatures, vignettes, and other effects to resized images.

This feature is available only in [Workers](https://developers.cloudflare.com/images/transform-images/transform-via-workers/). To draw overlay images, add an array of drawing commands to options of `fetch()` requests. The drawing options are nested in `options.cf.image.draw`, like in the following example:

```js
fetch(imageURL, {
  cf: {
    image: {
      width: 800,
      height: 600,
      draw: [
        {
          url: 'https://example.com/branding/logo.png', // draw this image
          bottom: 5, // 5 pixels from the bottom edge
          right: 5, // 5 pixels from the right edge
          fit: 'contain', // make it fit within 100x50 area
          width: 100,
          height: 50,
          opacity: 0.8, // 20% transparent
        },
      ],
    },
  },
});
```

## Draw options

The `draw` property is an array. Overlays are drawn in the order they appear in the array (the last array entry is the topmost layer). Each item in the `draw` array is an object, which can have the following properties:

* `url`

  * Absolute URL of the image file to use for the drawing. It can be any of the supported file formats. For drawing watermarks or non-rectangular overlays, Cloudflare recommends that you use PNG or WebP images.

* `width` and `height`

  * Maximum size of the overlay image, in pixels. It must be an integer.

* `fit` and `gravity`

  * Affects interpretation of `width` and `height`. Same as [for the main image](https://developers.cloudflare.com/images/transform-images/transform-via-workers/#fetch-options).

* `opacity`

  * Floating-point number between `0` (transparent) and `1` (opaque). For example, `opacity: 0.5` makes overlay semitransparent.

* `repeat`

  * If set to `true`, the overlay image will be tiled to cover the entire area. This is useful for stock-photo-like watermarks.
  * If set to `"x"`, the overlay image will be tiled horizontally only (form a line).
  * If set to `"y"`, the overlay image will be tiled vertically only (form a line).

* `top`, `left`, `bottom`, `right`

  * Position of the overlay image relative to a given edge. Each property is an offset in pixels. `0` aligns exactly to the edge. For example, `left: 10` positions left side of the overlay 10 pixels from the left edge of the image it is drawn over. `bottom: 0` aligns bottom of the overlay with bottom of the background image.

    Setting both `left` and `right`, or both `top` and `bottom` is an error.

    If no position is specified, the image will be centered.

* `background`

  * Background color to add underneath the overlay image. Same as [for the main image](https://developers.cloudflare.com/images/transform-images/transform-via-workers/#fetch-options).

* `rotate`

  * Number of degrees to rotate the overlay image by. Same as [for the main image](https://developers.cloudflare.com/images/transform-images/transform-via-workers/#fetch-options).

## Draw using the Images binding

When [interacting with Images through a binding](https://developers.cloudflare.com/images/transform-images/bindings/), the Images API supports a `.draw()` method.

The accepted options for the overlaid image are `opacity`, `repeat`, `top`, `left`, `bottom`, and `right`.

```js
// Fetch image and watermark
const img = await fetch('https://example.com/image.png');
const watermark = await fetch('https://example.com/watermark.png');


const response = await env.IMAGES.input(img.body)
  .transform({ width: 1024 })
  .draw(watermark.body, { "opacity": 0.25, "repeat": true })
  .output({ format: "image/avif" })
  .response();


return response;
```

To apply [parameters](https://developers.cloudflare.com/images/transform-images/transform-via-workers/) to the overlaid image, you can pass a child `.transform()` function inside the `.draw()` request.

In the example below, the watermark is manipulated with `rotate` and `width` before being drawn over the base image with the `opacity` and `rotate` options.

```js
// Fetch image and watermark
const response = (
  await env.IMAGES.input(img.body)
    .transform({ width: 1024 })
    .draw(watermark.body, { "opacity": 0.25, "repeat": true })
    .output({ format: "image/avif" })
).response();
```

## Examples

### Stock Photo Watermark

```js
image: {
  draw: [
    {
      url: 'https://example.com/watermark.png',
      repeat: true, // Tiled over entire image
      opacity: 0.2, // and subtly blended
    },
  ];
}
```

### Signature

```js
image: {
  draw: [
    {
      url: 'https://example.com/by-me.png', // Predefined logo/signature
      bottom: 5, // Positioned near bottom right corner
      right: 5,
    },
  ];
}
```

### Centered icon

```js
image: {
  draw: [
    {
      url: 'https://example.com/play-button.png',
      // Center position is the default
    },
  ];
}
```

### Combined

Multiple operations can be combined in one image:

```js
image: {
  draw: [
    { url: 'https://example.com/watermark.png', repeat: true, opacity: 0.2 },
    { url: 'https://example.com/play-button.png' },
    { url: 'https://example.com/by-me.png', bottom: 5, right: 5 },
  ];
}
```

</page>

<page>
---
title: Integrate with frameworks · Cloudflare Images docs
description: Image transformations can be used automatically with the Next.js
  <Image /> component.
lastUpdated: 2025-02-03T14:37:08.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/transform-images/integrate-with-frameworks/
  md: https://developers.cloudflare.com/images/transform-images/integrate-with-frameworks/index.md
---

## Next.js

Image transformations can be used automatically with the Next.js [`<Image />` component](https://nextjs.org/docs/api-reference/next/image).

To use image transformations, define a global image loader or multiple custom loaders for each `<Image />` component.

Next.js will request the image with the correct parameters for width and quality.

Image transformations will be responsible for caching and serving an optimal format to the client.

### Global Loader

To use Images with **all** your app's images, define a global [loaderFile](https://nextjs.org/docs/pages/api-reference/components/image#loaderfile) for your app.

Add the following settings to the **next.config.js** file located at the root our your Next.js application.

```ts
module.exports = {
  images: {
    loader: 'custom',
    loaderFile: './imageLoader.ts',
  },
}
```

Next, create the `imageLoader.ts` file in the specified path (relative to the root of your Next.js application).

```ts
const normalizeSrc = (src: string) => {
    return src.startsWith("/") ? src.slice(1) : src;
};


export default function cloudflareLoader({
    src,
    width,
    quality,
}: { src: string; width: number; quality?: number }) {
    if (process.env.NODE_ENV === "development") {
        return src;
    }
    const params = [`width=${width}`];
    if (quality) {
        params.push(`quality=${quality}`);
    }
    const paramsString = params.join(",");
    return `/cdn-cgi/image/${paramsString}/${normalizeSrc(src)}`;
}
```

### Custom Loaders

Alternatively, define a loader for each `<Image />` component.

```js
import Image from 'next/image';


const normalizeSrc = src => {
  return src.startsWith('/') ? src.slice(1) : src;
};


const cloudflareLoader = ({ src, width, quality }) => {
  if (process.env.NODE_ENV === "development") {
    return src;
  }
  const params = [`width=${width}`];
  if (quality) {
    params.push(`quality=${quality}`);
  }
  const paramsString = params.join(',');
  return `/cdn-cgi/image/${paramsString}/${normalizeSrc(src)}`;
};


const MyImage = props => {
  return (
    <Image
      loader={cloudflareLoader}
      src="/me.png"
      alt="Picture of the author"
      width={500}
      height={500}
    />
  );
};
```

Note

For local development, you can enable [Resize images from any origin checkbox](https://developers.cloudflare.com/images/get-started/) for your zone. Then, replace `/cdn-cgi/image/${paramsString}/${normalizeSrc(src)}` with an absolute URL path:

`https://<YOUR_DOMAIN.COM>/cdn-cgi/image/${paramsString}/${normalizeSrc(src)}`

</page>

<page>
---
title: Make responsive images · Cloudflare Images docs
description: Learn how to serve responsive images using HTML srcset and
  width=auto for optimal display on various devices. Ideal for high-DPI and
  fluid layouts.
lastUpdated: 2025-04-07T16:12:42.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/transform-images/make-responsive-images/
  md: https://developers.cloudflare.com/images/transform-images/make-responsive-images/index.md
---

You can serve responsive images in two different ways:

* Use the HTML `srcset` feature to allow browsers to choose the most optimal image. This is the most reliable solution to serve responsive images.
* Use the `width=auto` option to serve the most optimal image based on the available browser and device information. This is a server-side solution that is supported only by Chromium-based browsers.

## Transform with HTML `srcset`

The `srcset` [feature of HTML](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images) allows browsers to automatically choose an image that is best suited for user’s screen resolution.

`srcset` requires providing multiple resized versions of every image, and with Cloudflare’s image transformations this is an easy task to accomplish.

There are two different scenarios where it is useful to use `srcset`:

* Images with a fixed size in terms of CSS pixels, but adapting to high-DPI screens (also known as Retina displays). These images take the same amount of space on the page regardless of screen size, but are sharper on high-resolution displays. This is appropriate for icons, thumbnails, and most images on pages with fixed-width layouts.
* Responsive images that stretch to fill a certain percentage of the screen (usually full width). This is best for hero images and pages with fluid layouts, including pages using media queries to adapt to various screen sizes.

### `srcset` for high-DPI displays

For high-DPI display you need two versions of every image. One for `1x` density, suitable for typical desktop displays (such as HD/1080p monitors or low-end laptops), and one for `2x` high-density displays used by almost all mobile phones, high-end laptops, and 4K desktop displays. Some mobile phones have very high-DPI displays and could use even a `3x` resolution. However, while the jump from `1x` to `2x` is a clear improvement, there are diminishing returns from increasing the resolution further. The difference between `2x` and `3x` is visually insignificant, but `3x` files are two times larger than `2x` files.

Assuming you have an image `product.jpg` in the `assets` folder and you want to display it at a size of `960px`, the code is as follows:

```html
<img
  src="/cdn-cgi/image/fit=contain,width=960/assets/product.jpg"
  srcset="/cdn-cgi/image/fit=contain,width=1920/assets/product.jpg 2x"
/>
```

In the URL path used in this example, the `src` attribute is for images with the usual "1x" density. `/cdn-cgi/image/` is a special path for resizing images. This is followed by `width=960` which resizes the image to have a width of 960 pixels. `/assets/product.jpg` is a URL to the source image on the server.

The `srcset` attribute adds another, high-DPI image. The browser will automatically select between the images in the `src` and `srcset`. In this case, specifying `width=1920` (two times 960 pixels) and adding `2x` at the end, informs the browser that this is a double-density image. It will be displayed at the same size as a 960 pixel image, but with double the number of pixels which will make it look twice as sharp on high-DPI displays.

Note that it does not make sense to scale images up for use in `srcset`. That would only increase file sizes without improving visual quality. The source images you should use with `srcset` must be high resolution, so that they are only scaled down for `1x` displays, and displayed as-is or also scaled down for `2x` displays.

### `srcset` for responsive images

When you want to display an image that takes a certain percentage of the window or screen width, the image should have dimensions that are appropriate for a visitor’s screen size. Screen sizes vary a lot, typically from 320 pixels to 3840 pixels, so there is not a single image size that fits all cases. With `<img srcset>` you can offer the browser several possible sizes and let it choose the most appropriate size automatically.

By default, the browser assumes the image will be stretched to the full width of the screen, and will pick a size that is closest to a visitor’s screen size. In the `src` attribute the browser will pick any size that is a good fallback for older browsers that do not understand `srcset`.

```html
<img
  width="100%"
  srcset="
    /cdn-cgi/image/fit=contain,width=320/assets/hero.jpg   320w,
    /cdn-cgi/image/fit=contain,width=640/assets/hero.jpg   640w,
    /cdn-cgi/image/fit=contain,width=960/assets/hero.jpg   960w,
    /cdn-cgi/image/fit=contain,width=1280/assets/hero.jpg 1280w,
    /cdn-cgi/image/fit=contain,width=2560/assets/hero.jpg 2560w
  "
  src="/cdn-cgi/image/width=960/assets/hero.jpg"
/>
```

In the previous case, the number followed by `x` described *screen* density. In this case the number followed by `w` describes the *image* size. There is no need to specify screen density here (`2x`, etc.), because the browser automatically takes it into account and picks a higher-resolution image when necessary.

If the image is not displayed at full width of the screen (or browser window), you have two options:

* If the image is displayed at full width of a fixed-width column, use the first technique that uses one specific image size.
* If it takes a specific percentage of the screen, or stretches to full width only sometimes (using CSS media queries), then add the `sizes` attribute as described below.

#### The `sizes` attribute

If the image takes 50% of the screen (or window) width:

```html
<img style="width: 50vw" srcset="<SAME_AS_BEFORE>" sizes="50vw" />
```

The `vw` unit is a percentage of the viewport (screen or window) width. If the image can have a different size depending on media queries or other CSS properties, such as `max-width`, then specify all the conditions in the `sizes` attribute:

```html
<img
  style="max-width: 640px"
  srcset="
    /cdn-cgi/image/fit=contain,width=320/assets/hero.jpg   320w,
    /cdn-cgi/image/fit=contain,width=480/assets/hero.jpg   480w,
    /cdn-cgi/image/fit=contain,width=640/assets/hero.jpg   640w,
    /cdn-cgi/image/fit=contain,width=1280/assets/hero.jpg 1280w
  "
  sizes="(max-width: 640px) 100vw, 640px"
/>
```

In this example, `sizes` says that for screens smaller than 640 pixels the image is displayed at full viewport width; on all larger screens the image stays at 640px. Note that one of the options in `srcset` is 1280 pixels, because an image displayed at 640 CSS pixels may need twice as many image pixels on a high-dpi (`2x`) display.

## WebP images

`srcset` is useful for pixel-based formats such as PNG, JPEG, and WebP. It is unnecessary for vector-based SVG images.

HTML also [supports the `<picture>` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/picture) that can optionally request an image in the WebP format, but you do not need it. Cloudflare can serve WebP images automatically whenever you use `/cdn-cgi/image/format=auto` URLs in `src` or `srcset`.

If you want to use WebP images, but do not need resizing, you have two options:

* You can enable the automatic [WebP conversion in Polish](https://developers.cloudflare.com/images/polish/activate-polish/). This will convert all images on the site.
* Alternatively, you can change specific image paths on the site to start with `/cdn-cgi/image/format=auto/`. For example, change `https://example.com/assets/hero.jpg` to `https://example.com/cdn-cgi/image/format=auto/assets/hero.jpg`.

## Transform with `width` parameter

When setting up a [transformation URL](https://developers.cloudflare.com/images/transform-images/transform-via-url/#width), you can apply the `width=auto` option to serve the most optimal image based on the available information about the user's browser and device.

This method can serve multiple sizes from a single URL. Currently, images will be served in one of four sizes:

* 1200 (large desktop/monitor)
* 960 (desktop)
* 768 (tablet)
* 320 (mobile)

Each width is counted as a separate transformation. For example, if you use `width=auto` and the image is delivered with a width of 320px to one user and 960px to another user, then this counts as two unique transformations.

By default, this feature uses information from the user agent, which detects the platform type (for example, iOS or Android) and browser.

### Client hints

For more accurate results, you can use client hints to send the user's browser information as request headers.

This method currently works only on Chromium-based browsers such as Chrome, Edge, and Opera.

You can enable client hints via HTML by adding the following tag in the `<head>` tag of your page before any other elements:

```txt
<meta http-equiv="Delegate-CH" content="sec-ch-dpr https://example.com; sec-ch-viewport-width https://example.com"/>
```

Replace `https://example.com` with your Cloudflare zone where transformations are enabled.

Alternatively, you can enable client hints via HTTP by adding the following headers to your HTML page's response:

```txt
critical-ch: sec-ch-viewport-width, sec-ch-dpr


permissions-policy: ch-dpr=("https://example.com"), ch-viewport-width=("https://example.com")
```

Replace `https://example.com` with your Cloudflare zone where transformations are enabled.

</page>

<page>
---
title: Preserve Content Credentials · Cloudflare Images docs
description: Content Credentials (or C2PA metadata) are a type of metadata that
  includes the full provenance chain of a digital asset. This provides
  information about an image's creation, authorship, and editing flow. This data
  is cryptographically authenticated and can be verified using an open-source
  verification service.
lastUpdated: 2025-02-03T14:37:08.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/transform-images/preserve-content-credentials/
  md: https://developers.cloudflare.com/images/transform-images/preserve-content-credentials/index.md
---

[Content Credentials](https://contentcredentials.org/) (or C2PA metadata) are a type of metadata that includes the full provenance chain of a digital asset. This provides information about an image's creation, authorship, and editing flow. This data is cryptographically authenticated and can be verified using an [open-source verification service](https://contentcredentials.org/verify).

You can preserve Content Credentials when optimizing images stored in remote sources.

## Enable

You can configure how Content Credentials are handled for each zone where transformations are served.

In the Cloudflare dashboard under **Images** > **Transformations**, navigate to a specific zone and enable the toggle to preserve Content Credentials:

![Enable Preserving Content Credentials in the dashboard](https://developers.cloudflare.com/_astro/preserve-content-credentials.BDptgOn0_1TjaGK.webp)

The behavior of this setting is determined by the [`metadata`](https://developers.cloudflare.com/images/transform-images/transform-via-url/#metadata) parameter for each transformation.

For example, if a transformation specifies `metadata=copyright`, then the EXIF copyright tag and all Content Credentials will be preserved in the resulting image and all other metadata will be discarded.

When Content Credentials are preserved in a transformation, Cloudflare will keep any existing Content Credentials embedded in the source image and automatically append and cryptographically sign additional actions.

When this setting is disabled, any existing Content Credentials will always be discarded.

</page>

<page>
---
title: Serve images from custom paths · Cloudflare Images docs
description: You can use Transform Rules to rewrite URLs for every image that
  you transform through Images.
lastUpdated: 2025-02-03T14:37:08.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/transform-images/serve-images-custom-paths/
  md: https://developers.cloudflare.com/images/transform-images/serve-images-custom-paths/index.md
---

You can use Transform Rules to rewrite URLs for every image that you transform through Images.

This page covers examples for the following scenarios:

* Serve images from custom paths
* Modify existing URLs to be compatible with transformations in Images
* Transform every image requested on your zone with Images

To create a rule, log in to the Cloudflare dashboard and select your account and website. Then, go to **Rules** > **Overview** and select **Create rule** next to **URL Rewrite Rules**.

## Before you start

Every rule runs before and after the transformation request.

If the path for the request matches the path where the original images are stored on your server, this may cause the request to fetch the original image to loop.

To direct the request to the origin server, you can check for the string `image-resizing` in the `Via` header:

`...and (not (any(http.request.headers["via"][*] contains "image-resizing")))`

## Serve images from custom paths

By default, requests to transform images through Images are served from the `/cdn-cgi/image/` path. You can use Transform Rules to rewrite URLs.

### Basic version

Free and Pro plans support string matching rules (including wildcard operations) that do not require regular expressions.

This example lets you rewrite a request from `example.com/images` to `example.com/cdn-cgi/image/`:

```txt
(starts_with(http.request.uri.path, "/images")) and (not (any(http.request.headers["via"][*] contains "image-resizing")))
```

```txt
concat("/cdn-cgi/image", substring(http.request.uri.path, 7))
```

### Advanced version

Note

This feature requires a Business or Enterprise plan to enable regex in Transform Rules. Refer to [Cloudflare Transform Rules Availability](https://developers.cloudflare.com/rules/transform/#availability) for more information.

There is an advanced version of Transform Rules supporting regular expressions.

This example lets you rewrite a request from `example.com/images` to `example.com/cdn-cgi/image/`:

```txt
(http.request.uri.path matches "^/images/.*$") and (not (any(http.request.headers["via"][*] contains "image-resizing")))
```

```txt
regex_replace(http.request.uri.path, "^/images/", "/cdn-cgi/image/")
```

## Modify existing URLs to be compatible with transformations in Images

Note

This feature requires a Business or Enterprise plan to enable regex in Transform Rules. Refer to [Cloudflare Transform Rules Availability](https://developers.cloudflare.com/rules/transform/#availability) for more information.

This example lets you rewrite your URL parameters to be compatible with Images:

```txt
(http.request.uri matches "^/(.*)\\?width=([0-9]+)&height=([0-9]+)$")
```

```txt
regex_replace(
  http.request.uri,
  "^/(.*)\\?width=([0-9]+)&height=([0-9]+)$",
  "/cdn-cgi/image/width=${2},height=${3}/${1}"
)
```

Leave the **Query** > **Rewrite to** > *Static* field empty.

## Pass every image requested on your zone through Images

Note

This feature requires a Business or Enterprise plan to enable regular expressions in Transform Rules. Refer to [Cloudflare Transform Rules Availability](https://developers.cloudflare.com/rules/transform/#availability) for more information.

This example lets you transform every image that is requested on your zone with the `format=auto` option:

```txt
(http.request.uri.path.extension matches "(jpg)|(jpeg)|(png)|(gif)") and (not (any(http.request.headers["via"][*] contains "image-resizing")))
```

```txt
regex_replace(http.request.uri.path, "/(.*)", "/cdn-cgi/image/format=auto/${1}")
```

</page>

<page>
---
title: Define source origin · Cloudflare Images docs
description: When optimizing remote images, you can specify which origins can be
  used as the source for transformed images. By default, Cloudflare accepts only
  source images from the zone where your transformations are served.
lastUpdated: 2025-03-11T13:51:28.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/transform-images/sources/
  md: https://developers.cloudflare.com/images/transform-images/sources/index.md
---

When optimizing remote images, you can specify which origins can be used as the source for transformed images. By default, Cloudflare accepts only source images from the zone where your transformations are served.

On this page, you will learn how to define and manage the origins for the source images that you want to optimize.

Note

The allowed origins setting applies to requests from Cloudflare Workers.

If you use a Worker to optimize remote images via a `fetch()` subrequest, then this setting may conflict with existing logic that handles source images.

## How it works

In the Cloudflare dashboard, go to **Images** > **Transformations** and select the zone where you want to serve transformations.

To get started, you must have [transformations enabled on your zone](https://developers.cloudflare.com/images/get-started/#enable-transformations-on-your-zone).

In **Sources**, you can configure the origins for transformations on your zone.

![Enable allowed origins from the Cloudflare dashboard](https://developers.cloudflare.com/_astro/allowed-origins.4hu5lHws_1geX4Q.webp)

## Allow source images only from allowed origins

You can restrict source images to **allowed origins**, which applies transformations only to source images from a defined list.

By default, your accepted sources are set to **allowed origins**. Cloudflare will always allow source images from the same zone where your transformations are served.

If you request a transformation with a source image from outside your **allowed origins**, then the image will be rejected. For example, if you serve transformations on your zone `a.com` and do not define any additional origins, then `a.com/image.png` can be used as a source image, but `b.com/image.png` will return an error.

To define a new origin:

1. From **Sources**, select **Add origin**.
2. Under **Domain**, specify the domain for the source image. Only valid web URLs will be accepted.

![Add the origin for source images in the Cloudflare dashboard](https://developers.cloudflare.com/_astro/add-origin.BtfOyoOS_1qwksq.webp)

When you add a root domain, subdomains are not accepted. In other words, if you add `b.com`, then source images from `media.b.com` will be rejected.

To support individual subdomains, define an additional origin such as `media.b.com`. If you add only `media.b.com` and not the root domain, then source images from the root domain (`b.com`) and other subdomains (`cdn.b.com`) will be rejected.

To support all subdomains, use the `*` wildcard at the beginning of the root domain. For example, `*.b.com` will accept source images from the root domain (like `b.com/image.png`) as well as from subdomains (like `media.b.com/image.png` or `cdn.b.com/image.png`).

1. Optionally, you can specify the **Path** for the source image. If no path is specified, then source images from all paths on this domain are accepted.

Cloudflare checks whether the defined path is at the beginning of the source path. If the defined path is not present at the beginning of the path, then the source image will be rejected.

For example, if you define an origin with domain `b.com` and path `/themes`, then `b.com/themes/image.png` will be accepted but `b.com/media/themes/image.png` will be rejected.

1. Select **Add**. Your origin will now appear in your list of allowed origins.
2. Select **Save**. These changes will take effect immediately.

When you configure **allowed origins**, only the initial URL of the source image is checked. Any redirects, including URLs that leave your zone, will be followed, and the resulting image will be transformed.

If you change your accepted sources to **any origin**, then your list of sources will be cleared and reset to default.

## Allow source images from any origin

When your accepted sources are set to **any origin**, any publicly available image can be used as the source image for transformations on this zone.

**Any origin** is less secure and may allow third parties to serve transformations on your zone.

</page>

<page>
---
title: Transform via URL · Cloudflare Images docs
description: "You can convert and resize images by requesting them via a
  specially-formatted URL. This way you do not need to write any code, only
  change HTML markup of your website to use the new URLs. The format is:"
lastUpdated: 2025-03-14T14:35:48.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/transform-images/transform-via-url/
  md: https://developers.cloudflare.com/images/transform-images/transform-via-url/index.md
---

You can convert and resize images by requesting them via a specially-formatted URL. This way you do not need to write any code, only change HTML markup of your website to use the new URLs. The format is:

```txt
https://<ZONE>/cdn-cgi/image/<OPTIONS>/<SOURCE-IMAGE>
```

Here is a breakdown of each part of the URL:

* `<ZONE>`

  * Your domain name on Cloudflare. Unlike other third-party image resizing services, image transformations do not use a separate domain name for an API. Every Cloudflare zone with image transformations enabled can handle resizing itself. In URLs used on your website this part can be omitted, so that URLs start with `/cdn-cgi/image/`.

* `/cdn-cgi/image/`

  * A fixed prefix that identifies that this is a special path handled by Cloudflare's built-in Worker.

* `<OPTIONS>`

  * A comma-separated list of options such as `width`, `height`, and `quality`.

* `<SOURCE-IMAGE>`

  * An absolute path on the origin server, or an absolute URL (starting with `https://` or `http://`), pointing to an image to resize. The path is not URL-encoded, so the resizing URL can be safely constructed by concatenating `/cdn-cgi/image/options` and the original image URL. For example: `/cdn-cgi/image/width=100/https://s3.example.com/bucket/image.png`.

Here is an example of an URL with `<OPTIONS>` set to `width=80,quality=75` and a `<SOURCE-IMAGE>` of `uploads/avatar1.jpg`:

```html
<img src="/cdn-cgi/image/width=80,quality=75/uploads/avatar1.jpg" />
```

Note

You can use image transformations to sanitize SVGs, but not to resize them. Refer to [Resize with Workers](https://developers.cloudflare.com/images/transform-images/transform-via-workers/) for more information.

## Options

You must specify at least one option. Options are comma-separated (spaces are not allowed anywhere). Names of options can be specified in full or abbreviated.

### `anim`

Whether to preserve animation frames from input files. Default is `true`. Setting it to `false` reduces animations to still images. This setting is recommended when enlarging images or processing arbitrary user content, because large GIF animations can weigh tens or even hundreds of megabytes. It is also useful to set `anim:false` when using `format:"json"` to get the response quicker without the number of frames.

* URL format

  ```js
  anim=false
  ```

* Workers

  ```js
  cf: {image: {anim: false}}
  ```

### `background`

Background color to add underneath the image. Applies to images with transparency (for example, PNG) and images resized with `fit=pad`. Accepts any CSS color using CSS4 modern syntax, such as `rgb(255 255 0)` and `rgba(255 255 0 100)`.

* URL format

  ```js
  background=%23RRGGBB


  OR


  background=red


  OR


  background=rgb%28240%2C40%2C145%29
  ```

* Workers

  ```js
  cf: {image: {background: "#RRGGBB"}}


  OR


  cf:{image: {background: "rgba(240,40,145,0)"}}
  ```

### `blur`

Blur radius between `1` (slight blur) and `250` (maximum). Be aware that you cannot use this option to reliably obscure image content, because savvy users can modify an image's URL and remove the blur option. Use Workers to control which options can be set.

* URL format

  ```js
  blur=50
  ```

* Workers

  ```js
  cf: {image: {blur: 50}}
  ```

### `border`

Adds a border around the image. The border is added after resizing. Border width takes `dpr` into account, and can be specified either using a single `width` property, or individually for each side.

* Workers

  ```js
  cf: {image: {border: {color: "rgb(0,0,0,0)", top: 5, right: 10, bottom: 5, left: 10}}}
  cf: {image: {border: {color: "#FFFFFF", width: 10}}}
  ```

### `brightness`

Increase brightness by a factor. A value of `1.0` equals no change, a value of `0.5` equals half brightness, and a value of `2.0` equals twice as bright. `0` is ignored.

* URL format

  ```js
  brightness=0.5
  ```

* Workers

  ```js
  cf: {image: {brightness: 0.5}}
  ```

### `compression`

Slightly reduces latency on a cache miss by selecting a quickest-to-compress file format, at a cost of increased file size and lower image quality. It will usually override the `format` option and choose JPEG over WebP or AVIF. We do not recommend using this option, except in unusual circumstances like resizing uncacheable dynamically-generated images.

* URL format

  ```js
  compression=fast
  ```

* Workers

  ```js
  cf: {image: {compression: "fast"}}
  ```

### `contrast`

Increase contrast by a factor. A value of `1.0` equals no change, a value of `0.5` equals low contrast, and a value of `2.0` equals high contrast. `0` is ignored.

* URL format

  ```js
  contrast=0.5
  ```

* Workers

  ```js
  cf: {image: {contrast: 0.5}}
  ```

### `dpr`

Device Pixel Ratio. Default is `1`. Multiplier for `width`/`height` that makes it easier to specify higher-DPI sizes in `<img srcset>`.

* URL format

  ```js
  dpr=1
  ```

* Workers

  ```js
  cf: {image: {dpr: 1}}
  ```

### `fit`

Affects interpretation of `width` and `height`. All resizing modes preserve aspect ratio. Used as a string in Workers integration. Available modes are:

* `scale-down`\
  Similar to `contain`, but the image is never enlarged. If the image is larger than given `width` or `height`, it will be resized. Otherwise its original size will be kept.
* `contain`\
  Image will be resized (shrunk or enlarged) to be as large as possible within the given `width` or `height` while preserving the aspect ratio. If you only provide a single dimension (for example, only `width`), the image will be shrunk or enlarged to exactly match that dimension.
* `cover`\
  Resizes (shrinks or enlarges) to fill the entire area of `width` and `height`. If the image has an aspect ratio different from the ratio of `width` and `height`, it will be cropped to fit.
* `crop`\
  Image will be shrunk and cropped to fit within the area specified by `width` and `height`. The image will not be enlarged. For images smaller than the given dimensions, it is the same as `scale-down`. For images larger than the given dimensions, it is the same as `cover`. See also [`trim`](#trim)
* `pad`\
  Resizes to the maximum size that fits within the given `width` and `height`, and then fills the remaining area with a `background` color (white by default). This mode is not recommended, since you can achieve the same effect more efficiently with the `contain` mode and the CSS `object-fit: contain` property.

- URL format

  ```js
  fit=scale-down
  ```

- Workers

  ```js
  cf: {image: {fit: "scale-down"}}
  ```

### `flip`

Flips the image horizontally, vertically, or both. Can be used with the `rotate` parameter to set the orientation of an image.

Flipping is performed before rotation. For example, if you apply `flip=h,rotate=90,` then the image will be flipped horizontally, then rotated by 90 degrees.

Available options are:

* `h`: Flips the image horizontally.
* `v`: Flips the image vertically.
* `hv`: Flips the image vertically and horizontally.

- URL format

  ```js
  flip=h
  ```

- Workers

  ```js
  cf: {image: {flip: "h"}}
  ```

### `format`

The `auto` option will serve the WebP or AVIF format to browsers that support it. If this option is not specified, a standard format like JPEG or PNG will be used. Cloudflare will default to JPEG when possible due to the large size of PNG files.

Workers integration supports:

* `avif`: Generate images in AVIF format if possible (with WebP as a fallback).
* `webp`: Generate images in Google WebP format. Set the quality to `100` to get the WebP lossless format.
* `jpeg`: Generate images in interlaced progressive JPEG format, in which data is compressed in multiple passes of progressively higher detail.
* `baseline-jpeg`: Generate images in baseline sequential JPEG format. It should be used in cases when target devices don't support progressive JPEG or other modern file formats.
* `json`: Instead of generating an image, outputs information about the image in JSON format. The JSON object will contain data such as image size (before and after resizing), source image's MIME type, and file size.

- URL format

  ```js
  format=auto
  ```

- URL format alias

  ```js
  f=auto
  ```

- Workers

  ```js
  cf: {image: {format: "avif"}}
  ```

For the `format:auto` option to work with a custom Worker, you need to parse the `Accept` header. Refer to [this example Worker](https://developers.cloudflare.com/images/transform-images/transform-via-workers/#an-example-worker) for a complete overview of how to set up an image transformation Worker.

```js
const accept = request.headers.get("accept");
let image = {};


if (/image\/avif/.test(accept)) {
  image.format = "avif";
} else if (/image\/webp/.test(accept)) {
  image.format = "webp";
}


return fetch(url, { cf: { image } });
```

### `gamma`

Increase exposure by a factor. A value of `1.0` equals no change, a value of `0.5` darkens the image, and a value of `2.0` lightens the image. `0` is ignored.

* URL format

  ```js
  gamma=0.5
  ```

* Workers

  ```js
  cf: {image: {gamma: 0.5}}
  ```

### `gravity`

When cropping with `fit: "cover"` and `fit: "crop"`, this parameter defines the side or point that should not be cropped. Available options are:

* `auto`\
  Selects focal point based on saliency detection (using maximum symmetric surround algorithm).

* `side`\
  A side (`"left"`, `"right"`, `"top"`, `"bottom"`) or coordinates specified on a scale from `0.0` (top or left) to `1.0` (bottom or right), `0.5` being the center. The X and Y coordinates are separated by lowercase `x` in the URL format. For example, `0x1` means left and bottom, `0.5x0.5` is the center, `0.5x0.33` is a point in the top third of the image.

  For the Workers integration, use an object `{x, y}` to specify coordinates. It contains focal point coordinates in the original image expressed as fractions ranging from `0.0` (top or left) to `1.0` (bottom or right), with `0.5` being the center. `{fit: "cover", gravity: {x:0.5, y:0.2}}` will crop each side to preserve as much as possible around a point at 20% of the height of the source image.

Note

You must subtract the height of the image before you calculate the focal point.

* URL format

  ```js
  gravity=auto


  OR


  gravity=left


  OR


  gravity=0x1
  ```

* URL format alias

  ```js
  g=auto


  OR


  g=left


  OR


  g=0x1
  ```

* Workers

  ```js
  cf: {image: {gravity: "auto"}}


  OR


  cf: {image: {gravity: "right"}}


  OR


  cf: {image: {gravity: {x:0.5, y:0.2}}}
  ```

```plaintext
```

### `height`

Specifies maximum height of the image in pixels. Exact behavior depends on the `fit` mode (described below).

* URL format

  ```js
  height=250
  ```

* URL format alias

  ```js
  h=250
  ```

* Workers

  ```js
  cf: {image: {height: 250}}
  ```

### `metadata`

Controls amount of invisible metadata (EXIF data) that should be preserved.

Color profiles and EXIF rotation are applied to the image even if the metadata is discarded. Content Credentials (C2PA metadata) may be preserved if the [setting is enabled](https://developers.cloudflare.com/images/transform-images/preserve-content-credentials).

Available options are `copyright`, `keep`, and `none`. The default for all JPEG images is `copyright`. WebP and PNG output formats will always discard EXIF metadata.

Note

* If [Polish](https://developers.cloudflare.com/images/polish/) is enabled, then all metadata may already be removed and this option will have no effect.
* Even when choosing to keep EXIF metadata, Cloudflare will modify JFIF data (potentially invalidating it) to avoid the known incompatibility between the two standards. For more details, refer to [JFIF Compatibility](https://en.wikipedia.org/wiki/JPEG_File_Interchange_Format#Compatibility).

Options include:

* `copyright`\
  Discards all EXIF metadata except copyright tag. If C2PA metadata preservation is enabled, then this option will preserve all Content Credentials.
* `keep`\
  Preserves most of EXIF metadata, including GPS location if present. If C2PA metadata preservation is enabled, then this option will preserve all Content Credentials.
* `none`\
  Discards all invisible EXIF and C2PA metadata. If the output format is WebP or PNG, then all metadata will be discarded.

- URL format

  ```js
  metadata=none
  ```

- Workers

  ```js
  cf: {image: {metadata: "none"}}
  ```

### `onerror`

Note

This setting only works directly with [image transformations](https://developers.cloudflare.com/images/transform-images/) and does not support resizing with Cloudflare Workers.

In case of a [fatal error](https://developers.cloudflare.com/images/reference/troubleshooting/#error-responses-from-resizing) that prevents the image from being resized, redirects to the unresized source image URL. This may be useful in case some images require user authentication and cannot be fetched anonymously via Worker. This option should not be used if there is a chance the source image is very large. This option is ignored if the image is from another domain, but you can use it with subdomains.

* URL format

  ```js
  onerror=redirect
  ```

### `quality`

Specifies quality for images in JPEG, WebP, and AVIF formats. The quality is in a 1-100 scale, but useful values are between `50` (low quality, small file size) and `90` (high quality, large file size). `85` is the default. When using the PNG format, an explicit quality setting allows use of PNG8 (palette) variant of the format. Use the `format=auto` option to allow use of WebP and AVIF formats.

We also allow setting one of the perceptual quality levels `high|medium-high|medium-low|low`

* URL format

  ```js
  quality=50


  OR


  quality=low
  ```

* URL format alias

  ```js
  q=50


  OR


  q=medium-high
  ```

* Workers

  ```js
  cf: {image: {quality: 50}}


  OR


  cf: {image: {quality: "high"}}
  ```

### `rotate`

Number of degrees (`90`, `180`, or `270`) to rotate the image by. `width` and `height` options refer to axes after rotation.

* URL format

  ```js
  rotate=90
  ```

* Workers

  ```js
  cf: {image: {rotate: 90}}
  ```

### `saturation`

Increases saturation by a factor. A value of `1.0` equals no change, a value of `0.5` equals half saturation, and a value of `2.0` equals twice as saturated. A value of `0` will convert the image to grayscale.

* URL format

  ```js
  saturation=0.5
  ```

* Workers

  ```js
  cf: {image: {saturation: 0.5}}
  ```

### `sharpen`

Specifies strength of sharpening filter to apply to the image. The value is a floating-point number between `0` (no sharpening, default) and `10` (maximum). `1` is a recommended value for downscaled images.

* URL format

  ```js
  sharpen=2
  ```

* Workers

  ```js
  cf: {image: {sharpen: 2}}
  ```

### `slow-connection-quality`

Allows overriding `quality` value whenever a slow connection is detected.

Available options are same as [quality](https://developers.cloudflare.com/images/transform-images/transform-via-url/#quality).

* URL format

  ```js
  slow-connection-quality=50
  ```

* URL format alias

  ```js
  scq=50
  ```

Detecting slow connections is currently only supported on Chromium-based browsers such as Chrome, Edge, and Opera.

You can enable any of the following client hints via HTTP in a header

```txt
accept-ch: rtt, save-data, ect, downlink
```

slow-connection-quality applies whenever any of the following is true and the client hint is present:

* [rtt](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/RTT): Greater than 150ms.

* [save-data](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Save-Data): Value is "on".

* [ect](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/ECT): Value is one of `slow-2g|2g|3g`.

* [downlink](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Downlink): Less than 5Mbps.

### `trim`

Specifies a number of pixels to cut off on each side. Allows removal of borders or cutting out a specific fragment of an image. Trimming is performed before resizing or rotation. Takes `dpr` into account. For image transformations and Cloudflare Images, use as four numbers in pixels separated by a semicolon, in the form of `top;right;bottom;left` or via separate values `trim.width`,`trim.height`, `trim.left`,`trim.top`. For the Workers integration, specify an object with properties: `{top, right, bottom, left, width, height}`.

* URL format

  ```js
  trim=20;30;20;0
  trim.width=678
  trim.height=678
  trim.left=30
  trim.top=40
  ```

* Workers

  ```js
  cf: {image: {trim: {top: 12,  right: 78, bottom: 34, left: 56, width:678, height:678}}}
  ```

### `width`

Specifies maximum width of the image. Exact behavior depends on the `fit` mode; use the `fit=scale-down` option to ensure that the image will not be enlarged unnecessarily.

Available options are a specified width in pixels or `auto`.

* URL format

  ```js
  width=250
  ```

* URL format alias

  ```js
  w=250
  ```

* Workers

  ```js
  cf: {image: {width: 250}}
  ```

Ideally, image sizes should match the exact dimensions at which they are displayed on the page. If the page contains thumbnails with markup such as `<img width="200">`, then you can resize the image by applying `width=200`.

[To serve responsive images](https://developers.cloudflare.com/images/transform-images/make-responsive-images/#transform-with-html-srcset), you can use the HTML `srcset` element and apply width parameters.

`auto` - Automatically serves the image in the most optimal width based on available information about the browser and device. This method is supported only by Chromium browsers. For more information about this works, refer to [Transform width parameter](https://developers.cloudflare.com/images/transform-images/make-responsive-images/#transform-with-width-parameter).

## Recommended image sizes

Ideally, image sizes should match exactly the size they are displayed on the page. If the page contains thumbnails with markup such as `<img width="200" …>`, then images should be resized to `width=200`. If the exact size is not known ahead of time, use the [responsive images technique](https://developers.cloudflare.com/images/manage-images/create-variants/).

If you cannot use the `<img srcset>` markup, and have to hardcode specific maximum sizes, Cloudflare recommends the following sizes:

* Maximum of 1920 pixels for desktop browsers.
* Maximum of 960 pixels for tablets.
* Maximum of 640 pixels for mobile phones.

Here is an example of markup to configure a maximum size for your image:

```txt
/cdn-cgi/image/fit=scale-down,width=1920/<YOUR-IMAGE>
```

The `fit=scale-down` option ensures that the image will not be enlarged unnecessarily.

You can detect device type by enabling the `CF-Device-Type` header [via Cache Rule](https://developers.cloudflare.com/cache/how-to/cache-rules/examples/cache-device-type/).

## Caching

Resizing causes the original image to be fetched from the origin server and cached — following the usual rules of HTTP caching, `Cache-Control` header, etc.. Requests for multiple different image sizes are likely to reuse the cached original image, without causing extra transfers from the origin server.

Note

If Custom Cache Keys are used for the origin image, the origin image might not be cached and might result in more calls to the origin.

Resized images follow the same caching rules as the original image they were resized from, except the minimum cache time is one hour. If you need images to be updated more frequently, add `must-revalidate` to the `Cache-Control` header. Resizing supports cache revalidation, so we recommend serving images with the `Etag` header. Refer to the [Cache docs for more information](https://developers.cloudflare.com/cache/concepts/cache-control/#revalidation).

Cloudflare Images does not support purging resized variants individually. URLs starting with `/cdn-cgi/` cannot be purged. However, purging of the original image's URL will also purge all of its resized variants.

</page>

<page>
---
title: Transform via Workers · Cloudflare Images docs
description: Using Cloudflare Workers to transform with a custom URL scheme
  gives you powerful programmatic control over every image request.
lastUpdated: 2025-03-10T21:18:36.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/transform-images/transform-via-workers/
  md: https://developers.cloudflare.com/images/transform-images/transform-via-workers/index.md
---

Using Cloudflare Workers to transform with a custom URL scheme gives you powerful programmatic control over every image request.

Here are a few examples of the flexibility Workers give you:

* **Use a custom URL scheme**. Instead of specifying pixel dimensions in image URLs, use preset names such as `thumbnail` and `large`.
* **Hide the actual location of the original image**. You can store images in an external S3 bucket or a hidden folder on your server without exposing that information in URLs.
* **Implement content negotiation**. This is useful to adapt image sizes, formats and quality dynamically based on the device and condition of the network.

The resizing feature is accessed via the [options](https://developers.cloudflare.com/workers/runtime-apis/request/#the-cf-property-requestinitcfproperties) of a `fetch()` [subrequest inside a Worker](https://developers.cloudflare.com/workers/runtime-apis/fetch/).

Note

You can use Cloudflare Images to sanitize SVGs but not to resize them.

## Fetch options

The `fetch()` function accepts parameters in the second argument inside the `{cf: {image: {…}}}` object.

### `anim`

Whether to preserve animation frames from input files. Default is `true`. Setting it to `false` reduces animations to still images. This setting is recommended when enlarging images or processing arbitrary user content, because large GIF animations can weigh tens or even hundreds of megabytes. It is also useful to set `anim:false` when using `format:"json"` to get the response quicker without the number of frames.

* URL format

  ```js
  anim=false
  ```

* Workers

  ```js
  cf: {image: {anim: false}}
  ```

### `background`

Background color to add underneath the image. Applies to images with transparency (for example, PNG) and images resized with `fit=pad`. Accepts any CSS color using CSS4 modern syntax, such as `rgb(255 255 0)` and `rgba(255 255 0 100)`.

* URL format

  ```js
  background=%23RRGGBB


  OR


  background=red


  OR


  background=rgb%28240%2C40%2C145%29
  ```

* Workers

  ```js
  cf: {image: {background: "#RRGGBB"}}


  OR


  cf:{image: {background: "rgba(240,40,145,0)"}}
  ```

### `blur`

Blur radius between `1` (slight blur) and `250` (maximum). Be aware that you cannot use this option to reliably obscure image content, because savvy users can modify an image's URL and remove the blur option. Use Workers to control which options can be set.

* URL format

  ```js
  blur=50
  ```

* Workers

  ```js
  cf: {image: {blur: 50}}
  ```

### `border`

Adds a border around the image. The border is added after resizing. Border width takes `dpr` into account, and can be specified either using a single `width` property, or individually for each side.

* Workers

  ```js
  cf: {image: {border: {color: "rgb(0,0,0,0)", top: 5, right: 10, bottom: 5, left: 10}}}
  cf: {image: {border: {color: "#FFFFFF", width: 10}}}
  ```

### `brightness`

Increase brightness by a factor. A value of `1.0` equals no change, a value of `0.5` equals half brightness, and a value of `2.0` equals twice as bright. `0` is ignored.

* URL format

  ```js
  brightness=0.5
  ```

* Workers

  ```js
  cf: {image: {brightness: 0.5}}
  ```

### `compression`

Slightly reduces latency on a cache miss by selecting a quickest-to-compress file format, at a cost of increased file size and lower image quality. It will usually override the `format` option and choose JPEG over WebP or AVIF. We do not recommend using this option, except in unusual circumstances like resizing uncacheable dynamically-generated images.

* URL format

  ```js
  compression=fast
  ```

* Workers

  ```js
  cf: {image: {compression: "fast"}}
  ```

### `contrast`

Increase contrast by a factor. A value of `1.0` equals no change, a value of `0.5` equals low contrast, and a value of `2.0` equals high contrast. `0` is ignored.

* URL format

  ```js
  contrast=0.5
  ```

* Workers

  ```js
  cf: {image: {contrast: 0.5}}
  ```

### `dpr`

Device Pixel Ratio. Default is `1`. Multiplier for `width`/`height` that makes it easier to specify higher-DPI sizes in `<img srcset>`.

* URL format

  ```js
  dpr=1
  ```

* Workers

  ```js
  cf: {image: {dpr: 1}}
  ```

### `fit`

Affects interpretation of `width` and `height`. All resizing modes preserve aspect ratio. Used as a string in Workers integration. Available modes are:

* `scale-down`\
  Similar to `contain`, but the image is never enlarged. If the image is larger than given `width` or `height`, it will be resized. Otherwise its original size will be kept.
* `contain`\
  Image will be resized (shrunk or enlarged) to be as large as possible within the given `width` or `height` while preserving the aspect ratio. If you only provide a single dimension (for example, only `width`), the image will be shrunk or enlarged to exactly match that dimension.
* `cover`\
  Resizes (shrinks or enlarges) to fill the entire area of `width` and `height`. If the image has an aspect ratio different from the ratio of `width` and `height`, it will be cropped to fit.
* `crop`\
  Image will be shrunk and cropped to fit within the area specified by `width` and `height`. The image will not be enlarged. For images smaller than the given dimensions, it is the same as `scale-down`. For images larger than the given dimensions, it is the same as `cover`. See also [`trim`](#trim)
* `pad`\
  Resizes to the maximum size that fits within the given `width` and `height`, and then fills the remaining area with a `background` color (white by default). This mode is not recommended, since you can achieve the same effect more efficiently with the `contain` mode and the CSS `object-fit: contain` property.

- URL format

  ```js
  fit=scale-down
  ```

- Workers

  ```js
  cf: {image: {fit: "scale-down"}}
  ```

### `flip`

Flips the image horizontally, vertically, or both. Can be used with the `rotate` parameter to set the orientation of an image.

Flipping is performed before rotation. For example, if you apply `flip=h,rotate=90,` then the image will be flipped horizontally, then rotated by 90 degrees.

Available options are:

* `h`: Flips the image horizontally.
* `v`: Flips the image vertically.
* `hv`: Flips the image vertically and horizontally.

- URL format

  ```js
  flip=h
  ```

- Workers

  ```js
  cf: {image: {flip: "h"}}
  ```

### `format`

The `auto` option will serve the WebP or AVIF format to browsers that support it. If this option is not specified, a standard format like JPEG or PNG will be used. Cloudflare will default to JPEG when possible due to the large size of PNG files.

Workers integration supports:

* `avif`: Generate images in AVIF format if possible (with WebP as a fallback).
* `webp`: Generate images in Google WebP format. Set the quality to `100` to get the WebP lossless format.
* `jpeg`: Generate images in interlaced progressive JPEG format, in which data is compressed in multiple passes of progressively higher detail.
* `baseline-jpeg`: Generate images in baseline sequential JPEG format. It should be used in cases when target devices don't support progressive JPEG or other modern file formats.
* `json`: Instead of generating an image, outputs information about the image in JSON format. The JSON object will contain data such as image size (before and after resizing), source image's MIME type, and file size.

- URL format

  ```js
  format=auto
  ```

- URL format alias

  ```js
  f=auto
  ```

- Workers

  ```js
  cf: {image: {format: "avif"}}
  ```

For the `format:auto` option to work with a custom Worker, you need to parse the `Accept` header. Refer to [this example Worker](https://developers.cloudflare.com/images/transform-images/transform-via-workers/#an-example-worker) for a complete overview of how to set up an image transformation Worker.

```js
const accept = request.headers.get("accept");
let image = {};


if (/image\/avif/.test(accept)) {
  image.format = "avif";
} else if (/image\/webp/.test(accept)) {
  image.format = "webp";
}


return fetch(url, { cf: { image } });
```

### `gamma`

Increase exposure by a factor. A value of `1.0` equals no change, a value of `0.5` darkens the image, and a value of `2.0` lightens the image. `0` is ignored.

* URL format

  ```js
  gamma=0.5
  ```

* Workers

  ```js
  cf: {image: {gamma: 0.5}}
  ```

### `gravity`

When cropping with `fit: "cover"` and `fit: "crop"`, this parameter defines the side or point that should not be cropped. Available options are:

* `auto`\
  Selects focal point based on saliency detection (using maximum symmetric surround algorithm).

* `side`\
  A side (`"left"`, `"right"`, `"top"`, `"bottom"`) or coordinates specified on a scale from `0.0` (top or left) to `1.0` (bottom or right), `0.5` being the center. The X and Y coordinates are separated by lowercase `x` in the URL format. For example, `0x1` means left and bottom, `0.5x0.5` is the center, `0.5x0.33` is a point in the top third of the image.

  For the Workers integration, use an object `{x, y}` to specify coordinates. It contains focal point coordinates in the original image expressed as fractions ranging from `0.0` (top or left) to `1.0` (bottom or right), with `0.5` being the center. `{fit: "cover", gravity: {x:0.5, y:0.2}}` will crop each side to preserve as much as possible around a point at 20% of the height of the source image.

Note

You must subtract the height of the image before you calculate the focal point.

* URL format

  ```js
  gravity=auto


  OR


  gravity=left


  OR


  gravity=0x1
  ```

* URL format alias

  ```js
  g=auto


  OR


  g=left


  OR


  g=0x1
  ```

* Workers

  ```js
  cf: {image: {gravity: "auto"}}


  OR


  cf: {image: {gravity: "right"}}


  OR


  cf: {image: {gravity: {x:0.5, y:0.2}}}
  ```

```plaintext
```

### `height`

Specifies maximum height of the image in pixels. Exact behavior depends on the `fit` mode (described below).

* URL format

  ```js
  height=250
  ```

* URL format alias

  ```js
  h=250
  ```

* Workers

  ```js
  cf: {image: {height: 250}}
  ```

### `metadata`

Controls amount of invisible metadata (EXIF data) that should be preserved.

Color profiles and EXIF rotation are applied to the image even if the metadata is discarded. Content Credentials (C2PA metadata) may be preserved if the [setting is enabled](https://developers.cloudflare.com/images/transform-images/preserve-content-credentials).

Available options are `copyright`, `keep`, and `none`. The default for all JPEG images is `copyright`. WebP and PNG output formats will always discard EXIF metadata.

Note

* If [Polish](https://developers.cloudflare.com/images/polish/) is enabled, then all metadata may already be removed and this option will have no effect.
* Even when choosing to keep EXIF metadata, Cloudflare will modify JFIF data (potentially invalidating it) to avoid the known incompatibility between the two standards. For more details, refer to [JFIF Compatibility](https://en.wikipedia.org/wiki/JPEG_File_Interchange_Format#Compatibility).

Options include:

* `copyright`\
  Discards all EXIF metadata except copyright tag. If C2PA metadata preservation is enabled, then this option will preserve all Content Credentials.
* `keep`\
  Preserves most of EXIF metadata, including GPS location if present. If C2PA metadata preservation is enabled, then this option will preserve all Content Credentials.
* `none`\
  Discards all invisible EXIF and C2PA metadata. If the output format is WebP or PNG, then all metadata will be discarded.

- URL format

  ```js
  metadata=none
  ```

- Workers

  ```js
  cf: {image: {metadata: "none"}}
  ```

### `onerror`

Note

This setting only works directly with [image transformations](https://developers.cloudflare.com/images/transform-images/) and does not support resizing with Cloudflare Workers.

In case of a [fatal error](https://developers.cloudflare.com/images/reference/troubleshooting/#error-responses-from-resizing) that prevents the image from being resized, redirects to the unresized source image URL. This may be useful in case some images require user authentication and cannot be fetched anonymously via Worker. This option should not be used if there is a chance the source image is very large. This option is ignored if the image is from another domain, but you can use it with subdomains.

* URL format

  ```js
  onerror=redirect
  ```

### `quality`

Specifies quality for images in JPEG, WebP, and AVIF formats. The quality is in a 1-100 scale, but useful values are between `50` (low quality, small file size) and `90` (high quality, large file size). `85` is the default. When using the PNG format, an explicit quality setting allows use of PNG8 (palette) variant of the format. Use the `format=auto` option to allow use of WebP and AVIF formats.

We also allow setting one of the perceptual quality levels `high|medium-high|medium-low|low`

* URL format

  ```js
  quality=50


  OR


  quality=low
  ```

* URL format alias

  ```js
  q=50


  OR


  q=medium-high
  ```

* Workers

  ```js
  cf: {image: {quality: 50}}


  OR


  cf: {image: {quality: "high"}}
  ```

### `rotate`

Number of degrees (`90`, `180`, or `270`) to rotate the image by. `width` and `height` options refer to axes after rotation.

* URL format

  ```js
  rotate=90
  ```

* Workers

  ```js
  cf: {image: {rotate: 90}}
  ```

### `saturation`

Increases saturation by a factor. A value of `1.0` equals no change, a value of `0.5` equals half saturation, and a value of `2.0` equals twice as saturated. A value of `0` will convert the image to grayscale.

* URL format

  ```js
  saturation=0.5
  ```

* Workers

  ```js
  cf: {image: {saturation: 0.5}}
  ```

### `sharpen`

Specifies strength of sharpening filter to apply to the image. The value is a floating-point number between `0` (no sharpening, default) and `10` (maximum). `1` is a recommended value for downscaled images.

* URL format

  ```js
  sharpen=2
  ```

* Workers

  ```js
  cf: {image: {sharpen: 2}}
  ```

### `trim`

Specifies a number of pixels to cut off on each side. Allows removal of borders or cutting out a specific fragment of an image. Trimming is performed before resizing or rotation. Takes `dpr` into account. For image transformations and Cloudflare Images, use as four numbers in pixels separated by a semicolon, in the form of `top;right;bottom;left` or via separate values `trim.width`,`trim.height`, `trim.left`,`trim.top`. For the Workers integration, specify an object with properties: `{top, right, bottom, left, width, height}`.

* URL format

  ```js
  trim=20;30;20;0
  trim.width=678
  trim.height=678
  trim.left=30
  trim.top=40
  ```

* Workers

  ```js
  cf: {image: {trim: {top: 12,  right: 78, bottom: 34, left: 56, width:678, height:678}}}
  ```

### `width`

Specifies maximum width of the image. Exact behavior depends on the `fit` mode; use the `fit=scale-down` option to ensure that the image will not be enlarged unnecessarily.

Available options are a specified width in pixels or `auto`.

* URL format

  ```js
  width=250
  ```

* URL format alias

  ```js
  w=250
  ```

* Workers

  ```js
  cf: {image: {width: 250}}
  ```

Ideally, image sizes should match the exact dimensions at which they are displayed on the page. If the page contains thumbnails with markup such as `<img width="200">`, then you can resize the image by applying `width=200`.

[To serve responsive images](https://developers.cloudflare.com/images/transform-images/make-responsive-images/#transform-with-html-srcset), you can use the HTML `srcset` element and apply width parameters.

`auto` - Automatically serves the image in the most optimal width based on available information about the browser and device. This method is supported only by Chromium browsers. For more information about this works, refer to [Transform width parameter](https://developers.cloudflare.com/images/transform-images/make-responsive-images/#transform-with-width-parameter).

In your worker, where you would fetch the image using `fetch(request)`, add options like in the following example:

```js
fetch(imageURL, {
  cf: {
    image: {
      fit: "scale-down",
      width: 800,
      height: 600
    }
  }
})
```

These typings are also available in [our Workers TypeScript definitions library](https://github.com/cloudflare/workers-types).

## Configure a Worker

Create a new script in the Workers section of the Cloudflare dashboard. Scope your Worker script to a path dedicated to serving assets, such as `/images/*` or `/assets/*`. Only supported image formats can be resized. Attempting to resize any other type of resource (CSS, HTML) will result in an error.

Warning

Do not set up the Image Resizing worker for the entire zone (`/*`). This will block all non-image requests and make your website inaccessible.

It is best to keep the path handled by the Worker separate from the path to original (unresized) images, to avoid request loops caused by the image resizing worker calling itself. For example, store your images in `example.com/originals/` directory, and handle resizing via `example.com/thumbnails/*` path that fetches images from the `/originals/` directory. If source images are stored in a location that is handled by a Worker, you must prevent the Worker from creating an infinite loop.

### Prevent request loops

To perform resizing and optimizations, the Worker must be able to fetch the original, unresized image from your origin server. If the path handled by your Worker overlaps with the path where images are stored on your server, it could cause an infinite loop by the Worker trying to request images from itself.

You must detect which requests must go directly to the origin server. When the `image-resizing` string is present in the `Via` header, it means that it is a request coming from another Worker and should be directed to the origin server:

```js
addEventListener("fetch", event => {
  // If this request is coming from image resizing worker,
  // avoid causing an infinite loop by resizing it again:
  if (/image-resizing/.test(event.request.headers.get("via"))) {
    return fetch(event.request)
  }


  // Now you can safely use image resizing here
}
```

## Lack of preview in the dashboard

Note

Image transformations are not simulated in the preview of in the Workers dashboard editor.

The script preview of the Worker editor ignores `fetch()` options, and will always fetch unresized images. To see the effect of image transformations you must deploy the Worker script and use it outside of the editor.

## Error handling

When an image cannot be resized — for example, because the image does not exist or the resizing parameters were invalid — the response will have an HTTP status indicating an error (for example, `400`, `404`, or `502`).

By default, the error will be forwarded to the browser, but you can decide how to handle errors. For example, you can redirect the browser to the original, unresized image instead:

```js
const response = await fetch(imageURL, options)


if (response.ok || response.redirected) { // fetch() may respond with status 304
  return response
} else {
  return response.redirect(imageURL, 307)
}
```

Keep in mind that if the original images on your server are very large, it may be better not to display failing images at all, than to fall back to overly large images that could use too much bandwidth, memory, or break page layout.

You can also replace failed images with a placeholder image:

```js
const response = await fetch(imageURL, options)
if (response.ok || response.redirected) {
  return response
} else {
  // Change to a URL on your server
  return fetch("https://img.example.com/blank-placeholder.png")
}
```

## An example worker

Assuming you [set up a Worker](https://developers.cloudflare.com/workers/get-started/guide/) on `https://example.com/image-resizing` to handle URLs like `https://example.com/image-resizing?width=80&image=https://example.com/uploads/avatar1.jpg`:

```js
/**
 * Fetch and log a request
 * @param {Request} request
 */
export default {
  async fetch(request) {
    // Parse request URL to get access to query string
    let url = new URL(request.url)


    // Cloudflare-specific options are in the cf object.
    let options = { cf: { image: {} } }


    // Copy parameters from query string to request options.
    // You can implement various different parameters here.
    if (url.searchParams.has("fit")) options.cf.image.fit = url.searchParams.get("fit")
    if (url.searchParams.has("width")) options.cf.image.width = url.searchParams.get("width")
    if (url.searchParams.has("height")) options.cf.image.height = url.searchParams.get("height")
    if (url.searchParams.has("quality")) options.cf.image.quality = url.searchParams.get("quality")


    // Your Worker is responsible for automatic format negotiation. Check the Accept header.
    const accept = request.headers.get("Accept");
    if (/image\/avif/.test(accept)) {
      options.cf.image.format = 'avif';
    } else if (/image\/webp/.test(accept)) {
      options.cf.image.format = 'webp';
    }


    // Get URL of the original (full size) image to resize.
    // You could adjust the URL here, e.g., prefix it with a fixed address of your server,
    // so that user-visible URLs are shorter and cleaner.
    const imageURL = url.searchParams.get("image")
    if (!imageURL) return new Response('Missing "image" value', { status: 400 })


    try {
      // TODO: Customize validation logic
      const { hostname, pathname } = new URL(imageURL)


      // Optionally, only allow URLs with JPEG, PNG, GIF, or WebP file extensions
      // @see https://developers.cloudflare.com/images/url-format#supported-formats-and-limitations
      if (!/\.(jpe?g|png|gif|webp)$/i.test(pathname)) {
        return new Response('Disallowed file extension', { status: 400 })
      }


      // Demo: Only accept "example.com" images
      if (hostname !== 'example.com') {
        return new Response('Must use "example.com" source images', { status: 403 })
      }
    } catch (err) {
      return new Response('Invalid "image" value', { status: 400 })
    }


    // Build a request that passes through request headers
    const imageRequest = new Request(imageURL, {
      headers: request.headers
    })


    // Returning fetch() with resizing options will pass through response with the resized image.
    return fetch(imageRequest, options)
  }
}
```

When testing image resizing, please deploy the script first. Resizing will not be active in the online editor in the dashboard.

## Warning about `cacheKey`

Resized images are always cached. They are cached as additional variants under a cache entry for the URL of the full-size source image in the `fetch` subrequest. Do not worry about using many different Workers or many external URLs — they do not influence caching of resized images, and you do not need to do anything for resized images to be cached correctly.

If you use the `cacheKey` fetch option to unify caches of multiple different source URLs, you must not add any resizing options to the `cacheKey`, as this will fragment the cache and hurt caching performance. The `cacheKey` option is meant for the full-size source image URL only, not for its resized variants.

</page>

<page>
---
title: Optimize mobile viewing · Cloudflare Images docs
description: Lazy loading is an easy way to optimize the images on your webpages
  for mobile devices, with faster page load times and lower costs.
lastUpdated: 2025-07-07T13:33:04.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/tutorials/optimize-mobile-viewing/
  md: https://developers.cloudflare.com/images/tutorials/optimize-mobile-viewing/index.md
---

You can use lazy loading to optimize the images on your webpages for mobile viewing. This helps address common challenges of mobile viewing, like slow network connections or weak processing capabilities.

Lazy loading has two main advantages:

* **Faster page load times** — Images are loaded as the user scrolls down the page, instead of all at once when the page is opened.
* **Lower costs for image delivery** — When using Cloudflare Images, you only pay to load images that the user actually sees. With lazy loading, images that are not scrolled into view do not count toward your billable Images requests.

Lazy loading is natively supported on all Chromium-based browsers like Chrome, Safari, Firefox, Opera, and Edge.

Note

If you use older methods, involving custom JavaScript or a JavaScript library, lazy loading may increase the initial load time of the page since the browser needs to download, parse, and execute JavaScript.

## Modify your loading attribute

Without modifying your loading attribute, most browsers will fetch all images on a page, prioritizing the images that are closest to the viewport by default. You can override this by modifying your `loading` attribute.

There are two possible `loading` attributes for your `<img>` tags: `lazy` and `eager`.

### Lazy loading

Lazy loading is recommended for most images. With Lazy loading, resources like images are deferred until they reach a certain distance from the viewport. If an image does not reach the threshold, then it does not get loaded.

Example of modifying the `loading` attribute of your `<img>` tags to be `"lazy"`:

```HTML
<img src="example.com/cdn-cgi/width=300/image.png" loading="lazy">
```

### Eager loading

If you have images that are in the viewport, eager loading, instead of lazy loading, is recommended. Eager loading loads the asset at the initial page load, regardless of its location on the page.

Example of modifying the `loading` attribute of your `<img>` tags to be `"eager"`:

```HTML
<img src="example.com/cdn-cgi/width=300/image.png" loading="eager">
```

</page>

<page>
---
title: Transform user-uploaded images before uploading to R2 · Cloudflare Images docs
description: Set up bindings to connect Images, R2, and Assets to your Worker
lastUpdated: 2025-04-28T16:08:27.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/tutorials/optimize-user-uploaded-image/
  md: https://developers.cloudflare.com/images/tutorials/optimize-user-uploaded-image/index.md
---

In this guide, you will build an app that accepts image uploads, overlays the image with a visual watermark, then stores the transformed image in your R2 bucket.

***

With Images, you have the flexibility to choose where your original images are stored. You can transform images that are stored outside of the Images product, like in [R2](https://developers.cloudflare.com/r2/).

When you store user-uploaded media in R2, you may want to optimize or manipulate images before they are uploaded to your R2 bucket.

You will learn how to connect Developer Platform services to your Worker through bindings, as well as use various optimization features in the Images API.

## Prerequisites

Before you begin, you will need to do the following:

* Add an [Images Paid](https://developers.cloudflare.com/images/pricing/#images-paid) subscription to your account. This allows you to bind the Images API to your Worker.
* Create an [R2 bucket](https://developers.cloudflare.com/r2/get-started/#2-create-a-bucket), where the transformed images will be uploaded.
* Create a new Worker project.

If you are new, review how to [create your first Worker](https://developers.cloudflare.com/workers/get-started/guide/).

## 1: Set up your Worker project

To start, you will need to set up your project to use the following resources on the Developer Platform:

* [Images](https://developers.cloudflare.com/images/transform-images/bindings/) to transform, resize, and encode images directly from your Worker.
* [R2](https://developers.cloudflare.com/r2/api/workers/workers-api-usage/) to connect the bucket for storing transformed images.
* [Assets](https://developers.cloudflare.com/workers/static-assets/binding/) to access a static image that will be used as the visual watermark.

### Add the bindings to your Wrangler configuration

Configure your `wrangler.toml` file to add the Images, R2, and Assets bindings:

* wrangler.jsonc

  ```jsonc
  {
    "images": {
      "binding": "IMAGES"
    },
    "r2_buckets": [
      {
        "binding": "R2",
        "bucket_name": "<BUCKET>"
      }
    ],
    "assets": {
      "directory": "./<DIRECTORY>",
      "binding": "ASSETS"
    }
  }
  ```

* wrangler.toml

  ```toml
  [images]
  binding = "IMAGES"


  [[r2_buckets]]
  binding = "R2"
  bucket_name = "<BUCKET>"


  [assets]
  directory = "./<DIRECTORY>"
  binding = "ASSETS"
  ```

Replace `<BUCKET>` with the name of the R2 bucket where you will upload the images after they are transformed. In your Worker code, you will be able to refer to this bucket using `env.R2.`

Replace `./<DIRECTORY>` with the name of the project's directory where the overlay image will be stored. In your Worker code, you will be able to refer to these assets using `env.ASSETS`.

### Set up your assets directory

Because we want to apply a visual watermark to every uploaded image, you need a place to store the overlay image.

The assets directory of your project lets you upload static assets as part of your Worker. When you deploy your project, these uploaded files, along with your Worker code, are deployed to Cloudflare's infrastructure in a single operation.

After you configure your Wrangler file, upload the overlay image to the specified directory. In our example app, the directory `./assets` contains the overlay image.

## 2: Build your frontend

You will need to build the interface for the app that lets users upload images.

In this example, the frontend is rendered directly from the Worker script.

To do this, make a new `html` variable, which contains a `form` element for accepting uploads. In `fetch`, construct a new `Response` with a `Content-Type: text/html` header to serve your static HTML site to the client:

```js
const html = `
<!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Upload Image</title>
          </head>
          <body>
            <h1>Upload an image</h1>
            <form method="POST" enctype="multipart/form-data">
              <input type="file" name="image" accept="image/*" required />
              <button type="submit">Upload</button>
            </form>
          </body>
        </html>
`;


export default {
  async fetch(request, env) {
    if (request.method === "GET") {
      return new Response(html, {headers:{'Content-Type':'text/html'},})
    }
    if (request.method ==="POST") {
      // This is called when the user submits the form
    }
  }
};
```

## 3: Read the uploaded image

After you have a `form`, you need to make sure you can transform the uploaded images.

Because the `form` lets users upload directly from their disk, you cannot use `fetch()` to get an image from a URL. Instead, you will operate on the body of the image as a stream of bytes.

To do this, parse the data from the `form` as an array buffer:

```js
export default {
  async fetch(request, env) {
    if (request.method === "GET") {
      return new Response(html, {headers:{'Content-Type':'text/html'},})
    }
    if (request.method === "POST") {
      try {
        // Parse form data
        const formData = await request.formData();
        const file = formData.get("image");
        if (!file || typeof file.arrayBuffer !== "function") {
          return new Response("No image file provided", { status: 400 });
        }


        // Read uploaded image as array buffer
        const fileBuffer = await file.arrayBuffer();
      } catch (err) {
        console.log(err.message)
      }
    }
  }
};
```

Prevent potential errors when accessing request.body

The body of a [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) can only be accessed once. If you previously used `request.formData()` in the same request, you may encounter a TypeError when attempting to access `request.body`.

To avoid errors, create a clone of the Request object with `request.clone()` for each subsequent attempt to access a Request's body. Keep in mind that Workers have a [memory limit of 128 MB per Worker](https://developers.cloudflare.com/workers/platform/limits#worker-limits) and loading particularly large files into a Worker's memory multiple times may reach this limit. To ensure memory usage does not reach this limit, consider using [Streams](https://developers.cloudflare.com/workers/runtime-apis/streams/).

## 4: Transform the image

For every uploaded image, you want to perform the following actions:

* Overlay the visual watermark that we added to our assets directory.
* Transcode the image — with its watermark — to `AVIF`. This compresses the image and reduces its file size.
* Upload the transformed image to R2.

### Set up the overlay image

To fetch the overlay image from the assets directory, create a function `assetUrl` then use `env.ASSETS` to retrieve the `watermark.png` image:

```js
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });


function assetUrl(request, path) {
  const url = new URL(request.url);
  url.pathname = path;
  return url;
}
__name(assetUrl, "assetUrl");


export default {
  async fetch(request, env) {
    if (request.method === "GET") {
      return new Response(html, {headers:{'Content-Type':'text/html'},})
    }
    if (request.method === "POST") {
      try {
        // Parse form data
        const formData = await request.formData();
        const file = formData.get("image");
        if (!file || typeof file.arrayBuffer !== "function") {
          return new Response("No image file provided", { status: 400 });
        }


        // Read uploaded image as array buffer
        const fileBuffer = await file.arrayBuffer();


        // Fetch image as watermark
        let watermarkStream = (await env.ASSETS.fetch(assetUrl(request, "watermark.png"))).body;
      } catch (err) {
        console.log(err.message)
      }
    }
  }
};
```

### Watermark and transcode the image

You can interact with the Images binding through `env.IMAGES`.

This is where you will put all of the optimization operations you want to perform on the image. Here, you will use the `.draw()` function to apply a visual watermark over the uploaded image, then use `.output()` to encode the image as AVIF:

```js
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });


function assetUrl(request, path) {
  const url = new URL(request.url);
  url.pathname = path;
  return url;
}
__name(assetUrl, "assetUrl");


export default {
  async fetch(request, env) {
    if (request.method === "GET") {
      return new Response(html, {headers:{'Content-Type':'text/html'},})
    }
    if (request.method === "POST") {
      try {
        // Parse form data
        const formData = await request.formData();
        const file = formData.get("image");
        if (!file || typeof file.arrayBuffer !== "function") {
          return new Response("No image file provided", { status: 400 });
        }


        // Read uploaded image as array buffer
        const fileBuffer = await file.arrayBuffer();


        // Fetch image as watermark
        let watermarkStream = (await env.ASSETS.fetch(assetUrl(request, "watermark.png"))).body;


        // Apply watermark and convert to AVIF
        const imageResponse = (
          await env.IMAGES.input(fileBuffer)
              // Draw the watermark on top of the image
              .draw(
                env.IMAGES.input(watermarkStream)
                  .transform({ width: 100, height: 100 }),
                { bottom: 10, right: 10, opacity: 0.75 }
              )
              // Output the final image as AVIF
              .output({ format: "image/avif" })
          ).response();
      } catch (err) {
        console.log(err.message)
      }
    }
  }
};
```

## 5: Upload to R2

Upload the transformed image to R2.

By creating a `fileName` variable, you can specify the name of the transformed image. In this example, you append the date to the name of the original image before uploading to R2.

Here is the full code for the example:

```js
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });


function assetUrl(request, path) {
  const url = new URL(request.url);
  url.pathname = path;
  return url;
}
__name(assetUrl, "assetUrl");


export default {
  async fetch(request, env) {
    if (request.method === "GET") {
      return new Response(html, {headers:{'Content-Type':'text/html'},})
    }
    if (request.method === "POST") {
      try {
        // Parse form data
        const formData = await request.formData();
        const file = formData.get("image");
        if (!file || typeof file.arrayBuffer !== "function") {
          return new Response("No image file provided", { status: 400 });
        }


        // Read uploaded image as array buffer
        const fileBuffer = await file.arrayBuffer();


        // Fetch image as watermark
        let watermarkStream = (await env.ASSETS.fetch(assetUrl(request, "watermark.png"))).body;


        // Apply watermark and convert to AVIF
        const imageResponse = (
          await env.IMAGES.input(fileBuffer)
              // Draw the watermark on top of the image
              .draw(
                env.IMAGES.input(watermarkStream)
                  .transform({ width: 100, height: 100 }),
                { bottom: 10, right: 10, opacity: 0.75 }
              )
              // Output the final image as AVIF
              .output({ format: "image/avif" })
          ).response();


          // Add timestamp to file name
          const fileName = `image-${Date.now()}.avif`;


          // Upload to R2
          await env.R2.put(fileName, imageResponse.body)


          return new Response(`Image uploaded successfully as ${fileName}`, { status: 200 });
      } catch (err) {
        console.log(err.message)
      }
    }
  }
};
```

## Next steps

In this tutorial, you learned how to connect your Worker to various resources on the Developer Platform to build an app that accepts image uploads, transform images, and uploads the output to R2.

Next, you can [set up a transformation URL](https://developers.cloudflare.com/images/transform-images/transform-via-url/) to dynamically optimize images that are stored in R2.

</page>

<page>
---
title: Accept user-uploaded images · Cloudflare Images docs
description: The Direct Creator Upload feature in Cloudflare Images lets your
  users upload images with a one-time upload URL without exposing your API key
  or token to the client. Using a direct creator upload also eliminates the need
  for an intermediary storage bucket and the storage/egress costs associated
  with it.
lastUpdated: 2024-12-20T15:30:14.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/upload-images/direct-creator-upload/
  md: https://developers.cloudflare.com/images/upload-images/direct-creator-upload/index.md
---

The Direct Creator Upload feature in Cloudflare Images lets your users upload images with a one-time upload URL without exposing your API key or token to the client. Using a direct creator upload also eliminates the need for an intermediary storage bucket and the storage/egress costs associated with it.

You can set up [webhooks](https://developers.cloudflare.com/images/manage-images/configure-webhooks/) to receive notifications on your direct creator upload workflow.

## Request a one-time upload URL

Make a `POST` request to the `direct_upload` endpoint using the example below as reference.

Note

The `metadata` included in the request is never shared with end users.

```bash
curl --request POST \
https://api.cloudflare.com/client/v4/accounts/{account_id}/images/v2/direct_upload \
--header "Authorization: Bearer <API_TOKEN>" \
--form 'requireSignedURLs=true' \
--form 'metadata={"key":"value"}'
```

After a successful request, you will receive a response similar to the example below. The `id` field is a future image identifier that will be uploaded by a creator.

```json
{
  "result": {
    "id": "2cdc28f0-017a-49c4-9ed7-87056c83901",
    "uploadURL": "https://upload.imagedelivery.net/Vi7wi5KSItxGFsWRG2Us6Q/2cdc28f0-017a-49c4-9ed7-87056c83901"
  },
  "result_info": null,
  "success": true,
  "errors": [],
  "messages": []
}
```

After calling the endpoint, a new draft image record is created, but the image will not appear in the list of images. If you want to check the status of the image record, you can make a request to the one-time upload URL using the `direct_upload` endpoint.

## Check the image record status

To check the status of a new draft image record, use the one-time upload URL as shown in the example below.

```bash
curl https://api.cloudflare.com/client/v4/accounts/{account_id}/images/v1/{image_id} \
--header "Authorization: Bearer <API_TOKEN>"
```

After a successful request, you should receive a response similar to the example below. The `draft` field is set to `true` until a creator uploads an image. After an image is uploaded, the draft field is removed.

```json
{
  "result": {
    "id": "2cdc28f0-017a-49c4-9ed7-87056c83901",
    "metadata": {
      "key": "value"
    },
    "uploaded": "2022-01-31T16:39:28.458Z",
    "requireSignedURLs": true,
    "variants": [
      "https://imagedelivery.net/Vi7wi5KSItxGFsWRG2Us6Q/2cdc28f0-017a-49c4-9ed7-87056c83901/public",
      "https://imagedelivery.net/Vi7wi5KSItxGFsWRG2Us6Q/2cdc28f0-017a-49c4-9ed7-87056c83901/thumbnail"
    ],
    "draft": true
  },
  "success": true,
  "errors": [],
  "messages": []
}
```

The backend endpoint should return the `uploadURL` property to the client, which uploads the image without needing to pass any authentication information with it.

Below is an example of an HTML page that takes a one-time upload URL and uploads any image the user selects.

```html
<!DOCTYPE html>
<html>
<body>
<form
action="INSERT_UPLOAD_URL_HERE"
method="post"
enctype="multipart/form-data"
>
<input type="file" id="myFile" name="file" />
<input type="submit" />
</form>
</body>
</html>
```

By default, the `uploadURL` expires after 30 minutes if unused. To override this option, add the following argument to the cURL command:

```txt
--data '{"expiry":"2021-09-14T16:00:00Z"}'
```

The expiry value must be a minimum of two minutes and maximum of six hours in the future.

## Direct Creator Upload with custom ID

You can specify a [custom ID](https://developers.cloudflare.com/images/upload-images/upload-custom-path/) when you first request a one-time upload URL, instead of using the automatically generated ID for your image. Note that images with a custom ID cannot be made private with the [signed URL tokens](https://developers.cloudflare.com/images/manage-images/serve-images/serve-private-images) feature (`--requireSignedURLs=true`).

To specify a custom ID, pass a form field with the name ID and corresponding custom ID value as shown in the example below.

```txt
--form 'id=this/is/my-customid'
```

</page>

<page>
---
title: Upload via batch API · Cloudflare Images docs
description: The Images batch API lets you make several requests in sequence
  while bypassing Cloudflare’s global API rate limits.
lastUpdated: 2025-02-10T14:44:19.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/upload-images/images-batch/
  md: https://developers.cloudflare.com/images/upload-images/images-batch/index.md
---

The Images batch API lets you make several requests in sequence while bypassing Cloudflare’s global API rate limits.

To use the Images batch API, you will need to obtain a batch token and use the token to make several requests. The requests authorized by this batch token are made to a separate endpoint and do not count toward the global API rate limits. Each token is subject to a rate limit of 200 requests per second. You can use multiple tokens if you require higher throughput to the Cloudflare Images API.

To obtain a token, you can use the new `images/v1/batch_token` endpoint as shown in the example below.

```bash
curl "https://api.cloudflare.com/client/v4/accounts/{account_id}/images/v1/batch_token" \
--header "Authorization: Bearer <API_TOKEN>"


# Response:
{
  "result": {
    "token": "<BATCH_TOKEN>",
    "expiresAt": "2023-08-09T15:33:56.273411222Z"
  },
  "success": true,
  "errors": [],
  "messages": []
}
```

After getting your token, use it to make requests for:

* [Upload an image](https://developers.cloudflare.com/api/resources/images/subresources/v1/methods/create/) - `POST /images/v1`
* [Delete an image](https://developers.cloudflare.com/api/resources/images/subresources/v1/methods/delete/) - `DELETE /images/v1/{identifier}`
* [Image details](https://developers.cloudflare.com/api/resources/images/subresources/v1/methods/get/) - `GET /images/v1/{identifier}`
* [Update image](https://developers.cloudflare.com/api/resources/images/subresources/v1/methods/edit/) - `PATCH /images/v1/{identifier}`
* [List images V2](https://developers.cloudflare.com/api/resources/images/subresources/v2/methods/list/) - `GET /images/v2`
* [Direct upload V2](https://developers.cloudflare.com/api/resources/images/subresources/v2/subresources/direct_uploads/methods/create/) - `POST /images/v2/direct_upload`

These options use a different host and a different path with the same method, request, and response bodies.

```bash
curl "https://api.cloudflare.com/client/v4/accounts/{account_id}/images/v2" \
--header "Authorization: Bearer <API_TOKEN>"
```

```bash
curl "https://batch.imagedelivery.net/images/v1" \
--header "Authorization: Bearer <BATCH_TOKEN>"
```

</page>

<page>
---
title: Upload via Sourcing Kit · Cloudflare Images docs
description: With Sourcing Kit you can define one or multiple repositories of
  images to bulk import from Amazon S3. Once you have these set up, you can
  reuse those sources and import only new images to your Cloudflare Images
  account. This helps you make sure that only usable images are imported, and
  skip any other objects or files that might exist in that source.
lastUpdated: 2024-08-15T18:30:43.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/upload-images/sourcing-kit/
  md: https://developers.cloudflare.com/images/upload-images/sourcing-kit/index.md
---

With Sourcing Kit you can define one or multiple repositories of images to bulk import from Amazon S3. Once you have these set up, you can reuse those sources and import only new images to your Cloudflare Images account. This helps you make sure that only usable images are imported, and skip any other objects or files that might exist in that source.

Sourcing Kit also lets you target paths, define prefixes for imported images, and obtain error logs for bulk operations.

Sourcing Kit is available in beta. If you have any comments, questions, or bugs to report, contact the Images team on our [Discord channel](https://discord.cloudflare.com). You can also engage with other users and the Images team on the [Cloudflare Community](https://community.cloudflare.com/c/developers/images/63).

## When to use Sourcing Kit

Sourcing Kit can be a good choice if the Amazon S3 bucket you are importing consists primarily of images stored using non-archival storage classes, as images stored using [archival storage classes](https://aws.amazon.com/s3/storage-classes/#Archive) will be skipped and need to be imported separately. Specifically:

* Images stored using S3 Glacier tiers (not including Glacier Instant Retrieval) will be skipped and logged in the migration log.
* Images stored using S3 Intelligent Tiering and placed in Deep Archive tier will be skipped and logged in the migration log.

</page>

<page>
---
title: Upload via custom path · Cloudflare Images docs
description: You can use a custom ID path to upload an image instead of the path
  automatically generated by Cloudflare Images’ Universal Unique Identifier
  (UUID).
lastUpdated: 2025-04-07T16:12:42.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/upload-images/upload-custom-path/
  md: https://developers.cloudflare.com/images/upload-images/upload-custom-path/index.md
---

You can use a custom ID path to upload an image instead of the path automatically generated by Cloudflare Images’ Universal Unique Identifier (UUID).

Custom paths support:

* Up to 1,024 characters.
* Any number of subpaths.
* The [UTF-8 encoding standard](https://en.wikipedia.org/wiki/UTF-8) for characters.

Note

Images with custom ID paths cannot be made private using [signed URL tokens](https://developers.cloudflare.com/images/manage-images/serve-images/serve-private-images). Additionally, when [serving images](https://developers.cloudflare.com/images/manage-images/serve-images/), any `%` characters present in Custom IDs must be encoded to `%25` in the image delivery URLs.

Make a `POST` request using the example below as reference. You can use custom ID paths when you upload via a URL or with a direct file upload.

```bash
curl --request POST https://api.cloudflare.com/client/v4/accounts/{account_id}/images/v1 \
--header "Authorization: Bearer <API_TOKEN>" \
--form 'url=https://<REMOTE_PATH_TO_IMAGE>' \
--form 'id=<PATH_TO_YOUR_IMAGE>'
```

After successfully uploading the image, you will receive a response similar to the example below.

```json
{
  "result": {
    "id": "<PATH_TO_YOUR_IMAGE>",
    "filename": "<YOUR_IMAGE>",
    "uploaded": "2022-04-20T09:51:09.559Z",
    "requireSignedURLs": false,
    "variants": ["https://imagedelivery.net/Vi7wi5KSItxGFsWRG2Us6Q/<PATH_TO_YOUR_IMAGE>/public"]
  },
  "result_info": null,
  "success": true,
  "errors": [],
  "messages": []
}
```

</page>

<page>
---
title: Upload via dashboard · Cloudflare Images docs
description: Before you upload an image, check the list of supported formats and
  dimensions to confirm your image will be accepted.
lastUpdated: 2024-08-13T19:56:56.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/upload-images/upload-dashboard/
  md: https://developers.cloudflare.com/images/upload-images/upload-dashboard/index.md
---

Before you upload an image, check the list of [supported formats and dimensions](https://developers.cloudflare.com/images/upload-images/#supported-image-formats) to confirm your image will be accepted.

To upload an image from the Cloudflare dashboard:

1. Log in to the [Cloudflare dashboard](https://dash.cloudflare.com/login) and select your account.
2. Select **Images**.
3. Drag and drop your image into the **Quick Upload** section. Alternatively, you can select **Drop images here** or browse to select your image locally.
4. After the upload finishes, your image appears in the list of files.

</page>

<page>
---
title: Upload via a Worker · Cloudflare Images docs
description: Learn how to upload images to Cloudflare using Workers. This guide
  provides code examples for uploading both standard and AI-generated images
  efficiently.
lastUpdated: 2025-04-02T16:09:57.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/upload-images/upload-file-worker/
  md: https://developers.cloudflare.com/images/upload-images/upload-file-worker/index.md
---

You can use a Worker to upload your image to Cloudflare Images.

Refer to the example below or refer to the [Workers documentation](https://developers.cloudflare.com/workers/) for more information.

```ts
const API_URL = "https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/images/v1";
const TOKEN = "<YOUR_TOKEN_HERE>";


const image = await fetch("https://example.com/image.png");
const bytes = await image.bytes();


const formData = new FormData();
formData.append('file', new File([bytes], 'image.png'));


const response = await fetch(API_URL, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${TOKEN}`,
  },
  body: formData,
});
```

## Upload from AI generated images

You can use an AI Worker to generate an image and then upload that image to store it in Cloudflare Images. For more information about using Workers AI to generate an image, refer to the [SDXL-Lightning Model](https://developers.cloudflare.com/workers-ai/models/stable-diffusion-xl-lightning).

```ts
const API_URL = "https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/images/v1";
const TOKEN = "YOUR_TOKEN_HERE";


const stream = await env.AI.run(
  "@cf/bytedance/stable-diffusion-xl-lightning",
  {
    prompt: YOUR_PROMPT_HERE
  }
);
const bytes = await (new Response(stream)).bytes();


const formData = new FormData();
formData.append('file', new File([bytes], 'image.jpg');


const response = await fetch(API_URL, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${TOKEN}`,
  },
  body: formData,
});
```

</page>

<page>
---
title: Upload via URL · Cloudflare Images docs
description: Before you upload an image, check the list of supported formats and
  dimensions to confirm your image will be accepted.
lastUpdated: 2024-10-07T14:21:49.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/upload-images/upload-url/
  md: https://developers.cloudflare.com/images/upload-images/upload-url/index.md
---

Before you upload an image, check the list of [supported formats and dimensions](https://developers.cloudflare.com/images/upload-images/#supported-image-formats) to confirm your image will be accepted.

You can use the Images API to use a URL of an image instead of uploading the data.

Make a `POST` request using the example below as reference. Keep in mind that the `--form 'file=<FILE>'` and `--form 'url=<URL>'` fields are mutually exclusive.

Note

The `metadata` included in the request is never shared with end users.

```bash
curl --request POST \
https://api.cloudflare.com/client/v4/accounts/{account_id}/images/v1 \
--header "Authorization: Bearer <API_TOKEN>" \
--form 'url=https://[user:password@]example.com/<PATH_TO_IMAGE>' \
--form 'metadata={"key":"value"}' \
--form 'requireSignedURLs=false'
```

After successfully uploading the image, you will receive a response similar to the example below.

```json
{
    "result": {
        "id": "2cdc28f0-017a-49c4-9ed7-87056c83901",
        "filename": "image.jpeg",
        "metadata": {
            "key": "value"
        },
        "uploaded": "2022-01-31T16:39:28.458Z",
        "requireSignedURLs": false,
        "variants": [
            "https://imagedelivery.net/Vi7wi5KSItxGFsWRG2Us6Q/2cdc28f0-017a-49c4-9ed7-87056c83901/public",
            "https://imagedelivery.net/Vi7wi5KSItxGFsWRG2Us6Q/2cdc28f0-017a-49c4-9ed7-87056c83901/thumbnail"
        ]
    },
    "success": true,
    "errors": [],
    "messages": []
}
```

If your origin server returns an error while fetching the images, the API response will return a 4xx error.

</page>

<page>
---
title: Serve images from custom domains · Cloudflare Images docs
description: "Image delivery is supported from all customer domains under the
  same Cloudflare account. To serve images through custom domains, an image URL
  should be adjusted to the following format:"
lastUpdated: 2025-01-09T17:35:37.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/manage-images/serve-images/serve-from-custom-domains/
  md: https://developers.cloudflare.com/images/manage-images/serve-images/serve-from-custom-domains/index.md
---

Image delivery is supported from all customer domains under the same Cloudflare account. To serve images through custom domains, an image URL should be adjusted to the following format:

```txt
https://example.com/cdn-cgi/imagedelivery/<ACCOUNT_HASH>/<IMAGE_ID>/<VARIANT_NAME>
```

Example with a custom domain:

```txt
https://example.com/cdn-cgi/imagedelivery/ZWd9g1K7eljCn_KDTu_MWA/083eb7b2-5392-4565-b69e-aff66acddd00/public
```

In this example, `<ACCOUNT_HASH>`, `<IMAGE_ID>` and `<VARIANT_NAME>` are the same, but the hostname and prefix path is different:

* `example.com`: Cloudflare proxied domain under the same account as the Cloudflare Images.
* `/cdn-cgi/imagedelivery`: Path to trigger `cdn-cgi` image proxy.
* `ZWd9g1K7eljCn_KDTu_MWA`: The Images account hash. This can be found in the Cloudflare Images Dashboard.
* `083eb7b2-5392-4565-b69e-aff66acddd00`: The image ID.
* `public`: The variant name.

## Custom paths

By default, Images are served from the `/cdn-cgi/imagedelivery/` path. You can use Transform Rules to rewrite URLs and serve images from custom paths.

### Basic version

Free and Pro plans support string matching rules (including wildcard operations) that do not require regular expressions.

This example lets you rewrite a request from `example.com/images` to `example.com/cdn-cgi/imagedelivery/<ACCOUNT_HASH>`.

To create a rule:

1. Log in to the [Cloudflare dashboard](https://dash.cloudflare.com/login) and select your account and website.

2. Go to **Rules** > **Overview**.

3. Next to **URL Rewrite Rules**, select **Create rule**.

4. Under **If incoming requests match**, select **Wildcard pattern** and enter the following **Request URL** (update with your own domain):

   ```txt
   https://example.com/images/*
   ```

5. Under **Then rewrite the path and/or query** > **Path**, enter the following values (using your account hash):

   * **Target path**: \[`/`] `images/*`
   * **Rewrite to**: \[`/`] `cdn-cgi/imagedelivery/<ACCOUNT_HASH>/${1}`

6. Select **Deploy** when you are done.

### Advanced version

Note

This feature requires a Business or Enterprise plan to enable regular expressions in Transform Rules. Refer to Cloudflare [Transform Rules Availability](https://developers.cloudflare.com/rules/transform/#availability) for more information.

This example lets you rewrite a request from `example.com/images/some-image-id/w100,h300` to `example.com/cdn-cgi/imagedelivery/<ACCOUNT_HASH>/some-image-id/width=100,height=300` and assumes Flexible variants feature is turned on.

To create a rule:

1. Log in to the [Cloudflare dashboard](https://dash.cloudflare.com/login) and select your account and website.
2. Go to **Rules** > **Overview**.
3. Next to **URL Rewrite Rules**, select **Create rule**.
4. Under **If incoming requests match**, select **Custom filter expression** and then select **Edit expression**.
5. In the text field, enter `(http.request.uri.path matches "^/images/.*$")`.
6. Under **Path**, select **Rewrite to**.
7. Select *Dynamic* and enter the following in the text field.

```txt
regex_replace(
  http.request.uri.path,
  "^/images/(.*)\\?w([0-9]+)&h([0-9]+)$",
  "/cdn-cgi/imagedelivery/<ACCOUNT_HASH>/${1}/width=${2},height=${3}"
)
```

## Limitations

When using a custom domain, it is not possible to directly set up WAF rules that act on requests hitting the `/cdn-cgi/imagedelivery/` path. If you need to set up WAF rules, you can use a Cloudflare Worker to access your images and a Route using your domain to execute the worker. For an example worker, refer to [Serve private images using signed URL tokens](https://developers.cloudflare.com/images/manage-images/serve-images/serve-private-images/).

</page>

<page>
---
title: Serve private images · Cloudflare Images docs
description: You can serve private images by using signed URL tokens. When an
  image requires a signed URL, the image cannot be accessed without a token
  unless it is being requested for a variant set to always allow public access.
lastUpdated: 2025-06-26T18:43:59.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/manage-images/serve-images/serve-private-images/
  md: https://developers.cloudflare.com/images/manage-images/serve-images/serve-private-images/index.md
---

You can serve private images by using signed URL tokens. When an image requires a signed URL, the image cannot be accessed without a token unless it is being requested for a variant set to always allow public access.

1. Log in to the [Cloudflare dashboard](https://dash.cloudflare.com/login) and select your account.
2. Select **Images** > **Keys**.
3. Copy your key and use it to generate an expiring tokenized URL.

Note

Private images do not currently support custom paths.

The example below uses a Worker that takes in a regular URL without a signed token and returns a tokenized URL that expires after one day. You can, however, set this expiration period to whatever you need, by changing the const `EXPIRATION` value.

* JavaScript

  ```js
  const KEY = "YOUR_KEY_FROM_IMAGES_DASHBOARD";
  const EXPIRATION = 60 * 60 * 24; // 1 day


  const bufferToHex = (buffer) =>
    [...new Uint8Array(buffer)]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("");


  async function generateSignedUrl(url) {
    // `url` is a full imagedelivery.net URL
    // e.g. https://imagedelivery.net/cheeW4oKsx5ljh8e8BoL2A/bc27a117-9509-446b-8c69-c81bfeac0a01/mobile


    const encoder = new TextEncoder();
    const secretKeyData = encoder.encode(KEY);
    const key = await crypto.subtle.importKey(
      "raw",
      secretKeyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );


    // Attach the expiration value to the `url`
    const expiry = Math.floor(Date.now() / 1000) + EXPIRATION;
    url.searchParams.set("exp", expiry);
    // `url` now looks like
    // https://imagedelivery.net/cheeW4oKsx5ljh8e8BoL2A/bc27a117-9509-446b-8c69-c81bfeac0a01/mobile?exp=1631289275


    const stringToSign = url.pathname + "?" + url.searchParams.toString();
    // for example, /cheeW4oKsx5ljh8e8BoL2A/bc27a117-9509-446b-8c69-c81bfeac0a01/mobile?exp=1631289275


    // Generate the signature
    const mac = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(stringToSign),
    );
    const sig = bufferToHex(new Uint8Array(mac).buffer);


    // And attach it to the `url`
    url.searchParams.set("sig", sig);


    return new Response(url);
  }


  export default {
    async fetch(request, env, ctx) {
      const url = new URL(event.request.url);
      const imageDeliveryURL = new URL(
        url.pathname
          .slice(1)
          .replace("https:/imagedelivery.net", "https://imagedelivery.net"),
      );
      return generateSignedUrl(imageDeliveryURL);
    },
  };
  ```

* TypeScript

  ```ts
  const KEY = 'YOUR_KEY_FROM_IMAGES_DASHBOARD';
  const EXPIRATION = 60 * 60 * 24; // 1 day


  const bufferToHex = buffer =>
    [...new Uint8Array(buffer)].map(x => x.toString(16).padStart(2, '0')).join('');


  async function generateSignedUrl(url) {
    // `url` is a full imagedelivery.net URL
    // e.g. https://imagedelivery.net/cheeW4oKsx5ljh8e8BoL2A/bc27a117-9509-446b-8c69-c81bfeac0a01/mobile


    const encoder = new TextEncoder();
    const secretKeyData = encoder.encode(KEY);
    const key = await crypto.subtle.importKey(
      'raw',
      secretKeyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );


    // Attach the expiration value to the `url`
    const expiry = Math.floor(Date.now() / 1000) + EXPIRATION;
    url.searchParams.set('exp', expiry);
    // `url` now looks like
    // https://imagedelivery.net/cheeW4oKsx5ljh8e8BoL2A/bc27a117-9509-446b-8c69-c81bfeac0a01/mobile?exp=1631289275


    const stringToSign = url.pathname + '?' + url.searchParams.toString();
    // for example, /cheeW4oKsx5ljh8e8BoL2A/bc27a117-9509-446b-8c69-c81bfeac0a01/mobile?exp=1631289275


    // Generate the signature
    const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(stringToSign));
    const sig = bufferToHex(new Uint8Array(mac).buffer);


    // And attach it to the `url`
    url.searchParams.set('sig', sig);


    return new Response(url);
  }


  export default {
    async fetch(request, env, ctx): Promise<Response> {
      const url = new URL(event.request.url);
      const imageDeliveryURL = new URL(
        url.pathname.slice(1).replace('https:/imagedelivery.net', 'https://imagedelivery.net')
      );
      return generateSignedUrl(imageDeliveryURL);
    },
  } satisfies ExportedHandler<Env>;
  ```

</page>

<page>
---
title: Serve uploaded images · Cloudflare Images docs
description: "To serve images uploaded to Cloudflare Images, you must have:"
lastUpdated: 2024-08-13T19:56:56.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/manage-images/serve-images/serve-uploaded-images/
  md: https://developers.cloudflare.com/images/manage-images/serve-images/serve-uploaded-images/index.md
---

To serve images uploaded to Cloudflare Images, you must have:

* Your Images account hash
* Image ID
* Variant or flexible variant name

Assuming you have at least one image uploaded to Images, you will find the basic URL format from the Images dashboard under Developer Resources.

![Developer Resources section within the Images product form the Cloudflare Dashboard.](https://developers.cloudflare.com/_astro/image-delivery-url.D7G6zX-5_Z1UAouX.webp)

A typical image delivery URL looks similar to the example below.

`https://imagedelivery.net/<ACCOUNT_HASH>/<IMAGE_ID>/<VARIANT_NAME>`

In the example, you need to replace `<ACCOUNT_HASH>` with your Images account hash, along with the `<IMAGE_ID>` and `<VARIANT_NAME>`, to begin serving images.

You can select **Preview** next to the image you want to serve to preview the image with an Image URL you can copy. The link will have a fully formed **Images URL** and will look similar to the example below.

In this example:

* `ZWd9g1K7eljCn_KDTu_MWA` is the Images account hash.
* `083eb7b2-5392-4565-b69e-aff66acddd00` is the image ID. You can also use Custom IDs instead of the generated ID.
* `public` is the variant name.

When a user requests an image, Cloudflare Images chooses the optimal format, which is determined by client headers and the image type.

## Optimize format

Cloudflare Images automatically transcodes uploaded PNG, JPEG and GIF files to the more efficient AVIF and WebP formats. This happens whenever the customer browser supports them. If the browser does not support AVIF, Cloudflare Images will fall back to WebP. If there is no support for WebP, then Cloudflare Images will serve compressed files in the original format.

Uploaded SVG files are served as [sanitized SVGs](https://developers.cloudflare.com/images/upload-images/).

</page>

<page>
---
title: Credentials · Cloudflare Images docs
description: To migrate images from Amazon S3, Sourcing Kit requires access
  permissions to your bucket. While you can use any AWS Identity and Access
  Management (IAM) user credentials with the correct permissions to create a
  Sourcing Kit source, Cloudflare recommends that you create a user with a
  narrow set of permissions.
lastUpdated: 2024-08-13T19:56:56.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/upload-images/sourcing-kit/credentials/
  md: https://developers.cloudflare.com/images/upload-images/sourcing-kit/credentials/index.md
---

To migrate images from Amazon S3, Sourcing Kit requires access permissions to your bucket. While you can use any AWS Identity and Access Management (IAM) user credentials with the correct permissions to create a Sourcing Kit source, Cloudflare recommends that you create a user with a narrow set of permissions.

To create the correct Sourcing Kit permissions:

1. Log in to your AWS IAM account.

2. Create a policy with the following format (replace `<BUCKET_NAME>` with the bucket you want to grant access to):

   ```json
   {
       "Version": "2012-10-17",
       "Statement": [
           {
               "Effect": "Allow",
               "Action": [
                   "s3:Get*",
                   "s3:List*"
               ],
               "Resource": [
                   "arn:aws:s3:::<BUCKET_NAME>",
                   "arn:aws:s3:::<BUCKET_NAME>/*"
               ]
           }
       ]
   }
   ```

3. Next, create a new user and attach the created policy to that user.

You can now use both the Access Key ID and Secret Access Key to create a new source in Sourcing Kit. Refer to [Enable Sourcing Kit](https://developers.cloudflare.com/images/upload-images/sourcing-kit/enable/) to learn more.

</page>

<page>
---
title: Enable Sourcing Kit · Cloudflare Images docs
description: Enabling Sourcing Kit will set it up with the necessary information
  to start importing images from your Amazon S3 account.
lastUpdated: 2025-04-07T16:12:42.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/upload-images/sourcing-kit/enable/
  md: https://developers.cloudflare.com/images/upload-images/sourcing-kit/enable/index.md
---

Enabling Sourcing Kit will set it up with the necessary information to start importing images from your Amazon S3 account.

## Create your first import job

1. Log in to the [Cloudflare dashboard](https://dash.cloudflare.com/login), and select your account.
2. Go to **Images** > **Sourcing Kit**.
3. Select **Import images** to create an import job.
4. In **Source name** give your source an appropriate name.
5. In **Amazon S3 bucket information** enter the S3's bucket name where your images are stored.
6. In **Required credentials**, enter your Amazon S3 credentials. This is required to connect Cloudflare Images to your source and import your images. Refer to [Credentials](https://developers.cloudflare.com/images/upload-images/sourcing-kit/credentials/) to learn more about how to set up credentials.
7. Select **Next**.
8. In **Basic rules** define the Amazon S3 path to import your images from, and the path you want to copy your images to in your Cloudflare Images account. This is optional, and you can leave these fields blank.
9. On the same page, in **Overwrite images**, you need to choose what happens when the files in your source change. The recommended action is to copy the new images and overwrite the old ones on your Cloudflare Images account. You can also choose to skip the import, and keep what you already have on your Cloudflare Images account.
10. Select **Next**.
11. Review and confirm the information regarding the import job you created. Select **Import images** to start importing images from your source.

Your import job is now created. You can review the job status on the Sourcing Kit main page. It will show you information such as how many objects it found, how many images were imported, and any errors that might have occurred.

Note

Sourcing Kit will warn you when you are about to reach the limit for your plan space quota. When you exhaust the space available in your plan, the importing jobs will be aborted. If you see this warning on Sourcing Kit’s main page, select **View plan** to change your plan’s limits.

## Define a new source

1. Log in to the [Cloudflare dashboard](https://dash.cloudflare.com/login), and select your account.
2. Go to **Images** > **Sourcing Kit**.
3. Select **Import images** > **Define a new source**.

Repeat steps 4-11 in [Create your first import job](#create-your-first-import-job) to finish setting up your new source.

## Define additional import jobs

You can have many import jobs from the same or different sources. If you select an existing source to create a new import job, you will not need to enter your credentials again.

1. Log in to the [Cloudflare dashboard](https://dash.cloudflare.com/login), and select your account.
2. Go to **Images** > **Sourcing Kit**.
3. Select **Import images**.
4. Choose from one of the sources already configured.

Repeat steps 8-11 in [Create your first import job](#create-your-first-import-job) to finish setting up your new import job.

## Next steps

Refer to [Edit source details](https://developers.cloudflare.com/images/upload-images/sourcing-kit/edit/) to learn more about editing details for import jobs you have already created, or to learn how to abort running import jobs.

</page>

<page>
---
title: Edit sources · Cloudflare Images docs
description: The Sourcing Kit main page has a list of all the import jobs and
  sources you have defined. This is where you can edit details for your sources
  or abort running import jobs.
lastUpdated: 2024-08-13T19:56:56.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/images/upload-images/sourcing-kit/edit/
  md: https://developers.cloudflare.com/images/upload-images/sourcing-kit/edit/index.md
---

The Sourcing Kit main page has a list of all the import jobs and sources you have defined. This is where you can edit details for your sources or abort running import jobs.

## Source details

You can learn more about your sources by selecting the **Sources** tab on the Sourcing Kit dashboard. Use this option to rename or delete your sources.

1. Log in to the [Cloudflare dashboard](https://dash.cloudflare.com/login), and select your account.
2. Go to **Images** > **Sourcing Kit**.
3. Select **Sources** and choose the source you want to change.
4. In this page you have the option to rename or delete your source. Select **Rename source** or **Delete source** depending on what you want to do.

## Abort import jobs

While Cloudflare Images is still running a job to import images into your account, you can abort it before it finishes.

1. Log in to the [Cloudflare dashboard](https://dash.cloudflare.com/login), and select your account.
2. Go to **Images** > **Sourcing Kit**.
3. In **Imports** select the import job you want to abort.
4. The next page shows you a summary of the import. Select **Abort**.
5. Confirm that you want to abort your import job by selecting **Abort** on the dialog box.

</page>

