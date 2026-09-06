import { BACKUP_KIND, emptySettings } from '../constants';
import type {
	BackupFile,
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
import { todayKey } from './time';
import { normalizeTicket } from './ticket';

export function buildBackup(input: {
	profile: Profile;
	settings: Settings;
	roadmaps: Roadmap[];
	items: RoadmapItem[];
	drops: Drop[];
	completions: Completion[];
	sessions: WorkSession[];
	sprints: Sprint[];
	tickets: Ticket[];
	reviews?: ReviewCard[];
}): BackupFile {
	return {
		kind: BACKUP_KIND,
		version: 3,
		exportedAt: Date.now(),
		profile: {
			id: input.profile.id,
			name: input.profile.name,
			focusTrack: input.profile.focusTrack,
		},
		settings: input.settings,
		roadmaps: input.roadmaps,
		items: input.items,
		drops: input.drops,
		completions: input.completions,
		sessions: input.sessions,
		sprints: input.sprints,
		tickets: input.tickets,
		reviews: input.reviews ?? [],
	};
}

export function parseBackup(text: string): BackupFile {
	const parsed = JSON.parse(text) as BackupFile;
	if (parsed.kind !== BACKUP_KIND || (parsed.version !== 1 && parsed.version !== 2 && parsed.version !== 3)) {
		throw new Error('This file is not a Stride personal backup.');
	}
	if (!parsed.profile?.name || !Array.isArray(parsed.roadmaps) || !Array.isArray(parsed.items)) {
		throw new Error('Backup is missing progress data.');
	}
	return {
		...parsed,
		version: 3,
		drops: parsed.drops ?? [],
		completions: parsed.completions ?? [],
		sessions: parsed.sessions ?? [],
		sprints: parsed.sprints ?? [],
		tickets: (parsed.tickets ?? []).map((row) => normalizeTicket(row)),
		reviews: parsed.reviews ?? [],
		settings: {
			...emptySettings(parsed.profile.focusTrack),
			...parsed.settings,
			focusTrack: parsed.settings?.focusTrack ?? parsed.profile.focusTrack,
		},
	};
}

export function downloadBackup(backup: BackupFile): void {
	const slug = backup.profile.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'stride';
	const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = `${slug}-${todayKey()}.stride.json`;
	link.click();
	URL.revokeObjectURL(url);
}
