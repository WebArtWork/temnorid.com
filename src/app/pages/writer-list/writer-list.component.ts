import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { ModalService } from '@wawjs/ngx-ui';
import { BreadcrumbsComponent } from '../../layouts/breadcrumbs/breadcrumbs.component';
import { WriterInfoButtonComponent } from '../../feature/writer/writer-info.component';
import { WRITER_INFO } from '../../feature/writer/writer-info';
import { FirebaseService } from '../../feature/firebase/firebase.service';
import { StoryFormComponent } from '../../feature/writer/story-form.component';
import { WriterFrameComponent } from '../../feature/writer/writer-frame.component';
import { reviewStatusLabel, writerKindConfig } from '../../feature/writer/writer.data';
import { Review, WriterKind, WriterListItem } from '../../feature/writer/writer.interface';
import { WriterService } from '../../feature/writer/writer.service';

/**
 * /write/stories, /write/characters, ...: the author's own drafts, then what is released.
 * Other authors' drafts are only on the owners' review page. Drafts show the owner's decision;
 * released entries open on the public site, if the kind has one.
 */
@Component({
	imports: [
		BreadcrumbsComponent,
		WriterInfoButtonComponent,
		DatePipe,
		NgTemplateOutlet,
		RouterLink,
		TranslateDirective,
		WriterFrameComponent,
	],
	template: `
		<app-writer-frame>
			<div class="flex flex-wrap items-center justify-between gap-4">
				<app-breadcrumbs heading [items]="[{ label: config.title, translate: true }]">
					<app-writer-info-button [info]="info" />
				</app-breadcrumbs>
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

				@if (released().length) {
					<section class="mt-12" aria-labelledby="writer-released">
						<h2
							id="writer-released"
							class="font-semibold text-[var(--c-text-strong)]"
							translate
						>
							Випущено
						</h2>
						<ul class="mt-4 space-y-2">
							@for (item of released(); track item.slug) {
								<li>
									@if (config.public) {
										<a
											class="theme-focus t-card t-row"
											[routerLink]="publicPath(item)"
										>
											<span class="min-w-0 flex-1 truncate t-item">{{
												item.title
											}}</span>
											<span
												class="material-symbols-outlined pr-2 text-[20px] text-[var(--c-text-muted)]"
												aria-hidden="true"
												>open_in_new</span
											>
										</a>
									} @else {
										<div class="t-card t-row">
											<span class="min-w-0 flex-1 truncate t-item">{{
												item.title
											}}</span>
										</div>
									}
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
					<span
						class="flex shrink-0 flex-wrap justify-end gap-x-3 pr-2 text-sm text-[var(--c-text-muted)]"
					>
						@if (statusLabel(item); as label) {
							<span class="text-[var(--c-primary-text)]" [translate]="label">{{
								label
							}}</span>
						}
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
	/** What this collection is and where it is used, for the info button. */
	protected readonly info = WRITER_INFO[this._kind];
	protected readonly status = signal<'loading' | 'ready' | 'error'>('loading');
	protected readonly items = signal<WriterListItem[]>([]);
	protected readonly mine = computed(() =>
		this.items().filter((item) => !item.released && item.mine),
	);
	protected readonly released = computed(() => this.items().filter((item) => item.released));
	/** The owner's decisions on drafts, keyed by `<kind>/<slug>`. */
	private readonly _reviews = signal(new Map<string, Review>());

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

	/** The owner's decision on a draft, once there is one. */
	protected statusLabel(item: WriterListItem): string | null {
		const review = this._reviews().get(`${item.kind}/${item.slug}`);

		return review ? reviewStatusLabel(review.status) : null;
	}

	protected publicPath(item: WriterListItem): string {
		return `/${item.kind}/${item.slug}`;
	}

	private async _load() {
		this.status.set('loading');

		try {
			const [items, reviews] = await Promise.all([
				this._writer.list(this._kind),
				this._writer.reviews(),
			]);

			this.items.set(items);
			this._reviews.set(reviews);
			this.status.set('ready');
		} catch (error) {
			console.error(error);
			this.status.set('error');
		}
	}
}
