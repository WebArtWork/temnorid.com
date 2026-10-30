import { computed, inject, Service } from '@angular/core';
import { LanguageService } from '@wawjs/ngx-translate';
import { MODELS_PLAN } from './models.data';
import { FamilySummary, GameKey, LocalizedModel, Localized } from './models.interface';

export const GAME_KEYS: GameKey[] = ['craft', 'dungeons', 'conquest', 'hippodrome', 'caravan', 'arena', 'legends', 'master', 'escape', 'detective'];

@Service()
export class ModelsService {
	private readonly _languageService = inject(LanguageService);

	readonly updated = MODELS_PLAN.updated;

	readonly models = computed<LocalizedModel[]>(() => {
		const language = this._languageService.language();

		const list = MODELS_PLAN.models.map((model) => {
			const uses = model.uses.map((use) => ({
				game: use.game,
				count: use.count,
				note: use.note ? _text(use.note, language) : '',
			}));

			return {
				id: model.id,
				family: model.family,
				status: model.status,
				kind: model.kind,
				name: _text(model.name, language),
				uses,
				size: model.size ?? '',
				triangles: model.triangles ?? null,
				note: model.note ? _text(model.note, language) : '',
				brief: model.brief ? _text(model.brief, language) : '',
				games: new Set(uses.map((use) => use.game)).size,
				instances: uses.reduce((sum, use) => sum + (use.count ?? 0), 0),
			};
		});

		// Most used first: total instances, then number of games.
		return list.sort((a, b) => b.instances - a.instances || b.games - a.games || a.name.localeCompare(b.name));
	});

	readonly families = computed<FamilySummary[]>(() => {
		const language = this._languageService.language();
		const models = this.models();

		return MODELS_PLAN.families.map((family) => {
			const own = models.filter((model) => model.family === family.id);
			const games = new Set(own.flatMap((model) => model.uses.map((use) => use.game)));

			return {
				id: family.id,
				name: _text(family.name, language),
				summary: _text(family.summary, language),
				models: own.length,
				games: games.size,
				instances: own.reduce((sum, model) => sum + model.instances, 0),
				done: own.filter((model) => model.status === 'done').length,
			};
		});
	});

	/** Per game: models used, instances, finished models. */
	readonly games = computed(() => {
		const models = this.models();

		return GAME_KEYS.map((game) => {
			const used = models.filter((model) => model.uses.some((use) => use.game === game));
			const instances = used.reduce(
				(sum, model) => sum + model.uses.filter((use) => use.game === game).reduce((s, use) => s + (use.count ?? 0), 0),
				0,
			);

			return {
				game,
				models: used.length,
				instances,
				done: used.filter((model) => model.status === 'done').length,
			};
		});
	});

	readonly totals = computed(() => {
		const models = this.models();

		return {
			models: models.length,
			instances: models.reduce((sum, model) => sum + model.instances, 0),
			done: models.filter((model) => model.status === 'done').length,
			placeholder: models.filter((model) => model.status === 'placeholder').length,
			planned: models.filter((model) => model.status === 'planned').length,
			shared: models.filter((model) => model.games > 1).length,
		};
	});
}

function _text(value: Localized, language: string): string {
	return value[language] ?? value.ua;
}
