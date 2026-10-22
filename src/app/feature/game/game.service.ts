import { computed, inject, Service } from '@angular/core';
import { LanguageService } from '@wawjs/ngx-translate';
import { GAMES } from './game.data';
import { Game, LocalizedGame } from './game.interface';

@Service()
export class GameService {
	private readonly _languageService = inject(LanguageService);

	readonly games = computed(() => {
		const language = this._languageService.language();

		return GAMES.map((game) => _localize(game, language));
	});

	game(slug: string) {
		return computed(() => this.games().find((game) => game.slug === slug) ?? null);
	}
}

function _localize(game: Game, language: string): LocalizedGame {
	const content = game.content[language] ?? game.content.ua;

	return {
		...content,
		slug: game.slug,
		url: game.url,
		status: game.status,
		path: `/game/${game.slug}`,
	};
}
