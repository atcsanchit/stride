import { ACCOUNTS_DB, LEGACY_PROGRESS_DB, USERS_INDEX_KEY } from '../constants';
import type { Profile } from '../types';
import { slug } from './id';
import { progressDbName } from './db';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function nameKey(name: string): string {
	return slug(name.trim()) || 'user';
}

export function progressUserIdFromDbName(name: string | undefined): string | null {
	if (!name || !name.startsWith('stride-personal-')) {
		return null;
	}
	if (name === ACCOUNTS_DB || name === LEGACY_PROGRESS_DB) {
		return null;
	}
	const id = name.slice('stride-personal-'.length);
	return UUID_RE.test(id) ? id : null;
}

type UserStub = { id: string; name: string; nameKey: string };

export function readUserIndex(): UserStub[] {
	try {
		const raw = localStorage.getItem(USERS_INDEX_KEY);
		if (!raw) {
			return [];
		}
		const parsed = JSON.parse(raw) as { users?: UserStub[] };
		return (parsed.users ?? []).filter((entry) => entry?.id && entry.name);
	} catch {
		return [];
	}
}

export function writeUserIndex(profiles: Profile[]): void {
	const users: UserStub[] = profiles.map((profile) => ({
		id: profile.id,
		name: profile.name,
		nameKey: profile.nameKey || nameKey(profile.name),
	}));
	const known = new Map(users.map((entry) => [entry.id, entry]));
	for (const stub of readUserIndex()) {
		if (!known.has(stub.id)) {
			known.set(stub.id, stub);
			users.push(stub);
		}
	}
	try {
		localStorage.setItem(USERS_INDEX_KEY, JSON.stringify({ users: [...known.values()] }));
	} catch {
		// Quota or private mode — IndexedDB remains the source of truth.
	}
}

export async function listProgressUserIds(): Promise<string[]> {
	const found = new Set<string>();
	if ('databases' in indexedDB) {
		try {
			const dbs = await indexedDB.databases();
			for (const entry of dbs) {
				const id = progressUserIdFromDbName(entry.name);
				if (id) {
					found.add(id);
				}
			}
		} catch {
			// Some browsers expose databases() but throw.
		}
	}
	for (const stub of readUserIndex()) {
		found.add(stub.id);
	}
	return [...found];
}

export function dbNameForUser(userId: string): string {
	return progressDbName(userId);
}
