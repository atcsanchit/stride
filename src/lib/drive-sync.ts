import {
	ensureProfileForGoogleEmail,
	loadProfilesFromIdb,
	readAccountSession,
	upsertProfileLocal,
	writeUserIndexFromList,
} from './accounts';
import { loadAll, loadIdentity, loadLocalSnapshot, mergeSnapshots, replaceAll, type ProgressSnapshot } from './db';
import { clearDriveFileCache, listStrideJsonNames, readDriveJson, writeDriveJson } from './drive-api';
import {
	clearDriveSession,
	currentAccessToken,
	driveConfigured,
	driveRemembered,
	rememberedDriveEmail,
	requestGoogleToken,
} from './google-auth';
import { setDriveAccountsHook, setDriveProgressHook } from './persist-hooks';
import type { Profile, UserIdentity } from '../types';

const DEBOUNCE_MS = 4_000;
const ACCOUNTS_FILE = 'accounts.json';
const PUSHED_KEY = 'stride-drive-pushed-at';

export type DriveStatus = {
	configured: boolean;
	connected: boolean;
	email: string | null;
	syncing: boolean;
	lastSyncedAt: number | null;
	lastError: string | null;
};

export type DriveRestoreResult = {
	users: Profile[];
	remoteUserIds: string[];
};

type DriveAccountsFile = {
	kind: 'stride-drive-accounts';
	version: 1;
	updatedAt: number;
	users: Profile[];
	sessionUserId: string | null;
};

type DriveSnapshotFile = {
	kind: 'stride-drive-snapshot';
	version: 1;
	updatedAt: number;
	profileId: string;
	identity: UserIdentity | null;
	snapshot: ProgressSnapshot;
};

type Listener = (status: DriveStatus) => void;
type DataListener = (profileId: string) => void;

const listeners = new Set<Listener>();
const dataListeners = new Set<DataListener>();
const dirtyProfiles = new Set<string>();
let accountsDirty = false;
let accountsTimer: number | null = null;
let profileTimer: number | null = null;
let lastSyncedAt: number | null = readLastPushed(null);
let lastError: string | null = null;
let syncing = false;
let hooksInstalled = false;
let applyingRemote = false;

function readLastPushed(profileId: string | null): number | null {
	try {
		const raw = localStorage.getItem(profileId ? `${PUSHED_KEY}:${profileId}` : PUSHED_KEY);
		const value = raw ? Number(raw) : 0;
		return value > 0 ? value : null;
	} catch {
		return null;
	}
}

function writeLastPushed(profileId: string | null, when: number): void {
	try {
		localStorage.setItem(profileId ? `${PUSHED_KEY}:${profileId}` : PUSHED_KEY, String(when));
	} catch {
		// ignore
	}
}

function snapshotFileName(profileId: string): string {
	return `${profileId}.json`;
}

export function getDriveStatus(): DriveStatus {
	return {
		configured: driveConfigured(),
		connected: driveRemembered() || Boolean(rememberedDriveEmail()),
		email: rememberedDriveEmail(),
		syncing,
		lastSyncedAt,
		lastError,
	};
}

export function subscribeDriveStatus(listener: Listener): () => void {
	listeners.add(listener);
	listener(getDriveStatus());
	return () => listeners.delete(listener);
}

/** Fired when Drive merge wrote progress into local IndexedDB. */
export function subscribeDriveData(listener: DataListener): () => void {
	dataListeners.add(listener);
	return () => dataListeners.delete(listener);
}

function emitData(profileId: string): void {
	dataListeners.forEach((listener) => listener(profileId));
}

function emit(): void {
	const status = getDriveStatus();
	listeners.forEach((listener) => listener(status));
}

function setError(message: string | null): void {
	lastError = message;
	emit();
}

function hasProgress(snapshot: ProgressSnapshot): boolean {
	return snapshot.tickets.length > 0 || snapshot.completions.length > 0 || snapshot.items.some((item) => item.done);
}

export function installDrivePersistHooks(): void {
	if (hooksInstalled) {
		return;
	}
	hooksInstalled = true;
	setDriveProgressHook((profileId) => scheduleProfilePush(profileId));
	setDriveAccountsHook(() => scheduleAccountsPush());
}

function currentDriveEmail(): string | null {
	return rememberedDriveEmail()?.trim().toLowerCase() || null;
}

async function profilesForCurrentDrive(): Promise<Profile[]> {
	const email = currentDriveEmail();
	if (!email) {
		return [];
	}
	return (await loadProfilesFromIdb()).filter((user) => user.googleEmail === email);
}

export async function signInWithGoogle(options?: { pickAccount?: boolean }): Promise<{
	status: DriveStatus;
	profile: Profile;
}> {
	if (!driveConfigured()) {
		throw new Error('Add VITE_GOOGLE_CLIENT_ID, then rebuild. Use a personal Gmail, not work.');
	}
	const previous = currentDriveEmail();
	const pickAccount = options?.pickAccount !== false;
	const { email } = await requestGoogleToken(true, { pickAccount });
	if (!email) {
		throw new Error('Google did not return an email. Click again and allow the email permission.');
	}
	const nextEmail = email.trim().toLowerCase();
	if (!previous || previous !== nextEmail) {
		clearDriveFileCache();
	}
	setError(null);
	emit();
	const restored = await restoreFromDrive(true, nextEmail);
	const profile = await ensureProfileForGoogleEmail(nextEmail, restored.remoteUserIds, {
		claimUnlinkedLocal: !previous || previous === nextEmail,
	});
	accountsDirty = true;
	dirtyProfiles.clear();
	dirtyProfiles.add(profile.id);
	await flushDriveSync(true);
	return { status: getDriveStatus(), profile };
}

export async function connectGoogleDrive(): Promise<DriveStatus> {
	const { status } = await signInWithGoogle({ pickAccount: true });
	return status;
}

export function disconnectGoogleDrive(): void {
	clearDriveSession();
	clearDriveFileCache();
	dirtyProfiles.clear();
	accountsDirty = false;
	lastError = null;
	emit();
}

export async function restoreFromDrive(interactive: boolean, googleEmail?: string | null): Promise<DriveRestoreResult> {
	const empty = async (): Promise<DriveRestoreResult> => ({
		users: await loadProfilesFromIdb(),
		remoteUserIds: [],
	});
	if (!driveConfigured()) {
		return empty();
	}
	if (!interactive && !currentAccessToken()) {
		setError(null);
		return empty();
	}
	if (!driveRemembered() && !interactive) {
		return empty();
	}
	try {
		await requestGoogleToken(interactive);
	} catch (error) {
		if (!interactive) {
			return empty();
		}
		throw error;
	}
	const email = (googleEmail || rememberedDriveEmail() || '').trim().toLowerCase();
	syncing = true;
	emit();
	try {
		const remoteUserIds: string[] = [];
		const remote = await readDriveJson<DriveAccountsFile>(ACCOUNTS_FILE, interactive);
		if (remote?.kind === 'stride-drive-accounts' && Array.isArray(remote.users)) {
			for (const user of remote.users) {
				if (user?.id && user.name) {
					await upsertProfileLocal({
						...user,
						googleEmail: email || user.googleEmail,
					});
					remoteUserIds.push(user.id);
				}
			}
		}
		const names = await listStrideJsonNames(interactive);
		const snapshotIds: string[] = [];
		for (const name of names) {
			if (name === ACCOUNTS_FILE || !name.endsWith('.json')) {
				continue;
			}
			const profileId = name.slice(0, -'.json'.length);
			const file = await readDriveJson<DriveSnapshotFile>(name, interactive);
			if (file?.kind !== 'stride-drive-snapshot' || !file.snapshot) {
				continue;
			}
			snapshotIds.push(profileId);
			await applyRemoteSnapshot(profileId, file);
			if (email) {
				const existing = (await loadProfilesFromIdb()).find((row) => row.id === profileId);
				if (existing && existing.googleEmail !== email) {
					await upsertProfileLocal({ ...existing, googleEmail: email });
				}
			}
		}
		const users = await loadProfilesFromIdb();
		writeUserIndexFromList(users);
		lastSyncedAt = Date.now();
		writeLastPushed(null, lastSyncedAt);
		setError(null);
		return {
			users,
			remoteUserIds: remoteUserIds.length > 0 ? remoteUserIds : snapshotIds,
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Drive restore failed.';
		setError(message);
		if (interactive) {
			throw error;
		}
		return empty();
	} finally {
		syncing = false;
		emit();
	}
}

async function applyMergedSnapshot(profileId: string, merged: ProgressSnapshot, remoteUpdatedAt?: number): Promise<void> {
	applyingRemote = true;
	try {
		await replaceAll(profileId, merged);
	} finally {
		applyingRemote = false;
	}
	if (remoteUpdatedAt && remoteUpdatedAt > (readLastPushed(profileId) ?? 0)) {
		writeLastPushed(profileId, remoteUpdatedAt);
	}
	emitData(profileId);
}

async function applyRemoteSnapshot(profileId: string, remote: DriveSnapshotFile): Promise<void> {
	const local = await loadLocalSnapshot(profileId);
	/** Always union both sides — never drop tickets that exist only on one browser. */
	const merged = mergeSnapshots(remote.snapshot, local);
	await applyMergedSnapshot(profileId, merged, remote.updatedAt);
}

export async function pullProfileFromDrive(profileId: string, interactive = false): Promise<void> {
	if (!driveConfigured() || (!driveRemembered() && !interactive)) {
		return;
	}
	if (!interactive && !currentAccessToken()) {
		return;
	}
	try {
		await requestGoogleToken(interactive);
		const remote = await readDriveJson<DriveSnapshotFile>(snapshotFileName(profileId), interactive);
		if (!remote || remote.kind !== 'stride-drive-snapshot') {
			if (hasProgress(await loadAll(profileId))) {
				scheduleProfilePush(profileId);
			}
			return;
		}
		await applyRemoteSnapshot(profileId, remote);
		setError(null);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Drive pull failed.';
		setError(message);
		if (interactive) {
			throw error;
		}
	}
}

async function pushAccounts(interactive: boolean): Promise<void> {
	const users = await profilesForCurrentDrive();
	if (users.length === 0) {
		accountsDirty = false;
		return;
	}
	const sessionUserId = await readAccountSession();
	const payload: DriveAccountsFile = {
		kind: 'stride-drive-accounts',
		version: 1,
		updatedAt: Date.now(),
		users,
		sessionUserId: users.some((user) => user.id === sessionUserId) ? sessionUserId : users[0].id,
	};
	await writeDriveJson(ACCOUNTS_FILE, payload, interactive);
	accountsDirty = false;
}

/**
 * Pull Drive → merge with local (union tickets) → write local + Drive.
 * Prevents one browser from wiping tickets created in another.
 */
async function pushProfile(profileId: string, interactive: boolean): Promise<void> {
	const mergeWithRemote = async (base: ProgressSnapshot): Promise<{ merged: ProgressSnapshot; remoteUpdatedAt?: number }> => {
		const remote = await readDriveJson<DriveSnapshotFile>(snapshotFileName(profileId), interactive);
		if (remote?.kind === 'stride-drive-snapshot' && remote.snapshot) {
			return { merged: mergeSnapshots(base, remote.snapshot), remoteUpdatedAt: remote.updatedAt };
		}
		return { merged: base };
	};

	let local = await loadAll(profileId);
	let remoteUpdatedAt: number | undefined;
	try {
		const first = await mergeWithRemote(local);
		local = first.merged;
		remoteUpdatedAt = first.remoteUpdatedAt;
	} catch (error) {
		if (interactive) {
			throw error;
		}
		console.error('Drive pull before push failed; uploading local snapshot', error);
	}

	const beforeIds = new Set((await loadLocalSnapshot(profileId)).tickets.map((ticket) => ticket.id));
	const gainedRemote = local.tickets.some((ticket) => !beforeIds.has(ticket.id));
	if (gainedRemote || local.tickets.length !== beforeIds.size) {
		await applyMergedSnapshot(profileId, local, remoteUpdatedAt);
	}

	const identity = await loadIdentity(profileId);
	const updatedAt = Date.now();
	const payload: DriveSnapshotFile = {
		kind: 'stride-drive-snapshot',
		version: 1,
		updatedAt,
		profileId,
		identity,
		snapshot: local,
	};
	await writeDriveJson(snapshotFileName(profileId), payload, interactive);
	writeLastPushed(profileId, updatedAt);

	// If another tab wrote between our pull and write, pull again and re-merge once.
	try {
		const again = await mergeWithRemote(local);
		const againIds = new Set(again.merged.tickets.map((ticket) => ticket.id));
		const missing = local.tickets.some((ticket) => !againIds.has(ticket.id)) || again.merged.tickets.some((ticket) => !local.tickets.some((row) => row.id === ticket.id));
		if (missing && again.remoteUpdatedAt && again.remoteUpdatedAt > updatedAt) {
			local = again.merged;
			await applyMergedSnapshot(profileId, local, again.remoteUpdatedAt);
			const retryAt = Date.now();
			await writeDriveJson(
				snapshotFileName(profileId),
				{ ...payload, updatedAt: retryAt, snapshot: local },
				interactive,
			);
			writeLastPushed(profileId, retryAt);
		}
	} catch (error) {
		console.error('Drive verify-after-push failed', error);
	}

	dirtyProfiles.delete(profileId);
}

export function scheduleProfilePush(profileId: string): void {
	if (applyingRemote || !driveConfigured() || !driveRemembered()) {
		return;
	}
	dirtyProfiles.add(profileId);
	if (profileTimer !== null) {
		window.clearTimeout(profileTimer);
	}
	profileTimer = window.setTimeout(() => {
		profileTimer = null;
		void flushDriveSync(false);
	}, DEBOUNCE_MS);
}

export function scheduleAccountsPush(): void {
	if (!driveConfigured() || !driveRemembered()) {
		return;
	}
	accountsDirty = true;
	if (accountsTimer !== null) {
		window.clearTimeout(accountsTimer);
	}
	accountsTimer = window.setTimeout(() => {
		accountsTimer = null;
		void flushDriveSync(false);
	}, DEBOUNCE_MS);
}

export async function flushDriveSync(interactive = false): Promise<void> {
	if (!driveConfigured() || (!driveRemembered() && !interactive)) {
		return;
	}
	if (!interactive && !currentAccessToken()) {
		return;
	}
	const ownedIds = new Set((await profilesForCurrentDrive()).map((user) => user.id));
	const profiles = [...dirtyProfiles].filter((id) => ownedIds.has(id));
	for (const id of dirtyProfiles) {
		if (!ownedIds.has(id)) {
			dirtyProfiles.delete(id);
		}
	}
	if (!accountsDirty && profiles.length === 0) {
		return;
	}
	syncing = true;
	emit();
	try {
		await requestGoogleToken(interactive);
		if (accountsDirty || profiles.length > 0) {
			await pushAccounts(interactive);
		}
		for (const profileId of profiles) {
			await pushProfile(profileId, interactive);
		}
		lastSyncedAt = Date.now();
		writeLastPushed(null, lastSyncedAt);
		setError(null);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Drive sync failed.';
		setError(message);
		if (interactive) {
			throw error;
		}
	} finally {
		syncing = false;
		emit();
	}
}

export async function syncDriveNow(): Promise<void> {
	if (!driveConfigured()) {
		throw new Error('Add VITE_GOOGLE_CLIENT_ID first.');
	}
	await requestGoogleToken(true);
	const users = await profilesForCurrentDrive();
	accountsDirty = true;
	dirtyProfiles.clear();
	for (const user of users) {
		dirtyProfiles.add(user.id);
	}
	await flushDriveSync(true);
}

export function attachDriveLeaveSync(getActiveProfileId?: () => string | null): () => void {
	const flushLeaving = () => {
		void (async () => {
			try {
				const users = await profilesForCurrentDrive();
				for (const user of users) {
					dirtyProfiles.add(user.id);
				}
				const active = getActiveProfileId?.();
				if (active) {
					dirtyProfiles.add(active);
				}
				accountsDirty = users.length > 0 || Boolean(active);
				await flushDriveSync(false);
			} catch (error) {
				console.error(error);
			}
		})();
	};

	const onVisibility = () => {
		if (document.visibilityState === 'hidden') {
			flushLeaving();
			return;
		}
		if (document.visibilityState !== 'visible') {
			return;
		}
		const active = getActiveProfileId?.();
		if (!active || !driveRemembered()) {
			return;
		}
		void pullProfileFromDrive(active, false).catch((error) => console.error(error));
	};

	document.addEventListener('visibilitychange', onVisibility);
	window.addEventListener('pagehide', flushLeaving);
	return () => {
		document.removeEventListener('visibilitychange', onVisibility);
		window.removeEventListener('pagehide', flushLeaving);
	};
}
