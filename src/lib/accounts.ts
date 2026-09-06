import { ACCOUNTS_DB } from '../constants';
import type { Profile, UserIdentity } from '../types';
import { databaseExists, deleteDatabase, requestToPromise, transactionDone } from './idb';
import { listProgressUserIds, nameKey, readUserIndex, writeUserIndex } from './identity';
import { hashPin, randomSalt, verifyPin } from './pin';
import { loadIdentity, loadAll, progressDbName } from './db';
import { diskDeleteUser, diskLoadAccounts, diskSaveAccounts } from './disk';

const ACCOUNTS_VERSION = 2;

function openAccounts(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(ACCOUNTS_DB, ACCOUNTS_VERSION);
		request.onupgradeneeded = () => {
			const db = request.result;
			if (!db.objectStoreNames.contains('profiles')) {
				db.createObjectStore('profiles', { keyPath: 'id' });
			}
			const profiles = request.transaction?.objectStore('profiles');
			if (profiles && !profiles.indexNames.contains('nameKey')) {
				profiles.createIndex('nameKey', 'nameKey', { unique: false });
			}
			if (!db.objectStoreNames.contains('meta')) {
				db.createObjectStore('meta', { keyPath: 'key' });
			}
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

function normalizeProfile(row: Profile): Profile {
	return {
		...row,
		nameKey: row.nameKey || nameKey(row.name),
	};
}

export async function loadProfilesFromIdb(): Promise<Profile[]> {
	const db = await openAccounts();
	const profiles = await requestToPromise(
		db.transaction('profiles').objectStore('profiles').getAll() as IDBRequest<Profile[]>,
	);
	db.close();
	return profiles
		.filter((row) => row?.id)
		.map(normalizeProfile)
		.sort((a, b) => b.lastSeenAt - a.lastSeenAt);
}

async function saveProfileIdb(profile: Profile): Promise<void> {
	const next = normalizeProfile(profile);
	const db = await openAccounts();
	const tx = db.transaction('profiles', 'readwrite');
	tx.objectStore('profiles').put(next);
	await transactionDone(tx);
	db.close();
}

async function mirrorAccounts(sessionUserId: string | null): Promise<void> {
	const users = await loadProfilesFromIdb();
	writeUserIndex(users);
	await diskSaveAccounts(users, sessionUserId);
}

export async function loadProfiles(): Promise<Profile[]> {
	const local = await loadProfilesFromIdb();
	const disk = await diskLoadAccounts();
	if (!disk) {
		if (local.length > 0) {
			await diskSaveAccounts(local, await readAccountSessionIdb());
		}
		return local;
	}
	const byId = new Map(local.map((profile) => [profile.id, profile]));
	for (const user of disk.users) {
		if (!user?.id) {
			continue;
		}
		const current = byId.get(user.id);
		if (!current) {
			await saveProfileIdb(user);
			byId.set(user.id, normalizeProfile(user));
			continue;
		}
		const next = normalizeProfile({
			...user,
			...current,
			pinSalt: current.pinSalt || user.pinSalt,
			pinHash: current.pinHash || user.pinHash,
			lastSeenAt: Math.max(current.lastSeenAt || 0, user.lastSeenAt || 0),
		});
		if (next.lastSeenAt !== current.lastSeenAt || next.pinHash !== current.pinHash) {
			await saveProfileIdb(next);
		}
		byId.set(user.id, next);
	}
	const list = [...byId.values()].sort((a, b) => b.lastSeenAt - a.lastSeenAt);
	writeUserIndex(list);
	await diskSaveAccounts(list, disk.sessionUserId ?? (await readAccountSessionIdb()));
	return list;
}

export async function saveProfile(profile: Profile): Promise<void> {
	await saveProfileIdb(profile);
	await mirrorAccounts(await readAccountSessionIdb());
}

export async function findProfileById(userId: string): Promise<Profile | undefined> {
	return (await loadProfiles()).find((entry) => entry.id === userId);
}

export async function findProfilesByName(name: string): Promise<Profile[]> {
	const key = nameKey(name);
	return (await loadProfiles()).filter((entry) => (entry.nameKey || nameKey(entry.name)) === key);
}

export async function assertUniqueUsername(name: string, exceptId?: string): Promise<void> {
	const trimmed = name.trim();
	if (!trimmed) {
		throw new Error('Username is required.');
	}
	const taken = (await findProfilesByName(trimmed)).filter((entry) => entry.id !== exceptId);
	if (taken.length > 0) {
		throw new Error(
			`“${taken[0].name}” is already taken. Usernames must be unique. Change the name, or switch to Log in.`,
		);
	}
}

export async function pickProfileForName(name: string): Promise<Profile | undefined> {
	const matches = await findProfilesByName(name);
	if (matches.length === 0) {
		return undefined;
	}
	if (matches.length === 1) {
		return matches[0];
	}
	let best = matches[matches.length - 1];
	let bestScore = -1;
	for (const profile of matches) {
		if (!(await databaseExists(progressDbName(profile.id)))) {
			if (bestScore < 0) {
				best = profile;
			}
			continue;
		}
		const snapshot = await loadAll(profile.id);
		const score =
			snapshot.tickets.length * 20 +
			snapshot.completions.length +
			snapshot.items.filter((item) => item.done).length;
		if (score > bestScore) {
			bestScore = score;
			best = profile;
		}
	}
	return best;
}

export async function readAccountSessionIdb(): Promise<string | null> {
	const db = await openAccounts();
	if (!db.objectStoreNames.contains('meta')) {
		db.close();
		return null;
	}
	const row = await requestToPromise(
		db.transaction('meta').objectStore('meta').get('session') as IDBRequest<{ key: string; userId?: string } | undefined>,
	);
	db.close();
	return row?.userId || null;
}

export async function readAccountSession(): Promise<string | null> {
	const local = await readAccountSessionIdb();
	if (local) {
		return local;
	}
	const disk = await diskLoadAccounts();
	if (disk?.sessionUserId) {
		await writeAccountSessionIdb(disk.sessionUserId);
		return disk.sessionUserId;
	}
	return null;
}

async function writeAccountSessionIdb(userId: string): Promise<void> {
	const db = await openAccounts();
	if (!db.objectStoreNames.contains('meta')) {
		db.close();
		return;
	}
	const tx = db.transaction('meta', 'readwrite');
	tx.objectStore('meta').put({ key: 'session', userId });
	await transactionDone(tx);
	db.close();
}

export async function writeAccountSession(userId: string): Promise<void> {
	await writeAccountSessionIdb(userId);
	await mirrorAccounts(userId);
}

export async function clearAccountSession(): Promise<void> {
	const db = await openAccounts();
	if (!db.objectStoreNames.contains('meta')) {
		db.close();
		return;
	}
	const tx = db.transaction('meta', 'readwrite');
	tx.objectStore('meta').delete('session');
	await transactionDone(tx);
	db.close();
	await mirrorAccounts(null);
}

export async function setPin(profile: Profile, pin: string): Promise<Profile> {
	if (!pin) {
		const next = { ...profile, pinSalt: '', pinHash: '' };
		await saveProfile(next);
		return next;
	}
	const pinSalt = randomSalt();
	const pinHash = await hashPin(pin, pinSalt);
	const next = { ...profile, pinSalt, pinHash };
	await saveProfile(next);
	return next;
}

export async function unlockProfile(profile: Profile, pin: string): Promise<boolean> {
	if (!profile.pinHash) {
		return true;
	}
	return verifyPin(pin, profile.pinSalt, profile.pinHash);
}

export function hasPin(profile: Profile): boolean {
	return Boolean(profile.pinHash);
}

export async function deleteProfile(profileId: string): Promise<void> {
	const db = await openAccounts();
	const tx = db.transaction('profiles', 'readwrite');
	tx.objectStore('profiles').delete(profileId);
	await transactionDone(tx);
	db.close();
	await deleteDatabase(progressDbName(profileId));
	await diskDeleteUser(profileId);
	writeUserIndex(await loadProfilesFromIdb());
	await diskSaveAccounts(await loadProfilesFromIdb(), await readAccountSessionIdb());
}

function recoveredProfile(userId: string, identity: UserIdentity | null, stubName?: string): Profile {
	const name = identity?.name || stubName || `Recovered ${userId.slice(0, 8)}`;
	return {
		id: userId,
		name,
		nameKey: identity?.nameKey || nameKey(name),
		focusTrack: identity?.focusTrack ?? 'ai-engineering',
		pinSalt: '',
		pinHash: '',
		createdAt: identity?.createdAt ?? Date.now(),
		lastSeenAt: Date.now(),
	};
}

export async function reconcileAccounts(): Promise<Profile[]> {
	const byId = new Map((await loadProfiles()).map((profile) => [profile.id, profile]));

	for (const stub of readUserIndex()) {
		if (byId.has(stub.id)) {
			continue;
		}
		const identity = (await databaseExists(progressDbName(stub.id))) ? await loadIdentity(stub.id) : null;
		const profile = recoveredProfile(stub.id, identity, stub.name);
		await saveProfile(profile);
		byId.set(profile.id, profile);
	}

	for (const userId of await listProgressUserIds()) {
		if (byId.has(userId)) {
			continue;
		}
		if (!(await databaseExists(progressDbName(userId)))) {
			continue;
		}
		const identity = await loadIdentity(userId);
		const profile = recoveredProfile(userId, identity);
		await saveProfile(profile);
		byId.set(profile.id, profile);
	}

	const list = await loadProfiles();
	writeUserIndex(list);
	return list;
}
