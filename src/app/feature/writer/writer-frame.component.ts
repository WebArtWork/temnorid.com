import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { FirebaseService } from '../firebase/firebase.service';
import { ModalService } from '@wawjs/ngx-ui';
import { LoginCardComponent } from './login-card.component';
import { SyncComponent } from './sync.component';
import { WorkshopGuideComponent } from './workshop-guide.component';
import { WRITER_GROUPS, WRITER_KINDS } from './writer.data';

/** Layout for every /write page: a sidebar with the sections and the author, and a sign-in gate. */
@Component({
	selector: 'app-writer-frame',
	imports: [LoginCardComponent, RouterLink, TranslateDirective],
	template: `
		<div class="mx-auto max-w-[var(--container)] px-4 sm:px-6 t-page">
			@if (!authReady()) {
				<p class="text-[var(--c-text-muted)]" role="status" translate>Завантаження…</p>
			} @else if (user(); as user) {
				<div class="lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-12">
					<aside
						class="mb-8 border-b border-[var(--c-border)] pb-4 lg:sticky lg:top-8 lg:mb-0 lg:self-start lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6"
					>
						<div class="mb-2 flex items-center justify-between gap-2 lg:pl-3">
							<p
								class="hidden text-sm font-semibold uppercase tracking-[0.08em] text-[var(--c-text-muted)] lg:block"
								translate
							>
								Майстерня
							</p>
							<div class="flex items-center">
								<button
									class="theme-interactive theme-focus inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[var(--c-text-muted)] hover:bg-[var(--c-bg-tertiary)] hover:text-[var(--c-text-strong)]"
									type="button"
									[translate]="{ ariaLabel: 'Синхронізація чернеток (JSON)' }"
									(click)="openSync()"
								>
									<span
										class="material-symbols-outlined text-[20px]"
										aria-hidden="true"
										>sync</span
									>
								</button>
								<button
									class="theme-interactive theme-focus inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[var(--c-text-muted)] hover:bg-[var(--c-bg-tertiary)] hover:text-[var(--c-text-strong)]"
									type="button"
									[translate]="{
										ariaLabel: 'Інструкція для чатів зі штучним інтелектом',
									}"
									(click)="openGuide()"
								>
									<span
										class="material-symbols-outlined text-[20px]"
										aria-hidden="true"
										>info</span
									>
								</button>
							</div>
						</div>
						<nav [translate]="{ ariaLabel: 'Розділи майстерні' }">
							<ul
								class="-mx-1 flex gap-1 overflow-x-auto px-1 lg:mx-0 lg:flex-col lg:gap-5 lg:overflow-visible lg:px-0"
							>
								@for (section of sections(); track section.group) {
									<li class="contents lg:block">
										@if (section.links.length > 1) {
											<p
												class="mb-1 hidden px-3 text-xs font-semibold text-[var(--c-text-muted)] lg:block"
												[translate]="section.title"
											>
												{{ section.title }}
											</p>
										}
										<ul class="contents lg:flex lg:flex-col lg:gap-1">
											@for (link of section.links; track link.key) {
												<li class="shrink-0">
													<a
														class="theme-interactive theme-focus flex min-h-11 items-center rounded-[var(--t-radius-btn)] px-3 font-medium text-[var(--c-text)] hover:bg-[var(--c-bg-tertiary)]"
														[class.writer-nav-active]="
															link.key === activeKey
														"
														[attr.aria-current]="
															link.key === activeKey ? 'page' : null
														"
														[routerLink]="link.path"
														[translate]="link.title"
													>
														{{ link.title }}
													</a>
												</li>
											}
										</ul>
									</li>
								}
							</ul>
						</nav>
						<div
							class="mt-4 flex items-center justify-between gap-3 text-sm lg:mt-8 lg:flex-col lg:items-start lg:border-t lg:border-[var(--c-border)] lg:px-3 lg:pt-6"
						>
							<span class="truncate text-[var(--c-text-muted)]">{{
								user.displayName ?? user.email
							}}</span>
							<button class="btn" (click)="signOut()" type="button">
								<span class="material-symbols-outlined" aria-hidden="true"
									>logout</span
								><span translate>Вийти</span>
							</button>
						</div>
					</aside>
					<div class="min-w-0">
						<ng-content />
					</div>
				</div>
			} @else {
				<app-login-card />
			}
		</div>
	`,
})
export class WriterFrameComponent {
	private readonly _firebase = inject(FirebaseService);
	private readonly _router = inject(Router);
	private readonly _modal = inject(ModalService);

	/**
	 * Sidebar sections. Stories also hold the open-gaps page; owners get a review section.
	 * A heading only shows when a section has more than one link.
	 */
	protected readonly sections = computed(() => [
		...WRITER_GROUPS.map((section) => ({
			...section,
			links: [
				...WRITER_KINDS.filter((config) => config.group === section.group).map(
					(config): SidebarLink => ({
						key: config.kind,
						title: config.title,
						path: config.listPath,
					}),
				),
				...(section.group === 'stories' ? [GAPS_LINK] : []),
			],
		})),
		...(this._firebase.isAdmin()
			? [{ group: 'review', title: 'Для власника', links: [REVIEW_LINK] }]
			: []),
	]);
	/**
	 * Link of the current page. Each page renders its own frame, so the URL is read once.
	 * Editors count as their list's link, and chapters as stories.
	 */
	protected readonly activeKey = _activeKey(this._router.url);
	protected readonly authReady = this._firebase.authReady;
	protected readonly user = this._firebase.user;

	/** All of the author's drafts as JSON, to edit or replace with an AI chat's output. */
	protected openSync() {
		this._modal.show({
			component: SyncComponent,
			size: 'big',
			ariaLabelledBy: 'sync-heading',
			closeOnBackdrop: false,
		});
	}

	/** `/workshop.md`, the guide an AI chat reads to write a sync object. */
	protected openGuide() {
		this._modal.show({
			component: WorkshopGuideComponent,
			size: 'big',
			ariaLabelledBy: 'workshop-guide-heading',
		});
	}

	protected async signOut() {
		await this._firebase.signOut();
		await this._router.navigateByUrl('/write/stories');
	}
}

interface SidebarLink {
	key: string;
	/** Ukrainian source text for the translate directive. */
	title: string;
	path: string;
}

const GAPS_LINK: SidebarLink = { key: 'gaps', title: 'Прогалини', path: '/write/gaps' };
const REVIEW_LINK: SidebarLink = { key: 'review', title: 'Огляд чернеток', path: '/write/review' };

function _activeKey(url: string): string {
	const path = url.split(/[?#]/)[0]!;

	if (path === GAPS_LINK.path || path === REVIEW_LINK.path) {
		return path === GAPS_LINK.path ? GAPS_LINK.key : REVIEW_LINK.key;
	}

	return (
		WRITER_KINDS.find((config) => path === config.listPath || path === config.editorPath)
			?.kind ?? 'stories'
	);
}
