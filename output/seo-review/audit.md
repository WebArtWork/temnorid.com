# Temnorid SEO image coverage audit

Reviewed the current routes, image mappings, image files and all 31 public-page illustrations. Found one visual placeholder: `/soldiers/stone-guard`. Replaced it with a finished illustration of village sentries guarding the first houses and path to the salt flats. Generated with the built-in image_gen tool; the final prompt is saved in `tools/seo/image-prompts.json`.

Production build passed: 63 prerendered pages, 31 public URLs, 31 distinct valid sharing images. Metadata, canonicals, manifest coverage, image dimensions, file size, uniqueness and source/build image consistency passed. The 32 private sign-in/workshop pages remain excluded from indexing. Workshop-only lore categories do not yet have public routes and need no separate SEO images.

All image files loaded in the local gallery. Rendered gallery spacing checked at 390, 1440 and 1728 px with no critical or serious findings. No commits or deployment performed.

| Page | Route | SEO image | Result |
|---|---|---|---|
| Temnorid | `/` | `/seo/home.png` | Passed |
| Stories of Temnorid | `/stories` | `/seo/stories.png` | Passed |
| Games of Temnorid | `/games` | `/seo/games.png` | Passed |
| Temnorid Movies | `/movies` | `/seo/movies.png` | Passed |
| Lords | `/game/lords` | `/seo/game-lords.png` | Passed |
| Craft | `/game/craft` | `/seo/game-craft.png` | Passed |
| Arena | `/game/arena` | `/seo/game-arena.png` | Passed |
| Conquest | `/game/conquest` | `/seo/game-conquest.png` | Passed |
| Village from Stone | `/stories/village-from-stone` | `/seo/story-village-from-stone.png` | Passed |
| The Night That Did Not End | `/stories/village-from-stone/night-that-did-not-end` | `/seo/chapter-night-that-did-not-end.png` | Passed |
| The Grey Mountain | `/stories/village-from-stone/grey-mountain` | `/seo/chapter-grey-mountain.png` | Passed |
| The First Stone | `/stories/village-from-stone/first-stone` | `/seo/chapter-first-stone.png` | Passed |
| Those Who Came from the Dark | `/stories/village-from-stone/those-who-came-from-the-dark` | `/seo/chapter-those-who-came-from-the-dark.png` | Passed |
| The Stone Remembers | `/stories/village-from-stone/stone-remembers` | `/seo/chapter-stone-remembers.png` | Passed |
| Characters of Temnorid | `/characters` | `/seo/characters.png` | Passed |
| Locations of Temnorid | `/locations` | `/seo/locations.png` | Passed |
| Soldiers of Temnorid | `/soldiers` | `/seo/soldiers.png` | Passed |
| Buildings of Temnorid | `/buildings` | `/seo/buildings.png` | Passed |
| Yaryna | `/characters/yaryna` | `/seo/character-yaryna.png` | Passed |
| Danylo | `/characters/danylo` | `/seo/character-danylo.png` | Passed |
| Olena | `/characters/olena` | `/seo/character-olena.png` | Passed |
| The Grey Mountain | `/locations/grey-mountain` | `/seo/location-grey-mountain.png` | Passed |
| The Village from Stone | `/locations/village-from-stone` | `/seo/location-village-from-stone.png` | Passed |
| The Salt Flats | `/locations/salt-flats` | `/seo/location-salt-flats.png` | Passed |
| The Second River | `/locations/second-river` | `/seo/location-second-river.png` | Passed |
| The Burned Forest | `/locations/burned-forest` | `/seo/location-burned-forest.png` | Passed |
| The First House | `/buildings/first-house` | `/seo/building-first-house.png` | Passed |
| The Named Houses | `/buildings/named-houses` | `/seo/building-named-houses.png` | Passed |
| Dungeons | `/game/dungeons` | `/seo/game-dungeons.png` | Passed |
| Intrigue | `/game/intrigue` | `/seo/game-intrigue.png` | Passed |
| Stone Guard | `/soldiers/stone-guard` | `/seo/soldier-stone-guard.png` | Passed |
