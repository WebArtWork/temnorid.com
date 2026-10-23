import { isPlatformBrowser } from '@angular/common';
import { Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { AceComponent, registerAceMode, registerAceTheme } from '@wawjs/ngx-ace';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { ThemeService } from '@wawjs/ngx-ui';
import { syncRemovals, validateSync, WriterSyncService } from './writer-sync';
import { SyncIssue, SyncRemoval, SyncResult, WorkshopSync } from './writer.interface';
import { writerErrorMessage } from './writer.service';

registerAceMode('json', () => import('ace-builds/src-noconflict/mode-json'));
registerAceTheme('tomorrow_night', () => import('ace-builds/src-noconflict/theme-tomorrow_night'));

/**
 * The sync modal: the author's drafts as one JSON document in an ace editor.
 * Edit it, or paste one written by an AI chat from `/workshop.md`, then sync it back.
 * Drafts removed from the JSON are deleted, after the author confirms the list.
 * Shown via `ModalService.show()`; the modal assigns `close` before the first render.
 */
@Component({
	imports: [AceComponent, TranslateDirective],
	template: `
		<div class="p-1">
			<h2 id="sync-heading" class="t-heading" translate>Синхронізація</h2>
			<p class="writer-hint mt-2" translate>
				Тут усі ваші чернетки одним JSON. Змініть їх або вставте JSON, який написав чат зі
				штучним інтелектом. Чернетки, яких немає в JSON, буде видалено.
			</p>

			<div
				class="mt-4 h-[26rem] overflow-hidden rounded-[var(--t-radius)] border border-[var(--c-border)]"
			>
				@if (loading()) {
					<p class="p-4 text-[var(--c-text-muted)]" role="status" translate>
						Завантаження…
					</p>
				} @else {
					<ace
						[mode]="$any('json')"
						[theme]="$any(theme)"
						[config]="config"
						[ariaLabel]="'JSON'"
						[value]="json()"
						(valueChange)="onChange($event)"
					/>
				}
			</div>

			<div class="mt-4 min-h-6" aria-live="polite">
				@if (error()) {
					<p class="writer-error" role="alert" [translate]="error()">{{ error() }}</p>
				}
				@if (issues().length) {
					<p class="writer-error" role="alert" translate>
						Виправте перед синхронізацією:
					</p>
					<ul class="mt-2 max-h-40 space-y-1 overflow-y-auto text-sm">
						@for (issue of issues(); track $index) {
							<li>
								<code class="text-[var(--c-text-strong)]">{{
									issue.path || 'JSON'
								}}</code>
								— <span [translate]="issue.message">{{ issue.message }}</span>
							</li>
						}
					</ul>
				}
				@if (checked() && !issues().length && !result()) {
					@if (removals().length) {
						<p class="writer-error" role="alert" translate>Буде видалено назавжди:</p>
						<ul class="mt-2 max-h-40 space-y-1 overflow-y-auto text-sm">
							@for (removal of removals(); track removal.path) {
								<li>
									<code class="text-[var(--c-text-strong)]">{{
										removal.path
									}}</code>
								</li>
							}
						</ul>
					} @else {
						<p class="writer-hint" translate>Помилок немає. Можна синхронізувати.</p>
					}
				}
				@if (result(); as result) {
					<p class="font-semibold text-[var(--c-text-strong)]">
						<span translate>Створено</span>: {{ result.created }} ·
						<span translate>Оновлено</span>: {{ result.updated }} ·
						<span translate>Видалено</span>: {{ result.removed }}
					</p>
					@if (result.failed.length) {
						<ul class="mt-2 max-h-40 space-y-1 overflow-y-auto text-sm">
							@for (issue of result.failed; track $index) {
								<li class="writer-error mt-0">
									<code>{{ issue.path }}</code> —
									<span [translate]="issue.message">{{ issue.message }}</span>
								</li>
							}
						</ul>
					}
				}
			</div>

			<div class="mt-4 flex flex-wrap justify-end gap-3">
				<button class="btn" (click)="done()" type="button">
					<span class="material-symbols-outlined" aria-hidden="true">close</span>
					<span translate>Закрити</span>
				</button>
				<button
					class="btn"
					[disabled]="loading() || syncing()"
					(click)="check()"
					type="button"
				>
					<span class="material-symbols-outlined" aria-hidden="true">rule</span>
					<span translate>Перевірити</span>
				</button>
				<button
					class="btn btn--primary"
					[disabled]="loading() || syncing()"
					(click)="sync()"
					type="button"
				>
					@if (syncing()) {
						<span class="material-symbols-outlined animate-spin" aria-hidden="true"
							>progress_activity</span
						>
					} @else {
						<span class="material-symbols-outlined" aria-hidden="true">sync</span>
					}
					@if (confirming()) {
						<span translate>Видалити й синхронізувати</span>
					} @else {
						<span translate>Синхронізувати</span>
					}
				</button>
			</div>
		</div>
	`,
})
export class SyncComponent implements OnInit {
	private readonly _sync = inject(WriterSyncService);
	private readonly _isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

	/** Provided by ModalService. */
	close: () => void = () => {};

	protected readonly theme = inject(ThemeService).mode() === 'dark' ? 'tomorrow_night' : 'github';
	protected readonly config = {
		useWorker: false,
		tabSize: 2,
		wrap: true,
		showPrintMargin: false,
		fontSize: 14,
	};
	protected readonly loading = signal(true);
	protected readonly syncing = signal(false);
	protected readonly json = signal('');
	protected readonly issues = signal<SyncIssue[]>([]);
	protected readonly checked = signal(false);
	protected readonly error = signal('');
	protected readonly result = signal<SyncResult | null>(null);
	/** Drafts the checked JSON no longer lists. */
	protected readonly removals = signal<SyncRemoval[]>([]);
	/** The removals are on screen; the next sync click deletes them. */
	protected readonly confirming = signal(false);
	/** The drafts as last loaded or synced; removals are counted against it. */
	private _current: WorkshopSync = { version: 1, stories: [], lore: {} };
	private _text = '';
	private _changed = false;

	async ngOnInit() {
		try {
			this._current = await this._sync.exportMine();
			this._setText(JSON.stringify(this._current, null, 2));
		} catch (error) {
			console.error(error);
			this.error.set(writerErrorMessage(error));
			this._setText(JSON.stringify({ version: 1, stories: [], lore: {} }, null, 2));
		} finally {
			this.loading.set(false);
		}
	}

	protected onChange(text: string) {
		this._text = text;
		this.checked.set(false);
		this.issues.set([]);
		this.result.set(null);
		this.removals.set([]);
		this.confirming.set(false);
	}

	/** Parses and validates without saving. */
	protected check(): WorkshopSync | null {
		this.error.set('');
		this.result.set(null);
		this.removals.set([]);
		this.confirming.set(false);

		let parsed: unknown;

		try {
			parsed = JSON.parse(this._text);
		} catch {
			this.issues.set([{ path: '', message: 'Це не правильний JSON.' }]);
			this.checked.set(true);
			return null;
		}

		const issues = validateSync(parsed);

		this.issues.set(issues);
		this.checked.set(true);

		if (issues.length) {
			return null;
		}

		this.removals.set(syncRemovals(this._current, parsed as WorkshopSync));

		return parsed as WorkshopSync;
	}

	/** The first click with drafts to delete only lists them; the second one syncs. */
	protected async sync() {
		const confirmed = this.confirming();
		const parsed = this.check();

		if (!parsed) {
			return;
		}

		const removals = this.removals();

		if (removals.length && !confirmed) {
			this.confirming.set(true);
			return;
		}

		this.syncing.set(true);

		try {
			const result = await this._sync.apply(parsed, removals);

			this.result.set(result);
			this._current = parsed;
			this._changed ||= result.created + result.updated + result.removed > 0;
		} catch (error) {
			console.error(error);
			this.error.set(writerErrorMessage(error));
		} finally {
			this.syncing.set(false);
		}
	}

	/** Closes; reloads the page when drafts changed, so lists and editors show the new data. */
	protected done() {
		this.close();

		if (this._changed && this._isBrowser) {
			location.reload();
		}
	}

	private _setText(text: string) {
		this._text = text;
		this.json.set(text);
	}
}
