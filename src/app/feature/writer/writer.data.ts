import groups from '../../../data/workshop/groups.json';
import kinds from '../../../data/workshop/kinds.json';
import reviewStatuses from '../../../data/workshop/review-statuses.json';
import {
	ReviewStatus,
	WriterGroup,
	WriterKind,
	WriterKindConfig,
	WriterLoreKind,
} from './writer.interface';

/*
 * Kinds, their fields, sidebar groups and review statuses live in `src/data/workshop/`, so the
 * build can also describe them in `/workshop.md` for AI chats. Labels are Ukrainian source text.
 */

/** Workshop sidebar sections, in order. */
export const WRITER_GROUPS = groups as { group: WriterGroup; title: string }[];

/** Every workshop kind with its routes and extra fields, in sidebar order. */
export const WRITER_KINDS = kinds as WriterKindConfig[];

/** The owner's decisions on a draft, in workflow order. */
export const REVIEW_STATUSES = reviewStatuses as { value: ReviewStatus; label: string }[];

/** Every world-entry kind (all but stories), in sidebar order. */
export const WRITER_LORE_KINDS = WRITER_KINDS.filter(
	(config): config is WriterKindConfig & { kind: WriterLoreKind } => config.kind !== 'stories',
);

export function writerKindConfig(kind: WriterKind): WriterKindConfig {
	return WRITER_KINDS.find((config) => config.kind === kind)!;
}

/** Ukrainian letters to Latin, for slugs suggested from a Ukrainian name. */
const _TRANSLIT: Record<string, string> = {
	а: 'a',
	б: 'b',
	в: 'v',
	г: 'h',
	ґ: 'g',
	д: 'd',
	е: 'e',
	є: 'ye',
	ж: 'zh',
	з: 'z',
	и: 'y',
	і: 'i',
	ї: 'yi',
	й: 'y',
	к: 'k',
	л: 'l',
	м: 'm',
	н: 'n',
	о: 'o',
	п: 'p',
	р: 'r',
	с: 's',
	т: 't',
	у: 'u',
	ф: 'f',
	х: 'kh',
	ц: 'ts',
	ч: 'ch',
	ш: 'sh',
	щ: 'shch',
	ь: '',
	ю: 'yu',
	я: 'ya',
	"'": '',
	'’': '',
};

export function toSlug(text: string): string {
	return [...text.toLowerCase()]
		.map((char) => _TRANSLIT[char] ?? char)
		.join('')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 80)
		.replace(/-+$/g, '');
}

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function reviewStatusLabel(status: ReviewStatus): string {
	return REVIEW_STATUSES.find((item) => item.value === status)?.label ?? 'Нове';
}
