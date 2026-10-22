import { inject, Service } from '@angular/core';
import {
	collection,
	deleteDoc,
	deleteField,
	doc,
	DocumentData,
	getDoc,
	getDocs,
	serverTimestamp,
	setDoc,
	Timestamp,
	updateDoc,
	writeBatch,
} from 'firebase/firestore';
import { CODEX_ENTRIES, CODEX_KINDS } from '../codex/codex.data';
import { FirebaseService } from '../firebase/firebase.service';
import { STORIES } from '../story/story.data';
import { toSlug } from './writer.data';
import {
	ChapterDraft,
	CodexDraft,
	StoryDraft,
	WriterDraft,
	WriterKind,
	WriterListItem,
	WriterReference,
} from './writer.interface';

/** Fields the author edits. Owner, slug and timestamps are set by the service. */
export type StoryDraftInput = Pick<StoryDraft, 'title' | 'summary'>;
export type CodexDraftInput = Pick<
	CodexDraft,
	'name' | 'role' | 'summary' | 'html' | 'storySlugs' | 'related'
>;
export type ChapterDraftInput = Pick<ChapterDraft, 'title' | 'html' | 'tags'>;

/**
 * Entries saved before the single-language change kept their text under `content.ua`.
 * Every write removes that field, because the rules only allow the current fields.
 */
const _DROP_LEGACY = { content: deleteField() };

/** A save or delete error as a message for the author (Ukrainian source text). */
export function writerErrorMessage(error: unknown): string {
	return (error as { code?: string })?.code === 'permission-denied'
		? 'Firestore відхилив зміни: немає прав або дані не пройшли перевірку.'
		: "Не вдалося зберегти. Перевірте з'єднання і спробуйте ще раз.";
}

/** Firestore access for the story writer: stories with their chapters, and the four codex kinds. */
@Service()
export class WriterService {
	private readonly _firebase = inject(FirebaseService);

	/** Every entry of a kind, newest first, with the signed-in author's own marked. */
	async list(kind: WriterKind): Promise<WriterListItem[]> {
		const uid = this._firebase.user()?.uid;
		const snapshot = await getDocs(collection(this._firebase.db, kind));

		return snapshot.docs
			.map((item) => {
				const draft = _fromDoc(kind, item.data());

				return {
					kind,
					slug: draft.slug,
					title: 'title' in draft ? draft.title : draft.name,
					summary: draft.summary,
					ownerName: draft.ownerName,
					mine: draft.ownerUid === uid,
					updatedAt: draft.updatedAt,
				};
			})
			.sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0));
	}

	async get(kind: 'stories', slug: string): Promise<StoryDraft | null>;
	async get(kind: Exclude<WriterKind, 'stories'>, slug: string): Promise<CodexDraft | null>;
	async get(kind: WriterKind, slug: string): Promise<WriterDraft | null> {
		const snapshot = await getDoc(doc(this._firebase.db, kind, slug));

		return snapshot.exists() ? _fromDoc(kind, snapshot.data()) : null;
	}

	/**
	 * A slug made from the title that no entry uses yet, in the code or in Firestore:
	 * `grey-mountain`, then `grey-mountain-2`, and so on.
	 */
	async freeSlug(kind: WriterKind, title: string): Promise<string> {
		const canon = new Set(
			kind === 'stories'
				? STORIES.map((story) => story.slug)
				: CODEX_ENTRIES[kind].map((entry) => entry.slug),
		);

		return this._freeSlug(title, kind, async (slug) => canon.has(slug));
	}

	async create(kind: WriterKind, slug: string, input: StoryDraftInput | CodexDraftInput) {
		const user = this._firebase.user();

		if (!user) {
			throw new Error('Sign in to save.');
		}

		await setDoc(doc(this._firebase.db, kind, slug), {
			...input,
			slug,
			ownerUid: user.uid,
			ownerName: user.displayName ?? user.email ?? '',
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp(),
		});
	}

	async update(kind: WriterKind, slug: string, input: StoryDraftInput | CodexDraftInput) {
		await updateDoc(doc(this._firebase.db, kind, slug), {
			..._DROP_LEGACY,
			...input,
			updatedAt: serverTimestamp(),
		});
	}

	/** Deletes the entry; for a story, its chapters first, as the rules check the story's owner. */
	async remove(kind: WriterKind, slug: string) {
		if (kind === 'stories') {
			const chapters = await this.chapters(slug);

			if (chapters.length) {
				const batch = writeBatch(this._firebase.db);

				for (const chapter of chapters) {
					batch.delete(this._chapterRef(slug, chapter.slug));
				}

				await batch.commit();
			}
		}

		await deleteDoc(doc(this._firebase.db, kind, slug));
	}

	/** A story's chapters in reading order. */
	async chapters(storySlug: string): Promise<ChapterDraft[]> {
		const snapshot = await getDocs(
			collection(this._firebase.db, 'stories', storySlug, 'chapters'),
		);

		return snapshot.docs
			.map((item) => _chapterFromDoc(item.data()))
			.sort((a, b) => a.order - b.order);
	}

	async chapter(storySlug: string, chapterSlug: string): Promise<ChapterDraft | null> {
		const snapshot = await getDoc(this._chapterRef(storySlug, chapterSlug));

		return snapshot.exists() ? _chapterFromDoc(snapshot.data()) : null;
	}

	/** Adds a chapter after the last one and returns its slug. */
	async createChapter(storySlug: string, input: ChapterDraftInput): Promise<string> {
		const chapters = await this.chapters(storySlug);
		const used = new Set(chapters.map((chapter) => chapter.slug));
		const slug = await this._freeSlug(input.title, null, async (candidate) =>
			used.has(candidate),
		);

		await setDoc(this._chapterRef(storySlug, slug), {
			...input,
			slug,
			order: Math.max(-1, ...chapters.map((chapter) => chapter.order)) + 1,
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp(),
		});

		return slug;
	}

	async updateChapter(storySlug: string, chapterSlug: string, input: ChapterDraftInput) {
		await updateDoc(this._chapterRef(storySlug, chapterSlug), {
			..._DROP_LEGACY,
			...input,
			updatedAt: serverTimestamp(),
		});
	}

	async removeChapter(storySlug: string, chapterSlug: string) {
		await deleteDoc(this._chapterRef(storySlug, chapterSlug));
	}

	/** Saves a new reading order: `slugs` lists every chapter, first to last. */
	async reorderChapters(storySlug: string, slugs: string[]) {
		const batch = writeBatch(this._firebase.db);

		slugs.forEach((slug, order) =>
			batch.update(this._chapterRef(storySlug, slug), {
				..._DROP_LEGACY,
				order,
				updatedAt: serverTimestamp(),
			}),
		);

		await batch.commit();
	}

	/** Everything an entry can link to: canon from `src/data/` first, then Firestore entries. */
	async references(): Promise<WriterReference[]> {
		const canon: WriterReference[] = [
			...STORIES.map((story) => ({
				kind: 'stories' as const,
				slug: story.slug,
				value: story.slug,
				label: story.content.ua.title,
				canon: true,
			})),
			...CODEX_KINDS.flatMap(({ kind }) =>
				CODEX_ENTRIES[kind].map((entry) => ({
					kind,
					slug: entry.slug,
					value: `${kind}/${entry.slug}`,
					label: entry.content.ua.name,
					canon: true,
				})),
			),
		];
		const lists = await Promise.all(
			(['stories', ...CODEX_KINDS.map(({ kind }) => kind)] as WriterKind[]).map((kind) =>
				this.list(kind),
			),
		);
		const community = lists.flat().map((item) => ({
			kind: item.kind,
			slug: item.slug,
			value: item.kind === 'stories' ? item.slug : `${item.kind}/${item.slug}`,
			label: item.title,
			canon: false,
		}));
		const values = new Set(canon.map((reference) => reference.value));

		return [...canon, ...community.filter((reference) => !values.has(reference.value))];
	}

	private _chapterRef(storySlug: string, chapterSlug: string) {
		return doc(this._firebase.db, 'stories', storySlug, 'chapters', chapterSlug);
	}

	/** Checks `taken` and, for a top-level kind, Firestore, adding `-2`, `-3`... until one is free. */
	private async _freeSlug(
		title: string,
		kind: WriterKind | null,
		taken: (slug: string) => Promise<boolean>,
	): Promise<string> {
		// A title with no Latin or Ukrainian letters still needs an id.
		const base = toSlug(title).slice(0, 72).replace(/-+$/, '') || `entry-${Date.now()}`;

		for (let index = 1; ; index++) {
			const slug = index === 1 ? base : `${base}-${index}`;
			const exists =
				(await taken(slug)) ||
				(kind !== null && (await getDoc(doc(this._firebase.db, kind, slug))).exists());

			if (!exists) {
				return slug;
			}
		}
	}
}

function _fromDoc(kind: 'stories', data: DocumentData): StoryDraft;
function _fromDoc(kind: WriterKind, data: DocumentData): WriterDraft;
function _fromDoc(kind: WriterKind, data: DocumentData): WriterDraft {
	const legacy = data['content']?.['ua'] ?? {};
	const base = {
		slug: data['slug'],
		ownerUid: data['ownerUid'],
		ownerName: data['ownerName'] ?? '',
		summary: data['summary'] ?? legacy['summary'] ?? '',
		createdAt: _toDate(data['createdAt']),
		updatedAt: _toDate(data['updatedAt']),
	};

	return kind === 'stories'
		? { ...base, title: data['title'] ?? legacy['title'] ?? '' }
		: {
				...base,
				name: data['name'] ?? legacy['name'] ?? '',
				role: data['role'] ?? legacy['role'] ?? '',
				html: data['html'] ?? legacy['html'] ?? '',
				storySlugs: data['storySlugs'] ?? [],
				related: data['related'] ?? [],
			};
}

function _chapterFromDoc(data: DocumentData): ChapterDraft {
	const legacy = data['content']?.['ua'] ?? {};
	return {
		slug: data['slug'],
		order: data['order'] ?? 0,
		title: data['title'] ?? legacy['title'] ?? '',
		html: data['html'] ?? legacy['html'] ?? '',
		tags: data['tags'] ?? [],
		createdAt: _toDate(data['createdAt']),
		updatedAt: _toDate(data['updatedAt']),
	};
}

function _toDate(value: unknown): Date | null {
	return value instanceof Timestamp ? value.toDate() : null;
}
