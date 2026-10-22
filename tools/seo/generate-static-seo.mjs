import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');
const outputDirs = [path.join(rootDir, 'dist/app/browser')];

const storyRoutes = await readStoryRoutes();
const codexRoutes = await readCodexRoutes();
const games = await readJson('src/data/games/games.json');
const staticRoutes = [
	'/',
	'/stories',
	'/games',
	'/movies',
	...games.map((game) => `/game/${game.slug}`),
	...storyRoutes,
	...codexRoutes,
];

const company = await readJson('src/data/company/company.json');
const siteUrl = trimTrailingSlash(company.siteUrl || 'https://example.com');
const pageSeo = company.pageSeo ?? {};

const routes = staticRoutes.filter((route) => isIndexable(route, pageSeo));
const lastmod = new Date().toISOString().slice(0, 10);

await Promise.all(
	outputDirs.map(async (outputDir) => {
		await mkdir(outputDir, { recursive: true });
		await writeFile(
			path.join(outputDir, 'sitemap.xml'),
			buildSitemap(routes, siteUrl, lastmod),
		);
		await writeFile(path.join(outputDir, 'robots.txt'), buildRobots(siteUrl));
	}),
);

function buildSitemap(routes, siteUrl, lastmod) {
	const urls = routes
		.map(
			(route) => `	<url>
		<loc>${escapeXml(toAbsoluteUrl(siteUrl, route))}</loc>
		<lastmod>${lastmod}</lastmod>
	</url>`,
		)
		.join('\n');

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

function buildRobots(siteUrl) {
	return `User-agent: *
Allow: /
Disallow: /login
Disallow: /write/

Sitemap: ${siteUrl}/sitemap.xml
`;
}

function isIndexable(route, pageSeo) {
	const robots = pageSeo[route]?.robots;

	return typeof robots !== 'string' || !robots.toLowerCase().includes('noindex');
}

async function readStoryRoutes() {
	const storiesDir = path.join(rootDir, 'src/data/stories');
	const files = (await readdir(storiesDir)).filter((file) => file.endsWith('.json'));
	const stories = await Promise.all(files.map((file) => readJson(`src/data/stories/${file}`)));

	return stories
		.sort((a, b) => a.number - b.number)
		.flatMap((story) => [
			`/stories/${story.slug}`,
			...story.chapters.map((chapter) => `/stories/${story.slug}/${chapter.slug}`),
		]);
}

async function readCodexRoutes() {
	const kinds = ['characters', 'locations', 'soldiers', 'buildings'];
	const routes = await Promise.all(
		kinds.map(async (kind) => {
			const entries = await readJson(`src/data/codex/${kind}.json`);

			return [`/${kind}`, ...entries.map((entry) => `/${kind}/${entry.slug}`)];
		}),
	);

	return routes.flat();
}

async function readJson(relativePath) {
	return JSON.parse(await readFile(path.join(rootDir, relativePath), 'utf8'));
}

function toAbsoluteUrl(siteUrl, route) {
	return `${siteUrl}${route === '/' ? '' : route}`;
}

function trimTrailingSlash(value) {
	return value.endsWith('/') ? value.slice(0, -1) : value;
}

function escapeXml(value) {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}
