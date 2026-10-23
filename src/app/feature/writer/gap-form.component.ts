import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { ChapterDraft } from './writer.interface';
import { WriterService, writerErrorMessage } from './writer.service';

/**
 * A story's gap, shown in an ngx-ui modal via `ModalService.show()`.
 * The modal assigns the plain properties below before the first render.
 */
@Component({
	imports: [FormsModule, TranslateDirective],
	template: `
		<form class="p-1" (ngSubmit)="save()" novalidate>
			<h2 id="gap-form-heading" class="t-heading">
				@if (gapSlug) {
					<span translate>Редагувати прогалину</span>
				} @else {
					<span translate>Нова прогалина</span>
				}
			</h2>
			<p class="writer-hint mt-2" translate>
				Що в цій історії лишається незрозумілим і має пояснитися в іншій.
			</p>

			<div class="mt-6 space-y-5">
				<div>
					<label class="writer-label" for="gap-form-title" translate>Питання</label>
					<input
						id="gap-form-title"
						class="writer-input"
						name="title"
						type="text"
						autocomplete="off"
						maxlength="160"
						[translate]="{ placeholder: 'Наприклад: Хто стукає в горі?' }"
						[ngModel]="titleValue()"
						(ngModelChange)="titleValue.set($event)"
						[attr.aria-invalid]="titleError()"
						[attr.aria-describedby]="titleError() ? 'gap-form-title-error' : null"
					/>
					@if (titleError()) {
						<p id="gap-form-title-error" class="writer-error" translate>
							Додайте питання.
						</p>
					}
				</div>

				<div>
					<label class="writer-label" for="gap-form-details" translate>Подробиці</label>
					<textarea
						id="gap-form-details"
						class="writer-input"
						name="details"
						rows="4"
						maxlength="2000"
						[ngModel]="detailsValue()"
						(ngModelChange)="detailsValue.set($event)"
					></textarea>
				</div>

				@if (chapters.length) {
					<div>
						<label class="writer-label" for="gap-form-chapter" translate>Розділ</label>
						<select
							id="gap-form-chapter"
							class="writer-input"
							name="chapter"
							[ngModel]="chapterValue()"
							(ngModelChange)="chapterValue.set($event)"
						>
							<option value="" translate>Уся історія</option>
							@for (chapter of chapters; track chapter.slug) {
								<option [value]="chapter.slug">{{ chapter.title }}</option>
							}
						</select>
					</div>
				}
			</div>

			@if (saveError()) {
				<p class="writer-error mt-4" role="alert" [translate]="saveError()">
					{{ saveError() }}
				</p>
			}

			<div class="mt-6 flex flex-wrap justify-end gap-3">
				<button class="btn" (click)="close()" type="button">
					<span class="material-symbols-outlined" aria-hidden="true">close</span>
					<span translate>Скасувати</span>
				</button>
				<button class="btn btn--primary" [disabled]="saving()" type="submit">
					@if (saving()) {
						<span class="material-symbols-outlined animate-spin" aria-hidden="true"
							>progress_activity</span
						>
					} @else {
						<span class="material-symbols-outlined" aria-hidden="true">save</span>
					}
					<span translate>Зберегти</span>
				</button>
			</div>
		</form>
	`,
})
export class GapFormComponent implements OnInit {
	private readonly _writer = inject(WriterService);

	storySlug = '';
	/** Set when editing; empty adds a new gap. */
	gapSlug = '';
	title = '';
	details = '';
	chapterSlug = '';
	chapters: ChapterDraft[] = [];
	saved: () => void = () => {};
	/** Provided by ModalService. */
	close: () => void = () => {};

	protected readonly titleValue = signal('');
	protected readonly detailsValue = signal('');
	protected readonly chapterValue = signal('');
	protected readonly titleError = signal(false);
	protected readonly saving = signal(false);
	protected readonly saveError = signal('');

	ngOnInit() {
		this.titleValue.set(this.title);
		this.detailsValue.set(this.details);
		this.chapterValue.set(this.chapterSlug);
		setTimeout(() => document.getElementById('gap-form-title')?.focus());
	}

	protected async save() {
		const input = {
			title: this.titleValue().trim(),
			details: this.detailsValue().trim(),
			chapterSlug: this.chapterValue(),
		};

		this.titleError.set(!input.title);

		if (!input.title) {
			document.getElementById('gap-form-title')?.focus();
			return;
		}

		this.saving.set(true);
		this.saveError.set('');

		try {
			if (this.gapSlug) {
				await this._writer.updateGap(this.storySlug, this.gapSlug, input);
			} else {
				await this._writer.createGap(this.storySlug, input);
			}

			this.saved();
			this.close();
		} catch (error) {
			console.error(error);
			this.saveError.set(writerErrorMessage(error));
		} finally {
			this.saving.set(false);
		}
	}
}
