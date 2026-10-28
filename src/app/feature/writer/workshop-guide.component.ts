import { isPlatformBrowser } from '@angular/common';
import { Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { AceComponent, registerAceMode, registerAceTheme } from '@wawjs/ngx-ace';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { SpinnerComponent } from '../../layouts/spinner/spinner.component';
import { ThemeService } from '@wawjs/ngx-ui';

registerAceMode('markdown', () => import('ace-builds/src-noconflict/mode-markdown'));
registerAceTheme('tomorrow_night', () => import('ace-builds/src-noconflict/theme-tomorrow_night'));

/** Where the build writes the guide (tools/workshop/generate-workshop-md.mjs). */
const GUIDE_URL = '/workshop.md';

/**
 * The guide modal: `/workshop.md` as is, read-only, to copy into an AI chat.
 * The file only exists in a build, so `ng serve` shows the load error.
 * Shown via `ModalService.show()`; the modal assigns `close` before the first render.
 */
@Component({
	imports: [AceComponent, SpinnerComponent, TranslateDirective],
	template: `
		<div class="p-1">
			<h2 id="workshop-guide-heading" class="t-heading" translate>
				Інструкція для чатів зі штучним інтелектом
			</h2>
			<p class="writer-hint mt-2">
				<a class="t-link" [href]="url" target="_blank" rel="noopener"
					>temnorid.com/workshop.md</a
				>
			</p>

			<div
				class="mt-4 h-[32rem] overflow-hidden rounded-[var(--t-radius)] border border-[var(--c-border)]"
			>
				@if (loading()) {
					<app-spinner />
				} @else if (error()) {
					<p class="writer-error p-4" role="alert" translate>
						Не вдалося завантажити інструкцію.
					</p>
				} @else {
					<ace
						[mode]="$any('markdown')"
						[theme]="$any(theme)"
						[config]="config"
						[ariaLabel]="'workshop.md'"
						[value]="markdown()"
					/>
				}
			</div>

			<div class="mt-4 flex flex-wrap justify-end gap-3">
				<button class="btn" (click)="close()" type="button">
					<span class="material-symbols-outlined" aria-hidden="true">close</span>
					<span translate>Закрити</span>
				</button>
				<button
					class="btn btn--primary"
					[disabled]="loading() || error()"
					(click)="copy()"
					type="button"
				>
					<span class="material-symbols-outlined" aria-hidden="true">{{
						copied() ? 'check' : 'content_copy'
					}}</span>
					@if (copied()) {
						<span translate>Скопійовано</span>
					} @else {
						<span translate>Скопіювати</span>
					}
				</button>
			</div>
		</div>
	`,
})
export class WorkshopGuideComponent implements OnInit {
	private readonly _isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

	/** Provided by ModalService. */
	close: () => void = () => {};

	protected readonly url = GUIDE_URL;
	protected readonly theme = inject(ThemeService).mode() === 'dark' ? 'tomorrow_night' : 'github';
	protected readonly config = {
		useWorker: false,
		readOnly: true,
		wrap: true,
		showPrintMargin: false,
		fontSize: 14,
	};
	protected readonly loading = signal(true);
	protected readonly error = signal(false);
	protected readonly copied = signal(false);
	protected readonly markdown = signal('');

	async ngOnInit() {
		if (!this._isBrowser) {
			return;
		}

		try {
			const response = await fetch(GUIDE_URL);

			// A dev server may answer a missing file with the app's index.html.
			if (!response.ok || response.headers.get('content-type')?.includes('text/html')) {
				throw new Error(`${GUIDE_URL}: ${response.status}`);
			}

			this.markdown.set(await response.text());
		} catch (error) {
			console.error(error);
			this.error.set(true);
		} finally {
			this.loading.set(false);
		}
	}

	protected async copy() {
		await navigator.clipboard.writeText(this.markdown());
		this.copied.set(true);
	}
}
