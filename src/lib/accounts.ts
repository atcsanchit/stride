import { ACCOUNTS_DB, emptySettings } from '../constants';
import type { Profile, UserIdentity } from '../types';
import { databaseExists, deleteDatabase, requestToPromise, transactionDone } from './idb';
import { listProgressUserIds, nameKey, readUserIndex, writeUserIndex } from './identity';
import { hashPin, randomSalt, verifyPin } from './pin';
import { loadIdentity, loadAll, progressDbName, saveSettings } from './db';
import { diskDeleteUser, diskLoadAccounts, diskSaveAccounts } from './disk';
import { createId } from './id';
import { notifyAccountsSaved } from './persist-hooks';

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

function optionalText(value: string | undefined): string | undefined {
	const trimmed = value?.trim();
	return trimmed ? trimmed : undefined;
}

export type ProfileDetails = {
	displayName?: string;
	headline?: string;
	about?: string;
	location?: string;
	link?: string;
	photo?: string;
};

function normalizeProfile(row: Profile): Profile {
	const photo = row.photo?.startsWith('data:image/') ? row.photo : undefined;
	return {
		...row,
		nameKey: row.nameKey || nameKey(row.name),
		googleEmail: row.googleEmail?.trim().toLowerCase() || undefined,
		displayName: optionalText(row.displayName),
		headline: optionalText(row.headline),
		about: optionalText(row.about),
		location: optionalText(row.location),
		link: optionalText(row.link),
		photo,
	};
}

function preferDetail(
	incoming: string | undefined,
	current: string | undefined,
	incomingNewer: boolean,
): string | undefined {
	const primary = optionalText(incomingNewer ? incoming : current);
	const fallback = optionalText(incomingNewer ? current : incoming);
	return primary || fallback;
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
	notifyAccountsSaved();
}

export function writeUserIndexFromList(users: Profile[]): void {
	writeUserIndex(users);
}

export async function upsertProfileLocal(incoming: Profile): Promise<void> {
	if (!incoming.id || !incoming.name) {
		return;
	}
	const current = (await loadProfilesFromIdb()).find((entry) => entry.id === incoming.id);
	const incomingNewer = (incoming.lastSeenAt || 0) >= (current?.lastSeenAt || 0);
	const next = normalizeProfile({
		...incoming,
		...current,
		id: incoming.id,
		name: current?.name || incoming.name,
		nameKey: current?.nameKey || incoming.nameKey || nameKey(incoming.name),
		pinSalt: current?.pinSalt || incoming.pinSalt,
		pinHash: current?.pinHash || incoming.pinHash,
		lastSeenAt: Math.max(current?.lastSeenAt || 0, incoming.lastSeenAt || 0),
		focusTrack: current?.focusTrack || incoming.focusTrack,
		createdAt: current?.createdAt || incoming.createdAt,
		googleEmail: incoming.googleEmail || current?.googleEmail,
		displayName: preferDetail(incoming.displayName, current?.displayName, incomingNewer),
		headline: preferDetail(incoming.headline, current?.headline, incomingNewer),
		about: preferDetail(incoming.about, current?.about, incomingNewer),
		location: preferDetail(incoming.location, current?.location, incomingNewer),
		link: preferDetail(incoming.link, current?.link, incomingNewer),
		photo: preferDetail(incoming.photo, current?.photo, incomingNewer),
	});
	await saveProfileIdb(next);
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
			googleEmail: current.googleEmail || user.googleEmail,
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

export async function updateProfileDetails(profile: Profile, details: ProfileDetails): Promise<Profile> {
	const photo = details.photo?.trim() ?? '';
	if (photo && !photo.startsWith('data:image/')) {
		throw new Error('Profile photo must be an image.');
	}
	if (photo.length > 180_000) {
		throw new Error('That photo is too large. Try a smaller image.');
	}
	const next = normalizeProfile({
		...profile,
		displayName: details.displayName,
		headline: details.headline,
		about: details.about,
		location: details.location,
		link: details.link,
		photo: photo || undefined,
		lastSeenAt: Date.now(),
	});
	await saveProfile(next);
	return next;
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

async function uniqueNameFromEmail(email: string): Promise<string> {
	const local = email.split('@')[0]?.replace(/[._]+/g, ' ').trim() || 'user';
	const existing = new Set((await loadProfilesFromIdb()).map((row) => (row.nameKey || nameKey(row.name)).toLowerCase()));
	let candidate = local;
	let n = 2;
	while (existing.has(nameKey(candidate))) {
		candidate = `${local} ${n}`;
		n += 1;
	}
	return candidate;
}

export type WorkspaceSummary = {
	profile: Profile;
	tickets: number;
	completions: number;
	sessions: number;
	doneItems: number;
};

export async function profilesForGoogleEmail(email: string, remoteUserIds: string[] = []): Promise<Profile[]> {
	const key = email.trim().toLowerCase();
	if (!key) {
		return [];
	}
	const local = await loadProfilesFromIdb();
	const matched = local.filter(
		(row) => (row.googleEmail ?? '').trim().toLowerCase() === key || remoteUserIds.includes(row.id),
	);
	for (const row of matched) {
		if ((row.googleEmail ?? '').trim().toLowerCase() !== key) {
			await saveProfile({ ...row, googleEmail: key });
		}
	}
	return (await loadProfilesFromIdb())
		.filter((row) => (row.googleEmail ?? '').trim().toLowerCase() === key)
		.sort((a, b) => b.lastSeenAt - a.lastSeenAt);
}

export async function summarizeWorkspace(profile: Profile): Promise<WorkspaceSummary> {
	if (!(await databaseExists(progressDbName(profile.id)))) {
		return { profile, tickets: 0, completions: 0, sessions: 0, doneItems: 0 };
	}
	const snapshot = await loadAll(profile.id);
	return {
		profile,
		tickets: snapshot.tickets.length,
		completions: snapshot.completions.length,
		sessions: snapshot.sessions.length,
		doneItems: snapshot.items.filter((item) => item.done).length,
	};
}

export async function summarizeWorkspaces(profiles: Profile[]): Promise<WorkspaceSummary[]> {
	const rows = await Promise.all(profiles.map((profile) => summarizeWorkspace(profile)));
	return rows.sort((a, b) => {
		const scoreA = a.tickets * 20 + a.completions + a.doneItems;
		const scoreB = b.tickets * 20 + b.completions + b.doneItems;
		if (scoreA !== scoreB) {
			return scoreB - scoreA;
		}
		return b.profile.lastSeenAt - a.profile.lastSeenAt;
	});
}

/**
 * Resolve Google login to workspaces. Never invents a second empty profile when one already exists.
 * Creates a first workspace only when this Gmail has none yet.
 */
export async function ensureProfileForGoogleEmail(
	email: string,
	remoteUserIds: string[] = [],
	options?: { claimUnlinkedLocal?: boolean },
): Promise<Profile> {
	const key = email.trim().toLowerCase();
	if (!key) {
		throw new Error('Google did not return an email.');
	}
	const now = Date.now();
	const candidates = await profilesForGoogleEmail(key, remoteUserIds);
	if (candidates.length > 0) {
		const best = await richestProfile(candidates);
		const next = { ...best, lastSeenAt: now, googleEmail: key };
		await saveProfile(next);
		return next;
	}

	const local = await loadProfilesFromIdb();
	const unlinked = local.filter((row) => !row.googleEmail);
	if (options?.claimUnlinkedLocal !== false && unlinked.length === 1 && remoteUserIds.length === 0) {
		const next = { ...unlinked[0], googleEmail: key, lastSeenAt: now };
		await saveProfile(next);
		return next;
	}

	return createGoogleWorkspace(key);
}

/** Explicit new workspace under this Gmail — kept separate until the user merges. */
export async function createGoogleWorkspace(email: string, name?: string): Promise<Profile> {
	const key = email.trim().toLowerCase();
	if (!key) {
		throw new Error('Google did not return an email.');
	}
	const now = Date.now();
	const label = name?.trim() || (await uniqueNameFromEmail(key));
	await assertUniqueUsername(label);
	const created: Profile = {
		id: createId(),
		name: label,
		nameKey: nameKey(label),
		focusTrack: 'ai-engineering',
		pinSalt: '',
		pinHash: '',
		createdAt: now,
		lastSeenAt: now,
		googleEmail: key,
	};
	await saveProfile(created);
	await saveSettings(created.id, emptySettings('ai-engineering'));
	return created;
}

async function progressScore(profileId: string): Promise<number> {
	if (!(await databaseExists(progressDbName(profileId)))) {
		return -1;
	}
	const snapshot = await loadAll(profileId);
	return (
		snapshot.tickets.length * 20 + snapshot.completions.length + snapshot.items.filter((item) => item.done).length
	);
}

/** Prefer the workspace with the most work when a default is needed. */
async function richestProfile(profiles: Profile[]): Promise<Profile> {
	let best = profiles[0];
	let bestScore = -2;
	for (const profile of profiles) {
		const score = await progressScore(profile.id);
		if (score > bestScore || (score === bestScore && profile.lastSeenAt > best.lastSeenAt)) {
			best = profile;
			bestScore = score;
		}
	}
	return best;
}

/** Other local profiles linked to the same Gmail. */
export async function siblingProfilesForEmail(email: string, exceptId: string): Promise<Profile[]> {
	const key = email.trim().toLowerCase();
	if (!key) {
		return [];
	}
	return (await profilesForGoogleEmail(key)).filter((row) => row.id !== exceptId);
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
