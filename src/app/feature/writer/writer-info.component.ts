import { Component, inject, input } from '@angular/core';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { ModalService } from '@wawjs/ngx-ui';
import { WriterInfo } from './writer-info';

/** Contents of the ngx-ui modal: what a collection is and where it is used. */
@Component({
	imports: [TranslateDirective],
	template: `
		<div class="p-1">
			<h2 id="writer-info-heading" class="t-heading" [translate]="info.title">
				{{ info.title }}
			</h2>
			<p class="mt-3 leading-7" [translate]="info.about">{{ info.about }}</p>

			<h3 class="mt-6 font-semibold text-[var(--c-text-strong)]" translate>
				Де використовується
			</h3>
			<dl class="mt-3 space-y-3">
				@for (use of info.uses; track use.where) {
					<div>
						<dt
							class="font-semibold text-[var(--c-text-strong)]"
							[translate]="use.where"
						>
							{{ use.where }}
						</dt>
						<dd class="leading-7" [translate]="use.how">{{ use.how }}</dd>
					</div>
				}
			</dl>

			<div class="mt-6 flex justify-end">
				<button class="btn" (click)="close()" type="button">
					<span class="material-symbols-outlined" aria-hidden="true">check</span>
					<span translate>Зрозуміло</span>
				</button>
			</div>
		</div>
	`,
})
export class WriterInfoComponent {
	/** Set by ModalService before the first render. */
	info!: WriterInfo;
	close: () => void = () => {};
}

/** Small info icon that opens the collection's explanation. */
@Component({
	selector: 'app-writer-info-button',
	imports: [TranslateDirective],
	template: `
		<button
			class="theme-interactive theme-focus inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[var(--c-text-muted)] hover:bg-[var(--c-bg-tertiary)] hover:text-[var(--c-text-strong)]"
			type="button"
			[translate]="{ ariaLabel: 'Що це і де використовується' }"
			(click)="open()"
		>
			<span class="material-symbols-outlined text-[20px]" aria-hidden="true">info</span>
		</button>
	`,
})
export class WriterInfoButtonComponent {
	private readonly _modal = inject(ModalService);

	readonly info = input.required<WriterInfo>();

	protected open() {
		this._modal.show({
			component: WriterInfoComponent,
			size: 'small',
			ariaLabelledBy: 'writer-info-heading',
			info: this.info(),
		});
	}
}
