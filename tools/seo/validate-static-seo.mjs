import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const output = path.join(root, 'dist/app/browser');
const company = JSON.parse(
	await readFile(path.join(root, 'src/data/company/company.json'), 'utf8'),
);
const sitemap = await readFile(path.join(output, 'sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const imageManifest = JSON.parse(
	await readFile(path.join(root, 'tools/seo/image-prompts.json'), 'utf8'),
).assets;
assert.deepEqual(
	imageManifest.map((asset) => company.siteUrl + (asset.route === '/' ? '' : asset.route)).sort(),
	[...urls].sort(),
	'Image manifest and public sitemap routes differ',
);
const titles = new Set();
const descriptions = new Set();
const publicImages = new Set();
const publicImageHashes = new Set();
let checked = 0;

function attributes(tag) {
	return Object.fromEntries(
		[...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map((match) => [match[1], match[2]]),
	);
}

async function checkPage(file) {
	const route =
		'/' + path.relative(output, path.dirname(file)).split(path.sep).filter(Boolean).join('/');
	const url = company.siteUrl + (route === '/' ? '' : route);
	const html = await readFile(file, 'utf8');
	const tags = [...html.matchAll(/<meta\b[^>]*>/g)].map((match) => attributes(match[0]));
	const value = (attribute, key) => {
		const matches = tags.filter((tag) => tag[attribute] === key);
		assert.equal(matches.length, 1, `${route}: expected one ${key}`);
		assert.ok(matches[0].content?.trim(), `${route}: empty ${key}`);
		return matches[0].content;
	};
	const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
	assert.ok(title, `${route}: missing title`);
	assert.ok(title.includes('Temnorid'), `${route}: title missing brand`);
	assert.equal(value('property', 'og:title'), title, `${route}: OG title mismatch`);
	assert.equal(value('name', 'twitter:title'), title, `${route}: Twitter title mismatch`);
	const description = value('name', 'description');
	assert.equal(
		value('property', 'og:description'),
		description,
		`${route}: OG description mismatch`,
	);
	assert.equal(
		value('name', 'twitter:description'),
		description,
		`${route}: Twitter description mismatch`,
	);
	assert.equal(value('property', 'og:url'), url, `${route}: wrong sharing URL`);
	const canonical = [...html.matchAll(/<link\b[^>]*>/g)]
		.map((match) => attributes(match[0]))
		.filter((tag) => tag.rel === 'canonical');
	assert.equal(canonical.length, 1, `${route}: duplicate/missing canonical`);
	assert.equal(canonical[0].href, url, `${route}: wrong canonical`);
	const image = value('property', 'og:image');
	assert.equal(value('name', 'twitter:image'), image, `${route}: Twitter image mismatch`);
	assert.equal(value('itemprop', 'image'), image, `${route}: schema image mismatch`);
	const imageUrl = new URL(image);
	assert.equal(imageUrl.origin, company.siteUrl, `${route}: stale image host`);
	assert.ok(
		(await stat(path.join(output, imageUrl.pathname))).size > 0,
		`${route}: missing image asset`,
	);
	assert.equal(value('name', 'twitter:card'), 'summary_large_image');
	const privatePage = route === '/login' || route === '/models' || route.startsWith('/write/');
	if (privatePage) {
		assert.match(value('name', 'robots'), /noindex/);
		assert.ok(!urls.includes(url), `${route}: private page in sitemap`);
	} else {
		assert.ok(urls.includes(url), `${route}: public page missing from sitemap`);
		assert.doesNotMatch(value('name', 'robots'), /noindex/);
		assert.ok(!titles.has(title), `${route}: duplicate title`);
		assert.ok(!descriptions.has(description), `${route}: duplicate description`);
		const configuredImage = company.pageSeo[route]?.image;
		assert.ok(configuredImage, `${route}: missing page-specific image configuration`);
		assert.equal(
			image,
			new URL(configuredImage, company.siteUrl).href,
			`${route}: wrong page image`,
		);
		assert.ok(!publicImages.has(image), `${route}: reused public SEO image`);
		const manifestEntry = imageManifest.find((asset) => asset.route === route);
		assert.equal(
			manifestEntry?.image,
			configuredImage,
			`${route}: image manifest mapping mismatch`,
		);
		const imageBytes = await readFile(path.join(output, imageUrl.pathname));
		const sourceBytes = await readFile(path.join(root, 'src/assets', imageUrl.pathname));
		assert.ok(
			imageBytes.equals(sourceBytes),
			`${route}: stale build image differs from source`,
		);
		assert.equal(
			imageBytes.subarray(0, 8).toString('hex'),
			'89504e470d0a1a0a',
			`${route}: expected PNG`,
		);
		const width = imageBytes.readUInt32BE(16);
		const height = imageBytes.readUInt32BE(20);
		assert.ok(width >= 1200 && height >= 630, `${route}: image too small for social previews`);
		assert.ok(
			width / height > 1.85 && width / height < 1.95,
			`${route}: expected landscape social image`,
		);
		assert.ok(imageBytes.length < 5 * 1024 * 1024, `${route}: image exceeds 5 MB`);
		const hash = createHash('sha256').update(imageBytes).digest('hex');
		assert.ok(!publicImageHashes.has(hash), `${route}: duplicate image content`);
		publicImages.add(image);
		publicImageHashes.add(hash);
		titles.add(title);
		descriptions.add(description);
	}
	checked++;
}

async function walk(directory) {
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const file = path.join(directory, entry.name);
		if (entry.isDirectory()) await walk(file);
		else if (entry.name === 'index.html') await checkPage(file);
	}
}

await walk(output);
assert.equal(titles.size, urls.length, 'Sitemap contains routes without verified HTML');
console.log(
	`SEO verified: ${checked} pages, ${urls.length} public URLs; titles, descriptions, ${publicImages.size} distinct image files, canonicals, social tags and private-page exclusions passed.`,
);
