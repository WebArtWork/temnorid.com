import { computed, inject, Service } from '@angular/core';
import { LanguageService } from '@wawjs/ngx-translate';
import { CODEX_ENTRIES, CODEX_KINDS } from './codex.data';
import { CodexEntry, CodexKind, LocalizedCodexEntry } from './codex.interface';

@Service()
export class CodexService {
	private readonly _languageService = inject(LanguageService);

	readonly entries = computed(() => {
		const language = this._languageService.language();

		return CODEX_KINDS.flatMap(({ kind }) =>
			CODEX_ENTRIES[kind].map((entry) => _localize(kind, entry, language)),
		);
	});

	byKind(kind: CodexKind) {
		return computed(() => this.entries().filter((entry) => entry.kind === kind));
	}

	entry(kind: CodexKind, slug: string) {
		return computed(() => this._find(`${kind}/${slug}`));
	}

	/** Resolves `<kind>/<slug>` references, skipping any that do not exist. */
	related(kind: CodexKind, slug: string) {
		return computed(() =>
			(this._find(`${kind}/${slug}`)?.related ?? [])
				.map((path) => this._find(path))
				.filter((entry): entry is LocalizedCodexEntry => !!entry),
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

function _localize(kind: CodexKind, entry: CodexEntry, language: string): LocalizedCodexEntry {
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
