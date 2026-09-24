import { SESSION_KEY, VIEW_KEY, isTrackEnabled } from '../constants';
import { clearAccountSession, writeAccountSession } from './accounts';
import type { Settings, TrackId, View } from '../types';

const PIN_OK_PREFIX = 'stride-pin-ok:';

export function readSession(): string | null {
	try {
		return localStorage.getItem(SESSION_KEY);
	} catch {
		return null;
	}
}

export function writeSession(profileId: string): void {
	try {
		localStorage.setItem(SESSION_KEY, profileId);
	} catch {
		// Private mode — accounts IndexedDB still keeps the session.
	}
	void writeAccountSession(profileId);
}

export function clearSession(): void {
	try {
		localStorage.removeItem(SESSION_KEY);
	} catch {
		// ignore
	}
	clearPinUnlocks();
	clearView();
	void clearAccountSession();
}

export function rememberPinUnlock(profileId: string): void {
	try {
		sessionStorage.setItem(`${PIN_OK_PREFIX}${profileId}`, '1');
	} catch {
		// ignore
	}
}

export function pinUnlocked(profileId: string): boolean {
	try {
		return sessionStorage.getItem(`${PIN_OK_PREFIX}${profileId}`) === '1';
	} catch {
		return false;
	}
}

function clearPinUnlocks(): void {
	try {
		const keys: string[] = [];
		for (let i = 0; i < sessionStorage.length; i += 1) {
			const key = sessionStorage.key(i);
			if (key?.startsWith(PIN_OK_PREFIX)) {
				keys.push(key);
			}
		}
		for (const key of keys) {
			sessionStorage.removeItem(key);
		}
	} catch {
		// ignore
	}
}

function isTrackId(value: unknown): value is TrackId {
	return value === 'dsa' || value === 'system-design' || value === 'ai-engineering';
}

export function readView(): View | null {
	try {
		const raw = localStorage.getItem(VIEW_KEY);
		if (!raw) {
			return null;
		}
		return sanitizeView(JSON.parse(raw) as unknown);
	} catch {
		return null;
	}
}

export function writeView(view: View): void {
	try {
		localStorage.setItem(VIEW_KEY, JSON.stringify(view));
	} catch {
		// ignore
	}
}

export function clearView(): void {
	try {
		localStorage.removeItem(VIEW_KEY);
	} catch {
		// ignore
	}
}

export function sanitizeView(value: unknown): View | null {
	if (!value || typeof value !== 'object' || !('name' in value)) {
		return null;
	}
	const view = value as View;
	switch (view.name) {
		case 'home':
		case 'lab':
		case 'sprint':
		case 'chores':
		case 'settings':
			return { name: view.name };
		case 'revise':
			return typeof view.itemId === 'string' && view.itemId
				? { name: 'revise', itemId: view.itemId }
				: { name: 'revise' };
		case 'day':
			return typeof view.date === 'string' && view.date ? { name: 'day', date: view.date } : null;
		case 'lesson':
			return typeof view.itemId === 'string' && view.itemId ? { name: 'lesson', itemId: view.itemId } : null;
		case 'track':
			return isTrackId(view.trackId) ? { name: 'track', trackId: view.trackId } : null;
		case 'class':
			return isTrackId(view.trackId) && typeof view.section === 'string'
				? { name: 'class', trackId: view.trackId, section: view.section }
				: null;
		default:
			return null;
	}
}

export function restoreView(settings: Pick<Settings, 'enabledTracks'>): View {
	const saved = readView();
	if (!saved) {
		return { name: 'home' };
	}
	if ((saved.name === 'track' || saved.name === 'class') && !isTrackEnabled(settings, saved.trackId)) {
		return { name: 'home' };
	}
	return saved;
}
