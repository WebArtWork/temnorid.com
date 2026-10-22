import villageFromStone from '../../../data/stories/village-from-stone.json';
import { Story } from './story.interface';

/** All published stories, in reading order. Add new story JSON files here. */
export const STORIES: Story[] = [villageFromStone as Story].sort((a, b) => a.number - b.number);

export const STORY_FALLBACK_LANGUAGE = 'en';

const _ROMAN: [number, string][] = [
	[1000, 'M'],
	[900, 'CM'],
	[500, 'D'],
	[400, 'CD'],
	[100, 'C'],
	[90, 'XC'],
	[50, 'L'],
	[40, 'XL'],
	[10, 'X'],
	[9, 'IX'],
	[5, 'V'],
	[4, 'IV'],
	[1, 'I'],
];

/** Chapter numbers are shown as Roman numerals. */
export function romanNumeral(value: number): string {
	let rest = value;

	return _ROMAN.reduce((result, [size, numeral]) => {
		const count = Math.floor(rest / size);
		rest -= count * size;

		return result + numeral.repeat(count);
	}, '');
}
