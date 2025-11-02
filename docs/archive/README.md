# Documentation Archive

This folder contains historical documentation, migration notes, and completed implementation plans that are kept for reference but are no longer actively maintained.

## Contents

### Migration Notes

**[migration-notes/](./migration-notes/)** - Hugo to Astro migration documentation

Contains notes from the original migration from Hugo to Astro, including:
- Migration strategy and planning
- Content conversion scripts
- Tunes generator migration from Python to JavaScript
- Lessons learned

**Status**: Completed in October 2025

---

### Build Optimization

**[build-optimization-sharp.md](./build-optimization-sharp.md)** - GitHub Actions optimization with Sharp

Historical documentation about the build optimization approach using Sharp image processing with GitHub Actions caching.

**Note**: This approach is **no longer used**. The blog now uses Cloudflare Image Transformations instead.

**Replaced by**: [../architecture/image-delivery.md](../architecture/image-delivery.md)

**Key Changes**:
- Old: Sharp processing at build time (20+ min builds, 9,320+ images)
- New: Cloudflare Image Transformations (2-3 min builds, on-demand processing)

---

### Cloudflare Image Service Migration Plan

**[CLOUDFLARE_IMAGE_SERVICE_MIGRATION.md](./CLOUDFLARE_IMAGE_SERVICE_MIGRATION.md)** - Abandoned migration plan

Detailed migration plan for moving to Cloudflare Image Transformations.

**Status**: Plan was created but never executed exactly as written. The actual implementation differed from this plan.

**Actual Implementation**: See [../architecture/image-delivery.md](../architecture/image-delivery.md) for current approach.

**Why Archived**: The plan was overly detailed and included incorrect assumptions about needing the Cloudflare adapter. The actual migration was simpler - just use `/cdn-cgi/image/` URLs.

---

### Collage Implementation Status

**[COLLAGE_STATUS.md](./COLLAGE_STATUS.md)** - Tunes cover collage implementation notes

Status document tracking the implementation of the torn-paper strip collage generator for Tunes posts.

**Status**: Completed in 2025

**Features Implemented**:
- Native 1400×800 PNG collages
- Torn-edge effect with rotation
- Deterministic seeding
- Dynamic strip widths
- Full edge coverage (no transparency/black pixels)

**Current Location**: See [../guides/tunes-generator.md](../guides/tunes-generator.md) for usage

---

### SEO Implementation Notes

**[seo-implementation-notes.md](./seo-implementation-notes.md)** - Historical SEO implementation plan

Original SEO implementation plan with phases and checkboxes.

**Status**: Phases 1-4 completed in October 2025

**Current Documentation**: See [../architecture/seo-implementation.md](../architecture/seo-implementation.md)

**Completed Features**:
- Structured data (BlogPosting, Person, BreadcrumbList)
- Article meta tags
- Reading time component
- Related posts
- Breadcrumbs

---

## Why Archive?

These documents are archived rather than deleted because they:

1. **Provide context** for past architectural decisions
2. **Document migration history** for future reference
3. **Contain lessons learned** that may be useful
4. **Show evolution** of the codebase over time

## Current Documentation

For up-to-date documentation, see:

- **[../README.md](../README.md)** - Documentation index
- **[../guides/](../guides/)** - User guides
- **[../architecture/](../architecture/)** - System architecture
- **[../reference/](../reference/)** - Component reference

---

**Last Updated**: November 2025
