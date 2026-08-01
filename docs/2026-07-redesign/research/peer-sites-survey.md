> **Provenance:** research agent output, 31 Jul 2026, commissioned for the
> "Reading Room" redesign proposal (see [../NOTES.md](../NOTES.md)).
> Survey of ~17 professional personal sites/blogs that achieve a calm editorial feel, with per-site verified type/colour/layout details, shared DNA, differentiation levers, and the Google Fonts typeface evaluation that produced the Schibsted Grotesk + Literata pairing.

# Survey: Calm/Editorial/Professional Personal Sites ("Medium feel" with distinct identity)

Method: raw HTML/CSS fetched and inspected for every site (computed styles via live browser where Vercel blocked curl), July 31 2026. All hex values, widths, and font names below are read from live stylesheets, not from memory.

## Baseline: what "the Medium feel" literally is

- Body serif: **Charter** (Matthew Carter, 1987; licensed 2015), fallback Georgia. ~20-21px / 1.58 line-height.
- UI/headings sans: **Söhne** (Klim), with Inter/Helvetica Neue fallbacks.
- Colours: white background, near-black text `#242424`, muted grey metadata `#6B6B6B`, accent almost fully retired to black/green traces.
- Layout: one centred column, **680px**, no sidebar on the reading view, hairline rules, tiny muted metadata row, generous whitespace above the title.
- The calm comes from: big low-contrast serif body + quiet grotesque UI + one column + demoted metadata + almost no chrome.

---

## Site profiles (verified July 2026)

### 1. paulstamatiou.com — the closest "calm editorial with identity" exemplar
- **Type**: custom-subset serif ("PS1", a warm transitional/old-style) for headings AND much of body; custom sans ("PSA") for UI/metadata. Serif-forward.
- **Colours**: warm greige paper `rgb(247,242,237)` with a subtle grain texture, near-black text, links in soft warm grey `rgba(139,129,122,.9)` with underlines. Accent is a muted **olive green**, used only on the active nav icon.
- **Layout**: single centred column (~640-700px text), floating rounded "pill" icon nav at top centre, soft-rounded content wells for media rails (gear/photos), light/dark toggle.
- **One identity move**: the **warm paper tint + grain** — everything else is restrained, so the material temperature IS the brand.
- **Avoid**: nothing reads dated; if anything the rounded "wells" drift toward app-UI rather than editorial.

### 2. rauchg.com (Guillermo Rauch)
- **Type**: **Geist** (Vercel's own grotesque) everywhere, 16px/24px. Mono variant loaded for code.
- **Colours**: `#fcfcfc` background, pure black text, links black with no underline; **zero accent hue**. Dark mode inverts.
- **Layout**: single **672px** column. Post list = giant reverse-chron index grouped by year: `year · title · view-count` in tabular figures. No excerpts, no images.
- **One identity move**: the **view-count column** — a single data affordance turns a plain list into a signature.
- **Avoid**: pure monochrome + no underlines borders on affectless; needs the data gimmick to not be generic.

### 3. overreacted.io (Dan Abramov)
- **Type**: **Montserrat** 800-900 for the wordmark and post titles; **Merriweather** serif for body and metadata. `ui-monospace` stack for code.
- **Colours**: light = white bg, `#222` text, link/title accent **`#d23669`** (crimson-pink); dark = `rgb(40,44,53)` bg, `rgba(255,255,255,.88)` text, accent softens to `#ffa7c4`. Accent used ONLY for titles/links — total discipline.
- **Layout**: `max-w-2xl` = **672px** single column. Home list = pink bold title, small serif date, one-sentence description. Nothing else.
- **One identity move**: the **pink**. One saturated hue on chunky geometric titles over a bookish serif body = instantly recognisable.
- **Avoid**: Montserrat itself is a 2015-era default; it works here only because of weight (900) and the colour.

### 4. macwright.com (Tom MacWright)
- **Type**: system sans stack (`-apple-system, avenir next, helvetica neue…`), **Berkeley Mono** for code. 16px/1.6.
- **Colours**: `light-dark(#fff,#111)` bg, `light-dark(#111,#ccc)` text; links are **text-coloured but underlined**; a blue reserved for focus states only. Visited-link styling retained deliberately.
- **Layout**: `.limiter { max-width:640px }`. Writing index is a two-column CSS grid: title left, **right-aligned `tabular-nums` date**, 5px row gap — extremely dense, extremely calm.
- **One identity move**: **underlined same-colour links + tabular date grid** — reads as "working notebook of a serious person".
- **Avoid**: with zero display type it depends entirely on discipline; one sloppy element would collapse it.

### 5. jvns.ca (Julia Evans)
- **Type**: **PT Serif** body (Georgia fallback), **Montserrat** headings/nav, Alegreya for the tagline, Menlo code.
- **Colours**: pure `#000` on `#fff`; accent **`#FF5E00` orange** — used for title links AND as thick **35px solid border bars** flanking the header.
- **Layout**: `#wrap { width:70%; max-width:45em }` (~720px) single column; list = date + orange title.
- **One identity move**: the **structural orange bars** — accent used as architecture, not just link colour.
- **Avoid**: pure black-on-white at 1.25 line-height is harsher than the Medium feel; PT Serif reads slightly 2012.

### 6. simonwillison.net
- **Type**: Helvetica Neue + **Georgia** body.
- **Colours**: `#fdfdfd` bg, `#000` text, default-blue links `#0303bb` with visited `#636`; **purple** family (`rgb(129,72,163)`, `#ede3f1` tag pills, purple gradient PNG banner bands).
- **Layout**: fixed **940px** float layout: 560px main column + right sidebar of link-blog entries.
- **One identity move**: the **purple band headers + firehose density** — identity from volume and consistency, not polish.
- **Dated signals to avoid**: fixed-pixel float grid, gradient PNG bands, default blue/visited links, 560px measure with a competing sidebar. Beloved, but explicitly NOT the calm-editorial target.

### 7. daringfireball.net (John Gruber)
- **Type**: **Gill Sans / Verdana** stack, 1.8em line-height.
- **Colours**: inverted — slate `#4a525a` bg, white text, greys `#ccc/#aaa` for metadata.
- **Layout**: single column but `body { min-width:760px }`.
- **One identity move**: the **slate inversion + Gill Sans masthead** — 20 years unchanged, the palette IS the brand.
- **Dated signals to avoid**: min-width horizontal scroll, grey-on-slate contrast ratios, Verdana-era stack, no responsive layout. Proof that identity ages well but implementation must not.

### 8. chriscoyier.net
- **Type**: **DM Sans** body + **Instrument Serif** display (Google Fonts pair), `system-ui` base with `clamp()` fluid sizing, OKLCH colour system (`--accent: oklch(0.7528 0.2068 52.09)` = warm orange), `color-scheme: light dark`.
- **Layout**: masonry **card grid**, not a list; crayon-drawn multicolour wordmark; peach gradient page top; letter-spaced uppercase blue dates.
- **One identity move**: the **hand-drawn wordmark** over an otherwise systematic OKLCH design.
- **Avoid (for the calm lane)**: card grid + drop shadows + gradient reads "fun personal hub", not editorial; his font pair, however, is directly stealable.

### 9. ia.net (iA Writer blog)
- **Type**: proprietary **iA Sans/Serif in Day and Night cuts** — dark mode swaps to a slightly heavier "Night" font version, not just colours. Mono for accents.
- **Colours**: white / `rgb(34,34,34)` day; `rgb(27,27,27)` night; signature **cyan selection colour** `rgba(47,190,234,.25)`; essentially no other accent.
- **Layout**: **620px** text column, near-zero chrome, giant type scale, whole essays as the homepage.
- **One identity move**: **typography-as-product** — optical day/night font swap and nothing else. The most extreme "calm" on the list.

### 10. stripe.com/blog (team, but the professional benchmark)
- **Type**: **Söhne variable** (`sohne-var`), Source Code Pro mono.
- **Colours**: white bg, ink-navy **`#0a2540`** for headings (not black), blurple **`#635bff`** accent, per-post accent colours from a controlled set.
- **Layout**: single-column list of large entries with small author avatars; generous leading; hairline rules.
- **One identity move**: **navy-instead-of-black headings + blurple** — proves you can feel corporate-grade with just two committed colours.

### Briefer verifications
- **brianlovin.com**: redesigned to a minimal one-page **Inter** site (white bg, weight-600 headings, no link colour, no underlines; the old app-like sidebar is gone). Now reads clean but anonymous — cautionary: Inter alone = no identity.
- **joshwcomeau.com**: **Wotfard** sans, sky-blue illustrated header, 3D avatar, magenta eyebrow labels, two-column home with sidebar. Warm and masterful but **playful-tutorial**, not calm-editorial; identity from illustration, not typography.
- **seths.blog**: black left sidebar + orange-tinted headshot, full-post stream. Dated: cramped 200px sidebar, share-icon rows under every post, cookie banner, sub-16px type.
- **registerspill.thorstenball.com / pragmaticengineer.com**: Substack shells (SF Pro/system body; Register Spill picks the **bold Roboto Mono headings** preset). Even a good preset choice can't beat platform sameness: identical nav, subscribe interstitials, bundle CSS. pragmaticengineer.com itself is now just a landing page.
- **world.hey.com/dhh**: system sans stack, 45rem column, no styling levers at all — calm but fully generic.
- **frankchimero.com** (added): **Lyon** serif everywhere; entire site tinted one sage-green family (`#eeeeee` bg, `#464d4a` text, `#5e786d` accent, dark mode `#3d4340`). Identity from a **single monochrome hue family** — a lever nobody else on this list uses.
- **blog.jim-nielsen.com** (added): system-ui, **46rem** column, HSL hue-theming variables — evidence that even a system-font site gets identity from one committed hue + tight list craft.

---

## (a) Shared DNA of professional editorial blogs

1. **One centred column, 620-680px** for text (iA 620, macwright 640, rauchg/overreacted 672, Medium 680, jim-nielsen 46rem). Sidebars are extinct in this lane; anything wider is for media rails, not prose.
2. **16-21px body, 1.5-1.7 line-height, 60-75ch measure.** The serif-body sites run larger (18-21px); sans-body sites sit at 16-17px.
3. **Soft monochrome, never pure**: `#fcfcfc/#fdfdfd/#fff5-warm` backgrounds, `#222/#242424/#111` text. (Sites using pure #000-on-#fff — jvns — read noticeably harder.)
4. **Exactly one accent hue**, applied to at most two things (links and/or titles), everywhere, forever. The accent IS the brand: pink (Abramov), orange (Evans, Coyier), purple (Willison), blurple (Stripe), olive (Stamatiou). Second accents appear only in code syntax.
5. **Metadata demoted**: small, grey, often tabular-nums, never bold. Dates never compete with titles.
6. **Hierarchy from type, not boxes**: weight/size/space + hairline rules; no cards or shadows around prose. (Card grids = personal-hub genre, not editorial.)
7. **Near-zero chrome**: name/wordmark + 2-4 nav links + RSS. No hero banners, no share buttons, no badges.
8. **The list is a designed object**: every strong site has an opinionated post-list schema (see lever 5).
9. **Dark mode is expected** and done via variables/`light-dark()`, with the accent recalibrated (Abramov's `#d23669` → `#ffa7c4`), not just inverted.
10. **Code blocks are first-class** on dev blogs: a named mono (Berkeley Mono, Geist Mono, Cartograph) and a considered syntax palette — this is where a second, contained colour system is allowed.

## (b) Differentiation levers (Medium-calm without looking like Medium)

1. **Accent commitment** — one saturated, slightly off-standard hue (not default blue, not Medium green) used on titles+links only, recalibrated for dark mode. Cheapest, strongest lever (overreacted, jvns, Stripe).
2. **Paper temperature + texture** — shift the background off pure white toward warm greige (`#f7f2ed`) or cool `#fcfcfc`, optionally with a whisper of grain; set headings in ink-navy or warm near-black instead of `#000` (Stamatiou, Stripe). Instantly "print" rather than "app".
3. **Pairing inversion** — Medium is sans-display over serif-body; invert it (serif display over quiet sans body — Coyier's Instrument Serif/DM Sans), go serif-everywhere (Chimero/Lyon, iA), or mono-display (Register Spill). Same calm, different fingerprint.
4. **Wordmark as the single flourish** — one distinctive masthead treatment (hand-drawn, heavyweight lowercase, small-caps letterspaced) carried on an otherwise silent page (Coyier, overreacted, Daring Fireball). Budget: exactly one flourish.
5. **Post-list schema** — pick a signature: year-grouped title + view/read-count column (rauchg); title + one-line dek (overreacted); dense grid with right-aligned tabular dates (macwright); full-text stream (Seth). A designed list beats a card grid for editorial feel every time.
6. **Accent as architecture** — use the accent structurally, not just on text: thick border bars (jvns's 35px orange), a coloured top rule on every page, tag pills in the accent's 10% tint (Willison's `#ede3f1`). One structural element, repeated everywhere.
7. **Monochrome hue-family tint** — Chimero's move: tint background, text, borders, and accent all from one hue family (sage, sepia, slate). Radical differentiation with zero added visual noise.
8. **Materialised dark mode** — treat dark as a second edition, not an inversion: darker paper (`rgb(40,44,53)` not `#000`), softened accent, slightly lighter font weight (iA goes as far as swapping font cuts). Signals craft immediately.

## (c) Google-Fonts typeface evaluation

**Availability flag:** **General Sans is NOT on Google Fonts** — it's Indian Type Foundry via Fontshare (free licence, but self-host). Everything else evaluated is on Google Fonts.

### Söhne-like grotesques (want: quiet neo-grotesque warmth, real detail, not sterile)
- **Schibsted Grotesk** — **best pick.** Commissioned for the Schibsted newsroom, so its DNA is literally editorial. Slightly compact, confident single-storey details, strong 500-700 range for headings; low saturation on the web today. Closest "Söhne with a passport" on Google Fonts.
- **Hanken Grotesk** — **best warm/body pick.** Humanist grotesque (HK Grotesk lineage), soft terminals, excellent 400-500 at 16-17px, variable. Friendlier than Söhne; the calm choice if the serif carries the display duty. Moderately used, not saturated.
- **Instrument Sans** — characterful neo-grotesque with a width axis; slightly techy-cool curves; ready-made pairing with Instrument Serif (the Coyier combo). Rising fast in portfolio-land — fresh now, watch for saturation. Strong for wordmark + UI, adequate for body.
- **Public Sans** — Libre Franklin reworked for the US gov design system: sturdy, neutral, civic. Disciplined body sans, but institutionally flavourless as display — differentiates from Inter without adding identity.
- **Inter** — technically superb, and precisely why it fails here: it's the platform-default of the 2020s (brianlovin.com in Inter reads anonymous). Use only as a fallback stack member.
- **General Sans** (Fontshare) — genuinely Söhne-adjacent (slightly geometric, confident), good weights; costs self-hosting. Worth it only if Google-Fonts delivery isn't a constraint.

### Charter-like serifs (want: low-contrast transitional, big x-height, sturdy at screen text sizes)
- **Source Serif 4** — **closest Charter analogue on Google Fonts**: low contrast, robust, optical sizes, variable. Reads calm-professional out of the box. It's also the least differentiating of the good options (increasingly the "tasteful default"). Note: russ.cloud already ships it — continuity is free.
- **Literata** — **best body-text pick for warmth**: built for Google Play Books, superb texture at 17-19px, real italics, optical size axis. Slightly more calligraphic than Charter; distinctive without shouting; underused on dev blogs.
- **Newsreader** — **best editorial-flavour pick**: designed for on-screen news; higher contrast than Charter, gorgeous at display sizes via the opsz axis, elegant italic. More "magazine" than "book" — ideal when the serif is the headline voice.
- **Petrona** — semi-slab warmth, upright and a little quirky; genuinely differentiating as a body serif but the personality shows at display sizes; pick it to be noticed, not to disappear.
- **Besley** — Clarendon revival: bricky, British, assertive. Excellent **headline** serif over a quiet grotesque body; too much flavour for long-form body text. (Adjacent to the Fraunces energy already in the russ.cloud retheme.)
- **PT Serif** — sturdy and free but 2010s-flavoured (jvns uses it), tight spacing, only two weights + italics; the "dated WordPress theme" risk of this list. Skip.

**Strongest non-default combinations for a Söhne/Charter feel with identity:**
1. **Schibsted Grotesk (display/UI) + Literata (body)** — newsroom sans over bookish serif; nothing about it says Medium or SaaS.
2. **Hanken Grotesk (UI/meta) + Newsreader (display + body serif)** — serif-forward, magazine-calm.
3. **Instrument Sans + Instrument Serif** — one-family wit, display serif does the identity work (proven live on chriscoyier.net).
4. **Besley (headlines only) + Hanken Grotesk (body)** — inverted pairing, print-poster flavour at low risk.

## Dated/amateur signals catalogue (observed, to avoid)
- Fixed-pixel float layouts and sidebars (simonwillison 940/560px; seths.blog sidebar)
- `min-width` desktop-only layouts (daringfireball `min-width:760px`)
- Default blue `#0303bb` / visited-purple links; gradient PNG banner bands (simonwillison)
- Share-icon rows under posts, cookie banners, subscribe interstitials (seths.blog, Substack)
- Sub-16px body text; pure `#000` on `#fff` at tight leading (jvns)
- Verdana/Arial-era font stacks; Montserrat/PT Serif as unconsidered defaults
- Grey-on-grey sub-AA contrast (daringfireball `#aaa` on `#4a525a`)
- Card grids with drop shadows for text content (reads "personal hub", not editorial)
- Platform-template sameness (Substack, Hey World) — the strongest single argument for owning the design
- Inter-only, accentless, underline-less pages (brianlovin) — calm achieved, identity zero

Sources: [rauchg.com](https://rauchg.com), [paulstamatiou.com](https://paulstamatiou.com), [brianlovin.com](https://brianlovin.com), [overreacted.io](https://overreacted.io), [joshwcomeau.com](https://www.joshwcomeau.com), [macwright.com](https://macwright.com), [jvns.ca](https://jvns.ca), [simonwillison.net](https://simonwillison.net), [chriscoyier.net](https://chriscoyier.net), [daringfireball.net](https://daringfireball.net), [seths.blog](https://seths.blog), [ia.net/topics](https://ia.net/topics), [stripe.com/blog](https://stripe.com/blog), [registerspill.thorstenball.com](https://registerspill.thorstenball.com), [world.hey.com/dhh](https://world.hey.com/dhh), [frankchimero.com](https://frankchimero.com), [blog.jim-nielsen.com](https://blog.jim-nielsen.com), [Marcin Wichary, "Cast of characters" (Medium.design)](https://medium.design/cast-of-characters-17eaa82755cf), [designyourway.net on Medium's fonts](https://www.designyourway.net/blog/what-font-does-medium-use/)