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
import { WRITER_LORE_KINDS } from '../../feature/writer/writer.data';
import { ChapterDraft, StoryDraft, WriterReference } from '../../feature/writer/writer.interface';
import { WriterService, writerErrorMessage } from '../../feature/writer/writer.service';

/**
 * /write/chapter?story=<story>[&chapter=<chapter>]: one chapter of a story.
 * Without `chapter` it adds a new chapter at the end.
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
	templateUrl: './chapter-editor.component.html',
})
export class ChapterEditorComponent {
	private readonly _writer = inject(WriterService);
	private readonly _firebase = inject(FirebaseService);
	private readonly _router = inject(Router);
	private readonly _translate = inject(TranslateService);
	private readonly _theme = inject(ThemeService);
	private readonly _isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
	private readonly _query = inject(ActivatedRoute).snapshot.queryParamMap;

	/** What this collection is and where it is used, for the info button. */
	protected readonly info = WRITER_INFO.chapters;
	protected readonly status = signal<'loading' | 'ready' | 'missing' | 'error'>('loading');
	protected readonly story = signal<StoryDraft | null>(null);
	protected readonly chapter = signal<ChapterDraft | null>(null);
	protected readonly canEdit = computed(
		() => this.story()?.ownerUid === this._firebase.user()?.uid,
	);

	protected readonly current = signal({ title: '', html: '' });
	protected readonly tags = signal<string[]>([]);
	private readonly _references = signal<WriterReference[]>([]);
	/** Lore entries to tag, grouped by kind, from the code and from Firestore. */
	protected readonly tagGroups = computed(() =>
		WRITER_LORE_KINDS.map((config) => ({
			config,
			options: this._references().filter((reference) => reference.kind === config.kind),
		})).filter((group) => group.options.length),
	);

	protected readonly errors = signal<{ title?: string }>({});
	protected readonly saving = signal(false);
	protected readonly saveError = signal('');
	protected readonly savedAt = signal<Date | null>(null);
	protected readonly dirty = signal(false);

	protected readonly bodyLabel = this._translate.translate('Текст розділу');
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

	protected setField(name: 'title' | 'html', value: string) {
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

	protected toggleTag(value: string, checked: boolean) {
		this.tags.update((tags) =>
			checked ? [...tags, value] : tags.filter((tag) => tag !== value),
		);
		this.dirty.set(true);
	}

	protected async save() {
		const story = this.story();

		if (!story || !this.canEdit() || this.saving()) {
			return;
		}

		const title = this.current().title.trim();

		this.errors.set(title ? {} : { title: 'Додайте назву розділу.' });

		if (!title) {
			setTimeout(() => document.getElementById('chapter-title')?.focus());
			return;
		}

		this.saving.set(true);
		this.saveError.set('');

		try {
			const input = { title, html: this.current().html, tags: this.tags() };
			let slug = this.chapter()?.slug;

			if (slug) {
				await this._writer.updateChapter(story.slug, slug, input);
			} else {
				slug = await this._writer.createChapter(story.slug, input);
				await this._router.navigate([], {
					queryParams: { story: story.slug, chapter: slug },
					replaceUrl: true,
				});
			}

			this.chapter.set(await this._writer.chapter(story.slug, slug));
			this.dirty.set(false);
			this.savedAt.set(new Date());
		} catch (error) {
			console.error(error);
			this.saveError.set(writerErrorMessage(error));
		} finally {
			this.saving.set(false);
		}
	}

	protected async remove() {
		const story = this.story();
		const chapter = this.chapter();

		if (
			!story ||
			!chapter ||
			!this.canEdit() ||
			!confirm(this._translate.translate('Видалити цей розділ назавжди?')())
		) {
			return;
		}

		try {
			await this._writer.removeChapter(story.slug, chapter.slug);
			this.dirty.set(false);
			await this._router.navigate(['/write/story'], { queryParams: { slug: story.slug } });
		} catch (error) {
			console.error(error);
			this.saveError.set(writerErrorMessage(error));
		}
	}

	private async _load() {
		const storySlug = this._query.get('story');
		const chapterSlug = this._query.get('chapter');

		if (!storySlug) {
			this.status.set('missing');
			return;
		}

		try {
			const [story, chapters, references] = await Promise.all([
				this._writer.get('stories', storySlug),
				this._writer.chapters(storySlug),
				this._writer.references(),
			]);
			const chapter = chapters.find((item) => item.slug === chapterSlug) ?? null;

			if (!story || (chapterSlug && !chapter)) {
				this.status.set('missing');
				return;
			}

			this.story.set(story);
			this.chapter.set(chapter);
			this._references.set(references);

			if (chapter) {
				this.current.set({ title: chapter.title, html: chapter.html });
				this.tags.set(chapter.tags);
			}

			this.status.set('ready');
		} catch (error) {
			console.error(error);
			this.status.set('error');
		}
	}
}
