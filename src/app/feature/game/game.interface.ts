export type GameStatus = 'released' | 'in-development';

export interface GameContent {
	title: string;
	summary: string;
	paragraphs: string[];
}

export interface Game {
	slug: string;
	/** The game's own site. Missing while the game is in development. */
	url?: string;
	status: GameStatus;
	/** English search title and description for the game's page. */
	seo: { title: string; description: string };
	/** Keyed by language code. `ua` and `en` are required. */
	content: { ua: GameContent; en: GameContent } & Partial<Record<string, GameContent>>;
}

export interface LocalizedGame extends GameContent {
	slug: string;
	url?: string;
	status: GameStatus;
	path: string;
}
