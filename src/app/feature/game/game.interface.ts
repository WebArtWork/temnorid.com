export type GameStatus = 'released' | 'in-development';

export type GamePlatform = 'windows' | 'android' | 'ios' | 'web';

export interface GameContent {
	title: string;
	summary: string;
	paragraphs: string[];
	/** Short "what is inside" bullets. */
	features?: string[];
}

export interface Game {
	slug: string;
	/** The game's own site. Missing while the game is in development. */
	url?: string;
	status: GameStatus;
	/** Newest published release, without the leading v. Missing when nothing is published. */
	version?: string;
	platforms?: GamePlatform[];
	/** Most players in one online session; missing for single-player games. */
	players?: number;
	/** Direct link to the newest Windows installer on GitHub Releases. */
	download?: string;
	/** The game's source repository. */
	repo?: string;
	/** Extra in-game screenshots (paths relative to `src/assets`, e.g. `games/craft/market.png`). The hero image is `seo/game-<slug>.png`. */
	screenshots?: string[];
	/** English search title and description for the game's page. */
	seo: { title: string; description: string };
	/** Keyed by language code. `ua` and `en` are required. */
	content: { ua: GameContent; en: GameContent } & Partial<Record<string, GameContent>>;
}

export interface LocalizedGame extends GameContent {
	slug: string;
	url?: string;
	status: GameStatus;
	version?: string;
	platforms: GamePlatform[];
	players?: number;
	download?: string;
	repo?: string;
	image: string;
	screenshots: string[];
	path: string;
}
