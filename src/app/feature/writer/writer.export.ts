import { CodexEntry, CodexEntryContent } from '../codex/codex.interface';
import { CodexDraft } from './writer.interface';

/*
 * Turns a Firestore codex draft into the JSON the site is built from, so an entry we like can be
 * added to `src/data/codex/<kind>.json`.
 * Drafts are in the author's language, so `ua` and `en` both get that text: translate them after
 * pasting. Browser only: it parses the editor HTML with DOMParser.
 */

export function codexToCode(draft: CodexDraft): CodexEntry {
	const content: CodexEntryContent = {
		name: draft.name.trim(),
		role: draft.role.trim(),
		summary: draft.summary.trim(),
		paragraphs: _paragraphs(draft.html),
	};

	return {
		slug: draft.slug,
		storySlugs: draft.storySlugs,
		related: draft.related,
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
