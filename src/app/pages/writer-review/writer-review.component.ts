import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { ModalService } from '@wawjs/ngx-ui';
import { FirebaseService } from '../../feature/firebase/firebase.service';
import { ExportJsonComponent } from '../../feature/writer/export-json.component';
import { WRITER_INFO } from '../../feature/writer/writer-info';
import { WriterInfoButtonComponent } from '../../feature/writer/writer-info.component';
import { WriterFrameComponent } from '../../feature/writer/writer-frame.component';
import { REVIEW_STATUSES, WRITER_KINDS, writerKindConfig } from '../../feature/writer/writer.data';
import { loreToCode, storyToCode } from '../../feature/writer/writer.export';
import {
	Review,
	ReviewStatus,
	WriterKind,
	WriterListItem,
} from '../../feature/writer/writer.interface';
import { WriterService, writerErrorMessage } from '../../feature/writer/writer.service';
import { BreadcrumbsComponent } from '../../layouts/breadcrumbs/breadcrumbs.component';

interface ReviewRow {
	item: WriterListItem;
	review: Review | null;
}

/**
 * /write/review: every draft in Firestore, for project owners to decide what is released next.
 * Owners set a status and a note, then copy the JSON into `src/data/` to release an entry.
 */
@Component({
	imports: [
		BreadcrumbsComponent,
		DatePipe,
		RouterLink,
		TranslateDirective,
		WriterFrameComponent,
		WriterInfoButtonComponent,
	],
	template: `
		<app-writer-frame>
			<app-breadcrumbs heading [items]="[{ label: 'Огляд чернеток', translate: true }]">
				<app-writer-info-button [info]="info" />
			</app-breadcrumbs>

			@if (!isAdmin()) {
				<div class="t-stack max-w-[40rem] t-card">
					<p class="leading-7" translate>
						Ця сторінка лише для власників проєкту: вони вирішують, які чернетки
						випустити.
					</p>
					<p class="writer-hint mt-3">
						<span translate>Щоб стати власником, додайте в Firestore документ</span>
						<code class="ml-1 break-all">admins/{{ uid() }}</code>
					</p>
				</div>
			} @else {
				@switch (status()) {
					@case ('loading') {
						<p class="t-stack text-[var(--c-text-muted)]" role="status" translate>
							Завантаження…
						</p>
					}
					@case ('error') {
						<p class="writer-error t-stack" role="alert" translate>
							Не вдалося завантажити записи. Оновіть сторінку.
						</p>
					}
					@case ('ready') {
						<div class="t-stack flex flex-wrap items-end gap-4">
							<div>
								<label class="writer-label" for="review-filter" translate
									>Показати</label
								>
								<select
									id="review-filter"
									class="writer-input"
									(change)="filter.set($any($event.target).value)"
								>
									<option value="" translate>Усі, крім відхилених</option>
									@for (option of statuses; track option.value) {
										<option [value]="option.value" [translate]="option.label">
											{{ option.label }}
										</option>
									}
								</select>
							</div>
							<p class="writer-hint pb-3">
								{{ visible().length }} <span translate>чернеток</span>
							</p>
						</div>

						@if (actionError()) {
							<p class="writer-error mt-4" role="alert" [translate]="actionError()">
								{{ actionError() }}
							</p>
						}

						@if (visible().length) {
							<ul class="mt-6 space-y-3">
								@for (row of visible(); track row.item.kind + '/' + row.item.slug) {
									<li class="t-card">
										<div
											class="flex flex-wrap items-start justify-between gap-3"
										>
											<div class="min-w-0">
												<p
													class="text-sm text-[var(--c-text-muted)]"
													[translate]="kindTitle(row.item.kind)"
												>
													{{ kindTitle(row.item.kind) }}
												</p>
												<a
													class="t-item hover:text-[var(--c-primary-text)]"
													[routerLink]="editorPath(row.item.kind)"
													[queryParams]="{ slug: row.item.slug }"
													>{{ row.item.title }}</a
												>
												<p class="text-sm text-[var(--c-text-muted)]">
													{{ row.item.ownerName }}
													@if (row.item.updatedAt) {
														· {{ row.item.updatedAt | date: 'd.MM.y' }}
													}
												</p>
											</div>
											<button
												class="btn"
												type="button"
												(click)="showJson(row.item)"
											>
												<span
													class="material-symbols-outlined"
													aria-hidden="true"
													>data_object</span
												>
												<span translate>JSON для коду</span>
											</button>
										</div>
										<div
											class="mt-4 grid gap-3 sm:grid-cols-[14rem_minmax(0,1fr)]"
										>
											<select
												class="writer-input"
												[translate]="{ ariaLabel: 'Рішення' }"
												(change)="
													save(
														row,
														$any($event.target).value,
														row.review?.note ?? ''
													)
												"
											>
												@for (option of statuses; track option.value) {
													<option
														[value]="option.value"
														[selected]="
															(row.review?.status ?? 'new') ===
															option.value
														"
														[translate]="option.label"
													>
														{{ option.label }}
													</option>
												}
											</select>
											<input
												class="writer-input"
												type="text"
												maxlength="1000"
												[translate]="{
													placeholder: 'Нотатка для автора…',
													ariaLabel: 'Нотатка для автора',
												}"
												[value]="row.review?.note ?? ''"
												(change)="
													save(
														row,
														row.review?.status ?? 'new',
														$any($event.target).value
													)
												"
											/>
										</div>
									</li>
								}
							</ul>
						} @else {
							<p class="writer-hint mt-6" translate>
								Чернеток із таким рішенням немає.
							</p>
						}
					}
				}
			}
		</app-writer-frame>
	`,
})
export class WriterReviewComponent {
	private readonly _writer = inject(WriterService);
	private readonly _firebase = inject(FirebaseService);
	private readonly _modal = inject(ModalService);

	protected readonly info = WRITER_INFO.review;
	protected readonly statuses = REVIEW_STATUSES;
	protected readonly isAdmin = this._firebase.isAdmin;
	protected readonly uid = computed(() => this._firebase.user()?.uid ?? '');
	protected readonly status = signal<'loading' | 'ready' | 'error'>('loading');
	protected readonly rows = signal<ReviewRow[]>([]);
	/** Empty shows everything except declined drafts. */
	protected readonly filter = signal<ReviewStatus | ''>('');
	protected readonly visible = computed(() => {
		const filter = this.filter();

		return this.rows().filter((row) => {
			const status = row.review?.status ?? 'new';

			return filter ? status === filter : status !== 'declined';
		});
	});
	protected readonly actionError = signal('');

	constructor() {
		effect(() => {
			if (this.isAdmin() && this.status() === 'loading') {
				void this._load();
			}
		});
	}

	protected kindTitle(kind: WriterKind): string {
		return writerKindConfig(kind).title;
	}

	protected editorPath(kind: WriterKind): string {
		return writerKindConfig(kind).editorPath;
	}

	protected async save(row: ReviewRow, status: ReviewStatus, note: string) {
		this.actionError.set('');

		try {
			await this._writer.setReview(row.item.kind, row.item.slug, status, note.trim());
			this.rows.update((rows) =>
				rows.map((item) =>
					item === row
						? {
								...item,
								review: {
									kind: row.item.kind,
									slug: row.item.slug,
									status,
									note: note.trim(),
									updatedAt: new Date(),
								},
							}
						: item,
				),
			);
		} catch (error) {
			console.error(error);
			this.actionError.set(writerErrorMessage(error));
		}
	}

	/** Builds the released-format JSON from the full draft and shows it in a modal. */
	protected async showJson(item: WriterListItem) {
		this.actionError.set('');

		try {
			let json: unknown;
			let target: string;
			let instruction: string;

			if (item.kind === 'stories') {
				const [story, chapters, gaps] = await Promise.all([
					this._writer.get('stories', item.slug),
					this._writer.chapters(item.slug),
					this._writer.gaps(item.slug),
				]);

				json = storyToCode(story!, chapters, gaps);
				target = `src/data/stories/${item.slug}.json`;
				instruction = 'Збережіть як файл і додайте його до STORIES у story.data.ts:';
			} else {
				json = loreToCode((await this._writer.get(item.kind, item.slug))!);
				target = `src/data/lore/${item.kind}.json`;
				instruction = 'Додайте до масиву у';
			}

			this._modal.show({
				component: ExportJsonComponent,
				size: 'big',
				ariaLabelledBy: 'export-json-heading',
				json: JSON.stringify(json, null, '\t'),
				target,
				instruction,
			});
		} catch (error) {
			console.error(error);
			this.actionError.set(writerErrorMessage(error));
		}
	}

	private async _load() {
		try {
			const [lists, reviews] = await Promise.all([
				Promise.all(WRITER_KINDS.map(({ kind }) => this._writer.list(kind, 'all'))),
				this._writer.reviews(),
			]);

			this.rows.set(
				lists
					.flat()
					.filter((item) => !item.released)
					.sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0))
					.map((item) => ({
						item,
						review: reviews.get(`${item.kind}/${item.slug}`) ?? null,
					})),
			);
			this.status.set('ready');
		} catch (error) {
			console.error(error);
			this.status.set('error');
		}
	}
}
