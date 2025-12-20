# Accessibility Guide

This guide documents the accessibility features implemented in the blog to ensure WCAG 2.1 Level AA compliance.

## Overview

The site achieves full WCAG 2.1 Level AA compliance through:
- Build-time accessibility fixes via custom plugins
- Component-level aria-labels for interactive elements
- Runtime fallback for dynamically loaded content
- Automated testing via `@casoon/astro-webvitals`

## Implemented Solutions

### 1. Expressive Code Copy Buttons

**Problem**: Expressive Code's copy buttons only have `title` attributes, not `aria-label`, causing accessibility violations.

**Solution**: Custom Expressive Code plugin that adds aria-labels at build time.

**File**: `src/utils/expressive-code-a11y-plugin.ts`

```typescript
export const expressiveCodeA11yPlugin = () => {
  return {
    name: 'expressive-code-a11y',
    hooks: {
      postprocessRenderedBlock: ({ renderData }) => {
        const processNode = (node: any) => {
          if (!node) return;
          if (node.type === 'element' && node.tagName === 'button') {
            const props = node.properties || {};
            if (props.title && !props['aria-label']) {
              props['aria-label'] = props.title;
            }
            if (props['data-copied'] && !props['aria-label']) {
              props['aria-label'] = 'Copy to clipboard';
            }
          }
          if (node.children && Array.isArray(node.children)) {
            node.children.forEach(processNode);
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

### 4. Navigation Icon Links

**Problem**: Header navigation uses icon-only links without text labels.

**Solution**: Add aria-labels using the navigation item name.

**File**: `src/components/layout/Header.astro`

```astro
<!-- Desktop navigation -->
<a
  href={item.url}
  class="header-nav-item ..."
  title={item.name}
  aria-label={item.name}
>
  <Icon name={item.icon} />
</a>

<!-- Mobile menu trigger -->
<button
  id="menu-trigger"
  class="..."
  aria-label="Toggle menu"
>
  <span class="sr-only">Open main menu</span>
  <svg>...</svg>
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
