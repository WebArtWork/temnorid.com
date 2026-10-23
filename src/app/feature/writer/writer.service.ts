import { inject, Service } from '@angular/core';
import {
	collection,
	collectionGroup,
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
import { FirebaseService } from '../firebase/firebase.service';
import { STORIES } from '../story/story.data';
import { toSlug, WRITER_LORE_KINDS } from './writer.data';
import { RELEASED_ENTRIES, releasedSlugs } from './writer.released';
import {
	ChapterDraft,
	LoreDraft,
	GapDraft,
	GapListItem,
	Review,
	ReviewStatus,
	StoryDraft,
	WriterDraft,
	WriterKind,
	WriterListItem,
	WriterReference,
} from './writer.interface';

/** Fields the author edits. Owner, slug and timestamps are set by the service. */
export type StoryDraftInput = Pick<StoryDraft, 'title' | 'summary'> &
	Partial<Pick<StoryDraft, 'fills'>>;
export type LoreDraftInput = Pick<
	LoreDraft,
	'name' | 'role' | 'summary' | 'html' | 'storySlugs' | 'related' | 'fields'
>;
export type ChapterDraftInput = Pick<ChapterDraft, 'title' | 'html' | 'tags'>;
export type GapDraftInput = Pick<GapDraft, 'title' | 'details' | 'chapterSlug'>;

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

/** Firestore access for the workshop: stories with their chapters, and every world-entry kind. */
@Service()
export class WriterService {
	private readonly _firebase = inject(FirebaseService);

	/**
	 * Drafts of a kind from Firestore, newest first, then the released entries from the code.
	 * Authors see only their own drafts; `all` (the owners' review page) sees everyone's.
	 * A draft whose slug is released is left out: the code version replaced it.
	 */
	async list(kind: WriterKind, scope: 'mine' | 'all' = 'mine'): Promise<WriterListItem[]> {
		const uid = this._firebase.user()?.uid;
		const released = releasedSlugs(kind);
		const snapshot = await getDocs(collection(this._firebase.db, kind));
		const drafts = snapshot.docs
			.map((item): WriterListItem => {
				const draft = _fromDoc(kind, item.data());

				return {
					kind,
					slug: draft.slug,
					title: 'title' in draft ? draft.title : draft.name,
					summary: draft.summary,
					ownerName: draft.ownerName,
					mine: draft.ownerUid === uid,
					updatedAt: draft.updatedAt,
					released: false,
				};
			})
			.filter((item) => !released.has(item.slug) && (scope === 'all' || item.mine))
			.sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0));

		return [...drafts, ..._releasedItems(kind)];
	}

	async get(kind: 'stories', slug: string): Promise<StoryDraft | null>;
	async get(kind: Exclude<WriterKind, 'stories'>, slug: string): Promise<LoreDraft | null>;
	async get(kind: WriterKind, slug: string): Promise<WriterDraft | null> {
		const snapshot = await getDoc(doc(this._firebase.db, kind, slug));

		return snapshot.exists() ? _fromDoc(kind, snapshot.data()) : null;
	}

	/**
	 * A slug made from the title that no entry uses yet, in the code or in Firestore:
	 * `grey-mountain`, then `grey-mountain-2`, and so on.
	 */
	async freeSlug(kind: WriterKind, title: string): Promise<string> {
		const canon = releasedSlugs(kind);

		return this._freeSlug(title, kind, async (slug) => canon.has(slug));
	}

	async create(kind: WriterKind, slug: string, input: StoryDraftInput | LoreDraftInput) {
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

	async update(kind: WriterKind, slug: string, input: StoryDraftInput | LoreDraftInput) {
		await updateDoc(doc(this._firebase.db, kind, slug), {
			..._DROP_LEGACY,
			...input,
			updatedAt: serverTimestamp(),
		});
	}

	/** Deletes the entry; for a story, its chapters first, as the rules check the story's owner. */
	async remove(kind: WriterKind, slug: string) {
		if (kind === 'stories') {
			const [chapters, gaps] = await Promise.all([this.chapters(slug), this.gaps(slug)]);

			if (chapters.length || gaps.length) {
				const batch = writeBatch(this._firebase.db);

				for (const chapter of chapters) {
					batch.delete(this._chapterRef(slug, chapter.slug));
				}

				for (const gap of gaps) {
					batch.delete(this._gapRef(slug, gap.slug));
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

	/**
	 * Who holds a slug: nobody yet, the signed-in author, someone else, or the code (released).
	 * Used by sync, which may only touch the author's own drafts.
	 */
	async ownership(
		kind: WriterKind,
		slug: string,
	): Promise<'free' | 'mine' | 'other' | 'released'> {
		if (releasedSlugs(kind).has(slug)) {
			return 'released';
		}

		const snapshot = await getDoc(doc(this._firebase.db, kind, slug));

		if (!snapshot.exists()) {
			return 'free';
		}

		return snapshot.data()['ownerUid'] === this._firebase.user()?.uid ? 'mine' : 'other';
	}

	/** Creates or updates a chapter under a known slug, at a given reading position. */
	async upsertChapter(
		storySlug: string,
		slug: string,
		order: number,
		input: ChapterDraftInput,
	): Promise<'created' | 'updated'> {
		const ref = this._chapterRef(storySlug, slug);

		if ((await getDoc(ref)).exists()) {
			await updateDoc(ref, {
				..._DROP_LEGACY,
				...input,
				order,
				updatedAt: serverTimestamp(),
			});

			return 'updated';
		}

		await setDoc(ref, {
			...input,
			slug,
			order,
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp(),
		});

		return 'created';
	}

	/** Creates or updates a gap under a known slug. */
	async upsertGap(
		storySlug: string,
		slug: string,
		input: GapDraftInput,
	): Promise<'created' | 'updated'> {
		const ref = this._gapRef(storySlug, slug);

		if ((await getDoc(ref)).exists()) {
			await updateDoc(ref, { ...input, updatedAt: serverTimestamp() });

			return 'updated';
		}

		await setDoc(ref, {
			...input,
			slug,
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp(),
		});

		return 'created';
	}

	/** Which gaps of other stories this story explains. Saved straight away. */
	async updateFills(storySlug: string, fills: string[]) {
		await updateDoc(doc(this._firebase.db, 'stories', storySlug), {
			..._DROP_LEGACY,
			fills,
			updatedAt: serverTimestamp(),
		});
	}

	/** A draft story's gaps, oldest first. */
	async gaps(storySlug: string): Promise<GapDraft[]> {
		const snapshot = await getDocs(collection(this._firebase.db, 'stories', storySlug, 'gaps'));

		return snapshot.docs
			.map((item) => _gapFromDoc(storySlug, item.data()))
			.sort((a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0));
	}

	async createGap(storySlug: string, input: GapDraftInput) {
		const used = new Set((await this.gaps(storySlug)).map((gap) => gap.slug));
		const slug = await this._freeSlug(input.title, null, async (candidate) =>
			used.has(candidate),
		);

		await setDoc(this._gapRef(storySlug, slug), {
			...input,
			slug,
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp(),
		});
	}

	async updateGap(storySlug: string, gapSlug: string, input: GapDraftInput) {
		await updateDoc(this._gapRef(storySlug, gapSlug), {
			...input,
			updatedAt: serverTimestamp(),
		});
	}

	async removeGap(storySlug: string, gapSlug: string) {
		await deleteDoc(this._gapRef(storySlug, gapSlug));
	}

	/**
	 * Gaps of released stories and of the author's own drafts, with the stories that fill them.
	 * Open gaps come first.
	 */
	async allGaps(): Promise<GapListItem[]> {
		const uid = this._firebase.user()?.uid;
		const [gapDocs, storyDocs] = await Promise.all([
			getDocs(collectionGroup(this._firebase.db, 'gaps')),
			getDocs(collection(this._firebase.db, 'stories')),
		]);
		const released = releasedSlugs('stories');
		const drafts = storyDocs.docs
			.map((item) => _fromDoc('stories', item.data()))
			.filter((story) => !released.has(story.slug) && story.ownerUid === uid);
		const mine = new Set(drafts.map((story) => story.slug));
		const titles = new Map<string, { title: string; released: boolean }>();

		for (const story of STORIES) {
			titles.set(story.slug, { title: story.content.ua.title, released: true });
		}

		for (const story of drafts) {
			titles.set(story.slug, { title: story.title, released: false });
		}

		const fillers = [
			...STORIES.map((story) => ({ slug: story.slug, fills: story.fills ?? [] })),
			...drafts.map((story) => ({ slug: story.slug, fills: story.fills })),
		];
		const filledBy = (ref: string) =>
			fillers
				.filter((story) => story.fills.includes(ref))
				.map((story) => ({ slug: story.slug, ...titles.get(story.slug)! }));
		const items: GapListItem[] = [
			...STORIES.flatMap((story) =>
				(story.gaps ?? []).map((gap) => {
					const ref = `${story.slug}/${gap.slug}`;
					const chapter = story.chapters.find((item) => item.slug === gap.chapterSlug);

					return {
						ref,
						storySlug: story.slug,
						storyTitle: story.content.ua.title,
						chapterTitle: chapter?.content.ua.title ?? '',
						title: gap.content.ua.title,
						details: gap.content.ua.details,
						released: true,
						filledBy: filledBy(ref),
					};
				}),
			),
			...gapDocs.docs
				.map((item) => _gapFromDoc(item.ref.parent.parent!.id, item.data()))
				.filter((gap) => mine.has(gap.storySlug))
				.map((gap) => {
					const ref = `${gap.storySlug}/${gap.slug}`;

					return {
						ref,
						storySlug: gap.storySlug,
						storyTitle: titles.get(gap.storySlug)?.title ?? gap.storySlug,
						chapterTitle: '',
						title: gap.title,
						details: gap.details,
						released: false,
						filledBy: filledBy(ref),
					};
				}),
		];

		return items.sort((a, b) => Number(!!a.filledBy.length) - Number(!!b.filledBy.length));
	}

	/** The owner's decisions on drafts, keyed by `<kind>/<slug>`. */
	async reviews(): Promise<Map<string, Review>> {
		const snapshot = await getDocs(collection(this._firebase.db, 'reviews'));

		return new Map(
			snapshot.docs.map((item) => {
				const data = item.data();
				const review: Review = {
					kind: data['kind'],
					slug: data['slug'],
					status: data['status'],
					note: data['note'] ?? '',
					updatedAt: _toDate(data['updatedAt']),
				};

				return [`${review.kind}/${review.slug}`, review];
			}),
		);
	}

	/** Records the owner's decision on a draft. Only admins may; the rules check it. */
	async setReview(kind: WriterKind, slug: string, status: ReviewStatus, note: string) {
		await setDoc(doc(this._firebase.db, 'reviews', `${kind}__${slug}`), {
			kind,
			slug,
			status,
			note,
			reviewerUid: this._firebase.user()?.uid,
			updatedAt: serverTimestamp(),
		});
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
			...WRITER_LORE_KINDS.flatMap(({ kind }) =>
				RELEASED_ENTRIES[kind].map((entry) => ({
					kind,
					slug: entry.slug,
					value: `${kind}/${entry.slug}`,
					label: entry.content.ua.name,
					canon: true,
				})),
			),
		];
		const lists = await Promise.all(
			(['stories', ...WRITER_LORE_KINDS.map(({ kind }) => kind)] as WriterKind[]).map(
				(kind) => this.list(kind),
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

	private _gapRef(storySlug: string, gapSlug: string) {
		return doc(this._firebase.db, 'stories', storySlug, 'gaps', gapSlug);
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
		? { ...base, title: data['title'] ?? legacy['title'] ?? '', fills: data['fills'] ?? [] }
		: {
				...base,
				name: data['name'] ?? legacy['name'] ?? '',
				role: data['role'] ?? legacy['role'] ?? '',
				html: data['html'] ?? legacy['html'] ?? '',
				storySlugs: data['storySlugs'] ?? [],
				related: data['related'] ?? [],
				fields: data['fields'] ?? {},
			};
}

/** Released entries of a kind as list rows; they open read-only. */
function _releasedItems(kind: WriterKind): WriterListItem[] {
	const row = (slug: string, title: string, summary: string): WriterListItem => ({
		kind,
		slug,
		title,
		summary,
		ownerName: '',
		mine: false,
		updatedAt: null,
		released: true,
	});

	return kind === 'stories'
		? STORIES.map((story) => row(story.slug, story.content.ua.title, story.content.ua.summary))
		: RELEASED_ENTRIES[kind].map((entry) =>
				row(entry.slug, entry.content.ua.name, entry.content.ua.summary),
			);
}

function _gapFromDoc(storySlug: string, data: DocumentData): GapDraft {
	return {
		slug: data['slug'],
		storySlug,
		title: data['title'] ?? '',
		details: data['details'] ?? '',
		chapterSlug: data['chapterSlug'] ?? '',
		createdAt: _toDate(data['createdAt']),
		updatedAt: _toDate(data['updatedAt']),
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
