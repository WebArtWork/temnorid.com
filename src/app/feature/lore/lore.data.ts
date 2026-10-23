import buildings from '../../../data/lore/buildings.json';
import characters from '../../../data/lore/characters.json';
import locations from '../../../data/lore/locations.json';
import soldiers from '../../../data/lore/soldiers.json';
import { LoreEntry, LoreKind, LoreKindConfig } from './lore.interface';

export const LORE_KINDS: LoreKindConfig[] = [
	{
		kind: 'characters',
		title: 'Персонажі',
		singular: 'Персонаж',
		intro: 'Люди, з яких почалася історія Темнороду.',
		seoTitle: 'Characters',
		seoDescription:
			'Meet the characters of Temnorid through their roles and stories in a dark medieval fantasy world shaped by steel, elemental magic and strategy.',
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
		title: 'Війська',
		singular: 'Військо',
		intro: 'Ті, хто носить зброю в Темнороді.',
		seoTitle: 'Troops',
		seoDescription:
			'Meet the troops of Temnorid, a dark medieval fantasy world where armies fight with swords, shields, bows and siege weapons alongside powerful wizards.',
	},
	{
		kind: 'buildings',
		title: 'Будівлі',
		singular: 'Будівля',
		intro: 'Те, що люди Темнороду звели власними руками.',
		seoTitle: 'Buildings',
		seoDescription:
			'Discover the buildings of Temnorid and their stories, from stone houses to the fortresses and fortified cities of a dark medieval fantasy world.',
	},
];

/** All lore entries by kind. Edit the JSON files in `src/data/lore/` to add entries. */
export const LORE_ENTRIES: Record<LoreKind, LoreEntry[]> = {
	characters: characters as LoreEntry[],
	locations: locations as LoreEntry[],
	soldiers: soldiers as LoreEntry[],
	buildings: buildings as LoreEntry[],
};

export function loreKindConfig(kind: LoreKind): LoreKindConfig {
	return LORE_KINDS.find((config) => config.kind === kind)!;
}
