import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { CODEX_KINDS } from '../../feature/codex/codex.data';
import { CompanyService } from '../../feature/company/company.service';

interface FooterPageLink {
	label: string;
	path: string;
}

@Component({
	selector: 'app-footer',
	imports: [RouterLink, TranslateDirective],
	templateUrl: './footer.component.html',
})
export class FooterComponent {
	protected readonly company = inject(CompanyService).company;
	protected readonly currentYear = new Date().getFullYear();
	protected readonly pageLinks: FooterPageLink[] = [
		{
			label: 'Головна',
			path: '/',
		},
		{
			label: 'Історії',
			path: '/stories',
		},
		...CODEX_KINDS.map((config) => ({ label: config.title, path: `/${config.kind}` })),
	];
}
