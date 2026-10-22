import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateDirective, TranslateService } from '@wawjs/ngx-translate';
import { ModalService } from '@wawjs/ngx-ui';
import { BreadcrumbsComponent } from '../../layouts/breadcrumbs/breadcrumbs.component';
import { FirebaseService } from '../../feature/firebase/firebase.service';
import { StoryFormComponent } from '../../feature/writer/story-form.component';
import { WriterFrameComponent } from '../../feature/writer/writer-frame.component';
import { ChapterDraft, StoryDraft } from '../../feature/writer/writer.interface';
import { WriterService, writerErrorMessage } from '../../feature/writer/writer.service';

/**
 * /write/story?slug=<story>: a story's name, description and chapters.
 * Name and description are edited in a modal; chapter text on /write/chapter.
 */
@Component({
	imports: [BreadcrumbsComponent, RouterLink, TranslateDirective, WriterFrameComponent],
	templateUrl: './story-editor.component.html',
})
export class StoryEditorComponent {
	private readonly _writer = inject(WriterService);
	private readonly _firebase = inject(FirebaseService);
	private readonly _router = inject(Router);
	private readonly _translate = inject(TranslateService);
	private readonly _modal = inject(ModalService);
	private readonly _slug = inject(ActivatedRoute).snapshot.queryParamMap.get('slug');

	protected readonly status = signal<'loading' | 'ready' | 'missing' | 'error'>('loading');
	protected readonly story = signal<StoryDraft | null>(null);
	protected readonly chapters = signal<ChapterDraft[]>([]);
	protected readonly canEdit = computed(
		() => this.story()?.ownerUid === this._firebase.user()?.uid,
	);
	protected readonly reordering = signal(false);
	protected readonly actionError = signal('');

	constructor() {
		effect(() => {
			if (this._firebase.user() && this.status() === 'loading') {
				void this._load();
			}
		});
	}

	protected edit() {
		const story = this.story();

		if (!story) {
			return;
		}

		this._modal.show({
			component: StoryFormComponent,
			size: 'mid',
			ariaLabelledBy: 'story-form-heading',
			closeOnBackdrop: false,
			slug: story.slug,
			title: story.title,
			summary: story.summary,
			saved: async () => this.story.set(await this._writer.get('stories', story.slug)),
		});
	}

	protected async remove() {
		const story = this.story();

		if (
			!story ||
			!this.canEdit() ||
			!confirm(this._translate.translate('Видалити цей запис назавжди?')())
		) {
			return;
		}

		try {
			await this._writer.remove('stories', story.slug);
			await this._router.navigateByUrl('/write/stories');
		} catch (error) {
			console.error(error);
			this.actionError.set(writerErrorMessage(error));
		}
	}

	/** Moves a chapter one place up (-1) or down (+1) and saves the order right away. */
	protected async moveChapter(index: number, step: -1 | 1) {
		const story = this.story();
		const chapters = [...this.chapters()];
		const target = index + step;

		if (!story || target < 0 || target >= chapters.length || this.reordering()) {
			return;
		}

		[chapters[index], chapters[target]] = [chapters[target]!, chapters[index]!];
		this.chapters.set(chapters);
		this.reordering.set(true);
		this.actionError.set('');

		try {
			await this._writer.reorderChapters(
				story.slug,
				chapters.map((chapter) => chapter.slug),
			);
		} catch (error) {
			console.error(error);
			this.actionError.set(writerErrorMessage(error));
			this.chapters.set(await this._writer.chapters(story.slug));
		} finally {
			this.reordering.set(false);
		}
	}

	private async _load() {
		if (!this._slug) {
			this.status.set('missing');
			return;
		}

		try {
			const [story, chapters] = await Promise.all([
				this._writer.get('stories', this._slug),
				this._writer.chapters(this._slug),
			]);

			this.story.set(story);
			this.chapters.set(chapters);
			this.status.set(story ? 'ready' : 'missing');
		} catch (error) {
			console.error(error);
			this.status.set('error');
		}
	}
}
