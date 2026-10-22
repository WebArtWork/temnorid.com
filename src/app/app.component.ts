import { DOCUMENT } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Meta } from '@angular/platform-browser';
import { filter } from 'rxjs';
import { buildAbsoluteUrl, CanonicalService } from '@wawjs/ngx-default';
import { companyProfile } from './feature/company/company.data';
import { LanguageService } from '@wawjs/ngx-translate';
import { environment } from '../environments/environment';
import { FooterComponent } from './layouts/footer/footer.component';
import { TopbarComponent } from './layouts/topbar/topbar.component';

@Component({
	selector: 'app-root',
	imports: [RouterOutlet, TopbarComponent, FooterComponent],
	template: `
		<div class="flex min-h-screen flex-col">
			<app-topbar />
			<main class="flex-1">
				<router-outlet />
			</main>
			<app-footer />
		</div>
	`,
})
export class App {
	private readonly _meta = inject(Meta);
	private readonly _router = inject(Router);
	private readonly _canonicalService = inject(CanonicalService);
	private readonly _document = inject(DOCUMENT);
	private readonly _languageService = inject(LanguageService);

	constructor() {
		this._canonicalService.initialize();
		this._router.events
			.pipe(
				filter((event): event is NavigationEnd => event instanceof NavigationEnd),
				takeUntilDestroyed(),
			)
			.subscribe((event) => {
				const path = event.urlAfterRedirects.split(/[?#]/)[0];
				this._meta.updateTag({
					property: 'og:url',
					content:
						path === '/' ? companyProfile.siteUrl : buildAbsoluteUrl(companyProfile.siteUrl, path)!,
				});
			});

		effect(() => {
			const language = this._languageService.language();
			const htmlLang =
				environment.languages.find((item) => item.code === language)?.htmlLang ?? language;

			if (htmlLang) {
				this._document.documentElement.lang = htmlLang;
			}
		});
	}
}
