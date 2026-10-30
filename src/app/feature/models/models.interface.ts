export type ModelStatus = 'done' | 'placeholder' | 'planned';

export type GameKey = 'craft' | 'dungeons' | 'conquest' | 'hippodrome' | 'caravan' | 'arena' | 'legends' | 'master' | 'escape' | 'detective';

export interface Localized {
	ua: string;
	en: string;
	[language: string]: string;
}

export interface ModelUse {
	game: GameKey;
	/** Instances in one game; null when the number is not decided yet. */
	count: number | null;
	note?: Localized;
}

export interface ModelFamily {
	id: string;
	name: Localized;
	summary: Localized;
}

export interface ModelPlan {
	id: string;
	family: string;
	status: ModelStatus;
	kind: string;
	name: Localized;
	uses: ModelUse[];
	size?: string;
	triangles?: number;
	note?: Localized;
	/** What to generate: look, size, animations, budget. */
	brief?: Localized;
}

export interface ModelsPlan {
	updated: string;
	families: ModelFamily[];
	models: ModelPlan[];
}

export interface LocalizedModel {
	id: string;
	family: string;
	status: ModelStatus;
	kind: string;
	name: string;
	uses: { game: GameKey; count: number | null; note: string }[];
	size: string;
	triangles: number | null;
	note: string;
	brief: string;
	games: number;
	instances: number;
}

export interface FamilySummary {
	id: string;
	name: string;
	summary: string;
	models: number;
	games: number;
	instances: number;
	done: number;
}
