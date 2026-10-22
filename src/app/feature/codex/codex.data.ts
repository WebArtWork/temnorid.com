import buildings from '../../../data/codex/buildings.json';
import characters from '../../../data/codex/characters.json';
import locations from '../../../data/codex/locations.json';
import soldiers from '../../../data/codex/soldiers.json';
import { CodexEntry, CodexKind, CodexKindConfig } from './codex.interface';

export const CODEX_KINDS: CodexKindConfig[] = [
	{
		kind: 'characters',
		title: 'Персонажі',
		singular: 'Персонаж',
		intro: 'Люди, з яких почалася історія Темнороду.',
		seoTitle: 'Characters',
		seoDescription: 'Meet the characters of Temnorid through their roles and stories in a dark medieval fantasy world shaped by steel, elemental magic and strategy.',
	},
	{
		kind: 'locations',
		title: 'Локації',
		singular: 'Локація',
		intro: 'Місця, де відбуваються історії Темнороду.',
		seoTitle: 'Locations',
		seoDescription:
			'Explore the locations of Temnorid and the stories set there, in a dark medieval fantasy world of fortified cities, ancient ruins and dangerous wilderness.',
	},
	{
		kind: 'soldiers',
		title: 'Воїни',
		singular: 'Воїн',
		intro: 'Ті, хто носить зброю в Темнороді.',
		seoTitle: 'Soldiers',
		seoDescription: 'Meet the soldiers of Temnorid, a dark medieval fantasy world where armies fight with swords, shields, bows and siege weapons alongside powerful wizards.',
	},
	{
		kind: 'buildings',
		title: 'Будівлі',
		singular: 'Будівля',
		intro: 'Те, що люди Темнороду звели власними руками.',
		seoTitle: 'Buildings',
		seoDescription: 'Discover the buildings of Temnorid and their stories, from stone houses to the fortresses and fortified cities of a dark medieval fantasy world.',
	},
];

/** All codex entries by kind. Edit the JSON files in `src/data/codex/` to add entries. */
export const CODEX_ENTRIES: Record<CodexKind, CodexEntry[]> = {
	characters: characters as CodexEntry[],
	locations: locations as CodexEntry[],
	soldiers: soldiers as CodexEntry[],
	buildings: buildings as CodexEntry[],
};

export function codexKindConfig(kind: CodexKind): CodexKindConfig {
	return CODEX_KINDS.find((config) => config.kind === kind)!;
}
