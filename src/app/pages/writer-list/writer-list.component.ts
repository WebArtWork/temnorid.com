import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { ModalService } from '@wawjs/ngx-ui';
import { BreadcrumbsComponent } from '../../layouts/breadcrumbs/breadcrumbs.component';
import { FirebaseService } from '../../feature/firebase/firebase.service';
import { StoryFormComponent } from '../../feature/writer/story-form.component';
import { WriterFrameComponent } from '../../feature/writer/writer-frame.component';
import { writerKindConfig } from '../../feature/writer/writer.data';
import { WriterKind, WriterListItem } from '../../feature/writer/writer.interface';
import { WriterService } from '../../feature/writer/writer.service';

/** /write/stories, /write/characters, ...: the author's entries and other authors' entries. */
@Component({
	imports: [
		BreadcrumbsComponent,
		DatePipe,
		NgTemplateOutlet,
		RouterLink,
		TranslateDirective,
		WriterFrameComponent,
	],
	template: `
		<app-writer-frame>
			<div class="flex flex-wrap items-center justify-between gap-4">
				<app-breadcrumbs heading [items]="[{ label: config.title, translate: true }]" />
				@if (config.kind === 'stories') {
					<button class="btn btn--primary" (click)="newStory()" type="button">
						<span class="material-symbols-outlined" aria-hidden="true">add</span>
						<span [translate]="config.newLabel">{{ config.newLabel }}</span>
					</button>
				} @else {
					<a class="btn btn--primary" [routerLink]="config.editorPath">
						<span class="material-symbols-outlined" aria-hidden="true">add</span>
						<span [translate]="config.newLabel">{{ config.newLabel }}</span>
					</a>
				}
			</div>

			@if (status() === 'loading') {
				<p class="mt-8 text-[var(--c-text-muted)]" role="status" translate>Завантаження…</p>
			} @else if (status() === 'error') {
				<p class="writer-error mt-8" role="alert" translate>
					Не вдалося завантажити записи. Оновіть сторінку.
				</p>
			} @else {
				<section class="t-stack" [translate]="{ ariaLabel: 'Ваші записи' }">
					@if (mine().length) {
						<ul class="space-y-2">
							@for (item of mine(); track item.slug) {
								<li>
									<ng-container
										[ngTemplateOutlet]="card"
										[ngTemplateOutletContext]="{ $implicit: item }"
									/>
								</li>
							}
						</ul>
					} @else {
						<p class="leading-7 text-[var(--c-text-muted)]" translate>
							Ви ще нічого не написали в цьому розділі.
						</p>
					}
				</section>

				@if (others().length) {
					<section class="mt-12" aria-labelledby="writer-others">
						<h2
							id="writer-others"
							class="font-semibold text-[var(--c-text-strong)]"
							translate
						>
							Інші автори
						</h2>
						<ul class="mt-4 space-y-2">
							@for (item of others(); track item.slug) {
								<li>
									<ng-container
										[ngTemplateOutlet]="card"
										[ngTemplateOutletContext]="{ $implicit: item }"
									/>
								</li>
							}
						</ul>
					</section>
				}
			}

			<ng-template #card let-item>
				<a
					class="theme-focus t-card t-row"
					[routerLink]="config.editorPath"
					[queryParams]="{ slug: item.slug }"
				>
					<span class="min-w-0 flex-1 truncate t-item">{{ item.title }}</span>
					<span class="flex shrink-0 gap-x-3 pr-2 text-sm text-[var(--c-text-muted)]">
						@if (!item.mine) {
							<span>{{ item.ownerName }}</span>
						}
						@if (item.updatedAt) {
							<span>{{ item.updatedAt | date: 'd.MM.y' }}</span>
						}
					</span>
				</a>
			</ng-template>
		</app-writer-frame>
	`,
})
export class WriterListComponent {
	private readonly _writer = inject(WriterService);
	private readonly _firebase = inject(FirebaseService);
	private readonly _modal = inject(ModalService);
	private readonly _router = inject(Router);
	private readonly _kind: WriterKind = inject(ActivatedRoute).snapshot.data['writerKind'];

	protected readonly config = writerKindConfig(this._kind);
	protected readonly status = signal<'loading' | 'ready' | 'error'>('loading');
	protected readonly items = signal<WriterListItem[]>([]);
	protected readonly mine = computed(() => this.items().filter((item) => item.mine));
	protected readonly others = computed(() => this.items().filter((item) => !item.mine));

	constructor() {
		effect(() => {
			if (this._firebase.user()) {
				void this._load();
			}
		});
	}

	/** Name and description in a modal; once saved, the story page opens for adding chapters. */
	protected newStory() {
		this._modal.show({
			component: StoryFormComponent,
			size: 'mid',
			ariaLabelledBy: 'story-form-heading',
			closeOnBackdrop: false,
			saved: (slug: string) =>
				void this._router.navigate([this.config.editorPath], { queryParams: { slug } }),
		});
	}

	private async _load() {
		this.status.set('loading');

		try {
			this.items.set(await this._writer.list(this._kind));
			this.status.set('ready');
		} catch (error) {
			console.error(error);
			this.status.set('error');
		}
	}
}
