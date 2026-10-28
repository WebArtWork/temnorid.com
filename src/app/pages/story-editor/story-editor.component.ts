import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateDirective, TranslateService } from '@wawjs/ngx-translate';
import { SpinnerComponent } from '../../layouts/spinner/spinner.component';
import { ModalService } from '@wawjs/ngx-ui';
import { BreadcrumbsComponent } from '../../layouts/breadcrumbs/breadcrumbs.component';
import { WriterInfoButtonComponent } from '../../feature/writer/writer-info.component';
import { WRITER_INFO } from '../../feature/writer/writer-info';
import { FirebaseService } from '../../feature/firebase/firebase.service';
import { GapFormComponent } from '../../feature/writer/gap-form.component';
import { StoryFormComponent } from '../../feature/writer/story-form.component';
import { WriterFrameComponent } from '../../feature/writer/writer-frame.component';
import {
	ChapterDraft,
	GapDraft,
	GapListItem,
	StoryDraft,
} from '../../feature/writer/writer.interface';
import { WriterService, writerErrorMessage } from '../../feature/writer/writer.service';

/**
 * /write/story?slug=<story>: a story's name, description, chapters and gaps, and which gaps of
 * other stories it fills. Name, description and gaps are edited in modals; chapters on
 * /write/chapter.
 */
@Component({
	imports: [
		SpinnerComponent,
		BreadcrumbsComponent,
		WriterInfoButtonComponent,
		RouterLink,
		TranslateDirective,
		WriterFrameComponent,
	],
	templateUrl: './story-editor.component.html',
})
export class StoryEditorComponent {
	private readonly _writer = inject(WriterService);
	private readonly _firebase = inject(FirebaseService);
	private readonly _router = inject(Router);
	private readonly _translate = inject(TranslateService);
	private readonly _modal = inject(ModalService);
	private readonly _slug = inject(ActivatedRoute).snapshot.queryParamMap.get('slug');

	/** What this collection is and where it is used, for the info button. */
	protected readonly info = WRITER_INFO.stories;
	protected readonly status = signal<'loading' | 'ready' | 'missing' | 'error'>('loading');
	protected readonly story = signal<StoryDraft | null>(null);
	protected readonly chapters = signal<ChapterDraft[]>([]);
	protected readonly canEdit = computed(
		() => this.story()?.ownerUid === this._firebase.user()?.uid,
	);
	protected readonly reordering = signal(false);
	/** What this story leaves unexplained. */
	protected readonly gaps = signal<GapDraft[]>([]);
	/** Gaps of other stories, released and draft, that this story could explain. */
	protected readonly otherGaps = signal<GapListItem[]>([]);
	protected readonly fills = computed(() => this.story()?.fills ?? []);
	protected readonly savingFills = signal(false);
	protected readonly gapsInfo = WRITER_INFO.gaps;
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

	protected addGap() {
		this._openGap();
	}

	protected editGap(gap: GapDraft) {
		this._openGap(gap);
	}

	protected async removeGap(gap: GapDraft) {
		const story = this.story();

		if (!story || !confirm(this._translate.translate('Видалити цю прогалину?')())) {
			return;
		}

		try {
			await this._writer.removeGap(story.slug, gap.slug);
			this.gaps.set(await this._writer.gaps(story.slug));
		} catch (error) {
			console.error(error);
			this.actionError.set(writerErrorMessage(error));
		}
	}

	protected chapterTitle(slug: string): string {
		return this.chapters().find((chapter) => chapter.slug === slug)?.title ?? '';
	}

	/** Marks a gap of another story as explained by this one, or not. Saved straight away. */
	protected async toggleFill(ref: string, checked: boolean) {
		const story = this.story();

		if (!story || this.savingFills()) {
			return;
		}

		const fills = checked
			? [...this.fills(), ref]
			: this.fills().filter((item) => item !== ref);

		this.savingFills.set(true);
		this.actionError.set('');

		try {
			await this._writer.updateFills(story.slug, fills);
			this.story.set({ ...story, fills });
		} catch (error) {
			console.error(error);
			this.actionError.set(writerErrorMessage(error));
		} finally {
			this.savingFills.set(false);
		}
	}

	private _openGap(gap?: GapDraft) {
		const story = this.story();

		if (!story) {
			return;
		}

		this._modal.show({
			component: GapFormComponent,
			size: 'mid',
			ariaLabelledBy: 'gap-form-heading',
			closeOnBackdrop: false,
			storySlug: story.slug,
			gapSlug: gap?.slug ?? '',
			title: gap?.title ?? '',
			details: gap?.details ?? '',
			chapterSlug: gap?.chapterSlug ?? '',
			chapters: this.chapters(),
			saved: async () => this.gaps.set(await this._writer.gaps(story.slug)),
		});
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
			const [story, chapters, gaps, allGaps] = await Promise.all([
				this._writer.get('stories', this._slug),
				this._writer.chapters(this._slug),
				this._writer.gaps(this._slug),
				this._writer.allGaps(),
			]);

			this.story.set(story);
			this.chapters.set(chapters);
			this.gaps.set(gaps);
			this.otherGaps.set(allGaps.filter((gap) => gap.storySlug !== this._slug));
			this.status.set(story ? 'ready' : 'missing');
		} catch (error) {
			console.error(error);
			this.status.set('error');
		}
	}
}
