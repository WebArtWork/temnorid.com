import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { LORE_KINDS } from '../../feature/lore/lore.data';
import { CompanyService } from '../../feature/company/company.service';
import { GameService } from '../../feature/game/game.service';

interface FooterLink {
	label: string;
	path: string;
	/** True when `label` is Ukrainian source text for the translate directive. */
	translate: boolean;
}

interface FooterColumn {
	title: string;
	links: FooterLink[];
}

/** Site map of the whole world: stories and lore, the games, then films and the workshop. */
@Component({
	selector: 'app-footer',
	imports: [RouterLink, TranslateDirective],
	templateUrl: './footer.component.html',
})
export class FooterComponent {
	private readonly _games = inject(GameService).games;

	protected readonly company = inject(CompanyService).company;
	protected readonly currentYear = new Date().getFullYear();
	protected readonly columns = computed<FooterColumn[]>(() => [
		{
			title: 'Світ',
			links: [
				{ label: 'Історії', path: '/stories', translate: true },
				...LORE_KINDS.map((config) => ({
					label: config.title,
					path: `/${config.kind}`,
					translate: true,
				})),
			],
		},
		{
			title: 'Ігри',
			links: this._games().map((game) => ({
				label: game.title,
				path: game.path,
				translate: false,
			})),
		},
		{
			title: 'Ще',
			links: [
				{ label: 'Фільми', path: '/movies', translate: true },
				{ label: 'Майстерня', path: '/write/stories', translate: true },
			],
		},
	]);
}
