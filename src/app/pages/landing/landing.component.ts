import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { StoryCardComponent } from '../../feature/story/story-card.component';
import { StoryService } from '../../feature/story/story.service';

const LANDING_STORY_LIMIT = 4;

@Component({
	imports: [RouterLink, StoryCardComponent, TranslateDirective],
	templateUrl: './landing.component.html',
	styleUrl: './landing.component.scss',
})
export class LandingComponent {
	private readonly _stories = inject(StoryService).stories;

	protected readonly firstStory = computed(() => this._stories()[0] ?? null);
	/** Newest stories first. */
	protected readonly latestStories = computed(() =>
		[...this._stories()].reverse().slice(0, LANDING_STORY_LIMIT),
	);
}
