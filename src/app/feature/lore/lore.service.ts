import { computed, inject, Service } from '@angular/core';
import { LanguageService } from '@wawjs/ngx-translate';
import { LORE_ENTRIES, LORE_KINDS } from './lore.data';
import { LoreEntry, LoreKind, LocalizedLoreEntry } from './lore.interface';

@Service()
export class LoreService {
	private readonly _languageService = inject(LanguageService);

	readonly entries = computed(() => {
		const language = this._languageService.language();

		return LORE_KINDS.flatMap(({ kind }) =>
			LORE_ENTRIES[kind].map((entry) => _localize(kind, entry, language)),
		);
	});

	byKind(kind: LoreKind) {
		return computed(() => this.entries().filter((entry) => entry.kind === kind));
	}

	entry(kind: LoreKind, slug: string) {
		return computed(() => this._find(`${kind}/${slug}`));
	}

	/** Resolves `<kind>/<slug>` references, skipping any that do not exist. */
	related(kind: LoreKind, slug: string) {
		return computed(() =>
			(this._find(`${kind}/${slug}`)?.related ?? [])
				.map((path) => this._find(path))
				.filter((entry): entry is LocalizedLoreEntry => !!entry),
		);
	}

	inStory(storySlug: string) {
		return computed(() =>
			this.entries().filter((entry) => entry.storySlugs.includes(storySlug)),
		);
	}

	private _find(path: string) {
		return this.entries().find((entry) => `${entry.kind}/${entry.slug}` === path) ?? null;
	}
}

function _localize(kind: LoreKind, entry: LoreEntry, language: string): LocalizedLoreEntry {
	const content = entry.content[language] ?? entry.content.ua;

	return {
		...content,
		kind,
		slug: entry.slug,
		path: `/${kind}/${entry.slug}`,
		storySlugs: entry.storySlugs,
		related: entry.related,
	};
}
