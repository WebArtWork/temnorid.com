import { CodexKind } from '../codex/codex.interface';

/** Firestore collection names. They match the public route segments and the JSON folders. */
export type WriterKind = 'stories' | CodexKind;

export interface WriterKindConfig {
	kind: WriterKind;
	/** Ukrainian source text for the translate directive. */
	title: string;
	newLabel: string;
	/** Editor route, e.g. `/write/story`. The entry slug goes in the `slug` query param. */
	editorPath: string;
	listPath: string;
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
}

export interface ChapterDraft {
	slug: string;
	/** Reading position; chapters are sorted by it. */
	order: number;
	title: string;
	html: string;
	/** Characters, locations, soldiers and buildings in the chapter, as `<kind>/<slug>`. */
	tags: string[];
	createdAt: Date | null;
	updatedAt: Date | null;
}

export interface CodexDraft extends WriterEntryBase {
	name: string;
	role: string;
	summary: string;
	html: string;
	/** Slugs of stories the entry appears in. */
	storySlugs: string[];
	/** References in the form `<kind>/<slug>`. */
	related: string[];
}

export type WriterDraft = StoryDraft | CodexDraft;

/** One row on a writer list page. */
export interface WriterListItem {
	kind: WriterKind;
	slug: string;
	title: string;
	summary: string;
	ownerName: string;
	mine: boolean;
	updatedAt: Date | null;
}

/** Something an entry can link to: a story or a codex entry, from the code or from Firestore. */
export interface WriterReference {
	kind: WriterKind;
	slug: string;
	/** `<kind>/<slug>` for codex entries, the bare slug for stories. */
	value: string;
	label: string;
	/** True when the entry already lives in `src/data/`. */
	canon: boolean;
}
