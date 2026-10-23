import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID, Service, signal } from '@angular/core';
import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import {
	Auth,
	GoogleAuthProvider,
	getAuth,
	onAuthStateChanged,
	signInWithPopup,
	signOut,
	User,
} from 'firebase/auth';
import { doc, Firestore, getDoc, getFirestore } from 'firebase/firestore';
import { environment } from '../../../environments/environment';

/**
 * Firebase app, auth and Firestore for the story writer. Only imported by lazy writer pages, so
 * the public site never downloads Firebase. Nothing starts during prerender.
 */
@Service()
export class FirebaseService {
	private readonly _isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
	private _app?: FirebaseApp;
	private _auth?: Auth;
	private _db?: Firestore;

	/** Signed-in Google user, or null. */
	readonly user = signal<User | null>(null);
	/** False until Firebase has restored (or ruled out) a saved session. Stays false on the server. */
	readonly authReady = signal(false);
	/**
	 * True for project owners: they decide which drafts are released. Set by creating
	 * `admins/<uid>` in the Firebase console; nobody can grant it from the site.
	 */
	readonly isAdmin = signal(false);

	constructor() {
		if (!this._isBrowser) {
			return;
		}

		this._app = getApps()[0] ?? initializeApp(environment.firebase);
		this._auth = getAuth(this._app);
		this._db = getFirestore(this._app);

		onAuthStateChanged(this._auth, (user) => {
			// Anonymous sessions (used by the games) cannot write stories.
			this.user.set(user && !user.isAnonymous ? user : null);
			this.isAdmin.set(false);
			this.authReady.set(true);

			if (user && !user.isAnonymous) {
				getDoc(doc(this._db!, 'admins', user.uid))
					.then((snapshot) => this.isAdmin.set(snapshot.exists()))
					.catch(() => this.isAdmin.set(false));
			}
		});
	}

	get db(): Firestore {
		if (!this._db) {
			throw new Error('Firestore is only available in the browser.');
		}

		return this._db;
	}

	async signInWithGoogle() {
		if (!this._auth) {
			return;
		}

		await signInWithPopup(this._auth, new GoogleAuthProvider());
	}

	async signOut() {
		if (this._auth) {
			await signOut(this._auth);
		}
	}
}
