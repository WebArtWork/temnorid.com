import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { BreadcrumbsComponent } from '../../layouts/breadcrumbs/breadcrumbs.component';
import { CodexService } from '../../feature/codex/codex.service';
import { romanNumeral } from '../../feature/story/story.data';
import { StoryService } from '../../feature/story/story.service';

@Component({
	imports: [BreadcrumbsComponent, RouterLink, TranslateDirective],
	templateUrl: './story.component.html',
	styleUrl: './story.component.scss',
})
export class StoryComponent {
	private readonly _storyService = inject(StoryService);
	private readonly _slug: string = inject(ActivatedRoute).snapshot.data['storySlug'];

	protected readonly story = this._storyService.story(this._slug);
	protected readonly neighbours = this._storyService.neighbours(this._slug);
	protected readonly entries = inject(CodexService).inStory(this._slug);
	protected readonly romanNumeral = romanNumeral;
}
