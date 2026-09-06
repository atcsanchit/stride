import { emptySettings, LEGACY_PROGRESS_DB } from '../constants';
import type { Completion, Drop, ReviewCard, Roadmap, RoadmapItem, Settings, Sprint, Ticket, UserIdentity, WorkSession } from '../types';
import { databaseExists, deleteDatabase, requestToPromise, transactionDone } from './idb';
import {
	diskAvailable,
	diskLoadSnapshot,
	diskSaveIdentity,
	diskSaveSettings,
	diskSaveSnapshot,
	type DiskSnapshot,
} from './disk';
import { normalizeSprint } from './sprint';
import { normalizeTicket } from './ticket';

export function progressDbName(profileId: string): string {
	return `stride-personal-${profileId}`;
}

const DB_VERSION = 4;
const STORES = ['roadmaps', 'items', 'drops', 'meta', 'completions', 'sessions', 'sprints', 'tickets', 'reviews'] as const;

type IdRecord = { id: string };

function addIndex(store: IDBObjectStore, name: string, keyPath: string): void {
	if (!store.indexNames.contains(name)) {
		store.createIndex(name, keyPath, { unique: false });
	}
}

function cloneRecord<T>(record: T): T {
	return JSON.parse(JSON.stringify(record)) as T;
}

function putById(store: IDBObjectStore, record: IdRecord): void {
	if (!record.id) {
		throw new DOMException(`Cannot persist ${store.name} without id`, 'DataError');
	}
	const value = { ...cloneRecord(record), id: record.id };
	if (store.keyPath === 'id') {
		store.put(value);
		return;
	}
	store.put(value, record.id);
}

function recordId(value: unknown, fallbackKey: IDBValidKey): string | null {
	if (value && typeof value === 'object' && 'id' in value) {
		const id = (value as { id: unknown }).id;
		if (typeof id === 'string' && id) {
			return id;
		}
	}
	if (typeof fallbackKey === 'string' && fallbackKey) {
		return fallbackKey;
	}
	if (typeof fallbackKey === 'number' && Number.isFinite(fallbackKey)) {
		return String(fallbackKey);
	}
	return null;
}

function ensureIdStore(
	db: IDBDatabase,
	tx: IDBTransaction,
	name: string,
	indexes: Array<[string, string]> = [],
): void {
	if (!db.objectStoreNames.contains(name)) {
		const store = db.createObjectStore(name, { keyPath: 'id' });
		for (const [indexName, keyPath] of indexes) {
			addIndex(store, indexName, keyPath);
		}
		return;
	}
	const current = tx.objectStore(name);
	if (current.keyPath === 'id') {
		for (const [indexName, keyPath] of indexes) {
			addIndex(current, indexName, keyPath);
		}
		return;
	}
	const collected: Array<{ id: string; value: Record<string, unknown> }> = [];
	const cursorReq = current.openCursor();
	cursorReq.onsuccess = () => {
		const cursor = cursorReq.result;
		if (cursor) {
			const raw = cursor.value;
			const id = recordId(raw, cursor.key);
			if (id) {
				collected.push({
					id,
					value: raw && typeof raw === 'object' ? { ...(raw as Record<string, unknown>), id } : { id },
				});
			}
			cursor.continue();
			return;
		}
		db.deleteObjectStore(name);
		const next = db.createObjectStore(name, { keyPath: 'id' });
		for (const [indexName, keyPath] of indexes) {
			addIndex(next, indexName, keyPath);
		}
		for (const row of collected) {
			next.put(row.value);
		}
	};
}

function ensureStores(db: IDBDatabase, tx: IDBTransaction): void {
	ensureIdStore(db, tx, 'roadmaps');
	ensureIdStore(db, tx, 'items', [
		['roadmapId', 'roadmapId'],
		['trackId', 'trackId'],
	]);
	ensureIdStore(db, tx, 'drops', [
		['date', 'date'],
		['trackId', 'trackId'],
	]);
	if (!db.objectStoreNames.contains('meta')) {
		db.createObjectStore('meta', { keyPath: 'key' });
	}
	ensureIdStore(db, tx, 'completions', [
		['date', 'date'],
		['itemId', 'itemId'],
	]);
	ensureIdStore(db, tx, 'sessions');
	ensureIdStore(db, tx, 'sprints');
	ensureIdStore(db, tx, 'tickets', [
		['sprintId', 'sprintId'],
		['plannedDate', 'plannedDate'],
	]);
	ensureIdStore(db, tx, 'reviews', [
		['dueDate', 'dueDate'],
		['trackId', 'trackId'],
	]);
}

function openNamed(name: string): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(name, DB_VERSION);
		request.onupgradeneeded = () => {
			const tx = request.transaction;
			if (!tx) {
				return;
			}
			ensureStores(request.result, tx);
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
		request.onblocked = () => {
			console.warn(`Stride database ${name} is blocked. Close other tabs on this same URL, then refresh.`);
		};
	});
}

function openDb(profileId: string): Promise<IDBDatabase> {
	return openNamed(progressDbName(profileId));
}

function normalizeSettings(value: Settings | undefined): Settings {
	const fallback = emptySettings();
	return {
		activeTrack: value?.activeTrack ?? fallback.activeTrack,
		dailyTargets: { ...fallback.dailyTargets, ...value?.dailyTargets },
		focusTrack: value?.focusTrack ?? fallback.focusTrack,
	};
}

async function readAll<T>(db: IDBDatabase, store: string): Promise<T[]> {
	if (!db.objectStoreNames.contains(store)) {
		return [];
	}
	return requestToPromise(db.transaction(store).objectStore(store).getAll() as IDBRequest<T[]>);
}

async function readItemsForRoadmap(db: IDBDatabase, roadmapId: string): Promise<RoadmapItem[]> {
	if (!db.objectStoreNames.contains('items')) {
		return [];
	}
	const tx = db.transaction('items', 'readonly');
	const store = tx.objectStore('items');
	if (store.indexNames.contains('roadmapId')) {
		const rows = await requestToPromise(store.index('roadmapId').getAll(roadmapId) as IDBRequest<RoadmapItem[]>);
		await transactionDone(tx);
		return rows;
	}
	const rows = await requestToPromise(store.getAll() as IDBRequest<RoadmapItem[]>);
	await transactionDone(tx);
	return rows.filter((item) => item.roadmapId === roadmapId);
}

async function readSnapshot(db: IDBDatabase): Promise<{
	roadmaps: Roadmap[];
	items: RoadmapItem[];
	drops: Drop[];
	completions: Completion[];
	sessions: WorkSession[];
	sprints: Sprint[];
	tickets: Ticket[];
	reviews: ReviewCard[];
	settings: Settings;
}> {
	const [roadmaps, items, drops, completions, sessions, sprints, tickets, reviews, settingsRecord] = await Promise.all([
		readAll<Roadmap>(db, 'roadmaps'),
		readAll<RoadmapItem>(db, 'items'),
		readAll<Drop>(db, 'drops'),
		readAll<Completion>(db, 'completions'),
		readAll<WorkSession>(db, 'sessions'),
		readAll<Sprint>(db, 'sprints'),
		readAll<Ticket>(db, 'tickets'),
		readAll<ReviewCard>(db, 'reviews'),
		db.objectStoreNames.contains('meta')
			? requestToPromise(
					db.transaction('meta').objectStore('meta').get('settings') as IDBRequest<{ key: string; value: Settings } | undefined>,
				)
			: Promise.resolve(undefined),
	]);
	return {
		roadmaps: roadmaps.filter((row) => row?.id).sort((a, b) => a.addedAt - b.addedAt),
		items: items.filter((row) => row?.id).sort((a, b) => a.order - b.order),
		drops: drops.filter((row) => row?.id).sort((a, b) => a.createdAt - b.createdAt),
		completions: completions.filter((row) => row?.id).sort((a, b) => a.completedAt - b.completedAt),
		sessions: sessions.filter((row) => row?.id).sort((a, b) => b.startedAt - a.startedAt),
		sprints: sprints
			.filter((row) => row?.id)
			.map((row) => normalizeSprint(row))
			.sort((a, b) => b.createdAt - a.createdAt),
		tickets: tickets
			.filter((row) => row?.id)
			.map((row) => normalizeTicket(row))
			.sort((a, b) => a.priority - b.priority || a.createdAt - b.createdAt),
		reviews: reviews.filter((row) => row?.id).sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
		settings: normalizeSettings(settingsRecord?.value),
	};
}

async function loadAllLocal(profileId: string) {
	const db = await openDb(profileId);
	const snapshot = await readSnapshot(db);
	db.close();
	return snapshot;
}

export type ProgressSnapshot = Awaited<ReturnType<typeof loadAllLocal>>;

function unionById<T extends { id: string }>(preferred: T[], extra: T[]): T[] {
	const map = new Map<string, T>();
	for (const row of extra) {
		if (row?.id) {
			map.set(row.id, row);
		}
	}
	for (const row of preferred) {
		if (row?.id) {
			map.set(row.id, row);
		}
	}
	return [...map.values()];
}

function mergeCourseItems(preferred: RoadmapItem[], extra: RoadmapItem[]): RoadmapItem[] {
	const map = new Map<string, RoadmapItem>();
	for (const row of extra) {
		if (row?.id) {
			map.set(row.id, row);
		}
	}
	for (const row of preferred) {
		if (!row?.id) {
			continue;
		}
		const previous = map.get(row.id);
		map.set(
			row.id,
			previous ? { ...row, done: row.done || previous.done, doneAt: row.doneAt || previous.doneAt } : row,
		);
	}
	return [...map.values()];
}

function snapshotHasProgress(snapshot: { tickets: Ticket[]; completions: Completion[]; items: RoadmapItem[] }): boolean {
	return snapshot.tickets.length > 0 || snapshot.completions.length > 0 || snapshot.items.some((item) => item.done);
}

function mergeSnapshots(disk: DiskSnapshot, local: ProgressSnapshot): ProgressSnapshot {
	const preferDiskSettings = snapshotHasProgress(disk);
	return {
		roadmaps: unionById(disk.roadmaps, local.roadmaps),
		items: mergeCourseItems(disk.items, local.items),
		drops: unionById(disk.drops, local.drops),
		completions: unionById(disk.completions, local.completions),
		sessions: unionById(disk.sessions, local.sessions),
		sprints: unionById(disk.sprints.map((row) => normalizeSprint(row)), local.sprints),
		tickets: unionById(
			disk.tickets.map((row) => normalizeTicket(row)),
			local.tickets,
		),
		reviews: unionById(disk.reviews, local.reviews),
		settings: preferDiskSettings ? { ...local.settings, ...disk.settings } : local.settings,
	};
}

const hydratedProfiles = new Set<string>();

function markHydrated(profileId: string): void {
	hydratedProfiles.add(profileId);
}

async function mirrorSnapshot(profileId: string, snapshot: ProgressSnapshot): Promise<void> {
	if (!(await diskAvailable())) {
		return;
	}
	try {
		const identity = await loadIdentity(profileId);
		await diskSaveSnapshot(profileId, snapshot, identity);
	} catch (error) {
		console.error('Stride disk save failed', error);
	}
}

async function hydrateFromDisk(profileId: string): Promise<ProgressSnapshot | null> {
	const disk = (await diskLoadSnapshot(profileId)) ?? (await diskLoadSnapshot(profileId));
	if (!disk) {
		return null;
	}
	const local = await loadAllLocal(profileId);
	const merged = mergeSnapshots(disk, local);
	await replaceAllLocal(profileId, merged);
	markHydrated(profileId);
	return merged;
}

async function mirrorFromIdb(profileId: string): Promise<void> {
	if (!hydratedProfiles.has(profileId)) {
		const merged = await hydrateFromDisk(profileId);
		if (merged) {
			await mirrorSnapshot(profileId, merged);
			return;
		}
		const local = await loadAllLocal(profileId);
		if (snapshotHasProgress(local)) {
			markHydrated(profileId);
			await mirrorSnapshot(profileId, local);
		}
		return;
	}
	await mirrorSnapshot(profileId, await loadAllLocal(profileId));
}

export async function loadAll(profileId: string): Promise<ProgressSnapshot> {
	const local = await loadAllLocal(profileId);
	const disk = (await diskLoadSnapshot(profileId)) ?? (await diskLoadSnapshot(profileId));
	if (!disk) {
		if (snapshotHasProgress(local)) {
			markHydrated(profileId);
			await mirrorSnapshot(profileId, local);
		}
		return local;
	}
	const merged = mergeSnapshots(disk, local);
	await replaceAllLocal(profileId, merged);
	markHydrated(profileId);
	await mirrorSnapshot(profileId, merged);
	return merged;
}

async function replaceAllLocal(profileId: string, snapshot: ProgressSnapshot): Promise<void> {
	const db = await openDb(profileId);
	const identity = await readIdentityRecord(db);
	const names = STORES.filter((name) => db.objectStoreNames.contains(name));
	const tx = db.transaction(names, 'readwrite');
	names.forEach((name) => tx.objectStore(name).clear());
	snapshot.roadmaps.forEach((roadmap) => putById(tx.objectStore('roadmaps'), roadmap));
	snapshot.items.forEach((item) => putById(tx.objectStore('items'), item));
	snapshot.drops.forEach((drop) => putById(tx.objectStore('drops'), drop));
	snapshot.completions.forEach((row) => putById(tx.objectStore('completions'), row));
	snapshot.sessions.forEach((row) => putById(tx.objectStore('sessions'), row));
	snapshot.sprints.forEach((row) => putById(tx.objectStore('sprints'), row));
	snapshot.tickets.forEach((row) => putById(tx.objectStore('tickets'), row));
	if (names.includes('reviews')) {
		(snapshot.reviews ?? []).forEach((row) => putById(tx.objectStore('reviews'), row));
	}
	tx.objectStore('meta').put({ key: 'settings', value: snapshot.settings });
	if (identity) {
		tx.objectStore('meta').put({ key: 'identity', value: identity });
	}
	await transactionDone(tx);
	db.close();
}

export async function replaceAll(profileId: string, snapshot: ProgressSnapshot): Promise<void> {
	await replaceAllLocal(profileId, snapshot);
	markHydrated(profileId);
	await mirrorSnapshot(profileId, snapshot);
}

export async function migrateLegacyIfNeeded(profileId: string): Promise<boolean> {
	if (!(await databaseExists(LEGACY_PROGRESS_DB))) {
		return false;
	}
	const current = await loadAll(profileId);
	if (current.drops.length > 0 || current.items.some((item) => item.done) || current.completions.length > 0) {
		return false;
	}
	const legacy = await openNamed(LEGACY_PROGRESS_DB);
	const snapshot = await readSnapshot(legacy);
	legacy.close();
	if (snapshot.roadmaps.length === 0 && snapshot.drops.length === 0 && snapshot.items.length === 0) {
		await deleteDatabase(LEGACY_PROGRESS_DB);
		return false;
	}
	await replaceAll(profileId, snapshot);
	await deleteDatabase(LEGACY_PROGRESS_DB);
	return true;
}

export async function putRoadmap(profileId: string, roadmap: Roadmap, items: RoadmapItem[]): Promise<void> {
	if (!roadmap.id) {
		throw new Error('Roadmap is missing an id');
	}
	const record: Roadmap = {
		...roadmap,
		id: roadmap.id,
		source: typeof roadmap.source === 'string' ? roadmap.source : String(roadmap.source ?? ''),
	};
	const validItems = items.filter((item) => Boolean(item?.id));
	const db = await openDb(profileId);
	const existing = await readItemsForRoadmap(db, roadmap.id);
	const tx = db.transaction(['roadmaps', 'items'], 'readwrite');
	putById(tx.objectStore('roadmaps'), record);
	const itemStore = tx.objectStore('items');
	const keep = new Set(validItems.map((item) => item.id));
	existing.filter((item) => item.id && !keep.has(item.id)).forEach((item) => itemStore.delete(item.id));
	validItems.forEach((item) => putById(itemStore, item));
	await transactionDone(tx);
	db.close();
	await mirrorFromIdb(profileId);
}

export async function deleteRoadmap(profileId: string, roadmapId: string): Promise<void> {
	const db = await openDb(profileId);
	const existing = await readItemsForRoadmap(db, roadmapId);
	const tx = db.transaction(['roadmaps', 'items'], 'readwrite');
	tx.objectStore('roadmaps').delete(roadmapId);
	const itemStore = tx.objectStore('items');
	existing.forEach((item) => {
		if (item.id) {
			itemStore.delete(item.id);
		}
	});
	await transactionDone(tx);
	db.close();
	await mirrorFromIdb(profileId);
}

async function putIn<T extends IdRecord>(profileId: string, store: string, record: T): Promise<void> {
	const db = await openDb(profileId);
	const tx = db.transaction(store, 'readwrite');
	putById(tx.objectStore(store), record);
	await transactionDone(tx);
	db.close();
	await mirrorFromIdb(profileId);
}

async function deleteIn(profileId: string, store: string, id: string): Promise<void> {
	const db = await openDb(profileId);
	const tx = db.transaction(store, 'readwrite');
	tx.objectStore(store).delete(id);
	await transactionDone(tx);
	db.close();
	await mirrorFromIdb(profileId);
}

export async function putItem(profileId: string, item: RoadmapItem): Promise<void> {
	await putIn(profileId, 'items', item);
}

export async function putCompletion(profileId: string, row: Completion): Promise<void> {
	await putIn(profileId, 'completions', row);
}

export async function putSession(profileId: string, row: WorkSession): Promise<void> {
	await putIn(profileId, 'sessions', row);
}

export async function deleteSession(profileId: string, id: string): Promise<void> {
	await deleteIn(profileId, 'sessions', id);
}

export async function putSprint(profileId: string, row: Sprint): Promise<void> {
	await putIn(profileId, 'sprints', row);
}

export async function putTicket(profileId: string, row: Ticket): Promise<void> {
	await putIn(profileId, 'tickets', { ...row, userId: profileId });
}

export async function deleteTicket(profileId: string, id: string): Promise<void> {
	await deleteIn(profileId, 'tickets', id);
}

export async function putReview(profileId: string, row: ReviewCard): Promise<void> {
	await putIn(profileId, 'reviews', row);
}

export async function deleteReview(profileId: string, id: string): Promise<void> {
	await deleteIn(profileId, 'reviews', id);
}

async function readIdentityRecord(db: IDBDatabase): Promise<UserIdentity | null> {
	if (!db.objectStoreNames.contains('meta')) {
		return null;
	}
	const row = await requestToPromise(
		db.transaction('meta').objectStore('meta').get('identity') as IDBRequest<{ key: string; value?: UserIdentity } | undefined>,
	);
	const value = row?.value;
	if (!value?.userId) {
		return null;
	}
	return value;
}

export async function loadIdentity(profileId: string): Promise<UserIdentity | null> {
	if (!(await databaseExists(progressDbName(profileId)))) {
		return null;
	}
	const db = await openDb(profileId);
	const identity = await readIdentityRecord(db);
	db.close();
	return identity;
}

export async function saveIdentity(profileId: string, identity: UserIdentity): Promise<void> {
	const db = await openDb(profileId);
	const existing = await readIdentityRecord(db);
	const next: UserIdentity = {
		userId: existing?.userId || profileId,
		name: identity.name,
		nameKey: identity.nameKey,
		focusTrack: identity.focusTrack,
		createdAt: existing?.createdAt || identity.createdAt,
	};
	const tx = db.transaction('meta', 'readwrite');
	tx.objectStore('meta').put({ key: 'identity', value: cloneRecord(next) });
	await transactionDone(tx);
	db.close();
	if (await diskAvailable()) {
		try {
			await diskSaveIdentity(profileId, next);
		} catch (error) {
			console.error('Stride identity save failed', error);
		}
	}
}

export async function saveSettings(profileId: string, settings: Settings): Promise<void> {
	const db = await openDb(profileId);
	const tx = db.transaction('meta', 'readwrite');
	tx.objectStore('meta').put({ key: 'settings', value: cloneRecord(settings) });
	await transactionDone(tx);
	db.close();
	if (hydratedProfiles.has(profileId)) {
		await mirrorFromIdb(profileId);
		return;
	}
	if (await diskAvailable()) {
		try {
			await diskSaveSettings(profileId, settings);
		} catch (error) {
			console.error('Stride settings save failed', error);
		}
	}
}
