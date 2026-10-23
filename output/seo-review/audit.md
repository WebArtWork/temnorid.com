# Temnorid SEO image audit — 2026-10-23

Reviewed all 30 public pages and their sharing illustrations against current route data and page content. The production build prerendered 42 pages. All 42 passed metadata verification; all 30 public pages have distinct PNG images with valid dimensions, file sizes and source/build consistency. The remaining 12 pages are private sign-in/workshop tools excluded from indexing.

## Changes

- Dungeons: regenerated as a dark stone arch above warm amber torchlit stairs, as requested.
- Intrigue: regenerated as a wine-dark room with two candle glows above a long table edge, as requested.
- Craft: created game-craft.png for the updated gathering/crafting/production page; replaced its old farming-only image mapping.
- Salt Flats: removed the snowy alpine peak and replaced it with the bare Grey Mountain.
- The Stone Remembers: replaced the castle background with the humble first village.
- Retained the other 25 page images. No missing public-page image mappings.
- Refreshed the review gallery, prompts, source sitemap and robots file.
- Strengthened checks to compare the image manifest to the sitemap and published image bytes to source bytes.

## Public-page inventory

| Page | Route | Image | Dimensions | Result |
|---|---|---|---|---|
| Temnorid | `/` | `/seo/home.png` | 1732 × 908 | Passed |
| Stories of Temnorid | `/stories` | `/seo/stories.png` | 1733 × 907 | Passed |
| Games of Temnorid | `/games` | `/seo/games.png` | 1733 × 908 | Passed |
| Temnorid Movies | `/movies` | `/seo/movies.png` | 1734 × 907 | Passed |
| Lords | `/game/lords` | `/seo/game-lords.png` | 1732 × 908 | Passed |
| Craft | `/game/craft` | `/seo/game-craft.png` | 1734 × 907 | Passed |
| Arena | `/game/arena` | `/seo/game-arena.png` | 1734 × 907 | Passed |
| Conquest | `/game/conquest` | `/seo/game-conquest.png` | 1733 × 907 | Passed |
| Village from Stone | `/stories/village-from-stone` | `/seo/story-village-from-stone.png` | 1732 × 908 | Passed |
| The Night That Did Not End | `/stories/village-from-stone/night-that-did-not-end` | `/seo/chapter-night-that-did-not-end.png` | 1732 × 908 | Passed |
| The Grey Mountain | `/stories/village-from-stone/grey-mountain` | `/seo/chapter-grey-mountain.png` | 1732 × 908 | Passed |
| The First Stone | `/stories/village-from-stone/first-stone` | `/seo/chapter-first-stone.png` | 1734 × 907 | Passed |
| Those Who Came from the Dark | `/stories/village-from-stone/those-who-came-from-the-dark` | `/seo/chapter-those-who-came-from-the-dark.png` | 1732 × 908 | Passed |
| The Stone Remembers | `/stories/village-from-stone/stone-remembers` | `/seo/chapter-stone-remembers.png` | 1733 × 907 | Passed |
| Characters of Temnorid | `/characters` | `/seo/characters.png` | 1733 × 907 | Passed |
| Locations of Temnorid | `/locations` | `/seo/locations.png` | 1733 × 908 | Passed |
| Soldiers of Temnorid | `/soldiers` | `/seo/soldiers.png` | 1733 × 908 | Passed |
| Buildings of Temnorid | `/buildings` | `/seo/buildings.png` | 1733 × 907 | Passed |
| Yaryna | `/characters/yaryna` | `/seo/character-yaryna.png` | 1734 × 907 | Passed |
| Danylo | `/characters/danylo` | `/seo/character-danylo.png` | 1733 × 907 | Passed |
| Olena | `/characters/olena` | `/seo/character-olena.png` | 1733 × 907 | Passed |
| The Grey Mountain | `/locations/grey-mountain` | `/seo/location-grey-mountain.png` | 1734 × 907 | Passed |
| The Village from Stone | `/locations/village-from-stone` | `/seo/location-village-from-stone.png` | 1732 × 908 | Passed |
| The Salt Flats | `/locations/salt-flats` | `/seo/location-salt-flats.png` | 1734 × 907 | Passed |
| The Second River | `/locations/second-river` | `/seo/location-second-river.png` | 1733 × 908 | Passed |
| The Burned Forest | `/locations/burned-forest` | `/seo/location-burned-forest.png` | 1733 × 908 | Passed |
| The First House | `/buildings/first-house` | `/seo/building-first-house.png` | 1734 × 907 | Passed |
| The Named Houses | `/buildings/named-houses` | `/seo/building-named-houses.png` | 1733 × 907 | Passed |
| Dungeons | `/game/dungeons` | `/seo/game-dungeons.png` | 1734 × 907 | Passed |
| Intrigue | `/game/intrigue` | `/seo/game-intrigue.png` | 1733 × 907 | Passed |

The old game-farm.png is retained on disk but no current public route references it.

Build warning: initial bundle 514.07 kB, above the 500 kB warning threshold; build succeeded. No commits or deployment performed.
