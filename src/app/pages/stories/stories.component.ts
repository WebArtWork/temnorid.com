import { Component, inject } from '@angular/core';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { StoryCardComponent } from '../../feature/story/story-card.component';
import { StoryService } from '../../feature/story/story.service';

@Component({
	imports: [StoryCardComponent, TranslateDirective],
	template: `
		<section class="mx-auto max-w-[var(--container)] px-4 sm:px-6 t-page">
			<h1 class="t-display" translate>Історії Темнороду</h1>
			<p class="mt-4 max-w-[var(--reading)] text-lg leading-8" translate>
				Хроніки світу, від найпершої. Нові історії з'являтимуться тут.
			</p>

			<ul class="t-stack grid t-gap md:grid-cols-2">
				@for (story of stories(); track story.slug) {
					<li>
						<app-story-card [story]="story" />
					</li>
				}
			</ul>
		</section>
	`,
})
export class StoriesComponent {
	protected readonly stories = inject(StoryService).stories;
}
