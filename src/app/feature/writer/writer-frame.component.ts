import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { FirebaseService } from '../firebase/firebase.service';
import { LoginCardComponent } from './login-card.component';
import { WRITER_KINDS } from './writer.data';
import { WriterKind } from './writer.interface';

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
						<p
							class="mb-2 hidden px-3 text-sm font-semibold uppercase tracking-[0.08em] text-[var(--c-text-muted)] lg:block"
							translate
						>
							Майстерня
						</p>
						<nav [translate]="{ ariaLabel: 'Розділи майстерні' }">
							<ul
								class="-mx-1 flex gap-1 overflow-x-auto px-1 lg:mx-0 lg:flex-col lg:px-0"
							>
								@for (link of kinds; track link.kind) {
									<li class="shrink-0">
										<a
											class="theme-interactive theme-focus flex min-h-11 items-center rounded-[var(--t-radius-btn)] px-3 font-medium text-[var(--c-text)] hover:bg-[var(--c-bg-tertiary)]"
											[class.writer-nav-active]="link.kind === activeKind"
											[attr.aria-current]="
												link.kind === activeKind ? 'page' : null
											"
											[routerLink]="link.listPath"
											[translate]="link.title"
										>
											{{ link.title }}
										</a>
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

	protected readonly kinds = WRITER_KINDS;
	/**
	 * Section of the current page. Each page renders its own frame, so the URL is read once.
	 * Editors count as their list's section, and chapters as stories.
	 */
	protected readonly activeKind = _activeKind(this._router.url);
	protected readonly authReady = this._firebase.authReady;
	protected readonly user = this._firebase.user;

	protected async signOut() {
		await this._firebase.signOut();
		await this._router.navigateByUrl('/write/stories');
	}
}

function _activeKind(url: string): WriterKind {
	const path = url.split(/[?#]/)[0]!;

	return (
		WRITER_KINDS.find((config) => path === config.listPath || path === config.editorPath)
			?.kind ?? 'stories'
	);
}
