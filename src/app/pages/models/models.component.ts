import { Component, computed, inject, signal } from '@angular/core';
import { LanguageService } from '@wawjs/ngx-translate';
import { ModelsService } from '../../feature/models/models.service';
import { ModelStatus } from '../../feature/models/models.interface';

const UI = {
	ua: {
		title: 'План моделей',
		lead: 'Прості моделі з примітивів, які стоять у іграх зараз, і які потім замінимо справжніми. Спочатку ті, що використовуються найбільше. Назва файлу = id моделі; в кожної є опис для генерації.',
		general: 'Спільні вимоги',
		generalText:
			'Low-poly стилізований темний медієвальний фентезі. Один меш, Y вгору, 1 одиниця = 1 м, початок координат у центрі основи, формат GLB з PBR-матеріалами, текстури до 1024 px. Люди та істоти: T-поза, гуманоїдний скелет, масштаб як у моделі мага.',
		models: 'моделей',
		instances: 'екземплярів',
		done: 'Готові',
		placeholder: 'Примітиви',
		planned: 'Заплановані',
		any: 'Усі',
		todo: 'Замінити',
		copy: 'Копіювати опис',
		copied: 'Скопійовано',
		brief: 'Опис для генерації',
		ready: 'Готова модель, опис не потрібен.',
		usedIn: 'Використовується',
		games: 'Ігор',
		times: 'Разів разом',
		tbd: 'ще не визначено',
		size: 'Розмір',
		updated: 'Оновлено',
		statuses: { done: 'Готова', placeholder: 'Примітив', planned: 'Заплановано' },
		gameNames: {
			craft: 'Ремесло',
			dungeons: 'Підземелля',
			conquest: 'Завоювання',
			hippodrome: 'Іподром',
			caravan: 'Охорона каравану',
			arena: 'Арена',
			legends: 'Легенди',
			master: 'Майстер',
			escape: 'Втеча',
			detective: 'Детектив',
		},
	},
	en: {
		title: 'Models plan',
		lead: 'The simple primitive models the games use now, to be replaced later with proper ones. Most used first. The file name is the model id; each has a brief for generation.',
		general: 'General requirements',
		generalText:
			'Low-poly stylised dark medieval fantasy. One mesh, Y up, 1 unit = 1 m, origin at the centre of the base, GLB with PBR materials, textures up to 1024 px. People and creatures: T-pose, humanoid skeleton, scaled like the mage model.',
		models: 'models',
		instances: 'instances',
		done: 'Finished',
		placeholder: 'Primitives',
		planned: 'Planned',
		any: 'All',
		todo: 'To replace',
		copy: 'Copy brief',
		copied: 'Copied',
		brief: 'Brief for generation',
		ready: 'Finished model, no brief needed.',
		usedIn: 'Used in',
		games: 'Games',
		times: 'Times in total',
		tbd: 'not decided yet',
		size: 'Size',
		updated: 'Updated',
		statuses: { done: 'Finished', placeholder: 'Primitive', planned: 'Planned' },
		gameNames: {
			craft: 'Craft',
			dungeons: 'Dungeons',
			conquest: 'Conquest',
			hippodrome: 'Hippodrome',
			caravan: 'Caravan Guard',
			arena: 'Arena',
			legends: 'Legends',
			master: 'Master',
			escape: 'Escape',
			detective: 'Detective',
		},
	},
};

/** /models: the models to make, most used first, each with a brief to generate it. */
@Component({
	template: `
		<section class="mx-auto max-w-[var(--container)] px-4 sm:px-6 t-page">
			<h1 class="t-display">{{ ui().title }}</h1>
			<p class="mt-4 max-w-[var(--reading)] t-lead">{{ ui().lead }}</p>
			<p class="mt-2 text-sm">{{ ui().updated }}: {{ updated }}</p>

			<div class="t-stack t-card">
				<span class="t-item">{{ ui().general }}</span>
				<p class="mt-2 leading-7">{{ ui().generalText }}</p>
			</div>

			<div class="mt-6 flex flex-wrap gap-2">
				<button type="button" class="theme-focus rounded-full border px-3 py-1 text-sm"
					[class.font-bold]="status() === 'todo'" (click)="status.set('todo')">
					{{ ui().todo }} · {{ totals().placeholder + totals().planned }}
				</button>
				<button type="button" class="theme-focus rounded-full border px-3 py-1 text-sm"
					[class.font-bold]="status() === ''" (click)="status.set('')">
					{{ ui().any }} · {{ totals().models }}
				</button>
				@for (s of statusKeys; track s) {
					<button type="button" class="theme-focus rounded-full border px-3 py-1 text-sm"
						[class.font-bold]="status() === s" (click)="status.set(s)">
						{{ ui().statuses[s] }} · {{ totals()[s] }}
					</button>
				}
			</div>

			<ol class="mt-6 grid t-gap">
				@for (m of visible(); track m.id) {
					<li class="t-card">
						<div class="flex flex-wrap items-baseline justify-between gap-2">
							<span class="t-item">{{ m.rank }}. {{ m.name }}</span>
							<span class="text-sm">{{ ui().statuses[m.status] }}</span>
						</div>
						<div class="mt-1 text-sm opacity-70">{{ m.id }}</div>

						<div class="mt-3 text-sm">
							{{ ui().times }}:
							<strong class="text-[var(--c-text-strong)]">{{ m.instances || '—' }}</strong> ·
							{{ ui().games }}:
							<strong class="text-[var(--c-text-strong)]">{{ m.games }}</strong>
							@if (m.size) { · {{ ui().size }}: {{ m.size }} }
							@if (m.triangles) { · {{ m.triangles }} tri }
						</div>
						<ul class="mt-2 flex flex-wrap gap-2 text-sm">
							@for (u of m.uses; track u.game) {
								<li class="rounded-full border px-3 py-0.5">
									{{ ui().gameNames[u.game] }}: {{ u.count ?? ui().tbd }}
									@if (u.note) { <span class="opacity-70">({{ u.note }})</span> }
								</li>
							}
						</ul>

						<div class="mt-4">
							<span class="font-semibold text-[var(--c-text-strong)]">{{ ui().brief }}</span>
							@if (m.brief) {
								<p class="mt-1 leading-7">{{ m.brief }}</p>
								<button type="button" class="theme-focus mt-2 rounded border px-3 py-1 text-sm"
									(click)="copy(m.id, m.name, m.brief)">
									{{ copied() === m.id ? ui().copied : ui().copy }}
								</button>
							} @else {
								<p class="mt-1 leading-7">{{ m.note || ui().ready }}</p>
							}
						</div>
					</li>
				}
			</ol>
		</section>
	`,
})
export class ModelsComponent {
	private readonly _service = inject(ModelsService);
	private readonly _language = inject(LanguageService);

	protected readonly updated = this._service.updated;
	protected readonly totals = this._service.totals;
	protected readonly statusKeys: ModelStatus[] = ['done', 'placeholder', 'planned'];

	protected readonly status = signal<ModelStatus | 'todo' | ''>('todo');
	protected readonly copied = signal('');

	protected readonly ui = computed(() => (this._language.language() === 'en' ? UI.en : UI.ua));

	protected readonly visible = computed(() => {
		const status = this.status();

		return this._service
			.models()
			.map((model, index) => ({ ...model, rank: index + 1 }))
			.filter((model) => !status || (status === 'todo' ? model.status !== 'done' : model.status === status));
	});

	protected copy(id: string, name: string, brief: string): void {
		const text = `${name}: ${brief}\n\n${this.ui().generalText}`;

		navigator.clipboard?.writeText(text).then(() => {
			this.copied.set(id);
			setTimeout(() => this.copied() === id && this.copied.set(''), 1500);
		});
	}
}
