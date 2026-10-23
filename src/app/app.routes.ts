import { Routes } from '@angular/router';
import { buildRouteMeta } from '@wawjs/ngx-default';
import { LORE_ENTRIES, LORE_KINDS } from './feature/lore/lore.data';
import { companyProfile } from './feature/company/company.data';
import { GAMES } from './feature/game/game.data';
import { STORIES, STORY_FALLBACK_LANGUAGE } from './feature/story/story.data';
import { chapterSeoDescription } from './feature/story/story-seo';
import { WRITER_KINDS } from './feature/writer/writer.data';
import type { ChapterEditorComponent } from './pages/chapter-editor/chapter-editor.component';
import type { WriterEditorComponent } from './pages/writer-editor/writer-editor.component';

const loreRoutes: Routes = LORE_KINDS.flatMap((config) => [
	{
		path: config.kind,
		data: {
			loreKind: config.kind,
			meta: {
				...buildRouteMeta(companyProfile, `/${config.kind}`),
				title: config.seoTitle,
				description: config.seoDescription,
			},
		},
		loadComponent: () =>
			import('./pages/lore-list/lore-list.component').then((m) => m.LoreListComponent),
	},
	...LORE_ENTRIES[config.kind].map((entry) => {
		const content = entry.content[STORY_FALLBACK_LANGUAGE] ?? entry.content.ua;

		return {
			path: `${config.kind}/${entry.slug}`,
			data: {
				loreKind: config.kind,
				loreSlug: entry.slug,
				meta: {
					...buildRouteMeta(companyProfile, `/${config.kind}/${entry.slug}`),
					title: content.name,
					description: content.summary,
				},
			},
			loadComponent: () =>
				import('./pages/lore-entry/lore-entry.component').then((m) => m.LoreEntryComponent),
		};
	}),
]);

const storyRoutes: Routes = STORIES.flatMap((story) => {
	const content = story.content[STORY_FALLBACK_LANGUAGE] ?? story.content.ua;

	return [
		{
			path: `stories/${story.slug}`,
			data: {
				storySlug: story.slug,
				meta: {
					...buildRouteMeta(companyProfile, `/stories/${story.slug}`),
					title: content.title,
					description: content.summary,
				},
			},
			loadComponent: () =>
				import('./pages/story/story.component').then((m) => m.StoryComponent),
		},
		...story.chapters.map((chapter) => {
			const path = `/stories/${story.slug}/${chapter.slug}`;
			const chapterContent = chapter.content[STORY_FALLBACK_LANGUAGE] ?? chapter.content.ua;

			return {
				path: path.slice(1),
				data: {
					storySlug: story.slug,
					chapterSlug: chapter.slug,
					meta: {
						...buildRouteMeta(companyProfile, path),
						title: `${chapterContent.title} · ${content.title}`,
						description: chapterSeoDescription(chapterContent, content.title),
					},
				},
				loadComponent: () =>
					import('./pages/chapter/chapter.component').then((m) => m.ChapterComponent),
			};
		}),
	];
});

/** Writer pages are private tools: prerendered as empty shells, filled from Firestore in the browser. */
const writerMeta = (path: string, title: string) => ({
	...buildRouteMeta(companyProfile, path),
	title,
	description: `${title} in the Temnorid author workshop. Sign in to manage stories and world entries.`,
	robots: 'noindex, nofollow',
});

const writerRoutes: Routes = [
	{
		path: 'login',
		data: { meta: writerMeta('/login', 'Sign in') },
		loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
	},
	{
		path: 'write',
		pathMatch: 'full',
		redirectTo: 'write/stories',
	},
	...WRITER_KINDS.flatMap((config) => [
		{
			path: config.listPath.slice(1),
			data: {
				writerKind: config.kind,
				meta: writerMeta(config.listPath, `Manage ${config.kind}`),
			},
			loadComponent: () =>
				import('./pages/writer-list/writer-list.component').then(
					(m) => m.WriterListComponent,
				),
		},
		config.kind === 'stories'
			? {
					path: config.editorPath.slice(1),
					data: { meta: writerMeta(config.editorPath, 'Edit story') },
					loadComponent: () =>
						import('./pages/story-editor/story-editor.component').then(
							(m) => m.StoryEditorComponent,
						),
				}
			: {
					path: config.editorPath.slice(1),
					data: {
						writerKind: config.kind,
						meta: writerMeta(config.editorPath, `Edit ${config.kind.slice(0, -1)}`),
					},
					canDeactivate: [(component: WriterEditorComponent) => component.canLeave()],
					loadComponent: () =>
						import('./pages/writer-editor/writer-editor.component').then(
							(m) => m.WriterEditorComponent,
						),
				},
	]),
	{
		path: 'write/chapter',
		data: { meta: writerMeta('/write/chapter', 'Edit chapter') },
		canDeactivate: [(component: ChapterEditorComponent) => component.canLeave()],
		loadComponent: () =>
			import('./pages/chapter-editor/chapter-editor.component').then(
				(m) => m.ChapterEditorComponent,
			),
	},
	{
		path: 'write/gaps',
		data: { meta: writerMeta('/write/gaps', 'Story gaps') },
		loadComponent: () =>
			import('./pages/writer-gaps/writer-gaps.component').then((m) => m.WriterGapsComponent),
	},
	{
		path: 'write/review',
		data: { meta: writerMeta('/write/review', 'Review drafts') },
		loadComponent: () =>
			import('./pages/writer-review/writer-review.component').then(
				(m) => m.WriterReviewComponent,
			),
	},
];

export const routes: Routes = [
	{
		path: '',
		data: {
			meta: {
				...buildRouteMeta(companyProfile, '/'),
				titleSuffix: '',
			},
		},
		loadComponent: () =>
			import('./pages/landing/landing.component').then((m) => m.LandingComponent),
	},
	{
		path: 'stories',
		data: {
			meta: buildRouteMeta(companyProfile, '/stories'),
		},
		loadComponent: () =>
			import('./pages/stories/stories.component').then((m) => m.StoriesComponent),
	},
	...storyRoutes,
	{
		path: 'games',
		data: {
			meta: buildRouteMeta(companyProfile, '/games'),
		},
		loadComponent: () => import('./pages/games/games.component').then((m) => m.GamesComponent),
	},
	...GAMES.map((game) => ({
		path: `game/${game.slug}`,
		data: {
			gameSlug: game.slug,
			meta: {
				...buildRouteMeta(companyProfile, `/game/${game.slug}`),
				title: game.seo.title,
				description: game.seo.description,
			},
		},
		loadComponent: () => import('./pages/game/game.component').then((m) => m.GameComponent),
	})),
	{
		path: 'movies',
		data: {
			meta: buildRouteMeta(companyProfile, '/movies'),
		},
		loadComponent: () =>
			import('./pages/movies/movies.component').then((m) => m.MoviesComponent),
	},
	...loreRoutes,
	...writerRoutes,
	{
		path: '**',
		redirectTo: '',
	},
];
