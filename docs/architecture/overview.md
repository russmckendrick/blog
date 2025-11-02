# Architecture Overview

This document provides a high-level overview of the Russ.Cloud blog architecture, including the tech stack, data flow, and key design decisions.

## System Architecture

```mermaid
graph TB
    subgraph "Content Creation"
        A[Author] -->|Write MDX| B[src/content/blog/]
        A -->|Run tunes| C[Tunes Generator]
        C -->|Last.fm + AI| B
    end

    subgraph "Build Process"
        B --> D[Astro Build]
        E[src/assets/] --> D
        D --> F[Static HTML/CSS/JS]
        E -->|Copy| G[public/assets/]
    end

    subgraph "Deployment"
        F --> H[GitHub Actions]
        H --> I[Cloudflare Pages]
        G --> I
    end

    subgraph "Delivery"
        I --> J[Cloudflare CDN]
        J -->|Image Transform| K[/cdn-cgi/image/]
        J --> L[End User]
        K --> L
    end

    style D fill:#f9f,stroke:#333
    style I fill:#f96,stroke:#333
    style J fill:#9cf,stroke:#333
```

## Technology Stack

### Core Framework

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Framework** | Astro 5.x | Static site generation with islands architecture |
| **Language** | TypeScript | Type-safe development |
| **Styling** | Tailwind CSS 4.x | Utility-first CSS framework |
| **Content** | MDX | Markdown with JSX components |

### Infrastructure

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Hosting** | Cloudflare Workers (static) | Edge deployment |
| **CDN** | Cloudflare CDN | Global content delivery |
| **Images** | Cloudflare Image Transformations | On-demand image optimization |
| **DNS** | Cloudflare | Domain management |
| **CI/CD** | GitHub Actions | Automated builds and deployment |

### Content & Features

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Content Collections** | Astro Content Collections | Type-safe content management |
| **Search** | Pagefind | Static search index |
| **Analytics** | Plausible | Privacy-focused analytics |
| **Syntax Highlighting** | Expressive Code | Code block styling |
| **Image Gallery** | LightGallery | Lightbox image viewer |
| **OpenGraph Images** | astro-og-canvas | Auto-generated OG images |

## Data Flow

### Blog Post Rendering

```mermaid
sequenceDiagram
    participant Author
    participant MDX as MDX File
    participant Astro as Astro Build
    participant CF as Cloudflare
    participant User

    Author->>MDX: Write/Edit Post
    MDX->>Astro: Collection Entry
    Astro->>Astro: Render to HTML
    Astro->>Astro: Generate OG Image
    Astro->>CF: Deploy Static Files
    User->>CF: Request Page
    CF->>User: Deliver HTML
    User->>CF: Request Images
    CF->>CF: Transform Image
    CF->>User: Optimized Image
```

### Tunes Generation Flow

```mermaid
sequenceDiagram
    participant CLI as npm run tunes
    participant LastFM as Last.fm API
    participant Collection as russ.fm
    participant AI as OpenAI/Anthropic
    participant Files as File System

    CLI->>LastFM: Get Weekly Stats
    LastFM->>CLI: Top Artists/Albums
    CLI->>Collection: Fetch Metadata
    Collection->>CLI: Images + Links
    CLI->>AI: Generate Content
    AI->>CLI: Blog Sections
    CLI->>Files: Download Images
    CLI->>Files: Generate Cover Collage
    CLI->>Files: Write MDX Post
```

## URL Structure

### Blog Posts

```
https://www.russ.cloud/YYYY/MM/DD/slug/
```

Example: `https://www.russ.cloud/2024/04/14/installing-invokeai-on-macos/`

**Routing**: Dynamic route at `src/pages/[year]/[month]/[day]/[slug].astro`

### Content Collections

```mermaid
graph LR
    A[src/content/] --> B[blog/]
    A --> C[tunes/]
    B --> D[YYYY-MM-DD-slug.mdx]
    C --> E[YYYY-MM-DD-listened-to-this-week/]
    E --> F[index.mdx]
```

### Static Assets

| Type | Location | Delivery |
|------|----------|----------|
| **Source Images** | `src/assets/YYYY-MM-DD-slug/` | Via Cloudflare Image Transformations |
| **Public Assets** | `public/assets/` | Direct CDN delivery |
| **Avatars** | `public/images/avatars/` | Direct CDN delivery |
| **Cover Images** | `src/assets/YYYY-MM-DD-slug/cover.jpg` | Via Cloudflare Image Transformations |

## Content Types

### Blog Posts

**Location**: `src/content/blog/`

**Schema**: Defined in `src/content.config.ts`

**Key Features**:
- MDX support with global components
- Frontmatter validation via Zod
- Auto-generated OpenGraph images
- SEO meta tags and structured data
- Dark mode support
- Table of contents (optional)

### Tunes Posts

**Location**: `src/content/tunes/`

**Schema**: Extended blog schema with music metadata

**Key Features**:
- AI-generated content
- Album/artist galleries
- Last.fm integration
- Auto-generated cover collages
- Listening statistics

## Component Architecture

### Layout Hierarchy

```mermaid
graph TD
    A[BaseLayout.astro] --> B[BlogPost.astro]
    A --> C[About.astro]
    A --> D[Tags Pages]

    B --> E[MDX Content]
    E --> F[Global Components]

    F --> G[Embed Components]
    F --> H[Callout Components]

    G --> I[YouTube]
    G --> J[Img]
    G --> K[LightGallery]
    G --> L[LinkPreview]

    H --> M[Note]
    H --> N[Warning]
    H --> O[Tip]

    style A fill:#f9f,stroke:#333
    style B fill:#9cf,stroke:#333
    style F fill:#fcf,stroke:#333
```

### Component Types

**Layout Components** (`src/components/layout/`):
- `BaseHead.astro` - SEO, meta tags, schema
- `Header.astro` - Navigation and theme switcher
- `Footer.astro` - Footer with social links
- `Breadcrumbs.astro` - Breadcrumb navigation

**Blog Components** (`src/components/blog/`):
- `PostCard.astro` - Blog post preview cards
- `RelatedPosts.astro` - Tag-based related posts
- `TableOfContents.astro` - Auto-generated ToC
- `ReadingTime.astro` - Reading time estimate

**Embed Components** (`src/components/embeds/`):
- Media: YouTube, Instagram, Giphy, Audio, AppleMusic
- Content: LinkPreview, ChatMessage, Img, LightGallery
- Callouts: Note, Tip, Warning, Important, Caution, Info

## Build Process

### Local Development

```mermaid
graph LR
    A[npm run dev] --> B[Astro Dev Server]
    B --> C[Hot Module Reload]
    C --> D[localhost:4321]

    E[Edit MDX] --> C
    F[Edit Components] --> C
    G[Edit Styles] --> C
```

**Key Points**:
- No image processing in dev (Cloudflare transforms don't work locally)
- Fast hot reloading
- TypeScript type checking
- Real-time content updates

### Production Build

```mermaid
graph TD
    A[npm run build] --> B[Content Collection Processing]
    B --> C[Component Rendering]
    C --> D[Route Generation]
    D --> E[OG Image Generation]
    E --> F[Static HTML/CSS/JS]
    F --> G[Asset Compression]
    G --> H[dist/ Output]

    style H fill:#f96,stroke:#333
```

**Build Time**: ~2-3 minutes

**Output**: Fully static site in `dist/`

### Deployment Pipeline

```mermaid
graph TD
    A[git push main] --> B[GitHub Actions]
    B --> C[Install Dependencies]
    C --> D[Run Astro Build]
    D --> E[Wrangler Deploy]
    E --> F[Cloudflare Pages]
    F --> G[Global CDN Distribution]

    style B fill:#6cc,stroke:#333
    style F fill:#f96,stroke:#333
```

**Workflow**: `.github/workflows/deploy.yml`

**Triggers**:
- Push to `main` branch
- Pull request builds (preview)

**Deployment Time**: ~3-5 minutes total

## Image Processing Architecture

### Traditional Approach (Not Used)

```mermaid
graph LR
    A[Source Image] --> B[Sharp Processing]
    B --> C[Multiple Formats]
    C --> D[Multiple Sizes]
    D --> E[9,320+ Variations]
    E --> F[dist/ folder]
    F --> G[CDN]

    style B fill:#f99,stroke:#333
    style E fill:#f99,stroke:#333
```

**Issues**: 20+ minute builds, large dist folder, cache dependency

### Current Approach (Cloudflare Image Transformations)

```mermaid
graph TD
    A[Source Image] --> B[Copy to dist/]
    B --> C[Deploy to Cloudflare]
    C --> D[User Request]
    D --> E{/cdn-cgi/image/?}
    E -->|Yes| F[Transform on Edge]
    E -->|No| G[Original Image]
    F --> H[Cache Globally]
    H --> I[Deliver to User]
    G --> I

    style F fill:#9f9,stroke:#333
    style H fill:#9cf,stroke:#333
```

**Benefits**:
- 2-3 minute builds (no processing)
- On-demand optimization
- Global CDN caching
- Automatic format selection (AVIF/WebP)

See [image-delivery.md](./image-delivery.md) for details.

## SEO Architecture

### Meta Tags & Social Sharing

```mermaid
graph TD
    A[Blog Post] --> B[BaseHead.astro]
    B --> C[astro-seo-plugin]
    C --> D[Title & Description]
    C --> E[OpenGraph Tags]
    C --> F[Twitter Cards]
    C --> G[Canonical URL]

    A --> H[OG Image Generation]
    H --> I[astro-og-canvas]
    I --> J[1200x630 PNG]
    J --> E

    style C fill:#9cf,stroke:#333
```

### Structured Data

```mermaid
graph TD
    A[Page Type] --> B{Content Type?}
    B -->|Blog Post| C[BlogPosting Schema]
    B -->|About Page| D[Person Schema]
    B -->|All Pages| E[Organization Schema]

    C --> F[JSON-LD Output]
    D --> F
    E --> F

    F --> G[Search Engines]
    G --> H[Rich Snippets]

    style F fill:#9f9,stroke:#333
    style H fill:#fcf,stroke:#333
```

**Schema Types Implemented**:
- BlogPosting (all blog posts)
- Person (author information)
- Organization (publisher)
- BreadcrumbList (navigation)

See [seo-implementation.md](./seo-implementation.md) for details.

## Performance Characteristics

### Build Performance

| Metric | Value |
|--------|-------|
| **Build Time** | 2-3 minutes |
| **Source Images** | 173 images |
| **Output Size** | Small (no processed images) |
| **Node Modules** | ~500MB (cached) |

### Runtime Performance

| Metric | Target | Actual |
|--------|--------|--------|
| **Lighthouse Score** | 90+ | 95+ |
| **First Contentful Paint** | <1.8s | <1.5s |
| **Largest Contentful Paint** | <2.5s | <2.0s |
| **Time to Interactive** | <3.8s | <3.0s |

### CDN Performance

| Metric | Value |
|--------|-------|
| **Edge Locations** | 280+ worldwide |
| **Cache Hit Ratio** | >90% |
| **Image Transform Free Tier** | 5,000/month |
| **Current Usage** | ~700/month |

## Security & Privacy

### Content Security

- Static HTML (no server-side code)
- No database or user authentication
- Read-only deployment (no write access)

### Privacy

- Plausible Analytics (no cookies, GDPR compliant)
- No third-party tracking
- External links: `nofollow noopener noreferrer`

### Image Security

- Images served from trusted origin (own domain)
- Cloudflare Image Transformations (validated)
- No external image hotlinking

## Monitoring & Analytics

### Build Monitoring

- GitHub Actions logs
- Build time tracking
- Deployment status

### Site Analytics

- Plausible Analytics dashboard
- Page views and traffic sources
- No personal data collection

### Performance Monitoring

- Cloudflare Analytics
- Image transformation usage
- Cache hit rates
- Bandwidth usage

## Key Design Decisions

### Why Astro?

- **Islands Architecture**: Minimal JavaScript, maximum performance
- **Content Collections**: Type-safe content management
- **MDX Support**: Rich component-based content
- **Static Output**: Perfect for Cloudflare Pages

### Why Cloudflare?

- **Global CDN**: 280+ edge locations
- **Image Transformations**: On-demand optimization
- **Free Tier**: Generous limits for personal blogs
- **Worker Compatibility**: Future SSR option if needed

### Why Static?

- **Performance**: Sub-second page loads
- **Security**: No attack surface
- **Cost**: Free hosting
- **Reliability**: No server crashes

### Why MDX?

- **Component Reuse**: Embed components in markdown
- **Type Safety**: Props validated at build time
- **Flexibility**: Mix markdown and JSX
- **Migration**: Easy migration from Hugo

## Future Considerations

### Potential Enhancements

1. **Incremental Builds**: Astro experimental feature
2. **Edge SSR**: For dynamic content (comments, etc.)
3. **Service Worker**: Offline support
4. **Image Preloading**: Predictive image loading

### Scalability

**Current Capacity**:
- Unlimited static pages
- 5,000 image transformations/month (free)
- 100K Cloudflare Workers requests/day (free)

**Growth Path**:
- Paid Cloudflare plan if needed
- CDN already global scale
- No database scaling concerns

## Related Documentation

- [Image Delivery Architecture](./image-delivery.md)
- [SEO Implementation](./seo-implementation.md)
- [Build & Deployment](./build-deployment.md)
- [Component Reference](../reference/embed-components.md)

---

**Last Updated**: November 2025
