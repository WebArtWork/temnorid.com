import { inject, Service } from '@angular/core';
import { SLUG_PATTERN, WRITER_LORE_KINDS, writerKindConfig } from './writer.data';
import {
	LoreDraft,
	SyncIssue,
	SyncLoreEntry,
	SyncRemoval,
	SyncResult,
	SyncStory,
	WorkshopSync,
	WriterAmount,
	WriterFieldDef,
	WriterFieldValue,
	WriterLoreKind,
} from './writer.interface';
import { WriterService } from './writer.service';

/** The same tags firestore.rules refuses in HTML: anything that loads an asset, and CSS url(). */
const ASSET_HTML =
	/<(img|picture|source|video|audio|track|iframe|frame|object|embed|svg|canvas|link|script|style|form|input)[\s/>]|url\(/i;
const LORE_KINDS = new Set<string>(WRITER_LORE_KINDS.map(({ kind }) => kind));

/** Validation messages, Ukrainian source text for the translate directive. */
const M = {
	notObject: 'Очікується JSON-об’єкт.',
	notList: 'Очікується список.',
	slug: 'Неправильна адреса (slug): лише малі латинські літери, цифри й дефіси.',
	title: 'Немає назви.',
	tooLong: 'Задовгий текст.',
	text: 'Очікується текст.',
	assets: 'Зображення, відео й вставки заборонені.',
	kind: 'Невідомий вид запису.',
	ref: 'Неправильне посилання: потрібно <вид>/<адреса>.',
	field: 'Цей вид запису не має такого поля.',
	value: 'Неправильне значення поля.',
	duplicate: 'Ця адреса вже є в цьому об’єкті.',
	released: 'Цей запис уже випущено; змінити його може лише власник проєкту в коді.',
	other: 'Ця адреса належить чернетці іншого автора.',
	failed: 'Не вдалося зберегти.',
};

/**
 * Checks a parsed sync object without touching Firestore. Returns the problems found;
 * an empty list means it can be applied.
 */
export function validateSync(value: unknown): SyncIssue[] {
	const issues: SyncIssue[] = [];
	const issue = (path: string, message: string) => issues.push({ path, message });

	if (!_isObject(value)) {
		issue('', M.notObject);
		return issues;
	}

	if (value['stories'] !== undefined) {
		_list(value['stories'], 'stories', issue, (story, path) => _story(story, path, issue));
		_unique(value['stories'], 'stories', issue);
	}

	if (value['lore'] !== undefined) {
		if (!_isObject(value['lore'])) {
			issue('lore', M.notObject);
		} else {
			for (const [kind, entries] of Object.entries(value['lore'])) {
				if (!LORE_KINDS.has(kind)) {
					issue(`lore.${kind}`, M.kind);
					continue;
				}

				_list(entries, `lore.${kind}`, issue, (entry, path) =>
					_lore(kind as WriterLoreKind, entry, path, issue),
				);
				_unique(entries, `lore.${kind}`, issue);
			}
		}
	}

	return issues;
}

/**
 * What applying `next` deletes: the drafts in `current` (the author's drafts as exported) that
 * `next` no longer lists. A story's chapters and gaps only count when the story stays, since
 * deleting a story takes them with it.
 */
export function syncRemovals(current: WorkshopSync, next: WorkshopSync): SyncRemoval[] {
	const removals: SyncRemoval[] = [];
	const nextStories = new Map((next.stories ?? []).map((story) => [story.slug, story]));

	for (const story of current.stories ?? []) {
		const kept = nextStories.get(story.slug);

		if (!kept) {
			removals.push({ path: `stories/${story.slug}`, kind: 'stories', slug: story.slug });
			continue;
		}

		for (const kind of ['chapters', 'gaps'] as const) {
			const listed = new Set((kept[kind] ?? []).map((item) => item.slug));

			for (const { slug } of story[kind] ?? []) {
				if (!listed.has(slug)) {
					removals.push({
						path: `stories/${story.slug}/${kind}/${slug}`,
						kind,
						story: story.slug,
						slug,
					});
				}
			}
		}
	}

	for (const [kind, entries] of Object.entries(current.lore ?? {}) as [
		WriterLoreKind,
		SyncLoreEntry[],
	][]) {
		const listed = new Set((next.lore?.[kind] ?? []).map((entry) => entry.slug));

		for (const { slug } of entries) {
			if (!listed.has(slug)) {
				removals.push({ path: `${kind}/${slug}`, kind, slug });
			}
		}
	}

	return removals;
}

/** Builds sync objects from the signed-in author's drafts and applies them back. */
@Service()
export class WriterSyncService {
	private readonly _writer = inject(WriterService);

	/** Every draft of the signed-in author, as one sync object. Released entries are left out. */
	async exportMine(): Promise<WorkshopSync> {
		const [stories, ...loreLists] = await Promise.all([
			this._writer.list('stories'),
			...WRITER_LORE_KINDS.map(({ kind }) => this._writer.list(kind)),
		]);
		const mine = <T extends { released: boolean; mine: boolean }>(items: T[]) =>
			items.filter((item) => !item.released && item.mine);
		const sync: WorkshopSync = { version: 1, stories: [], lore: {} };

		for (const item of mine(stories)) {
			const [story, chapters, gaps] = await Promise.all([
				this._writer.get('stories', item.slug),
				this._writer.chapters(item.slug),
				this._writer.gaps(item.slug),
			]);

			if (!story) {
				continue;
			}

			sync.stories!.push({
				slug: story.slug,
				title: story.title,
				summary: story.summary,
				fills: story.fills,
				chapters: chapters.map((chapter) => ({
					slug: chapter.slug,
					title: chapter.title,
					html: chapter.html,
					tags: chapter.tags,
				})),
				gaps: gaps.map((gap) => ({
					slug: gap.slug,
					title: gap.title,
					details: gap.details,
					...(gap.chapterSlug ? { chapterSlug: gap.chapterSlug } : {}),
				})),
			});
		}

		for (const [index, { kind }] of WRITER_LORE_KINDS.entries()) {
			const entries: SyncLoreEntry[] = [];

			for (const item of mine(loreLists[index]!)) {
				const draft = await this._writer.get(kind, item.slug);

				if (draft) {
					entries.push(_loreToSync(draft));
				}
			}

			if (entries.length) {
				sync.lore![kind] = entries;
			}
		}

		return sync;
	}

	/**
	 * Upserts everything in a valid sync object into the author's drafts, by slug, then deletes
	 * `removals` (from `syncRemovals()`). Released slugs and other authors' drafts are reported,
	 * not touched.
	 */
	async apply(sync: WorkshopSync, removals: SyncRemoval[]): Promise<SyncResult> {
		const result: SyncResult = { created: 0, updated: 0, removed: 0, failed: [] };
		const count = (outcome: 'created' | 'updated') => result[outcome]++;

		for (const [index, story] of (sync.stories ?? []).entries()) {
			const path = `stories[${index}]`;

			try {
				const owner = await this._writer.ownership('stories', story.slug);

				if (owner === 'released' || owner === 'other') {
					result.failed.push({
						path,
						message: owner === 'released' ? M.released : M.other,
					});
					continue;
				}

				const input = {
					title: story.title.trim(),
					summary: (story.summary ?? '').trim(),
					fills: story.fills ?? [],
				};

				if (owner === 'mine') {
					await this._writer.update('stories', story.slug, input);
					count('updated');
				} else {
					await this._writer.create('stories', story.slug, input);
					count('created');
				}

				await this._applyChapters(story, path, result);

				for (const [gapIndex, gap] of (story.gaps ?? []).entries()) {
					try {
						count(
							await this._writer.upsertGap(story.slug, gap.slug, {
								title: gap.title.trim(),
								details: (gap.details ?? '').trim(),
								chapterSlug: gap.chapterSlug ?? '',
							}),
						);
					} catch (error) {
						console.error(error);
						result.failed.push({
							path: `${path}.gaps[${gapIndex}]`,
							message: M.failed,
						});
					}
				}
			} catch (error) {
				console.error(error);
				result.failed.push({ path, message: M.failed });
			}
		}

		for (const [kind, entries] of Object.entries(sync.lore ?? {}) as [
			WriterLoreKind,
			SyncLoreEntry[],
		][]) {
			for (const [index, entry] of entries.entries()) {
				const path = `lore.${kind}[${index}]`;

				try {
					const owner = await this._writer.ownership(kind, entry.slug);

					if (owner === 'released' || owner === 'other') {
						result.failed.push({
							path,
							message: owner === 'released' ? M.released : M.other,
						});
						continue;
					}

					const input = {
						name: entry.name.trim(),
						role: (entry.role ?? '').trim(),
						summary: (entry.summary ?? '').trim(),
						html: entry.html ?? '',
						storySlugs: entry.storySlugs ?? [],
						related: entry.related ?? [],
						fields: entry.fields ?? {},
					};

					if (owner === 'mine') {
						await this._writer.update(kind, entry.slug, input);
						count('updated');
					} else {
						await this._writer.create(kind, entry.slug, input);
						count('created');
					}
				} catch (error) {
					console.error(error);
					result.failed.push({ path, message: M.failed });
				}
			}
		}

		for (const removal of removals) {
			try {
				if (removal.kind === 'chapters') {
					await this._writer.removeChapter(removal.story, removal.slug);
				} else if (removal.kind === 'gaps') {
					await this._writer.removeGap(removal.story, removal.slug);
				} else {
					await this._writer.remove(removal.kind, removal.slug);
				}

				result.removed++;
			} catch (error) {
				console.error(error);
				result.failed.push({ path: removal.path, message: M.failed });
			}
		}

		return result;
	}

	/** Listed chapters take reading positions 0, 1, 2… in the order given. */
	private async _applyChapters(story: SyncStory, path: string, result: SyncResult) {
		const listed = story.chapters ?? [];

		for (const [index, chapter] of listed.entries()) {
			try {
				const outcome = await this._writer.upsertChapter(story.slug, chapter.slug, index, {
					title: chapter.title.trim(),
					html: chapter.html ?? '',
					tags: chapter.tags ?? [],
				});

				result[outcome]++;
			} catch (error) {
				console.error(error);
				result.failed.push({ path: `${path}.chapters[${index}]`, message: M.failed });
			}
		}
	}
}

function _loreToSync(draft: LoreDraft): SyncLoreEntry {
	return {
		slug: draft.slug,
		name: draft.name,
		...(draft.role ? { role: draft.role } : {}),
		summary: draft.summary,
		html: draft.html,
		storySlugs: draft.storySlugs,
		related: draft.related,
		fields: draft.fields,
	};
}

type Issue = (path: string, message: string) => void;

function _story(story: unknown, path: string, issue: Issue) {
	if (!_isObject(story)) {
		return issue(path, M.notObject);
	}

	_slug(story['slug'], `${path}.slug`, issue);
	_required(story['title'], 160, `${path}.title`, issue);
	_optionalText(story['summary'], 1000, `${path}.summary`, issue);
	_refs(story['fills'], `${path}.fills`, issue, (ref) => /^[a-z0-9-]+\/[a-z0-9-]+$/.test(ref));

	if (story['chapters'] !== undefined) {
		_list(story['chapters'], `${path}.chapters`, issue, (chapter, chapterPath) => {
			if (!_isObject(chapter)) {
				return issue(chapterPath, M.notObject);
			}

			_slug(chapter['slug'], `${chapterPath}.slug`, issue);
			_required(chapter['title'], 160, `${chapterPath}.title`, issue);
			_html(chapter['html'], `${chapterPath}.html`, issue);
			_refs(chapter['tags'], `${chapterPath}.tags`, issue, _isLoreRef);
		});
		_unique(story['chapters'], `${path}.chapters`, issue);
	}

	if (story['gaps'] !== undefined) {
		_list(story['gaps'], `${path}.gaps`, issue, (gap, gapPath) => {
			if (!_isObject(gap)) {
				return issue(gapPath, M.notObject);
			}

			_slug(gap['slug'], `${gapPath}.slug`, issue);
			_required(gap['title'], 160, `${gapPath}.title`, issue);
			_optionalText(gap['details'], 2000, `${gapPath}.details`, issue);
			_optionalText(gap['chapterSlug'], 80, `${gapPath}.chapterSlug`, issue);
		});
		_unique(story['gaps'], `${path}.gaps`, issue);
	}
}

function _lore(kind: WriterLoreKind, entry: unknown, path: string, issue: Issue) {
	if (!_isObject(entry)) {
		return issue(path, M.notObject);
	}

	_slug(entry['slug'], `${path}.slug`, issue);
	_required(entry['name'], 120, `${path}.name`, issue);
	_optionalText(entry['role'], 160, `${path}.role`, issue);
	_optionalText(entry['summary'], 1000, `${path}.summary`, issue);
	_html(entry['html'], `${path}.html`, issue);
	_refs(entry['storySlugs'], `${path}.storySlugs`, issue, (slug) => SLUG_PATTERN.test(slug));
	_refs(entry['related'], `${path}.related`, issue, _isLoreRef);

	if (entry['fields'] === undefined) {
		return;
	}

	if (!_isObject(entry['fields'])) {
		return issue(`${path}.fields`, M.notObject);
	}

	const defs = new Map(writerKindConfig(kind).fields.map((field) => [field.key, field]));

	for (const [key, value] of Object.entries(entry['fields'])) {
		const field = defs.get(key);

		if (!field) {
			issue(`${path}.fields.${key}`, M.field);
		} else if (!_fieldValueOk(field, value as WriterFieldValue)) {
			issue(`${path}.fields.${key}`, M.value);
		}
	}
}

function _fieldValueOk(field: WriterFieldDef, value: WriterFieldValue): boolean {
	const inKinds = (ref: unknown) =>
		typeof ref === 'string' &&
		'kinds' in field &&
		field.kinds.some((kind) => ref.startsWith(`${kind}/`)) &&
		_isLoreRef(ref);

	switch (field.type) {
		case 'text':
			return typeof value === 'string' && value.length <= 300;
		case 'select':
			return (
				typeof value === 'string' && field.options.some((option) => option.value === value)
			);
		case 'ref':
			return field.multiple
				? Array.isArray(value) && value.every(inKinds)
				: typeof value === 'string' && inKinds(value);
		case 'amounts':
			return (
				Array.isArray(value) &&
				(value as WriterAmount[]).every(
					(row) =>
						_isObject(row) &&
						inKinds(row.ref) &&
						typeof row.amount === 'number' &&
						row.amount >= 0,
				)
			);
	}
}

function _list(
	value: unknown,
	path: string,
	issue: Issue,
	each: (item: unknown, path: string) => void,
) {
	if (!Array.isArray(value)) {
		return issue(path, M.notList);
	}

	value.forEach((item, index) => each(item, `${path}[${index}]`));
}

function _unique(value: unknown, path: string, issue: Issue) {
	if (!Array.isArray(value)) {
		return;
	}

	const seen = new Set<unknown>();

	value.forEach((item, index) => {
		const slug = _isObject(item) ? item['slug'] : undefined;

		if (seen.has(slug)) {
			issue(`${path}[${index}].slug`, M.duplicate);
		}

		seen.add(slug);
	});
}

function _slug(value: unknown, path: string, issue: Issue) {
	if (typeof value !== 'string' || value.length > 80 || !SLUG_PATTERN.test(value)) {
		issue(path, M.slug);
	}
}

function _required(value: unknown, max: number, path: string, issue: Issue) {
	if (typeof value !== 'string' || !value.trim()) {
		issue(path, M.title);
	} else if (value.length > max) {
		issue(path, M.tooLong);
	}
}

function _optionalText(value: unknown, max: number, path: string, issue: Issue) {
	if (value === undefined) {
		return;
	}

	if (typeof value !== 'string') {
		issue(path, M.text);
	} else if (value.length > max) {
		issue(path, M.tooLong);
	}
}

function _html(value: unknown, path: string, issue: Issue) {
	if (value === undefined) {
		return;
	}

	if (typeof value !== 'string') {
		issue(path, M.text);
	} else if (value.length > 300000) {
		issue(path, M.tooLong);
	} else if (ASSET_HTML.test(value)) {
		issue(path, M.assets);
	}
}

function _refs(value: unknown, path: string, issue: Issue, ok: (ref: string) => boolean) {
	if (value === undefined) {
		return;
	}

	if (!Array.isArray(value) || value.length > 100) {
		return issue(path, M.notList);
	}

	value.forEach((ref, index) => {
		if (typeof ref !== 'string' || !ok(ref)) {
			issue(`${path}[${index}]`, M.ref);
		}
	});
}

function _isLoreRef(ref: unknown): boolean {
	if (typeof ref !== 'string') {
		return false;
	}

	const [kind, slug, ...rest] = ref.split('/');

	return !rest.length && LORE_KINDS.has(kind ?? '') && SLUG_PATTERN.test(slug ?? '');
}

function _isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
