import { Component, inject, output, signal } from '@angular/core';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { FirebaseService } from '../firebase/firebase.service';

/** Google sign-in prompt, shown on /login and in place of any writer page while signed out. */
@Component({
	selector: 'app-login-card',
	imports: [TranslateDirective],
	template: `
		<div class="max-w-[30rem] t-card">
			<h1 class="t-heading" translate>Пишіть історії Темнороду</h1>
			<p class="mt-3 leading-7" translate>
				Увійдіть, щоб створювати історії, персонажів, локації, воїнів і будівлі. Найкращі з
				них стануть частиною світу.
			</p>
			<button
				class="btn btn--primary mt-6"
				[disabled]="busy()"
				(click)="signIn()"
				type="button"
			>
				<span class="material-symbols-outlined text-[20px]" aria-hidden="true">login</span>
				<span translate>Увійти через Google</span>
			</button>
			@if (error()) {
				<p class="writer-error" role="alert" translate>
					Не вдалося увійти. Спробуйте ще раз.
				</p>
			}
		</div>
	`,
})
export class LoginCardComponent {
	private readonly _firebase = inject(FirebaseService);

	readonly signedIn = output<void>();

	protected readonly busy = signal(false);
	protected readonly error = signal(false);

	protected async signIn() {
		this.busy.set(true);
		this.error.set(false);

		try {
			await this._firebase.signInWithGoogle();
			this.signedIn.emit();
		} catch (error) {
			// Closing the popup is a choice, not a failure.
			if ((error as { code?: string }).code !== 'auth/popup-closed-by-user') {
				this.error.set(true);
			}
		} finally {
			this.busy.set(false);
		}
	}
}
