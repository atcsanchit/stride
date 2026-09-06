import type { Settings, TrackId, TrackMeta, Priority, Score, TicketStatus } from './types';

export const TRACKS: TrackMeta[] = [
	{
		id: 'dsa',
		label: 'DSA',
		short: 'DSA',
		blurb: 'Interview gate. Produce the solution. Do not reread the pattern first.',
		unit: 'lesson',
		unitPlural: 'lessons',
		accent: 'var(--dsa)',
	},
	{
		id: 'system-design',
		label: 'System Design',
		short: 'Design',
		blurb: 'Whiteboard from memory, then one tradeoff you would ship. Reading a primer is familiarity.',
		unit: 'topic',
		unitPlural: 'topics',
		accent: 'var(--design)',
	},
	{
		id: 'ai-engineering',
		label: 'AI Engineering',
		short: 'AI Eng',
		blurb: 'Produce systems, not lecture notes. Peakflo work named for Berlin: bottlenecks, RAG, agents, GDPR, public proof.',
		unit: 'block',
		unitPlural: 'blocks',
		accent: 'var(--ai)',
	},
];

export const TRACK_IDS: TrackId[] = TRACKS.map((track) => track.id);

export const DEFAULT_TARGETS: Record<TrackId, number> = {
	dsa: 3,
	'system-design': 1,
	'ai-engineering': 1,
};

export const BACKUP_KIND = 'stride-personal-backup' as const;
export const SESSION_KEY = 'stride-personal-session';
export const USERS_INDEX_KEY = 'stride-personal-users';
export const ACCOUNTS_DB = 'stride-personal-accounts';
export const LEGACY_PROGRESS_DB = 'stride-tracker';

export function sanitizeEnabledTracks(ids: readonly string[] | undefined | null): TrackId[] {
	const seen = new Set<TrackId>();
	const next: TrackId[] = [];
	for (const id of ids ?? []) {
		if (!TRACK_IDS.includes(id as TrackId) || seen.has(id as TrackId)) {
			continue;
		}
		seen.add(id as TrackId);
		next.push(id as TrackId);
	}
	return next;
}

export function enabledTrackIds(settings: Pick<Settings, 'enabledTracks'>): TrackId[] {
	return sanitizeEnabledTracks(settings.enabledTracks);
}

export function isTrackEnabled(settings: Pick<Settings, 'enabledTracks'>, trackId: TrackId): boolean {
	const enabled = enabledTrackIds(settings);
	return enabled.includes(trackId);
}

export function emptySettings(focusTrack: TrackId = 'ai-engineering'): Settings {
	return {
		activeTrack: 'dsa',
		dailyTargets: { ...DEFAULT_TARGETS },
		focusTrack,
		enabledTracks: [],
	};
}

export function firstName(name: string): string {
	return name.trim().split(/\s+/).filter(Boolean)[0] ?? 'there';
}

export function trackMeta(id: TrackId): TrackMeta {
	const found = TRACKS.find((track) => track.id === id);
	if (!found) {
		throw new Error(`Unknown track: ${id}`);
	}
	return found;
}

export const CHORE_TAGS = [
	'workflow testing',
	'code changes',
	'workflow builder',
	'upload function',
	'stage',
	'prod',
	'local validation',
	'workflows',
	'OCR POC',
] as const;

export const STATUSES: Array<{ value: TicketStatus; label: string; hint: string }> = [
	{ value: 'requirements', label: 'Requirements', hint: 'Still defining the work' },
	{ value: 'ready', label: 'Ready to pick', hint: 'Queued, not started' },
	{ value: 'progress', label: 'In progress', hint: 'Timer should be running' },
	{ value: 'blocked', label: 'Blocked', hint: 'Waiting on something' },
	{ value: 'done', label: 'Completed', hint: 'Shipped' },
	{ value: 'cancelled', label: 'Triage / cancel', hint: 'Not doing this' },
];

export const PRIORITIES: Array<{ value: Priority; label: string; hint: string }> = [
	{ value: 0, label: 'High', hint: 'Do first' },
	{ value: 1, label: 'Medium', hint: 'This sprint' },
	{ value: 2, label: 'Low', hint: 'If time' },
];

export const REVIEWS: Array<{ value: Score; label: string }> = [
	{ value: 1, label: 'Stuck' },
	{ value: 2, label: 'Shaky' },
	{ value: 3, label: 'Okay' },
	{ value: 4, label: 'Solid' },
	{ value: 5, label: 'Crushed' },
];

export const EFFORTS: Array<{ value: Score; label: string }> = [
	{ value: 1, label: 'Light' },
	{ value: 2, label: 'Easy' },
	{ value: 3, label: 'Fair' },
	{ value: 4, label: 'Hard' },
	{ value: 5, label: 'Max' },
];
