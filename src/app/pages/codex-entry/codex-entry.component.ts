import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { BreadcrumbsComponent } from '../../layouts/breadcrumbs/breadcrumbs.component';
import { codexKindConfig } from '../../feature/codex/codex.data';
import { CodexKind } from '../../feature/codex/codex.interface';
import { CodexService } from '../../feature/codex/codex.service';
import { StoryService } from '../../feature/story/story.service';

/** Detail page shared by a character, location, soldier and building. */
@Component({
	imports: [BreadcrumbsComponent, RouterLink, TranslateDirective],
	templateUrl: './codex-entry.component.html',
})
export class CodexEntryComponent {
	private readonly _codexService = inject(CodexService);
	private readonly _storyService = inject(StoryService);
	private readonly _data = inject(ActivatedRoute).snapshot.data;
	private readonly _kind: CodexKind = this._data['codexKind'];
	private readonly _slug: string = this._data['codexSlug'];

	protected readonly config = codexKindConfig(this._kind);
	protected readonly entry = this._codexService.entry(this._kind, this._slug);
	protected readonly related = this._codexService.related(this._kind, this._slug);
	protected readonly stories = computed(() => {
		const storySlugs = this.entry()?.storySlugs ?? [];

		return this._storyService.stories().filter((story) => storySlugs.includes(story.slug));
	});
}
