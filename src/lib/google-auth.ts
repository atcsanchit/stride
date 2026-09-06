const SCRIPT = 'https://accounts.google.com/gsi/client';
const SCOPE = [
	'https://www.googleapis.com/auth/drive.file',
	'https://www.googleapis.com/auth/userinfo.email',
].join(' ');
const EMAIL_KEY = 'stride-drive-email';
const CONNECTED_KEY = 'stride-drive-connected';

type TokenClient = {
	requestAccessToken: (opts?: { prompt?: string }) => void;
};

type TokenResponse = {
	access_token?: string;
	expires_in?: number | string;
	error?: string;
	error_description?: string;
};

declare global {
	interface Window {
		google?: {
			accounts: {
				oauth2: {
					initTokenClient: (config: {
						client_id: string;
						scope: string;
						callback: (resp: TokenResponse) => void;
						error_callback?: (err: { type?: string; message?: string }) => void;
					}) => TokenClient;
				};
			};
		};
	}
}

let scriptPromise: Promise<void> | null = null;
let token = '';
let tokenExpiresAt = 0;
let client: TokenClient | null = null;

export function googleClientId(): string {
	return (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '').trim();
}

export function driveConfigured(): boolean {
	return Boolean(googleClientId());
}

export function rememberedDriveEmail(): string | null {
	try {
		return localStorage.getItem(EMAIL_KEY);
	} catch {
		return null;
	}
}

export function driveRemembered(): boolean {
	try {
		return localStorage.getItem(CONNECTED_KEY) === '1';
	} catch {
		return false;
	}
}

export function clearDriveSession(): void {
	token = '';
	tokenExpiresAt = 0;
	try {
		localStorage.removeItem(EMAIL_KEY);
		localStorage.removeItem(CONNECTED_KEY);
	} catch {
		// ignore
	}
}

export function currentAccessToken(): string | null {
	if (token && Date.now() < tokenExpiresAt) {
		return token;
	}
	return null;
}

function loadScript(): Promise<void> {
	if (window.google?.accounts?.oauth2) {
		return Promise.resolve();
	}
	if (scriptPromise) {
		return scriptPromise;
	}
	scriptPromise = new Promise((resolve, reject) => {
		const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT}"]`);
		if (existing) {
			existing.addEventListener('load', () => resolve());
			existing.addEventListener('error', () => reject(new Error('Google sign-in failed to load.')));
			return;
		}
		const script = document.createElement('script');
		script.src = SCRIPT;
		script.async = true;
		script.defer = true;
		script.onload = () => resolve();
		script.onerror = () => reject(new Error('Google sign-in failed to load.'));
		document.head.appendChild(script);
	});
	return scriptPromise;
}

async function readEmail(accessToken: string): Promise<string | null> {
	try {
		const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
			headers: { Authorization: `Bearer ${accessToken}` },
		});
		if (!response.ok) {
			return null;
		}
		const body = (await response.json()) as { email?: string };
		return body.email ?? null;
	} catch {
		return null;
	}
}

function remember(email: string | null): void {
	try {
		localStorage.setItem(CONNECTED_KEY, '1');
		if (email) {
			localStorage.setItem(EMAIL_KEY, email);
		}
	} catch {
		// ignore
	}
}

/** Call on app boot so Continue with Google can open the popup in the same click. */
export function preloadGoogleAuth(): void {
	if (!googleClientId()) {
		return;
	}
	void loadScript();
}

function isWorkEmail(email: string | null): boolean {
	return Boolean(email && /@peakflo\.co$/i.test(email));
}

function tokenError(result: TokenResponse, fallback: string): Error {
	const raw = `${result.error ?? ''} ${result.error_description ?? ''}`.toLowerCase();
	if (raw.includes('popup_closed') || raw.includes('popup_failed') || raw.includes('access_denied')) {
		return new Error(
			'Google window closed or blocked. Allow popups for localhost:5174, click Continue with Google again, and pick a personal Gmail (not Peakflo).',
		);
	}
	return new Error(result.error_description || result.error || fallback);
}

export function dropGoogleAccessToken(): void {
	token = '';
	tokenExpiresAt = 0;
}

export function requestGoogleToken(
	interactive: boolean,
	options?: { pickAccount?: boolean },
): Promise<{ token: string; email: string | null }> {
	const clientId = googleClientId();
	if (!clientId) {
		return Promise.reject(new Error('Set VITE_GOOGLE_CLIENT_ID to connect a personal Google Drive.'));
	}
	const pickAccount = options?.pickAccount === true;
	const cached = currentAccessToken();
	if (cached && !pickAccount) {
		return Promise.resolve({ token: cached, email: rememberedDriveEmail() });
	}
	if (pickAccount) {
		dropGoogleAccessToken();
	}
	if (!interactive) {
		return Promise.reject(new Error('Drive token is only requested from a button click.'));
	}
	if (!window.google?.accounts?.oauth2) {
		void loadScript();
		return Promise.reject(
			new Error('Google sign-in is still loading. Wait a second, then click Continue with Google again.'),
		);
	}

	return new Promise((resolve, reject) => {
		client = window.google!.accounts.oauth2.initTokenClient({
			client_id: clientId,
			scope: SCOPE,
			callback: (result) => {
				if (result.error || !result.access_token) {
					reject(tokenError(result, 'Google sign-in failed.'));
					return;
				}
				const seconds = Number(result.expires_in ?? 3600);
				token = result.access_token;
				tokenExpiresAt = Date.now() + Math.max(60, seconds - 60) * 1000;
				void readEmail(token).then((email) => {
					if (isWorkEmail(email)) {
						dropGoogleAccessToken();
						reject(new Error('Use a personal Gmail, not Peakflo. Pick atcsanchit@gmail.com (or another personal account).'));
						return;
					}
					remember(email);
					resolve({ token, email });
				});
			},
			error_callback: (err) => {
				const type = `${err.type ?? ''} ${err.message ?? ''}`.toLowerCase();
				if (type.includes('popup') || type.includes('closed')) {
					reject(
						new Error(
							'Google window was blocked. Allow popups for localhost:5174, then click Continue with Google again.',
						),
					);
					return;
				}
				reject(new Error(err.message || err.type || 'Google sign-in was cancelled.'));
			},
		});
		const prompt = pickAccount ? 'select_account' : driveRemembered() ? '' : 'consent';
		client.requestAccessToken({ prompt });
	});
}
