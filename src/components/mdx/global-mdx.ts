// Global MDX components configuration
import { YouTube } from '@astro-community/astro-embed-youtube';
import { LinkPreview } from '@astro-community/astro-embed-link-preview';

export const globalComponents = {
  YouTube,
  LinkPreview,
};

// Make components available globally
if (typeof globalThis !== 'undefined') {
  Object.assign(globalThis, globalComponents);
}