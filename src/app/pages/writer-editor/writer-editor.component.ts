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
import { SpinnerComponent } from '../../layouts/spinner/spinner.component';
import { ThemeService } from '@wawjs/ngx-ui';
import { BreadcrumbsComponent } from '../../layouts/breadcrumbs/breadcrumbs.component';
import { WriterInfoButtonComponent } from '../../feature/writer/writer-info.component';
import { WRITER_INFO } from '../../feature/writer/writer-info';
import { FirebaseService } from '../../feature/firebase/firebase.service';
import { WriterFrameComponent } from '../../feature/writer/writer-frame.component';
import { WRITER_TINYMCE_PROVIDER, writerTinymceConfig } from '../../feature/writer/writer-tinymce';
import { WRITER_LORE_KINDS, writerKindConfig } from '../../feature/writer/writer.data';
import { loreToCode } from '../../feature/writer/writer.export';
import {
	LoreDraft,
	WriterAmount,
	WriterLoreKind,
	WriterFieldDef,
	WriterFieldValue,
	WriterReference,
} from '../../feature/writer/writer.interface';
import { WriterService, writerErrorMessage } from '../../feature/writer/writer.service';

type EditorFields = Pick<LoreDraft, 'name' | 'role' | 'summary' | 'html'>;

/**
 * Editor for every world-entry kind: /write/character, /write/faction, /write/item and so on.
 * Name, summary and description are shared; the rest comes from the kind's `fields` config.
 * Without `?slug=` it creates a new entry; with it, it edits (or, for someone else's entry, shows) it.
 * Stories have their own page: /write/story.
 */
@Component({
	providers: [WRITER_TINYMCE_PROVIDER],
	imports: [
		SpinnerComponent,
		BreadcrumbsComponent,
		WriterInfoButtonComponent,
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

	protected readonly kind: WriterLoreKind = this._route.data['writerKind'];
	protected readonly config = writerKindConfig(this.kind);

	/** What this collection is and where it is used, for the info button. */
	protected readonly info = WRITER_INFO[this.kind];
	protected readonly status = signal<'loading' | 'ready' | 'missing' | 'error'>('loading');
	protected readonly existing = signal<LoreDraft | null>(null);
	protected readonly canEdit = computed(() => {
		const existing = this.existing();

		return !existing || existing.ownerUid === this._firebase.user()?.uid;
	});

	protected readonly current = signal<EditorFields>(_emptyFields());
	protected readonly storySlugs = signal<string[]>([]);
	protected readonly related = signal<string[]>([]);
	/** Values of the kind's extra fields, keyed by field key. */
	protected readonly fieldValues = signal<Record<string, WriterFieldValue>>({});
	protected readonly references = signal<WriterReference[]>([]);
	protected readonly storyOptions = computed(() =>
		this.references().filter((reference) => reference.kind === 'stories'),
	);
	protected readonly relatedGroups = computed(() =>
		WRITER_LORE_KINDS.map((config) => ({
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

	/** Entries a field can link to, grouped by kind. */
	protected fieldOptions(field: WriterFieldDef & { kinds: WriterLoreKind[] }) {
		return field.kinds
			.map((kind) => ({
				config: writerKindConfig(kind),
				options: this.references().filter(
					(reference) =>
						reference.kind === kind &&
						!(kind === this.kind && reference.slug === this.existing()?.slug),
				),
			}))
			.filter((group) => group.options.length);
	}

	protected text(key: string): string {
		const value = this.fieldValues()[key];

		return typeof value === 'string' ? value : '';
	}

	protected refs(key: string): string[] {
		const value = this.fieldValues()[key];

		return Array.isArray(value) ? (value as string[]) : [];
	}

	protected amounts(key: string): WriterAmount[] {
		const value = this.fieldValues()[key];

		return Array.isArray(value) ? (value as WriterAmount[]) : [];
	}

	protected setValue(key: string, value: WriterFieldValue) {
		this.fieldValues.update((values) => ({ ...values, [key]: value }));
		this.dirty.set(true);
	}

	protected toggleRef(key: string, value: string, checked: boolean) {
		const refs = this.refs(key);

		this.setValue(key, checked ? [...refs, value] : refs.filter((ref) => ref !== value));
	}

	protected addAmount(key: string) {
		this.setValue(key, [...this.amounts(key), { ref: '', amount: 1 }]);
	}

	protected updateAmount(key: string, index: number, change: Partial<WriterAmount>) {
		this.setValue(
			key,
			this.amounts(key).map((row, i) => (i === index ? { ...row, ...change } : row)),
		);
	}

	protected removeAmount(key: string, index: number) {
		this.setValue(
			key,
			this.amounts(key).filter((_, i) => i !== index),
		);
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
				fields: this._cleanFields(),
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

		if (existing && this.config.public) {
			this.exportJson.set(JSON.stringify(loreToCode(existing), null, '\t'));
			this.copied.set(false);
		}
	}

	protected async copyExport() {
		await navigator.clipboard.writeText(this.exportJson());
		this.copied.set(true);
	}

	protected exportTarget() {
		return `src/data/lore/${this.kind}.json`;
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
				this.fieldValues.set(existing.fields);
			}

			this.status.set('ready');
		} catch (error) {
			console.error(error);
			this.status.set('error');
		}
	}

	/** Field values to save: trimmed text, no empty values, no amount rows without an entry. */
	private _cleanFields(): Record<string, WriterFieldValue> {
		const fields: Record<string, WriterFieldValue> = {};

		for (const field of this.config.fields) {
			const value = this.fieldValues()[field.key];

			if (field.type === 'amounts') {
				const rows = this.amounts(field.key)
					.filter((row) => row.ref)
					.map((row) => ({ ref: row.ref, amount: Math.max(0, Number(row.amount) || 0) }));

				if (rows.length) {
					fields[field.key] = rows;
				}
			} else if (Array.isArray(value)) {
				if (value.length) {
					fields[field.key] = value;
				}
			} else if (typeof value === 'string' && value.trim()) {
				fields[field.key] = value.trim();
			}
		}

		return fields;
	}
}

function _emptyFields(): EditorFields {
	return { name: '', role: '', summary: '', html: '' };
}
