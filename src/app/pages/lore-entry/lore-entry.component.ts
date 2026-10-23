import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { BreadcrumbsComponent } from '../../layouts/breadcrumbs/breadcrumbs.component';
import { loreKindConfig } from '../../feature/lore/lore.data';
import { LoreKind } from '../../feature/lore/lore.interface';
import { LoreService } from '../../feature/lore/lore.service';
import { StoryService } from '../../feature/story/story.service';

/** Detail page shared by a character, location, soldier and building. */
@Component({
	imports: [BreadcrumbsComponent, RouterLink, TranslateDirective],
	templateUrl: './lore-entry.component.html',
})
export class LoreEntryComponent {
	private readonly _loreService = inject(LoreService);
	private readonly _storyService = inject(StoryService);
	private readonly _data = inject(ActivatedRoute).snapshot.data;
	private readonly _kind: LoreKind = this._data['loreKind'];
	private readonly _slug: string = this._data['loreSlug'];

	protected readonly config = loreKindConfig(this._kind);
	protected readonly entry = this._loreService.entry(this._kind, this._slug);
	protected readonly related = this._loreService.related(this._kind, this._slug);
	protected readonly stories = computed(() => {
		const storySlugs = this.entry()?.storySlugs ?? [];

		return this._storyService.stories().filter((story) => storySlugs.includes(story.slug));
	});
}
