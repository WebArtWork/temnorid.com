# Temnorid workshop guide for AI chats

Source: https://temnorid.com/workshop.md · generated 2026-10-23 from the released data.

Temnorid is a dark medieval fantasy world inspired by the 14th century (1300–1400), where kingdoms, armies and wizards compete for territory and influence.

The world is told through stories, written chapter by chapter, and the lore of its characters, locations, troops and buildings. Six connected games share it: Lords at the centre, with Craft, Dungeons, Conquest, Arena and Intrigue around it. Films are planned.

In the Temnorid workshop anyone can write stories and world entries; the best become part of the world.

## Your task

Help a Temnorid author write new drafts: stories (with chapters and gaps) and lore entries.
Answer with **one JSON code block** containing a **sync object** (format below) and nothing
else inside the block. The author pastes it into the workshop at
https://temnorid.com/write/stories → the sync icon next to "Workshop" → "Check" → "Sync".

Rules:

- Stay consistent with the released canon listed below. Link to it by `<kind>/<slug>`.
- Write in the language the author uses. Drafts hold one language; the owner translates later.
- Slugs: lowercase Latin letters, digits and single hyphens, at most 80 characters, e.g.
  `ash-wolf`. Never reuse a released slug: released entries cannot be changed from the workshop.
- Text fields are plain text. `html` fields allow only `p`, `h2`, `h3`, `strong`, `em`, `ul`,
  `ol`, `li`, `blockquote` and `a`. No images, video, iframes, scripts or styles.
- The sync object mirrors all of the author's drafts. Sync creates and updates drafts by slug
  and **deletes** the drafts it no longer lists: stories, their chapters and gaps, lore entries.
  If the author shared their current sync object, return it whole with your changes in it;
  leave out only what the author asked to delete. The workshop lists deletions before syncing.
- Everything synced is a draft. The project owner decides what is released.

## Sync object

```ts
interface WorkshopSync {
  version: 1;
  stories?: SyncStory[];
  lore?: { [kind: string]: SyncLoreEntry[] }; // kind: one of the lore kinds below
}

interface SyncStory {
  slug: string;
  title: string;            // up to 160 characters
  summary?: string;         // one or two sentences, up to 1000
  fills?: string[];         // gaps of other stories this one explains: "<storySlug>/<gapSlug>"
  chapters?: SyncChapter[]; // in reading order
  gaps?: SyncGap[];         // what this story leaves unexplained for later stories
}

interface SyncChapter {
  slug: string;
  title: string;            // up to 160
  html?: string;            // the chapter text
  tags?: string[];          // lore entries in the chapter: "<kind>/<slug>"
}

interface SyncGap {
  slug: string;
  title: string;            // the open question, up to 160
  details?: string;         // up to 2000
  chapterSlug?: string;     // the chapter where it shows up
}

interface SyncLoreEntry {
  slug: string;
  name: string;             // up to 120
  role?: string;            // short role line; characters and troops only, up to 160
  summary?: string;         // one or two sentences, up to 1000
  html?: string;            // the full description
  storySlugs?: string[];    // stories it appears in
  related?: string[];       // other lore entries: "<kind>/<slug>"
  fields?: object;          // the kind's extra fields, see "Lore kinds"
}
```

Field value types: `text` is a string up to 300 characters; `select` is one of the listed
values; `ref` is `"<kind>/<slug>"` (or an array of them when it says "many"); `amounts` is an
array of `{ "ref": "<kind>/<slug>", "amount": number }`.

Example:

```json
{
  "version": 1,
  "stories": [
    {
      "slug": "the-knocking",
      "title": "The Knocking",
      "summary": "Years after the village was founded, someone finally goes down to answer the mountain.",
      "fills": [
        "village-from-stone/what-knocks"
      ],
      "chapters": [
        {
          "slug": "the-crack",
          "title": "The Crack",
          "html": "<p>The knocking grew louder the winter the old stonecutter died.</p>",
          "tags": [
            "characters/yaryna"
          ]
        }
      ],
      "gaps": [
        {
          "slug": "who-answered",
          "title": "Who answered from below?",
          "details": "Something knocked back. The story never says what.",
          "chapterSlug": "the-crack"
        }
      ]
    }
  ],
  "lore": {
    "creatures": [
      {
        "slug": "deep-listener",
        "name": "Deep Listener",
        "summary": "Something under the Grey Mountain that answers knocks.",
        "html": "<p>Nobody has seen it. Those who knock on the deepest stones hear it knock back.</p>",
        "storySlugs": [
          "the-knocking"
        ],
        "fields": {
          "habitat": [
            "locations/grey-mountain"
          ],
          "danger": "boss"
        }
      }
    ]
  }
}
```

## Released stories

### Village from Stone — `village-from-stone`

Before Temnorid had a name, a handful of people walked out of an endless night and found a mountain that listened. This is how the first village was built, and why its walls are never left without a name.

Chapters:

- `night-that-did-not-end`: The Night That Did Not End
- `grey-mountain`: The Grey Mountain
- `first-stone`: The First Stone
- `those-who-came-from-the-dark`: Those Who Came from the Dark
- `stone-remembers`: The Stone Remembers

Gaps:

- `village-from-stone/what-knocks`: What knocks inside the mountain? The knocking deep in the Grey Mountain never stopped. Yaryna said the mountain listens and will one day want an answer, but what is knocking is unknown.
- `village-from-stone/where-the-night-came-from`: Where did the endless night come from? Nobody remembered the last dawn. Why the long night came, and what happened to the world before it, the story does not explain.

## Open gaps

Questions released stories leave unanswered. A new story can explain one: add its
`"<storySlug>/<gapSlug>"` to the story's `fills`.

- `village-from-stone/what-knocks` (Village from Stone): What knocks inside the mountain? The knocking deep in the Grey Mountain never stopped. Yaryna said the mountain listens and will one day want an answer, but what is knocking is unknown.
- `village-from-stone/where-the-night-came-from` (Village from Stone): Where did the endless night come from? Nobody remembered the last dawn. Why the long night came, and what happened to the world before it, the story does not explain.

## Lore kinds

Each kind is a key under `lore` in the sync object. Links use `"<kind>/<slug>"`.

### `locations` — Locations (Локації)

Places of the world: regions, villages, cities, fortresses, ruins and dungeons.

Used in: Lords (Settlements that players grow and expand); Conquest (Territory to capture and defend); Dungeon (Ruins and dungeons for adventures); Website (The Locations section).

Has a `role` line: no.

| Field | Type | Values or links | Label |
|---|---|---|---|
| `locationType` | select | `region` Region, `village` Village, `town` Town, `city` City, `fortress` Fortress, `ruin` Ruins, `dungeon` Dungeon, `wilds` Wilds | Kind of place (Тип місця) |
| `faction` | ref | one: `factions` | Owned by (Кому належить) |

### `buildings` — Buildings (Будівлі)

Structures built in settlements: what they cost, what they produce and what they unlock.

Used in: Lords (Building and growing cities); Craft (Workshops where recipes are made); Website (The Buildings section).

Has a `role` line: no.

| Field | Type | Values or links | Label |
|---|---|---|---|
| `cost` | amounts | `resources` | Building cost (Вартість будівництва) |
| `produces` | amounts | `resources`, `items` | Produces (Що виробляє) |
| `unlocks` | ref | many: `recipes`, `soldiers` | Unlocks (Що відкриває) |

### `factions` — Factions (Фракції)

Kingdoms, houses and alliances fighting for power.

Used in: Lords (Owners of settlements and armies); Conquest (The sides in wars); Intrigue (Factions that players lead).

Has a `role` line: no.

| Field | Type | Values or links | Label |
|---|---|---|---|
| `leader` | ref | one: `characters` | Leader (Лідер) |
| `seat` | ref | one: `locations` | Seat (Осідок) |
| `allies` | ref | many: `factions` | Allies (Союзники) |
| `rivals` | ref | many: `factions` | Rivals (Суперники) |
| `goals` | text | free text | Goals (Цілі) |
| `emblem` | text | free text | Emblem (Герб) |
| `element` | select | `fire` Fire, `stone` Stone, `other` Other | Element (Стихія) |

### `events` — Events (Події)

Historical events: wars, sieges, treaties. Together they make the world's timeline.

Used in: Conquest (Past wars and what they left behind); Intrigue (Alliances and betrayals the factions remember); Stories (Background for plots).

Has a `role` line: no.

| Field | Type | Values or links | Label |
|---|---|---|---|
| `when` | text | free text | When (Коли) |
| `places` | ref | many: `locations` | Where (Де) |
| `factions` | ref | many: `factions` | Factions (Фракції) |
| `characters` | ref | many: `characters` | Characters (Персонажі) |
| `outcome` | text | free text | Outcome (Чим закінчилося) |

### `characters` — Characters (Персонажі)

People of the world: heroes, rulers, craftspeople.

Used in: Arena and Dungeons (Heroes you play as); Lords (Faction leaders and city rulers); Website (The Characters section).

Has a `role` line: yes.

| Field | Type | Values or links | Label |
|---|---|---|---|
| `faction` | ref | one: `factions` | Faction (Фракція) |
| `heroClass` | select | `warrior` Warrior, `mage` Mage, `archer` Archer, `rogue` Scout, `healer` Healer, `commander` Commander, `none` Not a hero | Hero class (Клас героя) |

### `soldiers` — Troops (Війська)

Kinds of troops: who they are, how they are armed and what training them costs.

Used in: Conquest (Armies for sieges and battles); Lords (Troops trained in cities); Website (The Troops section).

Has a `role` line: yes.

| Field | Type | Values or links | Label |
|---|---|---|---|
| `faction` | ref | one: `factions` | Faction (Фракція) |
| `equipment` | ref | many: `items` | Equipment (Спорядження) |
| `cost` | amounts | `resources` | Training cost (Вартість навчання) |

### `creatures` — Creatures (Істоти)

Beasts, monsters and bosses of the world.

Used in: Dungeon (Enemies and bosses); Arena (Opponents in the arena); Craft (Game to hunt).

Has a `role` line: no.

| Field | Type | Values or links | Label |
|---|---|---|---|
| `habitat` | ref | many: `locations` | Habitat (Де живе) |
| `danger` | select | `low` Low, `medium` Medium, `high` High, `deadly` Deadly, `boss` Boss | Danger (Небезпека) |
| `abilities` | text | free text | Abilities (Здібності) |
| `spells` | ref | many: `spells` | Spells (Закляття) |
| `drops` | amounts | `resources`, `items` | Drops (Що залишає) |

### `resources` — Resources (Ресурси)

Raw materials, food, valuables and magical substances.

Used in: Craft (What is mined and grown); Lords (What settlements live on); Conquest and Intrigue (Spoils and rewards).

Has a `role` line: no.

| Field | Type | Values or links | Label |
|---|---|---|---|
| `category` | select | `raw` Raw material, `food` Food, `precious` Valuables, `magical` Magical | Category (Категорія) |
| `rarity` | select | `common` Common, `uncommon` Uncommon, `rare` Rare, `legendary` Legendary | Rarity (Рідкісність) |
| `foundIn` | ref | many: `locations` | Where to find (Де знайти) |

### `items` — Items (Предмети)

Tools, weapons, armour, consumables and artefacts.

Used in: Craft (What is made); Dungeon (Gear and artefacts found on the way); Arena (Heroes' weapons and armour).

Has a `role` line: no.

| Field | Type | Values or links | Label |
|---|---|---|---|
| `itemType` | select | `tool` Tool, `weapon` Weapon, `armour` Armour, `consumable` Consumable, `artefact` Artefact | Type (Вид) |
| `rarity` | select | `common` Common, `uncommon` Uncommon, `rare` Rare, `legendary` Legendary | Rarity (Рідкісність) |
| `element` | select | `fire` Fire, `stone` Stone, `other` Other | Element (Стихія) |
| `effect` | text | free text | Effect (Дія) |
| `foundIn` | ref | many: `locations`, `creatures` | Where to find (Де знайти) |

### `recipes` — Recipes (Рецепти)

How to turn resources and items into a new item.

Used in: Craft (Production); Lords (Buildings unlock new recipes).

Has a `role` line: no.

| Field | Type | Values or links | Label |
|---|---|---|---|
| `ingredients` | amounts | `resources`, `items` | Ingredients (Інгредієнти) |
| `result` | amounts | `items` | Result (Результат) |
| `building` | ref | one: `buildings` | Made at (Де виготовляють) |

### `spells` — Spells (Закляття)

Spells of elemental magic: effect, cost and cooldown.

Used in: Arena (Duels between mages); Dungeon (Fights with monsters); Conquest (Battle mages in war).

Has a `role` line: no.

| Field | Type | Values or links | Label |
|---|---|---|---|
| `element` | select | `fire` Fire, `stone` Stone, `other` Other | Element (Стихія) |
| `effect` | text | free text | Effect (Дія) |
| `cost` | text | free text | Cost (Вартість) |
| `cooldown` | text | free text | Cooldown (Перезарядка) |

### `quests` — Quests (Завдання)

Tasks for heroes: who gives them, what to do and the reward.

Used in: Dungeon (Adventures); Lords (Tasks from rulers).

Has a `role` line: no.

| Field | Type | Values or links | Label |
|---|---|---|---|
| `giver` | ref | one: `characters` | Given by (Хто дає) |
| `goal` | text | free text | Goal (Мета) |
| `locations` | ref | many: `locations` | Where (Де) |
| `reward` | amounts | `resources`, `items` | Reward (Нагорода) |

### `cards` — Cards (Карти)

Cards for the board and online strategy game.

Used in: Intrigue (A player's deck).

Has a `role` line: no.

| Field | Type | Values or links | Label |
|---|---|---|---|
| `cardType` | select | `action` Effect, `unit` Unit, `event` Event, `intrigue` Intrigue, `resource` Resource | Card type (Тип карти) |
| `effect` | text | free text | Effect (Дія) |
| `cost` | text | free text | Cost (Вартість) |

## Released lore

Use these slugs in links. Do not create entries with the same slugs.

### `locations`

- `locations/grey-mountain` — **The Grey Mountain**, Mountain. A warm mountain without trees or snow that rose out of the dark. Something deep inside it knocks, slowly. (related: `locations/village-from-stone`, `buildings/first-house`, `characters/danylo`)
- `locations/village-from-stone` — **The Village from Stone**, First village. The first village of Temnorid, carved on the shoulder of the Grey Mountain. Every one of its walls holds a name. (related: `locations/grey-mountain`, `buildings/first-house`, `buildings/named-houses`, `characters/olena`)
- `locations/salt-flats` — **The Salt Flats**, Wasteland. The dead plain the walkers crossed before the Grey Mountain. The light first came back over it. (related: `locations/burned-forest`, `locations/grey-mountain`)
- `locations/second-river` — **The Second River**, River. A river on the long road that took the walkers' cart and one of their people. (related: `locations/burned-forest`)
- `locations/burned-forest` — **The Burned Forest**, Forest. A dead forest on the road through the long night. Yaryna's mother died between it and the salt flats. (related: `locations/salt-flats`, `characters/yaryna`)

### `buildings`

- `buildings/first-house` — **The First House**, House. The village's first house, low on the slope. Its first stone carries the name of Yaryna's mother. (related: `characters/danylo`, `characters/yaryna`, `locations/grey-mountain`)
- `buildings/named-houses` — **The Named Houses**, Dwellings. The stone houses of the Village from Stone. Every wall holds a name, which is why they stay warm without fire. (related: `locations/village-from-stone`, `characters/danylo`, `characters/yaryna`)

### `factions`

- `factions/village-of-names` — **Village of Names**. The people of the Village from Stone, who give every wall a name. (fields: `{"leader":"characters/olena","seat":"locations/village-from-stone","allies":["factions/ember-keepers"],"goals":"Зберегти кожну стіну названою, а гору теплою.","emblem":"Сірий камінь із вирізаним ім’ям на грубій вовні.","element":"stone"}`; related: `characters/olena`, `locations/village-from-stone`)
- `factions/ember-keepers` — **Ember Keepers**. Those who carried fire through the long night in clay pots. (fields: `{"seat":"locations/village-from-stone","allies":["factions/village-of-names"],"goals":"Щоб у селі ніколи не згас вогонь.","emblem":"Глиняний горщик із червоним жаром.","element":"fire"}`; related: `items/ember-pot`)

### `events`

- `events/long-night` — **The Long Night**. The road of forty-one people through the dark to the Grey Mountain. (fields: `{"when":"До заснування села","places":["locations/burned-forest","locations/salt-flats","locations/second-river"],"characters":["characters/yaryna","characters/danylo","characters/olena"],"factions":["factions/ember-keepers"],"outcome":"Мандрівники дійшли до Сірої гори."}`; related: `locations/grey-mountain`)
- `events/first-stone` — **The First Stone**. The day a stone first grew warm from a name. (fields: `{"when":"Перший рік села","places":["locations/village-from-stone"],"characters":["characters/yaryna","characters/danylo"],"factions":["factions/village-of-names"],"outcome":"Звели першу хату."}`; related: `buildings/first-house`)

### `characters`

- `characters/yaryna` — **Yaryna**, The stonecutter's granddaughter. The girl who carried her grandfather's tools through the long night and was the first to speak a name over a stone. (related: `characters/danylo`, `characters/olena`, `buildings/first-house`, `locations/grey-mountain`)
- `characters/danylo` — **Danylo**, Stonecutter. A stonecutter from a town that no longer exists. He was the first to hear the mountain and cut the village's first stone. (related: `characters/yaryna`, `buildings/first-house`, `buildings/named-houses`)
- `characters/olena` — **Olena**, Headwoman. Headwoman of the walkers. She chose to stay at the mountain and gave the people the name Temnorid. (related: `characters/yaryna`, `locations/village-from-stone`)

### `soldiers`

- `soldiers/stone-guard` — **Stone Guard**, Village defenders. Those who watch over the Village from Stone while it sleeps. (fields: `{"faction":"factions/village-of-names","equipment":["items/stonecutters-chisel"],"cost":[{"ref":"resources/warm-stone","amount":1}]}`; related: `locations/village-from-stone`, `buildings/first-house`)

### `creatures`

- `creatures/ash-wolf` — **Ash wolf**. Grey wolves that hunt among the burned trees. (fields: `{"habitat":["locations/burned-forest"],"danger":"medium","abilities":"Полюють зграєю, ховаються в попелі."}`; related: `locations/burned-forest`)

### `resources`

- `resources/warm-stone` — **Warm stone**. Stone of the Grey Mountain that grows warm once it is given a name. (fields: `{"category":"magical","rarity":"uncommon","foundIn":["locations/grey-mountain"]}`; related: `locations/grey-mountain`)
- `resources/clay` — **Clay**. River clay for pots and ovens. (fields: `{"category":"raw","rarity":"common","foundIn":["locations/second-river"]}`; related: `locations/second-river`)

### `items`

- `items/stonecutters-chisel` — **Stonecutter’s chisel**. Her grandfather’s chisel, which Yaryna used to cut the first names. (fields: `{"itemType":"tool","rarity":"rare","element":"stone","effect":"Вирізає в камені ім’я, і камінь теплішає.","foundIn":["locations/village-from-stone"]}`; related: `characters/yaryna`, `characters/danylo`)
- `items/ember-pot` — **Ember pot**. A clay pot in which the embers survived the long night. (fields: `{"itemType":"tool","rarity":"uncommon","element":"fire","effect":"Зберігає жар живим у довгій дорозі."}`; related: `factions/ember-keepers`)

### `recipes`

- `recipes/ember-pot` — **Ember pot**. How to make a pot that will carry an ember. (fields: `{"ingredients":[{"ref":"resources/clay","amount":2}],"result":[{"ref":"items/ember-pot","amount":1}],"building":"buildings/first-house"}`; related: `items/ember-pot`)

### `spells`

- `spells/warm-wall` — **Warm wall**. Wakes the warmth in a named wall. (fields: `{"element":"stone","effect":"Стіна гріє до ранку.","cost":"10 мани","cooldown":"1 хвилина"}`; related: `resources/warm-stone`)
- `spells/ember-breath` — **Ember breath**. Brings a dying ember back to flame. (fields: `{"element":"fire","effect":"Жар знову спалахує.","cost":"5 мани","cooldown":"10 секунд"}`; related: `factions/ember-keepers`)

### `quests`

- `quests/name-the-stone` — **Name the stone**. Bring a stone from the Grey Mountain and give it a name. (fields: `{"giver":"characters/yaryna","goal":"Покласти в стіну названий камінь.","locations":["locations/grey-mountain","locations/village-from-stone"],"reward":[{"ref":"resources/warm-stone","amount":1}]}`; related: `characters/yaryna`, `resources/warm-stone`)

### `cards`

- `cards/named-wall` — **Named wall**. Protects a settlement from the cold for one turn. (fields: `{"cardType":"action","effect":"Поселення не мерзне один хід.","cost":"1 теплий камінь"}`; related: `spells/warm-wall`)
- `cards/ember-keepers` — **Ember Keepers**. Bring fire to a settlement that has none. (fields: `{"cardType":"unit","effect":"Поселення отримує вогонь.","cost":"1 їжа"}`; related: `factions/ember-keepers`)
