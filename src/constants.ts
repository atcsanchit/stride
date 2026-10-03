import type { CustomField, Settings, TrackId, TrackMeta, Priority, Score, TicketStatus } from './types';

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
export const BUILTIN_TRACK_IDS = TRACK_IDS;

export const DEFAULT_TARGETS: Record<TrackId, number> = {
	dsa: 3,
	'system-design': 1,
	'ai-engineering': 1,
};

export const BACKUP_KIND = 'stride-personal-backup' as const;
export const SESSION_KEY = 'stride-personal-session';
export const VIEW_KEY = 'stride-personal-view';
export const USERS_INDEX_KEY = 'stride-personal-users';
export const ACCOUNTS_DB = 'stride-personal-accounts';
export const LEGACY_PROGRESS_DB = 'stride-tracker';

const CUSTOM_ACCENTS = ['var(--manage)', 'var(--exec)', 'var(--ai)', 'var(--design)', 'var(--dsa)'] as const;

export function slugifyFieldLabel(label: string): string {
	return label
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 48) || 'field';
}

export function customFieldId(label: string, existing: readonly CustomField[] = []): TrackId {
	const base = `field-${slugifyFieldLabel(label)}`;
	if (!existing.some((field) => field.id === base) && !TRACK_IDS.includes(base)) {
		return base;
	}
	let n = 2;
	while (existing.some((field) => field.id === `${base}-${n}`) || TRACK_IDS.includes(`${base}-${n}`)) {
		n += 1;
	}
	return `${base}-${n}`;
}

export function normalizeCustomFields(value: CustomField[] | undefined | null): CustomField[] {
	const seen = new Set<string>();
	const next: CustomField[] = [];
	for (const row of value ?? []) {
		const label = row?.label?.trim();
		if (!label) {
			continue;
		}
		const id = (row.id?.trim() || customFieldId(label, next)).toLowerCase();
		if (TRACK_IDS.includes(id) || seen.has(id)) {
			continue;
		}
		seen.add(id);
		next.push({
			id,
			label,
			blurb: row.blurb?.trim() || undefined,
		});
	}
	return next;
}

function customAsTrackMeta(field: CustomField, index: number): TrackMeta {
	const short = field.label.length > 12 ? field.label.slice(0, 10).trim() + '…' : field.label;
	return {
		id: field.id,
		label: field.label,
		short,
		blurb: field.blurb || 'Custom field for this workspace.',
		unit: 'item',
		unitPlural: 'items',
		accent: CUSTOM_ACCENTS[index % CUSTOM_ACCENTS.length],
	};
}

export function listTrackMeta(settings?: Pick<Settings, 'customFields'> | null): TrackMeta[] {
	const custom = normalizeCustomFields(settings?.customFields);
	return [...TRACKS, ...custom.map(customAsTrackMeta)];
}

export function sanitizeEnabledTracks(
	ids: readonly string[] | undefined | null,
	customFields?: CustomField[] | null,
): TrackId[] {
	const allowed = new Set<TrackId>([...TRACK_IDS, ...normalizeCustomFields(customFields).map((field) => field.id)]);
	const seen = new Set<TrackId>();
	const next: TrackId[] = [];
	for (const id of ids ?? []) {
		if (!allowed.has(id) || seen.has(id)) {
			continue;
		}
		seen.add(id);
		next.push(id);
	}
	return next;
}

export function enabledTrackIds(settings: Pick<Settings, 'enabledTracks' | 'customFields'>): TrackId[] {
	return sanitizeEnabledTracks(settings.enabledTracks, settings.customFields);
}

export function isTrackEnabled(settings: Pick<Settings, 'enabledTracks' | 'customFields'>, trackId: TrackId): boolean {
	return enabledTrackIds(settings).includes(trackId);
}

export function emptySettings(focusTrack: TrackId = 'ai-engineering'): Settings {
	return {
		activeTrack: 'dsa',
		dailyTargets: { ...DEFAULT_TARGETS },
		focusTrack,
		enabledTracks: [],
		customFields: [],
	};
}

export function firstName(name: string): string {
	return name.trim().split(/\s+/).filter(Boolean)[0] ?? 'there';
}

export function profileLabel(profile: { name: string; displayName?: string }): string {
	return profile.displayName?.trim() || profile.name;
}

export function trackMeta(id: TrackId, settings?: Pick<Settings, 'customFields'> | null): TrackMeta {
	const found = listTrackMeta(settings).find((track) => track.id === id);
	if (found) {
		return found;
	}
	const label = id.startsWith('field-') ? id.replace(/^field-/, '').replace(/-/g, ' ') : id;
	return {
		id,
		label: label.replace(/\b\w/g, (ch) => ch.toUpperCase()) || id,
		short: label.slice(0, 12) || id,
		blurb: 'Custom field for this workspace.',
		unit: 'item',
		unitPlural: 'items',
		accent: 'var(--manage)',
	};
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
	{ value: 'review', label: 'In review', hint: 'Waiting on review or sign-off' },
	{ value: 'blocked', label: 'Blocked', hint: 'Waiting on something' },
	{ value: 'done', label: 'Completed', hint: 'Shipped' },
	{ value: 'cancelled', label: 'Triage / cancel', hint: 'Not doing this' },
];

export const BOARD_STATUS_ORDER: TicketStatus[] = [
	'progress',
	'review',
	'blocked',
	'ready',
	'requirements',
	'done',
	'cancelled',
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
