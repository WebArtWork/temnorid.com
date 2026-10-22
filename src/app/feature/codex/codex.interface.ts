export type CodexKind = 'characters' | 'locations' | 'soldiers' | 'buildings';

export interface CodexKindConfig {
	kind: CodexKind;
	/** Ukrainian source text for the translate directive. */
	title: string;
	singular: string;
	intro: string;
	/** English values for route SEO metadata. */
	seoTitle: string;
	seoDescription: string;
}

export interface CodexEntryContent {
	name: string;
	role: string;
	summary: string;
	paragraphs: string[];
}

export interface CodexEntry {
	slug: string;
	storySlugs: string[];
	/** References in the form `<kind>/<slug>`. */
	related: string[];
	/** Keyed by language code. `ua` and `en` are required. */
	content: { ua: CodexEntryContent; en: CodexEntryContent } & Partial<
		Record<string, CodexEntryContent>
	>;
}

export interface LocalizedCodexEntry extends CodexEntryContent {
	kind: CodexKind;
	slug: string;
	path: string;
	storySlugs: string[];
	related: string[];
}
