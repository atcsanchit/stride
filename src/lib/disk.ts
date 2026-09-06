import { emptySettings } from '../constants';
import type {
	Completion,
	Drop,
	Profile,
	ReviewCard,
	Roadmap,
	RoadmapItem,
	Settings,
	Sprint,
	Ticket,
	WorkSession,
} from '../types';

export type DiskSnapshot = {
	roadmaps: Roadmap[];
	items: RoadmapItem[];
	drops: Drop[];
	completions: Completion[];
	sessions: WorkSession[];
	sprints: Sprint[];
	tickets: Ticket[];
	reviews: ReviewCard[];
	settings: Settings;
};

const BASE = '/api/stride';

type AccountsFile = {
	users: Profile[];
	sessionUserId: string | null;
};

async function request<T>(path: string, init?: RequestInit): Promise<T | null> {
	try {
		const response = await fetch(`${BASE}${path}`, init);
		if (response.status === 404) {
			return null;
		}
		if (!response.ok) {
			return null;
		}
		return (await response.json()) as T;
	} catch {
		return null;
	}
}

export async function diskAvailable(): Promise<boolean> {
	const health = await request<{ ok?: boolean }>('/health');
	return Boolean(health?.ok);
}

export async function diskLoadAccounts(): Promise<AccountsFile | null> {
	const data = await request<AccountsFile>('/accounts');
	if (!data) {
		return null;
	}
	return {
		users: Array.isArray(data.users) ? data.users.filter((user) => user?.id && user.name) : [],
		sessionUserId: data.sessionUserId ?? null,
	};
}

export async function diskSaveAccounts(users: Profile[], sessionUserId: string | null): Promise<void> {
	await request('/accounts', {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ users, sessionUserId }),
	});
}

export async function diskLoadSnapshot(userId: string): Promise<DiskSnapshot | null> {
	const data = await request<Partial<DiskSnapshot> & { userId?: string }>(`/users/${userId}`);
	if (!data) {
		return null;
	}
	return {
		roadmaps: data.roadmaps ?? [],
		items: data.items ?? [],
		drops: data.drops ?? [],
		completions: data.completions ?? [],
		sessions: data.sessions ?? [],
		sprints: data.sprints ?? [],
		tickets: data.tickets ?? [],
		reviews: data.reviews ?? [],
		settings: data.settings ? { ...emptySettings(), ...data.settings } : emptySettings(),
	};
}

export async function diskSaveSnapshot(userId: string, snapshot: DiskSnapshot, identity?: unknown): Promise<void> {
	await request(`/users/${userId}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ ...snapshot, identity: identity ?? null }),
	});
}

export async function diskSaveIdentity(userId: string, identity: unknown): Promise<void> {
	await request(`/users/${userId}/identity`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ value: identity }),
	});
}

export async function diskSaveSettings(userId: string, settings: unknown): Promise<void> {
	await request(`/users/${userId}/settings`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ value: settings }),
	});
}

export async function diskDeleteUser(userId: string): Promise<void> {
	await request(`/users/${userId}`, { method: 'DELETE' });
}
