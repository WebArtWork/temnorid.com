import { NgOptimizedImage } from '@angular/common';
import { Component } from '@angular/core';
import { TranslateDirective } from '@wawjs/ngx-translate';

/**
 * The logo with a turning gold ring, for any place that waits on data. It sits in the page flow,
 * so prerendered content is never covered, and follows the light or dark theme.
 */
@Component({
	selector: 'app-spinner',
	imports: [NgOptimizedImage, TranslateDirective],
	template: `
		<div class="spinner" role="status" aria-live="polite">
			<div class="spinner__mark">
				<span class="spinner__ring" aria-hidden="true"></span>
				<img class="spinner__logo" ngSrc="logo.png" width="64" height="64" alt="" />
			</div>
			<span class="sr-only" translate>Завантаження…</span>
		</div>
	`,
	styles: `
		:host {
			display: block;
		}

		.spinner {
			display: grid;
			place-items: center;
			padding-block: 2rem;
		}

		.spinner__mark {
			position: relative;
			display: grid;
			width: 6rem;
			height: 6rem;
			place-items: center;
		}

		.spinner__logo {
			width: 4rem;
			height: 4rem;
			border-radius: 50%;
		}

		/* A thin gold arc that turns around the logo. */
		.spinner__ring {
			position: absolute;
			inset: 0;
			border: 3px solid color-mix(in srgb, var(--c-primary) 20%, transparent);
			border-top-color: var(--c-primary);
			border-radius: 50%;
			animation: spinner-turn 1s linear infinite;
		}

		@keyframes spinner-turn {
			to {
				transform: rotate(1turn);
			}
		}

		@media (prefers-reduced-motion: reduce) {
			.spinner__ring {
				animation: spinner-glow 1.6s ease-in-out infinite alternate;
			}

			@keyframes spinner-glow {
				from {
					opacity: 0.4;
				}
			}
		}
	`,
})
export class SpinnerComponent {}
