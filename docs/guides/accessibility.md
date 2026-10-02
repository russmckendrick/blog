# Accessibility Guide

This guide documents the accessibility features implemented in the blog to ensure WCAG 2.1 Level AA compliance.

## Overview

The site achieves full WCAG 2.1 Level AA compliance through:
- Build-time accessibility fixes via custom plugins
- Component-level aria-labels for interactive elements
- Runtime fallback for dynamically loaded content
- Automated testing via `@casoon/astro-webvitals`

## Implemented Solutions

### 1. Expressive Code Accessibility

**Problems**:
- Copy buttons only have `title` attributes, not `aria-label`
- Multiple code blocks have identical `role="region"` landmarks with same aria-label

**Solution**: Custom Expressive Code plugin that adds unique, descriptive aria-labels at build time.

**File**: `src/utils/expressive-code-a11y-plugin.ts`

```typescript
export const expressiveCodeA11yPlugin = () => {
  return {
    name: 'expressive-code-a11y',
    hooks: {
      postprocessRenderedBlock: ({ codeBlock, renderData }) => {
        // Use title if available, otherwise capitalize language
        const title = codeBlock.title;
        const language = codeBlock.language || 'text';
        let ariaLabel: string;
        if (title) {
          ariaLabel = title;  // e.g., "Terminal", "app.js"
        } else {
          const langDisplay = language.charAt(0).toUpperCase() + language.slice(1);
          ariaLabel = `${langDisplay} code`;  // e.g., "Javascript code"
        }

        const processNode = (node: any) => {
          // Add aria-label to buttons from title attribute
          if (node.tagName === 'button') {
            if (props.title && !props['aria-label']) {
              props['aria-label'] = props.title;
            }
          }
          // Add unique aria-label to pre elements for landmark uniqueness
          if (node.tagName === 'pre' && !props['aria-label']) {
            props['aria-label'] = ariaLabel;
          }
        };
        processNode(renderData.blockAst);
      }
    }
  };
};
```

**Configuration** (`astro.config.mjs`):
```javascript
import { expressiveCodeA11yPlugin } from './src/utils/expressive-code-a11y-plugin.ts';

export default defineConfig({
  integrations: [
    expressiveCode({
      // ... other options
      plugins: [expressiveCodeA11yPlugin()],
    }),
  ],
});
```

### 2. LightGallery Image Links

**Problem**: Gallery image links contain only images, lacking accessible text for screen readers.

**Solution**: Add aria-labels to all gallery links based on image alt text.

**File**: `src/components/embeds/LightGalleryNew.astro`

```astro
<a
  href={img.src}
  class="astro-lightgallery-adaptive-item"
  data-lg-id="true"
  data-src={img.src}
  data-sub-html={img.alt ? `<h4>${img.alt}</h4>` : ''}
  aria-label={img.alt ? `View ${img.alt}` : 'View image in gallery'}
>
  <img src={img.thumbnail} alt={img.alt || ''} loading="lazy" decoding="async" />
</a>
```

### 3. Inline Image Component

**Problem**: The Img component has zoom and external link variants that need accessible labels.

**Solution**: Add context-aware aria-labels to both zoom and external link modes.

**File**: `src/components/embeds/Img.astro`

```astro
<!-- Zoom link -->
<a href={highResSrc} data-lg-id="true" aria-label={alt ? `View ${alt}` : 'View image in full size'}>
  <img src={imgSrc} alt={alt} />
</a>

<!-- External link -->
<a href={link} target="_blank" rel="noopener noreferrer"
   aria-label={alt ? `${alt} (opens in new tab)` : 'View image (opens in new tab)'}>
  <img src={imgSrc} alt={alt} />
</a>
```

### 4. Navigation Links

**Current state** (Workbench): the brand link is `<a href="/">` wrapping the `Logo.astro` lockup — one inline SVG marked `aria-hidden="true"`/`focusable="false"` — plus a `<span class="sr-only">Russ.Cloud home</span>`. Visually hidden text rather than an `aria-label` on purpose: it is the same accessible name, and it is also anchor text for the site-wide link home, which an `aria-label` is not (see [Naming icon-only links](#naming-icon-only-links)). The wordmark is outline paths, invisible to assistive tech by design, and the cursor blink is disabled under `prefers-reduced-motion: reduce` in the component's own styles. Alongside it the masthead shows seven labelled links (`MASTHEAD_ITEMS` — Tunes · Books · Reading List · Tags · Archive · About · Source, the last opening the repo in a new tab with `rel="noopener noreferrer"`), each pairing a decorative `Icon.astro` glyph with its label in a `.nav-label` span, so the text alone is the accessible name; the glyphs carry `aria-hidden="true"` (`Icon.astro` forwards any extra attributes straight onto the `<svg>`, so the same applies to the search icon) and are never the only cue for a destination. On pointer devices the label rests collapsed (`max-width: 0`, `opacity: 0`, clipped by `overflow: hidden` — never `display: none`, so it stays in the accessibility tree and remains the link's accessible name) and unfurls on `:hover` **and** `:focus-visible`, so keyboard tabbing reveals the same words a mouse does. The collapse is scoped to `@media (hover: hover)`: on touch (an iPad on the ≥768px desktop nav included) the labels are simply always visible, since there is no hover to reveal them. Under `prefers-reduced-motion: reduce` the reveal is instant rather than animated. Then two icon-only controls: the search trigger (named by a `sr-only` "Search the archive", also carrying `aria-keyshortcuts="Meta+K"` and a JS-set platform-aware `title`) and the theme toggle (a `<button>`, so `aria-label`). The search trigger is an `<a href="/search/">` upgraded by JS to open the search sheet — a native `<dialog>` (`SearchOverlay.astro`) named via `aria-label`, so `showModal()` provides the focus trap, background inerting, and focus restoration to the trigger on close. Focus moves straight into the search input (rendered server-side, so there is nothing to wait for); `Escape` is handled explicitly in the sheet's keydown listener because a `type="search"` input can consume the key to clear itself (blocking the dialog's native cancel), and the `/` shortcut is suppressed while focus is in an input, textarea, select, or contenteditable. Inside, the panel (`SearchPanel.astro`) keeps results as real links in an `<ol>`: arrow keys move focus from the input through them and back, so screen readers announce each link normally and modified clicks open new tabs. The type filters and the Best match / Newest sort are `<button aria-pressed>` groups, the result count is an `aria-live="polite"` region, and excerpt highlights are plain `<mark>`. Without JS the trigger simply navigates to `/search/`, where the input is autofocused. The mobile burger (below 768px) opens a full-width panel of glyph-plus-text rows; the trigger keeps `aria-controls`/`aria-expanded` and a sr-only label that flips between Open/Close, and the hamburger icon swaps to an X via CSS on `aria-expanded` — both SVGs are `aria-hidden`. On mobile the search trigger sits beside the burger rather than inside the menu. The footer's "Elsewhere" links pair a decorative icon with a visible name from `SOCIAL_LABELS`, so the text is the accessible name. Menu behaviour (outside click, Escape + refocus, close on link click) is unchanged.

**File**: `src/components/layout/Header.astro`

```astro
<!-- Brand link (Logo.astro renders one aria-hidden SVG) -->
<a href="/" class="header-logo flex items-center no-underline">
  <Logo />
  <span class="sr-only">Russ.Cloud home</span>
</a>

<!-- Desktop navigation (glyph + text; the text is the accessible name,
     collapsed to zero width on pointer devices and unfurled on hover/focus) -->
<a
  href={item.url}
  class="header-nav-item no-underline py-1.5 inline-flex items-center"
  style={`--nav-label-w: ${item.name.length + 1}ch`}
>
  <Icon name={item.icon} size={15} class="nav-glyph" aria-hidden="true" />
  <span class="nav-label">{item.name}</span>
</a>

<!-- Mobile menu trigger -->
<button
  id="menu-trigger"
  class="..."
  aria-controls="mobile-menu"
  aria-expanded="false"
>
  <span id="mobile-menu-label" class="sr-only">Open main menu</span>
  <svg class="icon-bars" aria-hidden="true">...</svg>
  <svg class="icon-close" aria-hidden="true">...</svg>
</button>
```

### 5. Listing Tiles (PostCard)

`PostCard` is the one listing tile, on the homepage, `/page/N/`, the tag, year and author hubs, the tunes pages and "Keep reading". Each tile is a single `<a>` wrapping its cover, meta line, heading and description. It carries no tag links, so there is nothing to nest and no need for an overlay link: the accessible name and the crawler's anchor text are the tile's own visible text. The cover's `alt` is `cover.alt` or the post title. `headingLevel` sets the heading inside the link so each page's outline stays sensible.

**History**: the old row layout put tag chips inside the row, which forced an overlay `post-row-link` named by a `sr-only` span and a 24px minimum on `.tag-editorial--sm` so a missed tap on a chip didn't open the post. With the chips gone, both are no longer needed by any listing. The class keeps its 24px floor in `global.css` in case a chip returns.

`HomeLead` links its headline as ordinary text, while the cover image's duplicate link is `aria-hidden="true"` with `tabindex="-1"` (plus an `aria-label` for the dev panel; see [Naming icon-only links](#naming-icon-only-links)), so keyboard and screen-reader users meet the post once. `HomeTunes` and the `/books/` featured cover follow the same pattern.

**File**: `src/components/blog/PostCard.astro`

```astro
<article class="post-tile">
  <a href={href} class="post-tile-link">
    <img alt={alt} ... />
    <p class="rubric post-tile-meta">...</p>
    <HeadingTag class="post-tile-title">{post.data.title}</HeadingTag>
    {!compact && description && <p class="post-tile-desc">{description}</p>}
  </a>
</article>
```

### 6. Pagination

`Pagination.astro` is a `<nav aria-label="Pagination">`. Page links are named "Page N", and the current one carries `aria-current="page"`. The Newer/Older steps are named by their full label through `aria-label`, so they stay named when the visible label collapses to an arrow below 640px. A step with nowhere to go still renders, so the row doesn't shift, but as an `aria-hidden` span rather than a dead link. Its mist text stays above 4.5:1. Ellipses are `aria-hidden`.

### Naming icon-only links

A link whose only content is an SVG, or an overlay with no content at all, needs an accessible name. Both `aria-label` and a visually hidden text node satisfy that, and the runtime fallback below treats them the same. Prefer the `sr-only` span on **links**:

- An `aria-label` leaves the `<a>` textless in the markup, so crawlers see a link with no anchor text — a Seobility "links don't have anchor text" finding, and a lost relevance signal on internal links.
- A `sr-only` span is real text: identical accessible name, plus anchor text. It is not hidden-text spam — it repeats the adjacent visible heading or the destination's own name, never keywords the page doesn't show.
- `aria-label` still belongs on **buttons** (theme toggle, dialog close), on landmarks (`<nav aria-label>`), and wherever the accessible name must differ from the visible text.

Applied to: the masthead brand link and both search triggers (`Header.astro`). The footer's social links no longer need it, because they now show their names. The footer's own logo link home uses `aria-label="Russ.Cloud home"`.

**Image-only links** are the exception, and carry an `aria-label` as well as the image's `alt`. An `<img alt>` already names a link for assistive tech, but the dev WebVitals panel's "Missing Labels" check counts only `textContent` and `aria-label`, so these links were flagged. They are:
- the `HomeBooks` covers
- the About page's book shelf
- the `HomeLead` and `HomeTunes` cover links and the `/books/` featured cover. These three keep `tabindex="-1"` and `aria-hidden="true"`, because the headline beside each one is the real link.

Each `aria-label` is the post, tune or book title. With these in place, every main page reports zero missing labels.

### 7. Runtime Fallback

**Problem**: Some third-party libraries or dynamic content may add elements without proper accessibility.

**Solution**: JavaScript fallback that adds aria-labels after DOM mutations.

**File**: `src/layouts/BaseLayout.astro`

```javascript
function fixButtonAccessibility() {
  const buttons = document.querySelectorAll('button:not([aria-label])');
  buttons.forEach(btn => {
    const textContent = btn.textContent?.trim();
    // Skip if has meaningful text
    if (textContent && textContent.length > 1 && textContent.length < 50) {
      return;
    }

    // Use title if available
    const title = btn.getAttribute('title');
    if (title) {
      btn.setAttribute('aria-label', title);
      return;
    }

    // Handle specific patterns
    if (btn.hasAttribute('data-copied') || btn.closest('.copy')) {
      btn.setAttribute('aria-label', 'Copy code to clipboard');
    }
    // ... more patterns
  });
}

// Run on page load and View Transitions
fixButtonAccessibility();
document.addEventListener('astro:page-load', fixButtonAccessibility);

// Watch for dynamic content
const observer = new MutationObserver((mutations) => {
  // Debounced fix for added nodes
});
observer.observe(document.body, { childList: true, subtree: true });
```

## Testing Accessibility

### Using @casoon/astro-webvitals

The site includes `@casoon/astro-webvitals` for real-time accessibility testing:

1. Start the dev server: `pnpm run dev`
2. Open any page in the browser
3. Look for the Performance widget in the bottom-right corner
4. Click to expand and select the "Accessibility" tab
5. Target: "No accessibility issues detected - WCAG 2.1 Level AA compliant"

Its "Missing Labels" count reads only a link's `textContent` and `aria-label`, not an `<img alt>` inside it, so give image-only links an `aria-label` too (see [Naming icon-only links](#naming-icon-only-links)).

### Pages to Test

Test accessibility on pages with different content types:

1. **Homepage** (`/`) - Navigation, lead cover, post tiles, topic pills, the `russ --now` terminal, pagination
2. **Blog posts with code** - Expressive Code copy buttons
3. **Tunes posts** (`/tunes/`) - LightGallery image galleries
4. **Posts with inline images** - Img component zoom/links

### Common Issues to Check

| Issue | Component | Solution |
|-------|-----------|----------|
| "Button has no accessible text" | Expressive Code | Ensure a11y plugin is loaded |
| "Landmarks should have unique labels" | Expressive Code | Plugin uses title/language for unique labels |
| "Scrollable content not keyboard accessible" | Expressive Code | Plugin adds tabindex="0" + client-side script re-adds after EC dynamic removal |
| "Links not distinguishable from text" | Prose content | CSS adds subtle underline to all prose links |
| "Link has no accessible text" | LightGallery | Check aria-label on `<a>` tags |
| "Link has no accessible text" | Navigation | Verify the icon link's `sr-only` name ([Naming icon-only links](#naming-icon-only-links)) |

## Creating Accessible Components

### Checklist for New Components

When creating new interactive components:

- [ ] All `<button>` elements have `aria-label` or visible text
- [ ] All `<a>` elements with only images or icons carry a `sr-only` name ([Naming icon-only links](#naming-icon-only-links))
- [ ] Icon-only elements have descriptive labels
- [ ] External links indicate they open in new tab
- [ ] Form inputs have associated labels
- [ ] Dynamic content triggers accessibility fix

### Code Examples

**Image Link with Accessibility:**
```astro
<a
  href={imageUrl}
  aria-label={altText ? `View ${altText}` : 'View image'}
>
  <img src={thumbnailUrl} alt={altText || ''} />
</a>
```

**Icon Button with Accessibility:**
```astro
<button
  type="button"
  aria-label="Close dialog"
  title="Close"
>
  <Icon name="x" />
</button>
```

**External Link with Accessibility:**
```astro
<a
  href={externalUrl}
  target="_blank"
  rel="noopener noreferrer"
  aria-label={`${linkText} (opens in new tab)`}
>
  {linkText}
  <Icon name="external-link" />
</a>
```

## File Reference

| File | Purpose |
|------|---------|
| `src/utils/expressive-code-a11y-plugin.ts` | Build-time plugin for code copy buttons |
| `src/components/embeds/LightGalleryNew.astro` | Gallery component with aria-labels |
| `src/components/embeds/Img.astro` | Image component with aria-labels |
| `src/components/layout/Header.astro` | Navigation with aria-labels |
| `src/components/layout/Logo.astro` | Brand lockup as decorative SVG (aria-hidden, reduced-motion-aware cursor) |
| `src/layouts/BaseLayout.astro` | Runtime accessibility fallback |
| `astro.config.mjs` | Plugin configuration |

## Troubleshooting

### Issues Still Appearing After Fix

1. **Clear browser cache** - Old JS may be cached
2. **Restart dev server** - Config changes require restart
3. **Check plugin order** - Expressive Code plugin must be in plugins array
4. **Verify component import** - Ensure using correct component version

### Third-Party Components

For third-party components without accessibility:

1. First, check if the library has accessibility options
2. If not, add runtime fix to BaseLayout.astro
3. Consider creating a wrapper component with proper aria-labels
4. Report issues upstream to library maintainers

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [Astro Accessibility](https://docs.astro.build/en/guides/accessibility/)
- [@casoon/astro-webvitals](https://github.com/casoon/astro-webvitals)
