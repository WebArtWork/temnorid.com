import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { WriterService, writerErrorMessage } from './writer.service';

/**
 * Story name and description, shown in an ngx-ui modal via `ModalService.show()`.
 * The modal assigns the plain properties below before the first render.
 */
@Component({
	imports: [FormsModule, TranslateDirective],
	template: `
		<form class="p-1" (ngSubmit)="save()" novalidate>
			<h2 id="story-form-heading" class="t-heading">
				@if (slug) {
					<span translate>Редагувати історію</span>
				} @else {
					<span translate>Нова історія</span>
				}
			</h2>

			<div class="mt-6 space-y-5">
				<div>
					<label class="writer-label" for="story-form-title" translate>
						Назва історії
					</label>
					<input
						id="story-form-title"
						class="writer-input"
						name="title"
						type="text"
						autocomplete="off"
						maxlength="160"
						[ngModel]="titleValue()"
						(ngModelChange)="titleValue.set($event)"
						[attr.aria-invalid]="titleError()"
						[attr.aria-describedby]="titleError() ? 'story-form-title-error' : null"
					/>
					@if (titleError()) {
						<p id="story-form-title-error" class="writer-error" translate>
							Додайте назву історії.
						</p>
					}
				</div>

				<div>
					<label class="writer-label" for="story-form-summary" translate>
						Короткий опис
					</label>
					<textarea
						id="story-form-summary"
						class="writer-input"
						name="summary"
						rows="4"
						maxlength="1000"
						aria-describedby="story-form-summary-hint"
						[ngModel]="summaryValue()"
						(ngModelChange)="summaryValue.set($event)"
					></textarea>
					<p id="story-form-summary-hint" class="writer-hint" translate>
						Одне-два речення для картки і пошукових систем.
					</p>
				</div>
			</div>

			@if (saveError()) {
				<p class="writer-error mt-4" role="alert" [translate]="saveError()">
					{{ saveError() }}
				</p>
			}

			<div class="mt-6 flex flex-wrap justify-end gap-3">
				<button class="btn" (click)="close()" type="button">
					<span class="material-symbols-outlined" aria-hidden="true">close</span
					><span translate>Скасувати</span>
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
export class StoryFormComponent implements OnInit {
	private readonly _writer = inject(WriterService);

	/** Set for an existing story; empty creates a new one. */
	slug = '';
	title = '';
	summary = '';
	/** Called with the story slug after a successful save. */
	saved: (slug: string) => void = () => {};
	/** Provided by ModalService. */
	close: () => void = () => {};

	protected readonly titleValue = signal('');
	protected readonly summaryValue = signal('');
	protected readonly titleError = signal(false);
	protected readonly saving = signal(false);
	protected readonly saveError = signal('');

	ngOnInit() {
		this.titleValue.set(this.title);
		this.summaryValue.set(this.summary);
		setTimeout(() => document.getElementById('story-form-title')?.focus());
	}

	protected async save() {
		const input = { title: this.titleValue().trim(), summary: this.summaryValue().trim() };

		this.titleError.set(!input.title);

		if (!input.title) {
			document.getElementById('story-form-title')?.focus();
			return;
		}

		this.saving.set(true);
		this.saveError.set('');

		try {
			let slug = this.slug;

			if (slug) {
				await this._writer.update('stories', slug, input);
			} else {
				slug = await this._writer.freeSlug('stories', input.title);
				await this._writer.create('stories', slug, input);
			}

			this.saved(slug);
			this.close();
		} catch (error) {
			console.error(error);
			this.saveError.set(writerErrorMessage(error));
		} finally {
			this.saving.set(false);
		}
	}
}
