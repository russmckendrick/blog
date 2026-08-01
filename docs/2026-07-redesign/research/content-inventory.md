> **Provenance:** research agent output, 31 Jul 2026, commissioned for the
> "Reading Room" redesign proposal (see [../NOTES.md](../NOTES.md)).
> Content inventory used to populate the mockup with real content: latest tunes entry, collection counts, bio, site identity, nav routes. The six most recent blog posts are in content-inventory-posts.json alongside this file.

# Content Inventory — russ.cloud (Astro blog)

## 2. Latest tunes entry
- **File**: `/Users/russ.mckendrick/Code/blog/src/content/tunes/2026-07-27-listened-to-this-week.mdx` (flat .mdx, not directory-based)
- **Title**: "Mod Scooters, Synth Ice, and Purple Funk After Midnight"
- **Description**: "Week 30 roams from mod fire and post punk wit to synth pulse soul revival and dream rock linking legends and left turns in one restless addictive ride"
- **pubDate**: 2026-07-27
- **Hero image (verified on disk)**: `/Users/russ.mckendrick/Code/blog/src/assets/2026-07-27-listened-to-this-week/tunes-cover-2026-07-27-listened-to-this-week.png` (small variant: `...-small.png` in same dir)
- **Album covers (verified on disk, under public/)**:
  - `/Users/russ.mckendrick/Code/blog/public/assets/2026-07-27-listened-to-this-week/albums/Snap.jpg` (The Jam)
  - `/Users/russ.mckendrick/Code/blog/public/assets/2026-07-27-listened-to-this-week/albums/Quadrophenia.jpg` (The Who)
  - `/Users/russ.mckendrick/Code/blog/public/assets/2026-07-27-listened-to-this-week/albums/The-Pleasure-Principle.jpg` (Gary Numan)
  - `/Users/russ.mckendrick/Code/blog/public/assets/2026-07-27-listened-to-this-week/albums/Lost-in-the-Dream.jpg` (The War on Drugs)
  - More available in same dir: Modern-Classics-The-Greatest-Hits.jpg (Paul Weller), Best-I.jpg / Best-II.jpg (The Smiths), Ice-Cream-Castle.jpg (The Time), Boing.jpg, Before-After.jpg, Doctrine-Of-Love.jpg, Reality-Awaits.jpg; matching `artists/` portraits also exist.

## 3. Counts (published, 0 drafts anywhere)
- Blog posts: **183**
- Tunes entries: **171**
- Books: **14**
- Glossary terms: **73**

## 4. Bio (Russ's own words, from src/pages/about.astro)
"Hello! I'm Russ, an IT professional with a strong background in DevOps and system administration. I've spent the last 30 years working in various IT roles across multiple industries." He adds: "I have a deep passion for Linux, open-source systems, automation, and containers" — currently Practice Manager of SRE & DevOps at Node4, author/contributor of fourteen technical books, vinyl record collector (russ.fm).

## 5. Site identity (src/consts.ts)
- **SITE_TITLE**: "Russ McKendrick"
- **SITE_DESCRIPTION**: "Russ.Cloud - The personal blog of Russ McKendrick"
- **SITE_LONG_DESCRIPTION** (tagline): "The ramblings of a nerd about random things that interest me."
- **Keywords**: Blog, Technical, Automation, DevOps, Cloud
- **Author**: Russ McKendrick, Nottingham, UK, r@russ.email
- **Social links (SOCIAL_LINKS)**: github (github.com/russmckendrick), mastodon (social.mckendrick.io/@russ), twitter, linkedin, amazon (author page), docker hub, instagram, medium, instapaper, reddit, discogs, applemusic, spotify, lastfm

## 6. Nav / top-level routes (NAVIGATION_ITEMS in consts.ts + verified src/pages/)
Nav items as configured: **Search** (/search/), **Tags** (/tags/), **Tunes** (/tunes/), **Reading** (/reading/), **Books** (/books/), **About** (/about/), **Archives** (/archives/), **Source** (external → github.com/russmckendrick/blog/).
Routes that exist on disk beyond nav: **Home** (/), **Glossary** (/glossary/ — exists but NOT in the nav config), /blog/ pagination, /author/russ-mckendrick/, /avatars/, date-based post URLs /[year]/[month]/[day]/[slug]/, tunes sub-routes (/tunes/album/, /tunes/artist/, /tunes/year/), reading sub-routes (/reading/tag/), RSS (rss.xml + tunes RSS), 404, /page/ pagination.

## Notes for the mockup
- Blog frontmatter uses `cover.image` (relative `../../assets/<slug>/blog-cover-<slug>.png`); tunes use flat `heroImage`. All 6 post hero paths above were verified with ls.
- Read minutes estimated at words/230 from post body word count (frontmatter has no readingTime field).
- Post URL pattern is date-based: /2026/07/19/token-use-coach-mode-and-a-week-of-releases/.
- All content is published (no draft: true anywhere), so counts equal visible entries.