import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { LocalizedStory } from './story.interface';

@Component({
	selector: 'app-story-card',
	imports: [RouterLink, TranslateDirective],
	template: `
		<a
			class="theme-interactive theme-focus group flex h-full flex-col t-card text-[var(--c-text)]"
			[routerLink]="['/stories', story().slug]"
		>
			<p class="text-sm text-[var(--c-text-muted)]">
				<span translate>Історія</span> {{ story().number }} · {{ story().readingMinutes }}
				<span translate>хв читання</span>
			</p>
			<h3 class="mt-3 t-item">
				{{ story().title }}
			</h3>
			<p class="mt-3 flex-1 leading-7">{{ story().summary }}</p>
			<span
				class="mt-6 inline-flex items-center gap-1 font-medium text-[var(--c-primary-text)]"
			>
				<span translate>Читати</span>
				<span
					class="material-symbols-outlined text-[20px] transition-transform duration-150 group-hover:translate-x-0.5"
					aria-hidden="true"
				>
					arrow_forward
				</span>
			</span>
		</a>
	`,
})
export class StoryCardComponent {
	readonly story = input.required<LocalizedStory>();
}
