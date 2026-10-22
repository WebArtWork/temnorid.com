import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { GameService } from '../../feature/game/game.service';
import { BreadcrumbsComponent } from '../../layouts/breadcrumbs/breadcrumbs.component';

/** /game/<slug>: one game, with a link out to its own site when it has one. */
@Component({
	imports: [BreadcrumbsComponent, TranslateDirective],
	template: `
		@if (game(); as game) {
			<article class="mx-auto max-w-[var(--reading)] px-4 sm:px-0 t-page">
				<app-breadcrumbs
					[items]="[
						{ label: 'Ігри', link: '/games', translate: true },
						{ label: game.title },
					]"
				/>

				<header class="mt-8">
					@if (game.status === 'in-development') {
						<p class="text-sm text-[var(--c-text-muted)]" translate>У розробці</p>
					}
					<h1 class="mt-3 t-display">{{ game.title }}</h1>
					<p class="mt-5 t-lead">{{ game.summary }}</p>
				</header>

				@if (game.url) {
					<a
						class="btn btn--primary mt-8"
						[href]="game.url"
						target="_blank"
						rel="noopener"
					>
						<span class="material-symbols-outlined" aria-hidden="true"
							>open_in_new</span
						>
						<span translate>Відкрити сайт гри</span>
					</a>
				}

				@if (game.paragraphs.length) {
					<div class="mt-10 t-prose">
						@for (paragraph of game.paragraphs; track $index) {
							<p>{{ paragraph }}</p>
						}
					</div>
				}
			</article>
		}
	`,
})
export class GameComponent {
	protected readonly game = inject(GameService).game(
		inject(ActivatedRoute).snapshot.data['gameSlug'],
	);
}
