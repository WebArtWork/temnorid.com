import type { StoryChapterContent } from './story.interface';

/** Keep chapter search snippets specific without including HTML markup. */
export function chapterSeoDescription(chapter: StoryChapterContent, storyTitle: string): string {
	const text = chapter.html
		.replace(/<[^>]*>/g, ' ')
		.replace(/&(?:nbsp|amp|quot|apos|lt|gt|#\d+|#x[0-9a-f]+);/gi, ' ')
		.replace(/\s+/g, ' ')
		.trim();
	const description = `${chapter.title} — ${storyTitle}. ${text}`;
	if (description.length <= 160) return description;
	return description.slice(0, 157).replace(/\s+\S*$/, '') + '…';
}
