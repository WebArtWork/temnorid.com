import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { GameService } from '../../feature/game/game.service';

/** /games: every game set in Temnorid. */
@Component({
	imports: [RouterLink, TranslateDirective],
	template: `
		<section class="mx-auto max-w-[var(--container)] px-4 sm:px-6 t-page">
			<h1 class="t-display" translate>Ігри</h1>
			<p class="mt-4 max-w-[var(--reading)] t-lead" translate>
				Ігри, що відбуваються у світі Темнороду.
			</p>

			<ul class="t-stack grid t-gap md:grid-cols-2">
				@for (game of games(); track game.slug) {
					<li>
						<a class="theme-focus flex h-full flex-col t-card" [routerLink]="game.path">
							@if (game.status === 'in-development') {
								<span class="text-sm text-[var(--c-text-muted)]" translate>
									У розробці
								</span>
							}
							<span class="t-item">{{ game.title }}</span>
							<span class="mt-3 flex-1 leading-7">{{ game.summary }}</span>
							<span class="t-link mt-6">
								<span translate>Детальніше</span>
								<span
									class="material-symbols-outlined text-[20px]"
									aria-hidden="true"
									>arrow_forward</span
								>
							</span>
						</a>
					</li>
				}
			</ul>
		</section>
	`,
})
export class GamesComponent {
	protected readonly games = inject(GameService).games;
}
