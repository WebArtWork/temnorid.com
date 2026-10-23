import { LoreKind } from '../lore/lore.interface';

/**
 * Workshop entry kinds that are not on the public site yet. They describe what the games need:
 * factions, the economy, magic, creatures, quests, history and Intrigue's cards.
 */
export type WorkshopOnlyKind =
	| 'factions'
	| 'resources'
	| 'items'
	| 'recipes'
	| 'spells'
	| 'creatures'
	| 'quests'
	| 'events'
	| 'cards';

/** Every kind of world entry. Each is a Firestore collection of the same name. */
export type WriterLoreKind = LoreKind | WorkshopOnlyKind;

/** Firestore collection names. Public kinds match their route segments and JSON files. */
export type WriterKind = 'stories' | WriterLoreKind;

/** Sidebar sections of the workshop. */
export type WriterGroup = 'stories' | 'world' | 'heroes' | 'economy' | 'magic' | 'cards';

export interface WriterFieldOption {
	value: string;
	/** Ukrainian source text for the translate directive. */
	label: string;
}

/** An entry together with how many, e.g. a recipe ingredient or a building's cost. */
export interface WriterAmount {
	/** `<kind>/<slug>` */
	ref: string;
	amount: number;
}

/**
 * Extra fields a kind has besides name, summary and description.
 * - text: a short line, e.g. a spell's effect
 * - select: one value from a fixed list, e.g. rarity
 * - ref: links to other entries, one or many, stored as `<kind>/<slug>`
 * - amounts: links to other entries with a number each
 */
export type WriterFieldDef = { key: string; label: string; hint?: string } & (
	| { type: 'text' }
	| { type: 'select'; options: WriterFieldOption[] }
	| { type: 'ref'; kinds: WriterLoreKind[]; multiple: boolean }
	| { type: 'amounts'; kinds: WriterLoreKind[] }
);

export type WriterFieldValue = string | string[] | WriterAmount[];

export interface WriterKindConfig {
	kind: WriterKind;
	group: WriterGroup;
	/** Ukrainian source text for the translate directive. */
	title: string;
	newLabel: string;
	/** Editor route, e.g. `/write/story`. The entry slug goes in the `slug` query param. */
	editorPath: string;
	listPath: string;
	/** True for kinds the public site shows; only they offer "JSON for the code". */
	public: boolean;
	/** Show the short "role" line under the name (characters, troops). */
	role: boolean;
	fields: WriterFieldDef[];
}

export interface WriterEntryBase {
	/** Also the Firestore document id. Cannot change after the entry is created. */
	slug: string;
	ownerUid: string;
	ownerName: string;
	createdAt: Date | null;
	updatedAt: Date | null;
}

/*
 * Authors write in whatever language they like, so drafts hold a single version of the text.
 * We translate when an entry moves into `src/data/`.
 */

/** The story itself. Its text lives in chapters: `stories/<slug>/chapters/<chapterSlug>`. */
export interface StoryDraft extends WriterEntryBase {
	title: string;
	summary: string;
	/** Gaps of other stories this one explains, as `<storySlug>/<gapSlug>`. */
	fills: string[];
}

/**
 * Something a story leaves unexplained on purpose, for a later story to fill.
 * Lives at `stories/<storySlug>/gaps/<slug>` and belongs to the story's author.
 */
export interface GapDraft {
	slug: string;
	storySlug: string;
	title: string;
	details: string;
	/** The chapter where the gap shows up; empty when it concerns the whole story. */
	chapterSlug: string;
	createdAt: Date | null;
	updatedAt: Date | null;
}

/** A gap from any story, released or draft, with what has filled it so far. */
export interface GapListItem {
	/** `<storySlug>/<gapSlug>` */
	ref: string;
	storySlug: string;
	storyTitle: string;
	chapterTitle: string;
	title: string;
	details: string;
	released: boolean;
	/** Stories that say they fill this gap. Empty means the gap is open. */
	filledBy: { slug: string; title: string; released: boolean }[];
}

/** Where the project owner stands on a draft. Only owners (admins) set it. */
export type ReviewStatus = 'new' | 'considering' | 'chosen' | 'released' | 'declined';

export interface Review {
	kind: WriterKind;
	slug: string;
	status: ReviewStatus;
	note: string;
	updatedAt: Date | null;
}

export interface ChapterDraft {
	slug: string;
	/** Reading position; chapters are sorted by it. */
	order: number;
	title: string;
	html: string;
	/** World entries in the chapter, as `<kind>/<slug>`. */
	tags: string[];
	createdAt: Date | null;
	updatedAt: Date | null;
}

export interface LoreDraft extends WriterEntryBase {
	name: string;
	role: string;
	summary: string;
	html: string;
	/** Slugs of stories the entry appears in. */
	storySlugs: string[];
	/** References in the form `<kind>/<slug>`. */
	related: string[];
	/** Values of the kind's extra fields, keyed by field key. */
	fields: Record<string, WriterFieldValue>;
}

export type WriterDraft = StoryDraft | LoreDraft;

/** One row on a writer list page. */
export interface WriterListItem {
	kind: WriterKind;
	slug: string;
	title: string;
	summary: string;
	ownerName: string;
	mine: boolean;
	updatedAt: Date | null;
	/** True for entries in the code (`src/data/`); they are read-only in the workshop. */
	released: boolean;
}

/** Something an entry can link to: a story or a lore entry, from the code or from Firestore. */
export interface WriterReference {
	kind: WriterKind;
	slug: string;
	/** `<kind>/<slug>` for lore entries, the bare slug for stories. */
	value: string;
	label: string;
	/** True when the entry already lives in `src/data/`. */
	canon: boolean;
}

/*
 * The sync object: an author's drafts as one JSON document. The workshop's sync modal shows it,
 * and accepts it back, edited by hand or written by an AI chat that read `/workshop.md`.
 * It mirrors the author's drafts: everything in it is upserted by slug, and drafts it no longer
 * lists (stories, their chapters and gaps, lore entries) are deleted.
 */

export interface SyncChapter {
	slug: string;
	title: string;
	/** Text as HTML: paragraphs, headings, lists, bold, italic, links. No images or embeds. */
	html?: string;
	/** Lore entries in the chapter, as `<kind>/<slug>`. */
	tags?: string[];
}

export interface SyncGap {
	slug: string;
	title: string;
	details?: string;
	chapterSlug?: string;
}

export interface SyncStory {
	slug: string;
	title: string;
	summary?: string;
	/** Gaps of other stories this one explains, as `<storySlug>/<gapSlug>`. */
	fills?: string[];
	/** In reading order. */
	chapters?: SyncChapter[];
	gaps?: SyncGap[];
}

export interface SyncLoreEntry {
	slug: string;
	name: string;
	role?: string;
	summary?: string;
	html?: string;
	storySlugs?: string[];
	related?: string[];
	fields?: Record<string, WriterFieldValue>;
}

export interface WorkshopSync {
	version: 1;
	stories?: SyncStory[];
	lore?: Partial<Record<WriterLoreKind, SyncLoreEntry[]>>;
}

/** A problem with one part of a sync object. `message` is Ukrainian source text. */
export interface SyncIssue {
	path: string;
	message: string;
}

/** A draft the sync object no longer lists. `path` reads like `stories/<slug>/chapters/<slug>`. */
export type SyncRemoval =
	| { path: string; kind: WriterKind; slug: string }
	| { path: string; kind: 'chapters' | 'gaps'; story: string; slug: string };

export interface SyncResult {
	created: number;
	updated: number;
	removed: number;
	failed: SyncIssue[];
}
