# Temnorid

Site for [temnorid.com](https://temnorid.com).

Temnorid is a dark medieval fantasy world inspired by the 14th century (1300–1400), where kingdoms, armies, and powerful wizards compete for territory and influence.

Stone fortresses, fortified cities, ancient ruins, and dangerous wilderness shape a world of constant conflict. Soldiers fight with swords, shields, bows, and siege weapons, while wizards command powerful elemental magic.

The first chapter introduces two forces: Fire, representing destruction and raw power, and Stone, representing endurance, protection, and strength.

In Temnorid, battles are won through steel, magic, and strategy—and every victory shapes the world's future.

SEO defaults and page overrides live in `src/data/company/company.json`. Every public route has a distinct generated landscape illustration under `src/assets/seo/` for Open Graph and Twitter previews. The Fire and Stone brand assets are `src/assets/logo.png` (1024 × 1024) and `src/assets/favicon.png` (64 × 64). Full built-in image generation prompts and the page-to-image manifest are in `tools/seo/image-prompts.json`; open `output/seo-review/index.html` to review the images locally. Public pages are prerendered with page-specific titles and descriptions; sign-in and workshop pages remain `noindex, nofollow`. The production build validates every generated page automatically. Run `npm run seo:check` to repeat the check against an existing build. This also checks page image mappings, distinct file contents, landscape dimensions and the 5 MB sharing-image limit.

## Workshop and releases

Anyone signed in with Google can write in the workshop (`/write`): stories with chapters and gaps,
and world entries of every kind. Everything in Firestore is a **draft**, whoever wrote it.
**Released** means "in the code": only the project owner decides what is released, by adding its JSON
to `src/data/`. The workshop shows released entries read-only, and a draft whose slug is released is
hidden because the code replaced it.

- **Owners.** Create the Firestore document `admins/<uid>` in the Firebase console (the uid is under
  Authentication → Users). Owners see "Огляд чернеток" (`/write/review`): every draft, a decision
  (new, considering, chosen, released, declined) with a note authors see in their lists, and
  "JSON для коду" with the entry in released format.
- **Gaps.** A story can list gaps: what it leaves unexplained on purpose. Another story fills a gap by
  ticking it on its own page. `/write/gaps` lists every open gap.
- **Sync and AI chats.** The sync icon next to "Workshop" opens an ace JSON editor with all of the
  author's drafts as one sync object; edited or pasted JSON is checked, then upserted by slug, and
  drafts missing from it are deleted after the author confirms the list. The build writes
  `/workshop.md` (`tools/workshop/generate-workshop-md.mjs`): released stories, open gaps, released
  lore, every kind's fields and the sync object format, so any AI chat can write a sync object. The
  info icon next to sync shows that file. Kinds, fields, groups, statuses and info texts live in
  `src/data/workshop/` for both the app and that guide.
- **Player names.** `src/data/names/names.json` holds `firstNames` (also split into `firstNamesMale` and `firstNamesFemale`) and `secondNames` from Kyivan Rus'
  and the Cossack era. The build writes `/names.json` (`tools/names/generate-names-json.mjs`) with
  those plus `existingNames`, the released characters, so the games (Lords onboarding) can generate
  a player name, reroll unlocked parts and skip names already taken.
- **Rules.** `firestore.rules` is shared with `arena.temnorid.com` (one Firebase project); keep both
  copies identical and deploy with `npm run rules`.

## Adding a story

1. Create `src/data/stories/<slug>.json`, or copy the JSON from the review page. It has `slug`,
   `number`, `readingMinutes`, `publishedAt`, `content.ua` / `content.en` (`title`, `summary`),
   `chapters[]` (`slug`, `order`, optional `tags`, `content.ua` / `content.en` with `title` and
   `html`), optional `gaps[]` and optional `fills[]` (`<story>/<gap>`). Translate `en` after pasting.
2. Import it in `src/app/feature/story/story.data.ts` and add it to `STORIES`.

The routes `/stories/<slug>` and `/stories/<slug>/<chapter>`, their SEO meta and the sitemap entries
are generated from that data. Each new public page also needs a share image in `src/data/company/
company.json` and `src/assets/seo/`. The site has two languages: Ukrainian (default) and English.

## Adding world entries

Add an object to the matching array in `src/data/lore/<kind>.json` with `slug`, `storySlugs`,
`related` (links like `locations/grey-mountain`), optional `fields` (the kind's workshop fields) and
`content.ua` / `content.en` (`name`, `role`, `summary`, `paragraphs[]`). Characters, locations, troops
(`soldiers`) and buildings get a public page `/<kind>/<slug>`; the other kinds (factions, resources,
items, recipes, spells, creatures, quests, events, cards) are released for the games and the
workshop only.

## Models plan

`/models` ("План моделей", `noindex`) lists the 3D models of the ten Unity games
(`craft`, `dungeons`, `conquest`, `hippodrome`, `caravan`, `arena`, `legends`, `master`, `escape`, `detective`). The games first ship with
simple primitive models; this page is the list to replace them later with generated, proper ones.

- **Data.** `src/data/models/models.json`: `families[]` and `models[]`. A model has a stable `id`
  (also the asset id the games load it by, e.g. `track/rail`), `family`, `status`
  (`done`, `placeholder` = primitive in the game now, `planned` = not built yet), `kind`, `name`,
  `uses[]` (`game`, `count` instances in one scene or run, `null` when not decided, optional
  `note`), optional `size`, `triangles`, `note`, and `brief`, the description to generate it from.
  Every text is `{ ua, en }`.
- **Page.** Models are sorted by total instances, then by number of games. The default filter
  "To replace" hides finished models; "Copy brief" copies the brief with the shared requirements
  (low-poly dark medieval fantasy, one mesh, Y up, 1 unit = 1 m, pivot at the base centre, GLB with
  PBR, textures up to 1024 px, T-pose humanoid rig scaled like the mage).
- **Replacing a model.** Generate it from its brief, keep the `id` and the size, put the GLB where
  the game keeps its models, then set `status` to `done` here. Arena's finished models and their
  Blender sources are in `arena.temnorid.com/Assets/Models` and `output/`.
- **Code.** `src/app/feature/models/` (interface, data, service) and
  `src/app/pages/models/models.component.ts`; route `models` in `app.routes.ts`.

## Games

The Unity games are separate projects next to this one (`D:\work\temnorid\<name>.temnorid.com`), each with its own
site (`docs/index.html`, `docs/CNAME`), README, Windows build and installer. This site lists them under `/games` and
`/game/<slug>` from `src/data/games/games.json`.

| Slug | Game | Project |
|---|---|---|
| `lords` | Lords (the connected world game, built separately) | `lords.temnorid.com` |
| `craft`, `dungeons`, `conquest`, `arena` (released), `hippodrome`, `caravan`, `legends` | the first seven games | `<slug>.temnorid.com` (`caravan` is `caravan-guard.temnorid.com`) |
| `master` | **Master**: seven trades in one workshop (stable, scribe, forge, workshop, kitchen, tailor, herbalist), offline | `master.temnorid.com` |
| `escape`, `detective` | short fixed-camera episodes | `<slug>.temnorid.com` |
| `intrigue` | listed on the site (status `released`); no Unity project next to this one | none here |

**Pets and Scribe are retired.** Master replaces both (the foal, its care and its two trainings are Master's Stable; the Academy
desk is Master's Scribe), so they are no longer in `games.json`, `/models` or the SEO images. Their project folders are left as
they were; nothing is deleted or changed there.

- **Adding or changing a game.** Edit its entry in `src/data/games/games.json` (`slug`, `status`, `seo`, `content.ua|en`), give
  its route a share image in `src/data/company/company.json` (`/game/<slug>`) and an entry in `tools/seo/image-prompts.json`
  (generate the image from the prompt into `src/assets/seo/game-<slug>.png`), list its models in `src/data/models/models.json`
  (see "Models plan") and add the slug to `GameKey` and `GAME_KEYS` in `src/app/feature/models/` and to the two name tables in
  `src/app/pages/models/models.component.ts`. `npm run build` checks that every public page has its own image.
- **Placeholder image.** `game-master.png` is a copy of the old Scribe illustration until a real one is generated from its prompt.
- **No download link is made up.** A game's page says "Coming soon" until a GitHub Release exists.

### Shared game packages

All games reference these by their GitHub URL in `Packages/manifest.json` (`https://github.com/IT-Kamianets/<package>.git`). Code two games both need lives
here, not in a game.

| Package | What it holds |
|---|---|
| `3d-unity-core`, `3d-unity-input` | startup and services; the only input entry point (`EngineInput`) |
| `3d-unity-ui` | `UiBuilder` (panels, labels, bars, buttons, event system), `UiShapes` (circle sprite, screen rectangle, quit), `LineDrawer` |
| `3d-unity-graybox` | asset ids, scene-builder helpers, world text with a depth-tested shader |
| `3d-unity-save` | atomic JSON save slots, corrupt saves set aside, optional backup of the previous save |
| `3d-unity-synth` | generated sounds: `Tone` (clip builder) and `SoundBoard` (volumes, ambience, one-shots) |
| `3d-unity-feedback`, `3d-unity-combat` | flashes, rings, health bars; combat basics |
| `3d-unity-shell` | the structure every game follows, after the Lords app: Boot (splash, update), Menu (landing, onboarding, lobby, profile), in-game top and bottom bars; Android and iOS settings |
| `3d-unity-net` | multiplayer over Netcode for GameObjects: host or join by address or Relay code, roster, events, poses, host-published entities |
| `3d-unity-update` | self-update from the newest GitHub release (silent installer on Windows) |
| `3d-unity-fixed-camera`, `3d-unity-topdown-camera`, `3d-unity-character`, `3d-unity-inventory`, `3d-unity-ai` | cameras and character, inventory and AI for the games that need them |

---

# Angular Landing Template (SSR + Prerender)

Modern Angular 22 starter template for building fast landing pages with **SSR prerendering**, **TailwindCSS**, and **GitHub Pages deployment**.

This template is optimized for static landing sites where pages are rendered at **build time** for SEO and performance.

---

# Acknowledge

- Angular **22**
- **SSR prerendering** during build
- **Zoneless Angular**
- State used in HTML class bindings should be exposed as **signals**
- Prefer **Angular Signal Forms** as the primary forms approach when building new forms
- **OnPush change detection through Angular 22 defaults**
- **TailwindCSS v4**
- Use shared **theme CSS variables** from `src/styles/_theme.scss` for colors, surfaces, spacing, radius, and motion
- **GitHub Pages deployment**
- **Prettier formatting**
- Clean minimal project structure

The project builds both:

```
dist/app/browser
dist/app/server
```

But deployment uses the **browser prerendered output**, making it perfect for static hosting.

---

# Project Structure

```
src/
  app/
    app.component.ts
    app.config.ts
    app.config.server.ts
    app.routes.ts
    app.routes.server.ts
    layouts/
    pages/
  assets/
  environments/
  i18n/
  styles/
  styles.scss
```

SSR configuration lives in:

```
app.config.server.ts
app.routes.server.ts
```

---

# Development

Start the development server:

```
npm start
```

or

```
ng serve
```

Application runs at [http://localhost:4200](http://localhost:4200)

Development mode runs as a normal Angular SPA.

---

# Build

Build the project:

```
npm run build
```

This generates:

```
dist/app/browser
dist/app/server
```

Pages are **prerendered at build time** using Angular SSR.

---

# Running the SSR server (optional)

After `npm run build`, the generated SSR server can be run manually:

```
node dist/app/server/server.mjs
```

For most landing pages this is **not required**, because prerendered HTML is already generated.

---

# Prerender configuration

All routes are prerendered by default:

```
src/app/app.routes.server.ts
```

```
RenderMode.Prerender
```

```ts
export const serverRoutes: ServerRoute[] = [
	{
		path: '**',
		renderMode: RenderMode.Prerender,
	},
];
```

This makes Angular generate static HTML for every route during build.

---

# Bootstrap Data

The app includes a small bootstrap data flow for company profile data.

Main files:

```text
src/app/app.config.ts
src/app/feature/bootstrap/bootstrap.service.ts
src/app/feature/bootstrap/bootstrap.interface.ts
src/app/feature/company/company.data.ts
src/app/feature/company/company.service.ts
src/data/company/company.json
src/environments/environment.prod.ts
```

How it works:

- `APP_INITIALIZER` runs `BootstrapService.initialize()` during app startup
- on the server, bootstrap data is fetched from `${environment.apiUrl}/api/regionit/bootstrap/${environment.companyId}`
- fetched data is stored in Angular `TransferState`
- on the browser, transferred data is applied immediately and then refreshed in the background
- if no remote data is available, the app falls back to `src/data/company/company.json`
- local company data is normalized into a `CompanyProfile` with SEO defaults, contact fields, structured data, and page SEO overrides

Bootstrap payload shape:

```ts
export interface BootstrapData {
	company?: Partial<Company> | null;
}
```

Environment keys involved:

- `apiUrl` - API host used for bootstrap requests
- `companyId` - company identifier sent to the bootstrap endpoint

Current fallback behavior in code:

- when the API is unavailable, the app keeps rendering with local fallback company data
- when the API returns a partial company object, it updates identity fields without discarding local SEO/contact defaults

This keeps SSR and prerender safe while still allowing the app to hydrate with API data when it exists.

For future component or page-level async reads, prefer signal-based resources. Use `ngxResource()`
from `@wawjs/ngx-core` for persisted or generic async reads, especially when `StoreService` caching
is useful. Keep bootstrap initialization, migrations, and startup fallback flows as direct
imperative async code when a resource state object would make the flow less clear.

For theme preferences, keep mode, density, radius, and persistence centralized in `ThemeService`
from `@wawjs/ngx-ui`. Do not add duplicate `localStorage` or document attribute logic for theme
state in app components.

---

# TailwindCSS

Tailwind is configured via:

```
.postcssrc.json
```

Tailwind should be used as much as possible for everyday UI work.

Prefer Tailwind utilities for:

- layout
- spacing
- typography
- colors
- borders
- sizing
- responsive behavior

Use SCSS only when Tailwind is not the right tool, for example:

- component-specific complex styling
- shared design tokens and mixins
- advanced states or selectors
- small amounts of global styling

Global styles live in:

```
src/styles.scss
```

---

# Icons

This template includes **Material Symbols Outlined** and those should be used as the default icon set across the project.

Loaded in:

```
src/index.html
```

Use icons directly in HTML like this:

```html
<span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
```

For accessible buttons, keep the icon decorative and provide a text label or `aria-label` on the button itself:

```html
<button type="button" aria-label="Open menu">
	<span class="material-symbols-outlined" aria-hidden="true">menu</span>
</button>
```

---

# Translations And Languages

UI translations live in:

```text
src/i18n/<code>.json
```

Language metadata lives in:

```text
src/environments/environment.prod.ts
```

Translation bootstrap starts in:

```text
src/app/app.config.ts
```

The app uses the `@wawjs/ngx-translate` translation stack:

- `provideTranslate(...)` registers the default interface bundle from `/i18n/`
- `TranslateDirective` and `TranslateService` are the default translation primitives
- Ukrainian is the default language and root source text
- `src/i18n/ua.json` is the root source array; every other language file is an array in the same order

When adding or updating translations:

- add or update the matching `src/i18n/<code>.json` array
- update `environment.languages` when adding or renaming a supported language
- keep Ukrainian source text identical across templates, components, and `src/i18n/ua.json`
- keep every translated language array aligned by index with `src/i18n/ua.json`
- store translation text and language labels as real UTF-8 characters, not escaped or re-encoded mojibake
- remove unused source strings from every language array when they are no longer referenced anywhere in the app

Supported usage patterns:

- Use the `translate` directive for plain element text content
- Use `TranslateDirective` for text and translated attributes
- Use `[translate]="{ placeholder: 'Default source text' }"` for directive-managed translated attributes
- Use `TranslateService.translate('Default source text')()` in TypeScript when the translated value is needed inside `computed()` or composed strings
- Do not use `TranslatePipe`; it is not available in the current `@wawjs/ngx-translate` package

Examples:

```html
<span translate>Default source text</span>
<button translate [translate]="{ ariaLabel: 'Default aria label' }" type="button"></button>
```

```ts
private readonly _translateService = inject(TranslateService);

protected readonly toggleLabel = computed(() =>
	this._translateService.translate('Default source text')(),
);
```

---

# SCSS Conventions

Use SCSS in a way that matches modern Angular defaults:

- Keep most styles inside the component `.scss` file.
- Use `src/styles.scss` only for truly global styles like resets, tokens, typography, and utility layers.
- Prefer CSS variables for colors, spacing, and theming that may change at runtime.
- Use SCSS features like `@use`, mixins, and partials for authoring convenience and shared design tokens.
- Avoid deep selector nesting. Keep selectors simple and local to the component.
- Avoid `::ng-deep` and `ViewEncapsulation.None` unless there is a clear integration reason.
- Prefer class bindings in templates over heavy inline style bindings.

Recommended split:

```text
src/styles.scss           -> global entry point
src/app/**/**/*.scss      -> component-local styles
src/styles/_theme.scss    -> shared theme CSS variables
```

---

# Environments

This template includes Angular environment files and they can be used for different runtime setups such as local development and production builds.

Available files:

```text
src/environments/environment.ts
src/environments/environment.prod.ts
```

Typical use cases:

- API base URLs
- feature flags
- analytics toggles
- external service configuration

Production builds replace `environment.ts` with `environment.prod.ts` through Angular file replacements.

Keep environment files limited to public front-end configuration. Do not store secrets in them.

---

# Deployment

Deployment is handled automatically via **GitHub Actions**.

Workflow:

```
.github/workflows/deploy.yml
```

Steps:

1. Install dependencies
2. Build Angular app
3. Copy `CNAME`
4. Push build output to `gh-pages`

The deployed folder is:

```
dist/app/browser
```

---

# Domain

Custom domain which you should adjust to your own domain so it works properly, any subdomain of `*.itkamianets.com` in case it's not used before on our github org.

```
ngx.itkamianets.com
```

Configured via:

```
CNAME
```

---

# Code Style

Formatting is handled by:

- `.editorconfig`
- `.prettierrc`

Key conventions:

- **tabs**
- **single quotes**
- **100 character line width**

---

# AI Usage

If you use AI outside the IDE and it does not automatically read repository instructions, copy the
contents of `AGENTS.md` into the AI prompt/context first.

This ensures the AI follows the same project-specific rules that Codex uses inside the IDE.

---

# MCP Servers For Codex, Copilot, And Gemini

This project uses these MCP servers:

```toml
[mcp_servers.angular-cli]
command = "npx"
args = ["-y", "@angular/cli", "mcp"]

[mcp_servers.context7]
command = "npx"
args = ["-y", "@upstash/context7-mcp"]

[mcp_servers.typescript-lsp]
command = "npx"
args = ["-y", "ts-lsp-mcp", "serve", "--stdio"]
```

Use the following setup depending on the client.

## Codex

Codex supports both user-level config and repo-level config through TOML files:

- global: `~/.codex/config.toml`
- project-local: `.codex/config.toml`

Codex CLI and the Codex IDE extension share the same MCP configuration.

### Codex global config

Add this to `~/.codex/config.toml`:

```toml
[mcp_servers.angular-cli]
command = "npx"
args = ["-y", "@angular/cli", "mcp"]

[mcp_servers.context7]
command = "npx"
args = ["-y", "@upstash/context7-mcp"]

[mcp_servers.typescript-lsp]
command = "npx"
args = ["-y", "ts-lsp-mcp", "serve", "--stdio"]
```

### Codex project-local config

Create `.codex/config.toml` in the repository root and add the same block:

```toml
[mcp_servers.angular-cli]
command = "npx"
args = ["-y", "@angular/cli", "mcp"]

[mcp_servers.context7]
command = "npx"
args = ["-y", "@upstash/context7-mcp"]

[mcp_servers.typescript-lsp]
command = "npx"
args = ["-y", "ts-lsp-mcp", "serve", "--stdio"]
```

If Codex does not load project-local MCP config, mark the repo as trusted in your user config:

```toml
[projects.'\\?\C:\Users\YOUR_USER\work\itkp.ngx-default']
trust_level = "trusted"
```

### Codex CLI commands

You can add the same servers with the CLI instead of editing TOML manually:

```bash
codex mcp add angular-cli -- npx -y @angular/cli mcp
codex mcp add context7 -- npx -y @upstash/context7-mcp
codex mcp add typescript-lsp -- npx -y ts-lsp-mcp serve --stdio
```

Useful checks:

```bash
codex mcp --help
codex mcp list
```

## GitHub Copilot

For GitHub Copilot in VS Code, MCP servers are configured with `mcp.json`:

- global: your VS Code user MCP config
- project-local: `.vscode/mcp.json`

The project-local file is the easiest way to share MCP setup with everyone working in the repo.

### Copilot project-local config

Create `.vscode/mcp.json`:

```json
{
	"servers": {
		"angular-cli": {
			"command": "npx",
			"args": ["-y", "@angular/cli", "mcp"]
		},
		"context7": {
			"command": "npx",
			"args": ["-y", "@upstash/context7-mcp"]
		},
		"typescript-lsp": {
			"command": "npx",
			"args": ["-y", "ts-lsp-mcp", "serve", "--stdio"]
		}
	}
}
```

### Copilot global config

Open the Command Palette in VS Code and run:

```text
MCP: Open User Configuration
```

Then add the same JSON shown above.

You can also use:

```text
MCP: Add Server
```

and choose either `Workspace` or `Global`.

### Copilot notes

- On Windows, these MCP servers run as local processes through `npx`.
- After saving `mcp.json`, use `MCP: List Servers` to verify they started.
- If your team uses Copilot CLI separately, its MCP config is different and lives in `~/.copilot/mcp-config.json`.

## Gemini CLI

Gemini CLI supports both user and project scope through `settings.json`:

- global: `~/.gemini/settings.json`
- project-local: `.gemini/settings.json`

### Gemini global config

Add this to `~/.gemini/settings.json`:

```json
{
	"mcpServers": {
		"angular-cli": {
			"command": "npx",
			"args": ["-y", "@angular/cli", "mcp"]
		},
		"context7": {
			"command": "npx",
			"args": ["-y", "@upstash/context7-mcp"]
		},
		"typescript-lsp": {
			"command": "npx",
			"args": ["-y", "ts-lsp-mcp", "serve", "--stdio"]
		}
	}
}
```

### Gemini project-local config

Create `.gemini/settings.json` in the repo root and add the same JSON:

```json
{
	"mcpServers": {
		"angular-cli": {
			"command": "npx",
			"args": ["-y", "@angular/cli", "mcp"]
		},
		"context7": {
			"command": "npx",
			"args": ["-y", "@upstash/context7-mcp"]
		},
		"typescript-lsp": {
			"command": "npx",
			"args": ["-y", "ts-lsp-mcp", "serve", "--stdio"]
		}
	}
}
```

### Gemini CLI commands

Gemini CLI can write either scope directly:

```bash
gemini mcp add -s user angular-cli npx -y @angular/cli mcp
gemini mcp add -s user context7 npx -y @upstash/context7-mcp
gemini mcp add -s user typescript-lsp npx -y ts-lsp-mcp serve --stdio
```

```bash
gemini mcp add -s project angular-cli npx -y @angular/cli mcp
gemini mcp add -s project context7 npx -y @upstash/context7-mcp
gemini mcp add -s project typescript-lsp npx -y ts-lsp-mcp serve --stdio
```

Useful checks:

```bash
gemini mcp list
```

## Recommendation

For this repository:

- use `.codex/config.toml` if your team uses Codex
- use `.vscode/mcp.json` if your team uses Copilot in VS Code
- use `.gemini/settings.json` if your team uses Gemini CLI

Use global config only when you want the same MCP servers in every project.

## References

- Codex config basics: <https://developers.openai.com/codex/config-basic>
- Codex MCP docs: <https://developers.openai.com/codex/mcp>
- VS Code MCP setup: <https://code.visualstudio.com/docs/copilot/customization/mcp-servers>
- GitHub Copilot MCP overview: <https://docs.github.com/copilot/concepts/context/mcp>
- Gemini CLI MCP docs: <https://google-gemini.github.io/gemini-cli/docs/tools/mcp-server.html>

---

# NPM Scripts

Start development:

```
npm start
```

Build project:

```
npm run build
```

# Requirements

Recommended environment:

```
Node.js 20+
npm 11+
```

---

# Code structure guide

## Pages

Application pages should be created inside:

```text
src/app/pages/
```

Each page should have its own folder and its own component file.

Example:

```text
src/app/pages/home/home.component.ts
src/app/pages/about/about.component.ts
```

Generate a page component with Angular CLI:

```bash
ng generate component pages/home
```

or shorter:

```bash
ng g c pages/home
```

Pages should be lazy loaded from `src/app/app.routes.ts`.

Example route config:

```ts
import { Routes } from '@angular/router';

export const routes: Routes = [
	{
		path: '',
		loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
	},
	{
		path: 'about',
		loadComponent: () => import('./pages/about/about.component').then((m) => m.AboutComponent),
	},
];
```

---

## Feature structure for back-end connected modules

If a part of the app needs its own business logic and back-end integration, create a dedicated feature folder inside:

```text
src/app/feature/
```

Each feature should keep its own internal structure.

Example:

```text
src/app/feature/user/
src/app/feature/user/components/
src/app/feature/user/directives/
src/app/feature/user/interfaces/
src/app/feature/user/pages/
src/app/feature/user/pipes/
src/app/feature/user/services/
```

Example service location:

```text
src/app/feature/user/services/user.service.ts
```

Suggested CLI commands:

Create feature page:

```bash
ng g c feature/user/pages/user-profile
```

Create feature component:

```bash
ng g c feature/user/components/user-card
```

Create feature directive:

```bash
ng g d feature/user/directives/user-focus
```

Create feature pipe:

```bash
ng g p feature/user/pipes/user-name
```

Create feature service:

```bash
ng g s feature/user/services/user
```

Interfaces are usually created manually:

```text
src/app/feature/user/interfaces/user.interface.ts
src/app/feature/user/interfaces/user-response.interface.ts
```

For small focused features, colocated files like `feature/language/language.type.ts`,
`language.interface.ts`, `language.const.ts`, and `language.service.ts` are also valid when that
structure keeps the feature simpler.

---

## Generic shared code

Generic reusable code that is not tied to one specific feature can live directly under `src/app`.

Example shared folders:

```text
src/app/components/
src/app/directives/
src/app/interfaces/
src/app/pipes/
src/app/services/
```

Example shared pipe location:

```text
src/app/pipes/phone.pipe.ts
```

Suggested CLI commands:

Create shared component:

```bash
ng g c components/page-header
```

Create shared directive:

```bash
ng g d directives/autofocus
```

Create shared pipe:

```bash
ng g p pipes/phone
```

Create shared service:

```bash
ng g s services/api
```

Interfaces are usually created manually:

```text
src/app/interfaces/api-response.interface.ts
src/app/interfaces/select-option.interface.ts
```

---

## Development summary

Use these locations by default:

- `src/app/pages` - app-level lazy loaded pages
- `src/app/feature/<name>` - feature-specific code with back-end/business logic
- `src/app/components`, `directives`, `pipes`, `services`, `interfaces` - generic shared code

# Create a new project from this template

Clone the default repository into a new folder with your project name (replace `PROJECT_NAME` with your project name):

```bash
git clone https://github.com/WebArtWork/ngx-default.git PROJECT_NAME
cd PROJECT_NAME
npm i
npm run start
```

### What these commands do

- `git clone https://github.com/WebArtWork/ngx-default.git PROJECT_NAME`
  Downloads the template repository and creates a local folder named `PROJECT_NAME`.
- `cd PROJECT_NAME`
  Opens the newly created project folder.
- `npm i`
  Installs all project dependencies from `package.json`.
- `npm run start`
  Starts the local development server.

After that, open the local URL shown in the terminal, usually [http://localhost:4200](http://localhost:4200)

## Initialize your own git repository

If you want to start fresh instead of keeping the template git history, remove the existing `.git` folder, initialize a new repository, and create the first commit.

Example:

```bash
rm -rf .git
git init
git remote add origin https://github.com/WebArtWork/PROJECT_NAME.git
git add .
git commit -m "chore(init): bootstrap project from ngx-default template"
```

`git remote add origin ...` connects your local repository to the remote GitHub repository so future `git push` and `git pull` commands know where your main project lives.

Use a Conventional Commit message for the first commit as well. A good default is:

```text
chore(init): bootstrap project from ngx-default template
```

# Adapting The Template To A Real Business

After cloning and installing the project, use the **Angular Default Web Art Work** Custom GPT to
adapt the template to a real business:

**[Angular Default Web Art Work on ChatGPT](https://chatgpt.com/g/g-6a205f0f0f14819185cd7707523d3816-angular-default-web-art-work)**

The GPT operates in two phases:

**Phase 1 — Implementation prompt**
Provide a Google Maps place URL and the new domain. The GPT researches the business from public
sources (Maps, website, socials, reviews, directories), gathers confirmed facts, and outputs one
compact ready-to-run prompt for a coding agent. The coding agent applies branding, content, SEO,
theme, company data, and environment config in a single pass.

**Phase 2 — Page cleanup**
After Phase 1 is applied, trigger cleanup with phrases like "cleanup" or "remove unused pages".
The GPT reviews each page one at a time, suggests keep or remove based on the business type,
collects your decision, and generates a targeted removal prompt.

---

# License

MIT
