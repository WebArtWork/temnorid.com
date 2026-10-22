import type { FirebaseOptions } from 'firebase/app';

export const environment: {
	apiUrl: string;
	appVersion: string;
	production: boolean;
	companyId: string;
	defaultLanguage: string;
	languages: AppLanguage[];
	firebase: FirebaseOptions;
} = {
	apiUrl: 'https://it.webart.work',
	appVersion: '1.0.0',
	production: true,
	companyId: 'temnorid',
	defaultLanguage: 'ua',
	languages: [
		{
			code: 'ua',
			name: 'Ukrainian',
			nativeName: 'Українська',
			flagSrc: 'flags/ukraine.svg',
			htmlLang: 'uk',
			population: 35,
		},
		{
			code: 'en',
			name: 'English',
			nativeName: 'English',
			flagSrc: 'flags/united-kingdom.svg',
			htmlLang: 'en',
			population: 280,
		},
	],
	// Web config of the `temnorid-arena` Firebase project. These values are public by design;
	// access is enforced by firestore.rules.
	firebase: {
		apiKey: 'AIzaSyDwqmZvJj599VIRrgQ6CCXKHSmwzqEeG7o',
		authDomain: 'temnorid-arena.firebaseapp.com',
		projectId: 'temnorid-arena',
		storageBucket: 'temnorid-arena.firebasestorage.app',
		messagingSenderId: '819171248831',
		appId: '1:819171248831:web:fb80ee12f76b677524d40a',
		measurementId: 'G-C4M3EYW0SQ',
	},
};

export interface AppLanguage {
	code: string;
	name: string;
	nativeName: string;
	flagSrc: string;
	htmlLang: string;
	population: number;
}
