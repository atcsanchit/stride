import { SESSION_KEY } from '../constants';
import { clearAccountSession, writeAccountSession } from './accounts';

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
	void clearAccountSession();
}
