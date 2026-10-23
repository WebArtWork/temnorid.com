import cards from '../../../data/lore/cards.json';
import creatures from '../../../data/lore/creatures.json';
import events from '../../../data/lore/events.json';
import factions from '../../../data/lore/factions.json';
import items from '../../../data/lore/items.json';
import quests from '../../../data/lore/quests.json';
import recipes from '../../../data/lore/recipes.json';
import resources from '../../../data/lore/resources.json';
import spells from '../../../data/lore/spells.json';
import { LORE_ENTRIES } from '../lore/lore.data';
import { LoreEntry } from '../lore/lore.interface';
import { STORIES } from '../story/story.data';
import { WriterLoreKind, WriterKind } from './writer.interface';

/*
 * Released means "in the code": the owner chose an entry from the workshop and added its JSON to
 * `src/data/`. Everything in Firestore is a draft until then, whoever wrote it.
 */

/** Released world entries of every kind, including the kinds that have no public page. */
export const RELEASED_ENTRIES: Record<WriterLoreKind, LoreEntry[]> = {
	...LORE_ENTRIES,
	factions: factions as LoreEntry[],
	resources: resources as LoreEntry[],
	items: items as LoreEntry[],
	recipes: recipes as LoreEntry[],
	spells: spells as LoreEntry[],
	creatures: creatures as LoreEntry[],
	quests: quests as LoreEntry[],
	events: events as LoreEntry[],
	cards: cards as LoreEntry[],
};

/** Slugs that are released for a kind; a draft with one of these is superseded by the code. */
export function releasedSlugs(kind: WriterKind): Set<string> {
	return new Set(
		kind === 'stories'
			? STORIES.map((story) => story.slug)
			: RELEASED_ENTRIES[kind].map((entry) => entry.slug),
	);
}
