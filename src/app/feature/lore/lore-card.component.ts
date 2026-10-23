import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LocalizedLoreEntry } from './lore.interface';

@Component({
	selector: 'app-lore-card',
	imports: [RouterLink],
	template: `
		<a
			class="theme-interactive theme-focus flex h-full flex-col t-card text-[var(--c-text)]"
			[routerLink]="entry().path"
		>
			<p class="text-sm text-[var(--c-text-muted)]">{{ entry().role }}</p>
			<h2 class="mt-2 t-item">
				{{ entry().name }}
			</h2>
			<p class="mt-3 leading-7">{{ entry().summary }}</p>
		</a>
	`,
})
export class LoreCardComponent {
	readonly entry = input.required<LocalizedLoreEntry>();
}
