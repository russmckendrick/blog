// Re-export embed convenience components for consistent imports
import { YouTube as AstroYouTube } from '@astro-community/astro-embed-youtube';
export { default as LinkPreview } from './LinkPreview.astro';
export { default as Instagram } from './Instagram.astro';
export { default as Audio } from './Audio.astro';
export { default as AppleMusic } from './AppleMusic.astro';
export { default as Giphy } from './Giphy.astro';
export { default as ChatMessage } from './ChatMessage.astro';
export { default as Reddit } from './Reddit.astro';
export { default as Img } from './Img.astro';
export { default as LightGallery } from './LightGalleryNew.astro';
export * from './callouts';
export const YouTube = AstroYouTube;
