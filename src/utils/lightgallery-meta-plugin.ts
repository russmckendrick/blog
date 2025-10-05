/**
 * LightGallery Meta File Plugin
 *
 * This plugin automatically loads .meta files (JSON format) for gallery images
 * and uses the "Title" field as the image caption (data-sub-html).
 *
 * .meta file format: {"Title": "Your caption here"}
 */

export interface LightGalleryMetaPluginSettings {
  /**
   * Enable/disable the meta plugin
   * @default true
   */
  enabled?: boolean;

  /**
   * Enable console logging for debugging
   * @default false
   */
  debug?: boolean;
}

const defaultSettings: LightGalleryMetaPluginSettings = {
  enabled: true,
  debug: false,
};

/**
 * Fetches and parses a .meta file for a given image URL
 */
async function fetchMetaFile(imageUrl: string, debug: boolean = false): Promise<string | null> {
  try {
    const metaUrl = `${imageUrl}.meta`;

    if (debug) {
      console.log(`[LG Meta Plugin] Fetching meta file: ${metaUrl}`);
    }

    const response = await fetch(metaUrl);

    if (!response.ok) {
      if (debug) {
        console.log(`[LG Meta Plugin] Meta file not found: ${metaUrl}`);
      }
      return null;
    }

    const data = await response.json();

    if (data.Title) {
      if (debug) {
        console.log(`[LG Meta Plugin] Found title: ${data.Title}`);
      }
      return data.Title;
    }

    return null;
  } catch (error) {
    if (debug) {
      console.error(`[LG Meta Plugin] Error fetching meta file for ${imageUrl}:`, error);
    }
    return null;
  }
}

/**
 * Initialize the meta plugin on LightGallery instances
 */
export async function initLightGalleryMetaPlugin(
  galleryElement: HTMLElement,
  settings: LightGalleryMetaPluginSettings = {}
) {
  const config = { ...defaultSettings, ...settings };

  if (!config.enabled) {
    return;
  }

  if (config.debug) {
    console.log('[LG Meta Plugin] Initializing plugin');
  }

  // Find all gallery items
  const items = galleryElement.querySelectorAll('a[href]');

  if (config.debug) {
    console.log(`[LG Meta Plugin] Found ${items.length} gallery items`);
  }

  // Process each item
  const promises = Array.from(items).map(async (item) => {
    const link = item as HTMLAnchorElement;
    const imageUrl = link.getAttribute('href');

    if (!imageUrl) {
      return;
    }

    // Check if caption already exists
    if (link.getAttribute('data-sub-html')) {
      if (config.debug) {
        console.log(`[LG Meta Plugin] Item already has caption, skipping: ${imageUrl}`);
      }
      return;
    }

    // Fetch meta file
    const title = await fetchMetaFile(imageUrl, config.debug);

    if (title) {
      // Set the caption using data-sub-html
      link.setAttribute('data-sub-html', `<h4>${title}</h4>`);

      if (config.debug) {
        console.log(`[LG Meta Plugin] Set caption for ${imageUrl}: ${title}`);
      }
    }
  });

  // Wait for all meta files to be fetched
  await Promise.all(promises);

  if (config.debug) {
    console.log('[LG Meta Plugin] Plugin initialization complete');
  }
}

/**
 * Auto-initialize plugin on all astro-lightgallery elements
 */
export function autoInitLightGalleryMetaPlugin(settings: LightGalleryMetaPluginSettings = {}) {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initAllGalleries(settings);
    });
  } else {
    initAllGalleries(settings);
  }
}

function initAllGalleries(settings: LightGalleryMetaPluginSettings) {
  const galleries = document.querySelectorAll('astro-lightgallery');

  if (settings.debug) {
    console.log(`[LG Meta Plugin] Found ${galleries.length} galleries`);
  }

  galleries.forEach((gallery) => {
    // Wait a bit for astro-lightgallery to render its content
    setTimeout(() => {
      initLightGalleryMetaPlugin(gallery as HTMLElement, settings);
    }, 100);
  });
}
