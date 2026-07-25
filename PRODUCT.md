# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Three confirmed audiences, all served by the same pages:

- **The engineer who arrived from a search result.** Hit a specific problem — Terraform state, AKS ingress, Docker on macOS, a Packer template — and landed deep on one post from Google. Wants the answer, and possibly one or two genuinely related posts. Frequently never sees the homepage.
- **The peer or follower browsing.** Knows Russ already, via the books, LinkedIn, Mastodon, or conferences. Arrives at the homepage or a hub and wanders across posts, tunes, reading, and books.
- **AI agents and LLM crawlers.** A deliberate first-class audience, not a side effect. `llms.txt`, per-post markdown twins, JSON-LD, and the Worker's `text/markdown` content negotiation exist specifically to serve them.

## Product Purpose

Russ.Cloud is the personal site of Russ McKendrick — a 30-year IT professional, Practice Manager of SRE & DevOps at Node4, and author or contributor on fourteen technical books. It carries four purposes at once, all confirmed:

- **Credibility surface.** The public evidence behind the career and the books; the thing people find when they check who Russ is. Success means it holds up to scrutiny.
- **Useful reference that ranks.** Posts that solve real problems and get found. Success means traffic to the technical posts, and readers saying a post helped.
- **A place to think in public.** Writing is the point. Success means Russ keeps publishing, and the site never gets in the way of shipping a post.
- **A personal archive with a music half.** Blog, tunes, reading list, books, and glossary as one long-running record of what he has made, read, and listened to. Success means it stays complete and coherent.

No purpose outranks the others; work that serves one at the direct cost of another is a trade to raise, not to make silently.

## Positioning

A single-author archive where the technical writing, the music listening record, the reading list, the published books, and a plain-language glossary are all one continuous, self-hosted body of work — with the whole thing readable by machines as easily as by people. The depth (183 blog posts, 170 tunes posts, 73 glossary entries, 14 books, a synced reading list, all with real URLs going back years) is the part a neighbouring blog cannot copy.

## Operating Context

- **Publishing is scripted, not manual.** `pnpm run post` scaffolds a post; `node scripts/generate-cover.js` generates the cover from the finished content; `pnpm run tunes` and `pnpm run wrapped` generate music posts from Last.fm; `pnpm run medium` cross-publishes; `pnpm run reading` syncs the Instapaper reading list. Design work must not break what these scripts emit or assume.
- **Content lives in MDX content collections** with a typed frontmatter schema (`src/content.config.ts`) across four collections: `blog`, `tunes`, `books`, `glossary`.
- **Prebuild is a real pipeline.** `extract-colors`, `cache-link-preview-images`, `fetch-reading-list`, and `build-tunes-index` run before every build and produce generated data under `src/data/` and `public/assets/`.
- **Deployment is Cloudflare.** Static Astro output served through a Cloudflare Worker with an `ASSETS` binding, behind the Cloudflare CDN, deployed via GitHub Actions.
- **Images are transformed at runtime**, not at build time, via Cloudflare Image Transformations (`/cdn-cgi/image/`), with presets centralised in `src/consts.ts` and helpers in `src/utils/cloudflare-images.ts`.
- **The music half has a sibling site.** Deeper collection material lives at russ.fm; the tunes section here is the listening record, not the collection database.
- **Secrets are handled out-of-band.** The repo's `.env` is a named pipe; API-dependent scripts are run by Russ, not by tooling on his behalf.

## Capabilities and Constraints

Confirmed capabilities:

- Blog with date-based routes, tag hubs, year hubs, archives, pagination, and per-tag RSS.
- Tunes section with album, artist, and year hubs plus its own RSS feed.
- Books section (one page per book), a technology glossary, and an Instapaper-backed reading list with tag filtering.
- Pagefind static search, generated OpenGraph images for posts, books, glossary terms, tags, tunes albums/artists/years, sitemap, and JSON-LD structured data.
- Expressive Code syntax highlighting, lightGallery lightboxes, Mermaid diagrams, and a registered set of MDX embed components.
- Light and dark themes.

Binding constraints (confirmed by the owner):

- **Performance budget.** Near-perfect Lighthouse, static output, minimal client JS, no React islands used for presentation. Anything that costs measurable performance is a hard no.
- **URL structure is permanent.** `/YYYY/MM/DD/slug/` post URLs, tag/year/tunes hubs, and RSS feed paths were migrated from Hugo. Links exist in the wild and in published books. They never change.
- **Agent-readable output must keep working.** `llms.txt`, per-post markdown twins (`scripts/generate-llms-markdown.js`), JSON-LD schema, and the Worker's `text/markdown` content negotiation.

Technical constraints:

- Astro with `pnpm` (enforced by `only-allow pnpm`), Node.js 20+, pnpm 10+.
- Tailwind CSS v4 with design tokens in `src/styles/global.css`.
- Repo conventions: 2-space indent, no semicolons, PascalCase components, kebab-case routes.
- HTML sanitisation goes through `sanitize-html`; regex-based sanitisation is not acceptable.

## Brand Commitments

- **Name and identity:** Russ.Cloud, at https://www.russ.cloud/. Author entity is Russ McKendrick, Nottingham UK, with a stable canonical author hub at `/author/russ-mckendrick/`.
- **Voice:** British English, pragmatic, dry wit, first-person, notes-from-the-field rather than thought-leadership. Codified in the `russcloud-blog` skill and applied to posts and LinkedIn announcements alike.
- **AI-generated tunes posts are attributed as such** — the `AI_AUTHOR` byline is deliberate and must stay visible rather than being quietly absorbed into the human byline.
- **Cover art is generated per post** from the finished content, and the imagery is treated as the artwork of the page rather than decoration.
- **The site's own source is public** and linked from the navigation.

## Evidence on Hand

Real, in-repo, and safe to use:

- 183 blog posts, 170 tunes posts, 73 glossary entries, 14 book entries.
- Fourteen real published technical books with covers, publishers, and buy links (`src/content/books/`).
- A live reading list synced from Instapaper (`src/data/reading-filtered`).
- A real social footprint across GitHub, Mastodon, LinkedIn, Amazon author page, Docker Hub, Medium, Discogs, Last.fm, Spotify, Apple Music, and others (`SOCIAL_LINKS` in `src/consts.ts`).
- Per-post AI-generated cover art in `src/assets/`, and SVG avatars in `public/images/avatars/`.
- Real employment fact: Practice Manager of SRE & DevOps at Node4.

Absent, and must never be fabricated: testimonials, reader quotes, subscriber or traffic numbers, client names, awards, certifications, course or product offerings, pricing, and any claim of a team behind the site. It is one person.

## Product Principles

1. **The deep link is the front door.** Most readers arrive mid-archive from a search result; every page must stand alone and still explain where it sits.
2. **Never cost the reader speed.** Performance is a product feature here, not a technical detail — it is what makes a reference site worth returning to.
3. **The archive is permanent.** URLs, feeds, and old posts are commitments already made in print. New work extends the record; it never invalidates it.
4. **Machines are readers too.** Anything a person can read on this site, an agent should be able to fetch as clean markdown with correct structured data.
5. **The publishing pipeline must stay frictionless.** If a change makes shipping a post harder, it has failed regardless of how it looks.
6. **One person, plainly.** Technical posts, music, reading, and books belong to the same voice and the same record; the site should never dress itself up as an organisation.

## Accessibility & Inclusion

No accessibility standard was named as a binding constraint during this interview. Factually, the codebase already implements and documents WCAG 2.1 Level AA — build-time fixes via `src/utils/expressive-code-a11y-plugin.ts`, component-level aria-labels, and monitoring through `@casoon/astro-webvitals`, all described in `docs/guides/accessibility.md`. Treat that as the incumbent baseline to preserve rather than as a declared product requirement, and confirm with the owner before either raising or relaxing it.
