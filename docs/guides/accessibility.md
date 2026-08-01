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

**Current state** (Reading Room): the brand link is `<a href="/" aria-label="russ.cloud home">` wrapping the `Logo.astro` lockup — one inline SVG marked `aria-hidden="true"`/`focusable="false"`, so the label is the accessible name (the wordmark is outline paths, invisible to assistive tech by design), and the cursor blink is disabled under `prefers-reduced-motion: reduce` in the component's own styles. Alongside it the masthead shows plain text links (`MASTHEAD_ITEMS` — Tunes · Books · Archive · About) plus two icon-only controls, each with an `aria-label`: the search trigger ("Search the archive", also carrying `aria-keyshortcuts="Meta+K"` and a JS-set platform-aware `title`) and the theme toggle. The search trigger is an `<a href="/search/">` upgraded by JS to open the search sheet — a native `<dialog>` (`SearchOverlay.astro`) labelled via `aria-labelledby`, so `showModal()` provides the focus trap, background inerting, and focus restoration to the trigger on close. Focus is moved into the Pagefind input once it renders; `Escape` is handled explicitly in the sheet's keydown listener because Pagefind's input consumes the key (blocking the dialog's native cancel), and the `/` shortcut is suppressed while focus is in an input, textarea, select, or contenteditable. Without JS the trigger simply navigates to `/search/`, where the input is autofocused. The mobile burger opens a full-width panel of text rows; the trigger keeps `aria-controls`/`aria-expanded` and a sr-only label that flips between Open/Close, and the hamburger icon swaps to an X via CSS on `aria-expanded` — both SVGs are `aria-hidden`. On mobile the search trigger sits beside the burger rather than inside the menu. The footer's social icons each carry an `aria-label` and `title` from `SOCIAL_LABELS`. Menu behaviour (outside click, Escape + refocus, close on link click) is unchanged.

**File**: `src/components/layout/Header.astro`

```astro
<!-- Brand link (Logo.astro renders one aria-hidden SVG) -->
<a href="/" class="header-logo flex items-center no-underline" aria-label="russ.cloud home">
  <Logo />
</a>

<!-- Desktop navigation (text links) -->
<a href={item.url} class="header-nav-item no-underline py-1.5 inline-flex items-center">
  {item.name}
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

### 5. Runtime Fallback

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

### Pages to Test

Test accessibility on pages with different content types:

1. **Homepage** (`/`) - Navigation, post cards
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
| "Link has no accessible text" | Navigation | Verify aria-label on icon links |

## Creating Accessible Components

### Checklist for New Components

When creating new interactive components:

- [ ] All `<button>` elements have `aria-label` or visible text
- [ ] All `<a>` elements with only images have `aria-label`
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
