> **Provenance:** independent finish review of the completed mockup,
> 31 Jul 2026, run by a separate agent that did not build it (standing in for
> the Impeccable finish reviewer). All five material fixes below were applied
> to the mockup the same day; the ceiling-note tombstone was adopted too.

# Finish review — verdict and findings

## Verdict

This lands the brief. It reads as Medium's calm executed in its own world — warm paper instead of Medium's clinical white, Schibsted Grotesk headlines with real character over a Literata reading face, the measured values all honoured (680px story column, 42px title, 20/32 serif body, 13px meta, one hairline value, 160×107 right thumbnails). Every copy claim checks out against the repo: 183 posts, 171 tunes weeks, "Week 30" and the tunes title match `2026-07-27-listened-to-this-week.mdx`, the bio matches `about.astro` (30 years, Node4, fourteen books), and all six feed posts are real. Contrast passes on both editions (mist on paper 5.1:1 light, 6.9:1 dark). Night edition, mobile at 375px, the burger menu, and the story view all hold together. It does not read as a Medium rip-off — the warm paper, the ink-dot wordmark, and the terminal figure carry their own identity. The gaps below are finish-level, not direction-level.

## Material fixes, by impact — all applied

1. **The single-author story vanished on tablet and phone.** At `max-width: 1024px` the entire sidebar was `display: none`, so bio, "Listened to this week", and topics disappeared with no fallback — yet the contract's STORY promise is "understands one person writes here". *Fix applied: sidebar reflows below the feed as a stacked section on narrow viewports.*

2. **Double copyright at the desktop feed bottom.** The sidebar fineprint and the page colophon both carried the © line within ~100px of each other, with Source repeated in both. *Fix applied: sidebar keeps only the typeface credit; the colophon owns the © line.*

3. **The wordmark didn't return you to the feed.** The most natural click in the whole demo (logo → home) just jumped to the top of the article. *Fix applied: wordmark switches back to the feed view.*

4. **Thumbnails weren't links.** Clicking a cover did nothing while the title was a link; Medium's canon makes both clickable. *Fix applied: every thumbnail wrapped in the same anchor behaviour as its title.*

5. **Stateful controls didn't reflect state.** The masthead theme button showed a moon in both editions, and the burger kept the hamburger glyph while the menu was open. *Fix applied: moon/sun swap on theme, hamburger/X swap on the menu.*

## Ceiling note (adopted)

The committed world had one obvious unclaimed device — an end-of-story mark. The wordmark's ink-blue dot makes a natural tombstone glyph closing each article before the tags, tying the "pen ink used almost nowhere" identity to the reading experience at zero noise cost. *Adopted as the three-dot tombstone.*

## Non-issues, for the record

The contract says "57px masthead" but the build is 60px — imperceptible. Mobile 2-line title clamp with hidden deks matches Medium's own mobile list. Missing `alt` attributes and absent `:focus-visible` styles are implementation-stage floor items, fine to defer in a proposal mockup but carried on the implementation checklist in NOTES.md. The floating Feed/Story/Tunes/Night switcher occasionally overlaps a feed row, but it is declared mockup tooling, not part of the design.
