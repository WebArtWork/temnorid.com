/*
 * Builds /workshop.md: a guide any AI chat can read to write a Temnorid workshop sync object.
 * It lists what is released (stories, open gaps, lore), documents every kind and its fields, and
 * describes the sync object the workshop's sync modal accepts. Everything comes from src/data/,
 * so the guide is always as current as the build. Labels are in English where a translation
 * exists in src/i18n, with the Ukrainian original after it.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const output = path.join(rootDir, 'dist/app/browser/workshop.md');

const read = async (file) => JSON.parse(await readFile(path.join(rootDir, file), 'utf8'));
const [kinds, info, company, ua, en] = await Promise.all([
	read('src/data/workshop/kinds.json'),
	read('src/data/workshop/info.json'),
	read('src/data/company/company.json'),
	read('src/i18n/ua.json'),
	read('src/i18n/en.json'),
]);
const english = new Map(ua.map((text, index) => [text, en[index]]));
/** English label with the Ukrainian original, e.g. `Factions (Фракції)`. */
const label = (text) => {
	const translated = english.get(text);

	return translated && translated !== text ? `${translated} (${text})` : text;
};
const t = (text) => english.get(text) ?? text;

const storyFiles = (await readdir(path.join(rootDir, 'src/data/stories'))).filter((file) =>
	file.endsWith('.json'),
);
const stories = (
	await Promise.all(storyFiles.map((file) => read(`src/data/stories/${file}`)))
).sort((a, b) => a.number - b.number);
const loreKinds = kinds.filter((config) => config.kind !== 'stories');
const lore = Object.fromEntries(
	await Promise.all(
		loreKinds.map(async ({ kind }) => [kind, await read(`src/data/lore/${kind}.json`)]),
	),
);

const filled = new Set(stories.flatMap((story) => story.fills ?? []));
const openGaps = stories.flatMap((story) =>
	(story.gaps ?? [])
		.filter((gap) => !filled.has(`${story.slug}/${gap.slug}`))
		.map((gap) => ({ story, gap })),
);

const lines = [];
const add = (...text) => lines.push(...text);

add(
	'# Temnorid workshop guide for AI chats',
	'',
	`Source: ${company.siteUrl}/workshop.md · generated ${new Date().toISOString().slice(0, 10)} from the released data.`,
	'',
	company.description,
	'',
	'## Your task',
	'',
	'Help a Temnorid author write new drafts: stories (with chapters and gaps) and lore entries.',
	'Answer with **one JSON code block** containing a **sync object** (format below) and nothing',
	'else inside the block. The author pastes it into the workshop at',
	`${company.siteUrl}/write/stories → the sync icon next to "Workshop" → "Check" → "Sync".`,
	'',
	'Rules:',
	'',
	'- Stay consistent with the released canon listed below. Link to it by `<kind>/<slug>`.',
	'- Write in the language the author uses. Drafts hold one language; the owner translates later.',
	'- Slugs: lowercase Latin letters, digits and single hyphens, at most 80 characters, e.g.',
	'  `ash-wolf`. Never reuse a released slug: released entries cannot be changed from the workshop.',
	'- Text fields are plain text. `html` fields allow only `p`, `h2`, `h3`, `strong`, `em`, `ul`,',
	'  `ol`, `li`, `blockquote` and `a`. No images, video, iframes, scripts or styles.',
	"- The sync object mirrors all of the author's drafts. Sync creates and updates drafts by slug",
	'  and **deletes** the drafts it no longer lists: stories, their chapters and gaps, lore entries.',
	'  If the author shared their current sync object, return it whole with your changes in it;',
	'  leave out only what the author asked to delete. The workshop lists deletions before syncing.',
	'- Everything synced is a draft. The project owner decides what is released.',
	'',
	'## Sync object',
	'',
	'```ts',
	'interface WorkshopSync {',
	'  version: 1;',
	'  stories?: SyncStory[];',
	'  lore?: { [kind: string]: SyncLoreEntry[] }; // kind: one of the lore kinds below',
	'}',
	'',
	'interface SyncStory {',
	'  slug: string;',
	'  title: string;            // up to 160 characters',
	'  summary?: string;         // one or two sentences, up to 1000',
	'  fills?: string[];         // gaps of other stories this one explains: "<storySlug>/<gapSlug>"',
	'  chapters?: SyncChapter[]; // in reading order',
	'  gaps?: SyncGap[];         // what this story leaves unexplained for later stories',
	'}',
	'',
	'interface SyncChapter {',
	'  slug: string;',
	'  title: string;            // up to 160',
	'  html?: string;            // the chapter text',
	'  tags?: string[];          // lore entries in the chapter: "<kind>/<slug>"',
	'}',
	'',
	'interface SyncGap {',
	'  slug: string;',
	'  title: string;            // the open question, up to 160',
	'  details?: string;         // up to 2000',
	'  chapterSlug?: string;     // the chapter where it shows up',
	'}',
	'',
	'interface SyncLoreEntry {',
	'  slug: string;',
	'  name: string;             // up to 120',
	'  role?: string;            // short role line; characters and troops only, up to 160',
	'  summary?: string;         // one or two sentences, up to 1000',
	'  html?: string;            // the full description',
	'  storySlugs?: string[];    // stories it appears in',
	'  related?: string[];       // other lore entries: "<kind>/<slug>"',
	'  fields?: object;          // the kind\'s extra fields, see "Lore kinds"',
	'}',
	'```',
	'',
	'Field value types: `text` is a string up to 300 characters; `select` is one of the listed',
	'values; `ref` is `"<kind>/<slug>"` (or an array of them when it says "many"); `amounts` is an',
	'array of `{ "ref": "<kind>/<slug>", "amount": number }`.',
	'',
);

// A small example built from real released slugs, so it is always valid against the canon.
const firstGap = openGaps[0];
const example = {
	version: 1,
	stories: [
		{
			slug: 'the-knocking',
			title: 'The Knocking',
			summary:
				'Years after the village was founded, someone finally goes down to answer the mountain.',
			...(firstGap ? { fills: [`${firstGap.story.slug}/${firstGap.gap.slug}`] } : {}),
			chapters: [
				{
					slug: 'the-crack',
					title: 'The Crack',
					html: '<p>The knocking grew louder the winter the old stonecutter died.</p>',
					tags: lore.characters?.[0] ? [`characters/${lore.characters[0].slug}`] : [],
				},
			],
			gaps: [
				{
					slug: 'who-answered',
					title: 'Who answered from below?',
					details: 'Something knocked back. The story never says what.',
					chapterSlug: 'the-crack',
				},
			],
		},
	],
	lore: {
		creatures: [
			{
				slug: 'deep-listener',
				name: 'Deep Listener',
				summary: 'Something under the Grey Mountain that answers knocks.',
				html: '<p>Nobody has seen it. Those who knock on the deepest stones hear it knock back.</p>',
				storySlugs: ['the-knocking'],
				fields: {
					...(lore.locations?.[0]
						? { habitat: [`locations/${lore.locations[0].slug}`] }
						: {}),
					danger: 'boss',
				},
			},
		],
	},
};

add('Example:', '', '```json', JSON.stringify(example, null, 2), '```', '');

add('## Released stories', '');

for (const story of stories) {
	const content = story.content.en ?? story.content.ua;

	add(`### ${content.title} — \`${story.slug}\``, '', content.summary, '', 'Chapters:', '');

	for (const chapter of [...story.chapters].sort((a, b) => a.order - b.order)) {
		add(`- \`${chapter.slug}\`: ${(chapter.content.en ?? chapter.content.ua).title}`);
	}

	add('');

	if (story.gaps?.length) {
		add('Gaps:', '');

		for (const gap of story.gaps) {
			const gapContent = gap.content.en ?? gap.content.ua;

			add(`- \`${story.slug}/${gap.slug}\`: ${gapContent.title} ${gapContent.details}`);
		}

		add('');
	}

	if (story.fills?.length) {
		add(`Fills: ${story.fills.map((ref) => `\`${ref}\``).join(', ')}`, '');
	}
}

add(
	'## Open gaps',
	'',
	'Questions released stories leave unanswered. A new story can explain one: add its',
	'`"<storySlug>/<gapSlug>"` to the story\'s `fills`.',
	'',
	...(openGaps.length
		? openGaps.map(({ story, gap }) => {
				const content = gap.content.en ?? gap.content.ua;

				return `- \`${story.slug}/${gap.slug}\` (${(story.content.en ?? story.content.ua).title}): ${content.title} ${content.details}`;
			})
		: ['None right now.']),
	'',
	'## Lore kinds',
	'',
	'Each kind is a key under `lore` in the sync object. Links use `"<kind>/<slug>"`.',
	'',
);

for (const config of loreKinds) {
	const kindInfo = info[config.kind];

	add(`### \`${config.kind}\` — ${label(config.title)}`, '');

	if (kindInfo) {
		add(t(kindInfo.about), '');
		add(
			`Used in: ${kindInfo.uses.map((use) => `${t(use.where)} (${t(use.how).replace(/\.$/, '')})`).join('; ')}.`,
			'',
		);
	}

	add(`Has a \`role\` line: ${config.role ? 'yes' : 'no'}.`, '');

	if (config.fields.length) {
		add('| Field | Type | Values or links | Label |', '|---|---|---|---|');

		for (const field of config.fields) {
			const values =
				field.type === 'select'
					? field.options
							.map((option) => `\`${option.value}\` ${t(option.label)}`)
							.join(', ')
					: field.type === 'ref'
						? `${field.multiple ? 'many: ' : 'one: '}${field.kinds.map((kind) => `\`${kind}\``).join(', ')}`
						: field.type === 'amounts'
							? field.kinds.map((kind) => `\`${kind}\``).join(', ')
							: 'free text';

			add(`| \`${field.key}\` | ${field.type} | ${values} | ${label(field.label)} |`);
		}

		add('');
	}
}

add(
	'## Released lore',
	'',
	'Use these slugs in links. Do not create entries with the same slugs.',
	'',
);

for (const config of loreKinds) {
	const entries = lore[config.kind] ?? [];

	add(`### \`${config.kind}\``, '');

	if (!entries.length) {
		add('Nothing released yet.', '');
		continue;
	}

	for (const entry of entries) {
		const content = entry.content.en ?? entry.content.ua;
		const extra = [
			entry.fields && Object.keys(entry.fields).length
				? `fields: \`${JSON.stringify(entry.fields)}\``
				: '',
			entry.related?.length
				? `related: ${entry.related.map((ref) => `\`${ref}\``).join(', ')}`
				: '',
		].filter(Boolean);

		add(
			`- \`${config.kind}/${entry.slug}\` — **${content.name}**${content.role ? `, ${content.role}` : ''}. ${content.summary}${extra.length ? ` (${extra.join('; ')})` : ''}`,
		);
	}

	add('');
}

await writeFile(output, lines.join('\n'));
console.log(`Workshop guide written: ${path.relative(rootDir, output)} (${lines.length} lines).`);
