import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { SpinnerComponent } from '../../layouts/spinner/spinner.component';
import { FirebaseService } from '../../feature/firebase/firebase.service';
import { WRITER_INFO } from '../../feature/writer/writer-info';
import { WriterInfoButtonComponent } from '../../feature/writer/writer-info.component';
import { WriterFrameComponent } from '../../feature/writer/writer-frame.component';
import { GapListItem } from '../../feature/writer/writer.interface';
import { WriterService } from '../../feature/writer/writer.service';
import { BreadcrumbsComponent } from '../../layouts/breadcrumbs/breadcrumbs.component';

/**
 * /write/gaps: what every story leaves unexplained, open gaps first.
 * A gap is filled when another story lists it on its own page.
 */
@Component({
	imports: [
		SpinnerComponent,
		BreadcrumbsComponent,
		NgTemplateOutlet,
		RouterLink,
		TranslateDirective,
		WriterFrameComponent,
		WriterInfoButtonComponent,
	],
	template: `
		<app-writer-frame>
			<app-breadcrumbs heading [items]="[{ label: 'Прогалини', translate: true }]">
				<app-writer-info-button [info]="info" />
			</app-breadcrumbs>

			@switch (status()) {
				@case ('loading') {
					<app-spinner />
				}
				@case ('error') {
					<p class="writer-error t-stack" role="alert" translate>
						Не вдалося завантажити записи. Оновіть сторінку.
					</p>
				}
				@case ('ready') {
					<section class="t-stack" aria-labelledby="gaps-open">
						<h2
							id="gaps-open"
							class="font-semibold text-[var(--c-text-strong)]"
							translate
						>
							Відкриті
						</h2>
						@if (open().length) {
							<ul class="mt-3 space-y-2">
								@for (gap of open(); track gap.ref) {
									<li class="t-card">
										<ng-container
											*ngTemplateOutlet="row; context: { $implicit: gap }"
										/>
									</li>
								}
							</ul>
						} @else {
							<p class="writer-hint mt-2" translate>
								Відкритих прогалин немає. Їх додають на сторінці історії.
							</p>
						}
					</section>

					@if (filled().length) {
						<section class="t-stack" aria-labelledby="gaps-filled">
							<h2
								id="gaps-filled"
								class="font-semibold text-[var(--c-text-strong)]"
								translate
							>
								Закриті
							</h2>
							<ul class="mt-3 space-y-2">
								@for (gap of filled(); track gap.ref) {
									<li class="t-card">
										<ng-container
											*ngTemplateOutlet="row; context: { $implicit: gap }"
										/>
									</li>
								}
							</ul>
						</section>
					}
				}
			}

			<ng-template #row let-gap>
				<p class="t-item">{{ gap.title }}</p>
				<p class="mt-1 text-sm text-[var(--c-text-muted)]">
					<a
						class="t-link"
						[routerLink]="storyPath(gap)"
						[queryParams]="storyQuery(gap)"
						>{{ gap.storyTitle }}</a
					>
					@if (gap.chapterTitle) {
						· {{ gap.chapterTitle }}
					}
				</p>
				@if (gap.details) {
					<p class="mt-2 leading-7">{{ gap.details }}</p>
				}
				@if (gap.filledBy.length) {
					<p class="mt-2 text-sm">
						<span class="text-[var(--c-text-muted)]" translate>Закриває</span>:
						@for (story of gap.filledBy; track story.slug; let last = $last) {
							<a
								class="t-link"
								[routerLink]="
									story.released ? '/stories/' + story.slug : '/write/story'
								"
								[queryParams]="story.released ? null : { slug: story.slug }"
								>{{ story.title }}</a
							>{{ last ? '' : ', ' }}
						}
					</p>
				}
			</ng-template>
		</app-writer-frame>
	`,
})
export class WriterGapsComponent {
	private readonly _writer = inject(WriterService);
	private readonly _firebase = inject(FirebaseService);

	protected readonly info = WRITER_INFO.gaps;
	protected readonly status = signal<'loading' | 'ready' | 'error'>('loading');
	protected readonly gaps = signal<GapListItem[]>([]);
	protected readonly open = computed(() => this.gaps().filter((gap) => !gap.filledBy.length));
	protected readonly filled = computed(() => this.gaps().filter((gap) => gap.filledBy.length));

	constructor() {
		effect(() => {
			if (this._firebase.user() && this.status() === 'loading') {
				void this._load();
			}
		});
	}

	/** Released stories open on the public site; drafts open in the workshop. */
	protected storyPath(gap: GapListItem): string {
		return gap.released ? `/stories/${gap.storySlug}` : '/write/story';
	}

	protected storyQuery(gap: GapListItem) {
		return gap.released ? null : { slug: gap.storySlug };
	}

	private async _load() {
		try {
			this.gaps.set(await this._writer.allGaps());
			this.status.set('ready');
		} catch (error) {
			console.error(error);
			this.status.set('error');
		}
	}
}
