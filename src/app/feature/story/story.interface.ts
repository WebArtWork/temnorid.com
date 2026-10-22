/*
 * Same shape as the workshop (stories/{slug} and its chapters in Firestore), plus a ua and an en
 * version of each text, so a story written there moves into `src/data/stories/` as it is.
 */

export interface StoryChapterContent {
	title: string;
	/** Chapter text as the workshop editor saves it: paragraphs, headings, lists. */
	html: string;
}

export interface StoryChapter {
	/** Used in the chapter URL: `/stories/<story>/<chapter>`. */
	slug: string;
	/** Reading position; chapters are sorted by it. */
	order: number;
	/** Characters, locations, soldiers and buildings in the chapter, as `<kind>/<slug>`. */
	tags?: string[];
	/** Keyed by language code. `ua` and `en` are required. */
	content: { ua: StoryChapterContent; en: StoryChapterContent } & Partial<
		Record<string, StoryChapterContent>
	>;
}

export interface StoryContent {
	title: string;
	summary: string;
}

export interface Story {
	slug: string;
	number: number;
	readingMinutes: number;
	publishedAt: string;
	/** Keyed by language code. `ua` and `en` are required. */
	content: { ua: StoryContent; en: StoryContent } & Partial<Record<string, StoryContent>>;
	chapters: StoryChapter[];
}

export interface LocalizedChapter extends StoryChapterContent {
	slug: string;
	/** 1-based position in the story. */
	number: number;
	path: string;
	readingMinutes: number;
}

export interface LocalizedStory extends StoryContent {
	slug: string;
	number: number;
	readingMinutes: number;
	publishedAt: string;
	chapters: LocalizedChapter[];
}
