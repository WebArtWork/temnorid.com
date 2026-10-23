import { NgTemplateOutlet } from '@angular/common';
import { booleanAttribute, Component, input } from '@angular/core';
import { Params, RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';

export interface Crumb {
	label: string;
	link?: string;
	queryParams?: Params;
	/** True when `label` is Ukrainian source text to translate, e.g. a section name. */
	translate?: boolean;
}

/**
 * Parent pages as links, then the current page as plain text.
 * With `heading`, the current page is the page's h1 (workshop pages, which have no big title).
 */
@Component({
	selector: 'app-breadcrumbs',
	imports: [NgTemplateOutlet, RouterLink, TranslateDirective],
	template: `
		<nav class="flex min-w-0 items-center gap-1" [translate]="{ ariaLabel: 'Навігація' }">
			<ol class="t-breadcrumbs">
				@for (crumb of items(); track $index; let first = $first, last = $last) {
					<li [attr.aria-current]="last ? 'page' : null">
						@if (!first) {
							<span class="material-symbols-outlined" aria-hidden="true">
								chevron_right
							</span>
						}
						@if (!last && crumb.link) {
							<a
								class="theme-focus"
								[routerLink]="crumb.link"
								[queryParams]="crumb.queryParams"
							>
								<ng-container
									[ngTemplateOutlet]="label"
									[ngTemplateOutletContext]="{ $implicit: crumb }"
								/>
							</a>
						} @else if (last && heading()) {
							<h1>
								<ng-container
									[ngTemplateOutlet]="label"
									[ngTemplateOutletContext]="{ $implicit: crumb }"
								/>
							</h1>
						} @else {
							<span class="t-breadcrumbs__current">
								<ng-container
									[ngTemplateOutlet]="label"
									[ngTemplateOutletContext]="{ $implicit: crumb }"
								/>
							</span>
						}
					</li>
				}
			</ol>
			<!-- Extra controls after the current page, e.g. an info button. -->
			<ng-content />
		</nav>

		<ng-template #label let-crumb>
			@if (crumb.translate) {
				<span [translate]="crumb.label">{{ crumb.label }}</span>
			} @else {
				{{ crumb.label }}
			}
		</ng-template>
	`,
})
export class BreadcrumbsComponent {
	readonly items = input.required<Crumb[]>();
	readonly heading = input(false, { transform: booleanAttribute });
}
