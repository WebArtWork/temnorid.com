export type LoreKind = 'characters' | 'locations' | 'soldiers' | 'buildings';

export interface LoreKindConfig {
	kind: LoreKind;
	/** Ukrainian source text for the translate directive. */
	title: string;
	singular: string;
	intro: string;
	/** English values for route SEO metadata. */
	seoTitle: string;
	seoDescription: string;
}

export interface LoreEntryContent {
	name: string;
	role: string;
	summary: string;
	paragraphs: string[];
}

export interface LoreEntry {
	slug: string;
	storySlugs: string[];
	/** References in the form `<kind>/<slug>`. */
	related: string[];
	/** The kind's extra workshop fields (faction, rarity, cost…), as saved in the workshop. */
	fields?: Record<string, unknown>;
	/** Keyed by language code. `ua` and `en` are required. */
	content: { ua: LoreEntryContent; en: LoreEntryContent } & Partial<
		Record<string, LoreEntryContent>
	>;
}

export interface LocalizedLoreEntry extends LoreEntryContent {
	kind: LoreKind;
	slug: string;
	path: string;
	storySlugs: string[];
	related: string[];
}
