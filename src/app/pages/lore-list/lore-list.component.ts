import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { LoreCardComponent } from '../../feature/lore/lore-card.component';
import { loreKindConfig } from '../../feature/lore/lore.data';
import { LoreKind } from '../../feature/lore/lore.interface';
import { LoreService } from '../../feature/lore/lore.service';

/** List page shared by characters, locations, soldiers and buildings. */
@Component({
	imports: [LoreCardComponent, RouterLink, TranslateDirective],
	template: `
		<section class="mx-auto max-w-[var(--container)] px-4 sm:px-6 t-page">
			<h1 class="t-display" [translate]="config.title">
				{{ config.title }}
			</h1>
			<p class="mt-4 max-w-[var(--reading)] text-lg leading-8" [translate]="config.intro">
				{{ config.intro }}
			</p>

			@if (entries().length) {
				<ul class="t-stack grid t-gap md:grid-cols-2 lg:grid-cols-3">
					@for (entry of entries(); track entry.slug) {
						<li>
							<app-lore-card [entry]="entry" />
						</li>
					}
				</ul>
			} @else {
				<div
					class="t-stack max-w-[var(--reading)] rounded-[var(--t-radius-card)] border border-dashed border-[var(--c-border)] p-6 sm:p-8"
				>
					<p class="leading-7" translate>
						Тут поки порожньо. Нові записи з'являться разом із наступними історіями.
					</p>
					<a class="theme-focus mt-4 t-link " routerLink="/stories">
						<span translate>Усі історії</span>
						<span class="material-symbols-outlined text-[20px]" aria-hidden="true">
							arrow_forward
						</span>
					</a>
				</div>
			}
		</section>
	`,
})
export class LoreListComponent {
	private readonly _kind: LoreKind = inject(ActivatedRoute).snapshot.data['loreKind'];

	protected readonly config = loreKindConfig(this._kind);
	protected readonly entries = inject(LoreService).byKind(this._kind);
}
