import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { BreadcrumbsComponent } from '../../layouts/breadcrumbs/breadcrumbs.component';
import { romanNumeral } from '../../feature/story/story.data';
import { StoryService } from '../../feature/story/story.service';

/** One chapter of a story: /stories/<story>/<chapter>. */
@Component({
	imports: [BreadcrumbsComponent, RouterLink, TranslateDirective],
	templateUrl: './chapter.component.html',
	styleUrl: './chapter.component.scss',
})
export class ChapterComponent {
	private readonly _storyService = inject(StoryService);
	private readonly _data = inject(ActivatedRoute).snapshot.data;
	private readonly _storySlug: string = this._data['storySlug'];
	private readonly _chapterSlug: string = this._data['chapterSlug'];

	protected readonly story = this._storyService.story(this._storySlug);
	protected readonly chapter = this._storyService.chapter(this._storySlug, this._chapterSlug);
	protected readonly neighbours = this._storyService.chapterNeighbours(
		this._storySlug,
		this._chapterSlug,
	);
	protected readonly romanNumeral = romanNumeral;
}
