import { Component, signal } from '@angular/core';
import { TranslateDirective } from '@wawjs/ngx-translate';

/**
 * Released-format JSON for one draft, shown in an ngx-ui modal via `ModalService.show()`.
 * The modal assigns the plain properties below before the first render.
 */
@Component({
	imports: [TranslateDirective],
	template: `
		<div class="p-1">
			<h2 id="export-json-heading" class="t-heading" translate>JSON для коду</h2>
			<p class="writer-hint mt-2">
				<span [translate]="instruction">{{ instruction }}</span>
				<code class="ml-1">{{ target }}</code>
			</p>
			<p class="writer-hint" translate>
				Текст у мові автора: перекладіть поля ua та en після вставлення.
			</p>
			<textarea
				class="writer-input mt-3 font-mono text-sm"
				rows="14"
				readonly
				[value]="json"
				[translate]="{ ariaLabel: 'JSON для коду' }"
			></textarea>
			<div class="mt-4 flex flex-wrap justify-end gap-3">
				<button class="btn" (click)="close()" type="button">
					<span class="material-symbols-outlined" aria-hidden="true">close</span>
					<span translate>Закрити</span>
				</button>
				<button class="btn btn--primary" (click)="copy()" type="button">
					@if (copied()) {
						<span class="material-symbols-outlined" aria-hidden="true">check</span>
						<span translate>Скопійовано</span>
					} @else {
						<span class="material-symbols-outlined" aria-hidden="true"
							>content_copy</span
						>
						<span translate>Копіювати</span>
					}
				</button>
			</div>
		</div>
	`,
})
export class ExportJsonComponent {
	json = '';
	/** Where the JSON goes, e.g. `src/data/stories/<slug>.json`. */
	target = '';
	/** Ukrainian source text: "Save as" or "Add to the array in". */
	instruction = '';
	/** Provided by ModalService. */
	close: () => void = () => {};

	protected readonly copied = signal(false);

	protected async copy() {
		await navigator.clipboard.writeText(this.json);
		this.copied.set(true);
	}
}
