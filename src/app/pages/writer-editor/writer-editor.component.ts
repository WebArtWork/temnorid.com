import { isPlatformBrowser } from '@angular/common';
import {
	Component,
	computed,
	effect,
	HostListener,
	inject,
	PLATFORM_ID,
	signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TinymceComponent, TinymceEditor } from '@wawjs/ngx-tinymce';
import { TranslateDirective, TranslateService } from '@wawjs/ngx-translate';
import { ThemeService } from '@wawjs/ngx-ui';
import { CODEX_KINDS } from '../../feature/codex/codex.data';
import { CodexKind } from '../../feature/codex/codex.interface';
import { BreadcrumbsComponent } from '../../layouts/breadcrumbs/breadcrumbs.component';
import { FirebaseService } from '../../feature/firebase/firebase.service';
import { WriterFrameComponent } from '../../feature/writer/writer-frame.component';
import { writerTinymceConfig } from '../../feature/writer/writer-tinymce';
import { writerKindConfig } from '../../feature/writer/writer.data';
import { codexToCode } from '../../feature/writer/writer.export';
import { CodexDraft, WriterReference } from '../../feature/writer/writer.interface';
import { WriterService, writerErrorMessage } from '../../feature/writer/writer.service';

type EditorFields = Pick<CodexDraft, 'name' | 'role' | 'summary' | 'html'>;

/**
 * /write/character, /write/location, /write/soldier, /write/building.
 * Without `?slug=` it creates a new entry; with it, it edits (or, for someone else's entry, shows) it.
 * Stories have their own page: /write/story.
 */
@Component({
	imports: [
		BreadcrumbsComponent,
		FormsModule,
		TinymceComponent,
		TranslateDirective,
		WriterFrameComponent,
	],
	templateUrl: './writer-editor.component.html',
})
export class WriterEditorComponent {
	private readonly _writer = inject(WriterService);
	private readonly _firebase = inject(FirebaseService);
	private readonly _router = inject(Router);
	private readonly _translate = inject(TranslateService);
	private readonly _theme = inject(ThemeService);
	private readonly _isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
	private readonly _route = inject(ActivatedRoute).snapshot;

	protected readonly kind: CodexKind = this._route.data['writerKind'];
	protected readonly config = writerKindConfig(this.kind);

	protected readonly status = signal<'loading' | 'ready' | 'missing' | 'error'>('loading');
	protected readonly existing = signal<CodexDraft | null>(null);
	protected readonly canEdit = computed(() => {
		const existing = this.existing();

		return !existing || existing.ownerUid === this._firebase.user()?.uid;
	});

	protected readonly current = signal<EditorFields>(_emptyFields());
	protected readonly storySlugs = signal<string[]>([]);
	protected readonly related = signal<string[]>([]);
	protected readonly references = signal<WriterReference[]>([]);
	protected readonly storyOptions = computed(() =>
		this.references().filter((reference) => reference.kind === 'stories'),
	);
	protected readonly relatedGroups = computed(() =>
		CODEX_KINDS.map((config) => ({
			config,
			options: this.references().filter(
				(reference) =>
					reference.kind === config.kind &&
					!(reference.kind === this.kind && reference.slug === this.existing()?.slug),
			),
		})).filter((group) => group.options.length),
	);

	protected readonly errors = signal<{ name?: string }>({});
	protected readonly saving = signal(false);
	protected readonly saveError = signal('');
	protected readonly savedAt = signal<Date | null>(null);
	protected readonly dirty = signal(false);
	protected readonly exportJson = signal('');
	protected readonly copied = signal(false);

	protected readonly bodyLabel = this._translate.translate('Опис');
	/**
	 * Built once: a new config makes the wrapper rebuild the editor, which can drop the text.
	 * The editor keeps the theme it opened with until the page is reloaded.
	 */
	protected readonly editorConfig = writerTinymceConfig(
		this._theme.mode() === 'dark',
		`${this._translate.translate('Абзац')()}=p; ${this._translate.translate('Підзаголовок')()}=h3`,
	);
	private _editorReady = false;

	constructor() {
		effect(() => {
			if (this._firebase.user() && this.status() === 'loading') {
				void this._load();
			}
		});
	}

	@HostListener('window:beforeunload', ['$event'])
	protected onBeforeUnload(event: BeforeUnloadEvent) {
		if (this.dirty()) {
			event.preventDefault();
		}
	}

	/** Used by the route's canDeactivate guard. */
	canLeave(): boolean {
		return (
			!this.dirty() ||
			!this._isBrowser ||
			confirm(this._translate.translate('Є незбережені зміни. Вийти без збереження?')())
		);
	}

	/** Puts the saved text back if the wrapper reported an empty change while starting. */
	protected onEditorReady(editor: TinymceEditor) {
		if (editor.getContent() !== this.current().html) {
			editor.setContent(this.current().html);
		}

		this._editorReady = true;
	}

	protected setField(name: keyof EditorFields, value: string) {
		// Before the editor is ready the wrapper can report an empty change; it is not the author's.
		if (name === 'html' && !this._editorReady) {
			return;
		}

		if (this.current()[name] === value) {
			return;
		}

		this.current.update((fields) => ({ ...fields, [name]: value }));
		this.dirty.set(true);
	}

	protected toggleReference(list: 'storySlugs' | 'related', value: string, checked: boolean) {
		this[list].update((values) =>
			checked ? [...values, value] : values.filter((item) => item !== value),
		);
		this.dirty.set(true);
	}

	protected async save() {
		if (!this.canEdit() || this.saving()) {
			return;
		}

		const name = this.current().name.trim();

		this.errors.set(name ? {} : { name: "Додайте ім'я або назву." });

		if (!name) {
			setTimeout(() => document.getElementById('writer-name')?.focus());
			return;
		}

		this.saving.set(true);
		this.saveError.set('');

		try {
			const input = {
				...this.current(),
				name,
				role: this.current().role.trim(),
				summary: this.current().summary.trim(),
				storySlugs: this.storySlugs(),
				related: this.related(),
			};
			let slug = this.existing()?.slug;

			if (slug) {
				await this._writer.update(this.kind, slug, input);
			} else {
				slug = await this._writer.freeSlug(this.kind, name);
				await this._writer.create(this.kind, slug, input);
				await this._router.navigate([], { queryParams: { slug }, replaceUrl: true });
			}

			this.existing.set(await this._writer.get(this.kind, slug));
			this.dirty.set(false);
			this.savedAt.set(new Date());
			this.exportJson.set('');
		} catch (error) {
			console.error(error);
			this.saveError.set(writerErrorMessage(error));
		} finally {
			this.saving.set(false);
		}
	}

	protected async remove() {
		const existing = this.existing();

		if (
			!existing ||
			!this.canEdit() ||
			!confirm(this._translate.translate('Видалити цей запис назавжди?')())
		) {
			return;
		}

		try {
			await this._writer.remove(this.kind, existing.slug);
			this.dirty.set(false);
			await this._router.navigateByUrl(this.config.listPath);
		} catch (error) {
			console.error(error);
			this.saveError.set(writerErrorMessage(error));
		}
	}

	protected showExport() {
		const existing = this.existing();

		if (existing) {
			this.exportJson.set(JSON.stringify(codexToCode(existing), null, '\t'));
			this.copied.set(false);
		}
	}

	protected async copyExport() {
		await navigator.clipboard.writeText(this.exportJson());
		this.copied.set(true);
	}

	protected exportTarget() {
		return `src/data/codex/${this.kind}.json`;
	}

	private async _load() {
		const slug = this._route.queryParamMap.get('slug');

		try {
			const [references, existing] = await Promise.all([
				this._writer.references(),
				slug ? this._writer.get(this.kind, slug) : Promise.resolve(null),
			]);

			this.references.set(references);

			if (slug && !existing) {
				this.status.set('missing');
				return;
			}

			if (existing) {
				this.existing.set(existing);
				this.current.set({
					name: existing.name,
					role: existing.role,
					summary: existing.summary,
					html: existing.html,
				});
				this.storySlugs.set(existing.storySlugs);
				this.related.set(existing.related);
			}

			this.status.set('ready');
		} catch (error) {
			console.error(error);
			this.status.set('error');
		}
	}
}

function _emptyFields(): EditorFields {
	return { name: '', role: '', summary: '', html: '' };
}
