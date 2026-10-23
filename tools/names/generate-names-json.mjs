/*
 * Builds /names.json: the shared pool every Temnorid game draws player names from (Lords uses it
 * for the lord's name). First and second names come from src/data/names/names.json; existingNames
 * are the released characters, so a game can reroll a generated name that is already taken.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const output = path.join(rootDir, 'dist/app/browser/names.json');

const read = async (file) => JSON.parse(await readFile(path.join(rootDir, file), 'utf8'));
const [names, characters] = await Promise.all([
	read('src/data/names/names.json'),
	read('src/data/lore/characters.json'),
]);

const existingNames = [
	...new Set(
		characters.flatMap((character) =>
			Object.values(character.content).map((content) => content.name.trim()),
		),
	),
].sort((a, b) => a.localeCompare(b, 'uk'));

await writeFile(
	output,
	`${JSON.stringify({
		firstNames: names.firstNames,
		secondNames: names.secondNames,
		existingNames,
	})}\n`,
);

console.log(
	`Names written: ${path.relative(rootDir, output)} (${names.firstNames.length} first, ${names.secondNames.length} second, ${existingNames.length} existing).`,
);
