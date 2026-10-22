import { Component, effect, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { FirebaseService } from '../../feature/firebase/firebase.service';
import { LoginCardComponent } from '../../feature/writer/login-card.component';

@Component({
	imports: [LoginCardComponent, TranslateDirective],
	template: `
		<section class="mx-auto max-w-[var(--container)] px-4 sm:px-6 t-page">
			@if (authReady()) {
				<app-login-card />
			} @else {
				<p class="text-[var(--c-text-muted)]" role="status" translate>Завантаження…</p>
			}
		</section>
	`,
})
export class LoginComponent {
	private readonly _firebase = inject(FirebaseService);
	private readonly _router = inject(Router);
	private readonly _route = inject(ActivatedRoute);

	protected readonly authReady = this._firebase.authReady;

	constructor() {
		// Already signed in: go straight to the workshop.
		effect(() => {
			if (this._firebase.user()) {
				this.continue();
			}
		});
	}

	protected continue() {
		const next = this._route.snapshot.queryParamMap.get('next');

		// Only follow local writer paths, never an absolute URL from the query string.
		void this._router.navigateByUrl(next?.startsWith('/write/') ? next : '/write/stories');
	}
}
