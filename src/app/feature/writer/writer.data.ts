import { WriterKind, WriterKindConfig } from './writer.interface';

export const WRITER_KINDS: WriterKindConfig[] = [
	{
		kind: 'stories',
		title: 'Історії',
		newLabel: 'Нова історія',
		editorPath: '/write/story',
		listPath: '/write/stories',
	},
	{
		kind: 'characters',
		title: 'Персонажі',
		newLabel: 'Новий персонаж',
		editorPath: '/write/character',
		listPath: '/write/characters',
	},
	{
		kind: 'locations',
		title: 'Локації',
		newLabel: 'Нова локація',
		editorPath: '/write/location',
		listPath: '/write/locations',
	},
	{
		kind: 'soldiers',
		title: 'Воїни',
		newLabel: 'Новий воїн',
		editorPath: '/write/soldier',
		listPath: '/write/soldiers',
	},
	{
		kind: 'buildings',
		title: 'Будівлі',
		newLabel: 'Нова будівля',
		editorPath: '/write/building',
		listPath: '/write/buildings',
	},
];

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
