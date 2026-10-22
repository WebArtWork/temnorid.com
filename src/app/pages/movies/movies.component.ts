import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';

/** Films set in Temnorid. None yet, so the page points readers to the stories. */
@Component({
	imports: [RouterLink, TranslateDirective],
	template: `
		<section class="mx-auto max-w-[var(--container)] px-4 sm:px-6 t-page">
			<h1 class="t-display" translate>Фільми</h1>
			<div
				class="t-stack max-w-[var(--reading)] rounded-[var(--t-radius-card)] border border-dashed border-[var(--c-border)] p-6 sm:p-8"
			>
				<p class="leading-7" translate>
					Фільмів за світом Темнороду поки немає. Усе починається з історій.
				</p>
				<a class="theme-focus t-link mt-4" routerLink="/stories">
					<span translate>Читати історії</span>
					<span class="material-symbols-outlined text-[20px]" aria-hidden="true"
						>arrow_forward</span
					>
				</a>
			</div>
		</section>
	`,
})
export class MoviesComponent {}
