import { computed, inject, Service } from '@angular/core';
import { LanguageService } from '@wawjs/ngx-translate';
import { STORIES } from './story.data';
import { LocalizedChapter, LocalizedStory, Story } from './story.interface';

const _WORDS_PER_MINUTE = 200;

@Service()
export class StoryService {
	private readonly _languageService = inject(LanguageService);

	readonly stories = computed(() => {
		const language = this._languageService.language();

		return STORIES.map((story) => _localize(story, language));
	});

	story(slug: string) {
		return computed(() => this.stories().find((story) => story.slug === slug) ?? null);
	}

	chapter(storySlug: string, chapterSlug: string) {
		return computed(
			() =>
				this.stories()
					.find((story) => story.slug === storySlug)
					?.chapters.find((chapter) => chapter.slug === chapterSlug) ?? null,
		);
	}

	chapterNeighbours(storySlug: string, chapterSlug: string) {
		return computed(() => {
			const chapters =
				this.stories().find((story) => story.slug === storySlug)?.chapters ?? [];
			const index = chapters.findIndex((chapter) => chapter.slug === chapterSlug);

			return {
				previous: index > 0 ? chapters[index - 1] : null,
				next: index >= 0 && index < chapters.length - 1 ? chapters[index + 1] : null,
			};
		});
	}

	neighbours(slug: string) {
		return computed(() => {
			const stories = this.stories();
			const index = stories.findIndex((story) => story.slug === slug);

			return {
				previous: index > 0 ? stories[index - 1] : null,
				next: index >= 0 && index < stories.length - 1 ? stories[index + 1] : null,
			};
		});
	}
}

function _localize(story: Story, language: string): LocalizedStory {
	const content = story.content[language] ?? story.content.ua;

	return {
		...content,
		slug: story.slug,
		number: story.number,
		readingMinutes: story.readingMinutes,
		publishedAt: story.publishedAt,
		chapters: [...story.chapters]
			.sort((a, b) => a.order - b.order)
			.map((chapter, index): LocalizedChapter => {
				const chapterContent = chapter.content[language] ?? chapter.content.ua;
				const words = _text(chapterContent.html).split(/\s+/).filter(Boolean).length;

				return {
					...chapterContent,
					slug: chapter.slug,
					number: index + 1,
					path: `/stories/${story.slug}/${chapter.slug}`,
					readingMinutes: Math.max(1, Math.round(words / _WORDS_PER_MINUTE)),
				};
			}),
	};
}

/** Plain text of chapter HTML, for word counts. Runs during prerender too, so no DOM. */
function _text(html: string): string {
	return html.replace(/<[^>]*>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ');
}
