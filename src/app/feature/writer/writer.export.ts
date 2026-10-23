import { LoreEntry, LoreEntryContent } from '../lore/lore.interface';
import { STORIES } from '../story/story.data';
import { Story } from '../story/story.interface';
import { ChapterDraft, LoreDraft, GapDraft, StoryDraft } from './writer.interface';

/*
 * Turns Firestore drafts into the JSON the site is built from, so the owner can release an entry
 * by adding it to `src/data/`. Drafts are in the author's language, so `ua` and `en` both get that
 * text: translate them after pasting. Browser only: lore text is parsed with DOMParser.
 */

const _WORDS_PER_MINUTE = 200;

/** A story with its chapters, gaps and filled gaps: a whole `src/data/stories/<slug>.json`. */
export function storyToCode(draft: StoryDraft, chapters: ChapterDraft[], gaps: GapDraft[]): Story {
	const content = { title: draft.title.trim(), summary: draft.summary.trim() };
	const words = chapters
		.map((chapter) => chapter.html.replace(/<[^>]*>/g, ' '))
		.join(' ')
		.split(/\s+/)
		.filter(Boolean).length;

	return {
		slug: draft.slug,
		number: Math.max(0, ...STORIES.map((story) => story.number)) + 1,
		readingMinutes: Math.max(1, Math.round(words / _WORDS_PER_MINUTE)),
		publishedAt: new Date().toISOString().slice(0, 10),
		content: { ua: content, en: content },
		chapters: chapters.map((chapter, order) => {
			const text = { title: chapter.title.trim(), html: chapter.html };

			return {
				slug: chapter.slug,
				order,
				...(chapter.tags.length ? { tags: chapter.tags } : {}),
				content: { ua: text, en: text },
			};
		}),
		gaps: gaps.map((gap) => {
			const text = { title: gap.title.trim(), details: gap.details.trim() };

			return {
				slug: gap.slug,
				...(gap.chapterSlug ? { chapterSlug: gap.chapterSlug } : {}),
				content: { ua: text, en: text },
			};
		}),
		fills: draft.fills,
	};
}

/** One world entry, to add to the array in `src/data/lore/<kind>.json`. */
export function loreToCode(draft: LoreDraft): LoreEntry {
	const content: LoreEntryContent = {
		name: draft.name.trim(),
		role: draft.role.trim(),
		summary: draft.summary.trim(),
		paragraphs: _paragraphs(draft.html),
	};

	return {
		slug: draft.slug,
		storySlugs: draft.storySlugs,
		related: draft.related,
		...(Object.keys(draft.fields).length ? { fields: draft.fields } : {}),
		content: { ua: content, en: content },
	};
}

/** Plain-text paragraphs: one per top-level block, and one per list item. */
function _paragraphs(html: string): string[] {
	const body = new DOMParser().parseFromString(html, 'text/html').body;

	return [...body.children]
		.flatMap((element) =>
			element.tagName === 'UL' || element.tagName === 'OL'
				? [...element.children]
				: [element],
		)
		.map((element) => (element.textContent ?? '').replace(/\s+/g, ' ').trim())
		.filter(Boolean);
}
