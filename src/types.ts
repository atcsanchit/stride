export type TrackId = 'dsa' | 'system-design' | 'ai-engineering';

export type View =
	| { name: 'home' }
	| { name: 'track'; trackId: TrackId }
	| { name: 'lab' }
	| { name: 'sprint' }
	| { name: 'chores' }
	| { name: 'revise'; itemId?: string }
	| { name: 'class'; trackId: TrackId; section: string }
	| { name: 'lesson'; itemId: string }
	| { name: 'day'; date: string }
	| { name: 'settings' };

export type RecallGrade = 'again' | 'hard' | 'good' | 'easy';

export type ReviewCard = {
	id: string;
	itemId: string;
	trackId: TrackId;
	step: number;
	intervalDays: number;
	dueDate: string;
	lastReviewedAt?: number;
	lastGrade?: RecallGrade;
	lapses: number;
	reviews: number;
	cue?: string;
};

export type Priority = 0 | 1 | 2;
export type Score = 1 | 2 | 3 | 4 | 5;
export type TicketStatus = 'requirements' | 'ready' | 'progress' | 'blocked' | 'done' | 'cancelled';
export type TicketKind = 'sprint' | 'chore';

export type PythonRunResult = {
	ok: boolean;
	bin?: string;
	version?: string;
	stdout?: string;
	stderr?: string;
	code?: number | null;
	timedOut?: boolean;
	ms?: number;
	error?: string;
	timeoutMs?: number;
};

export type TrackMeta = {
	id: TrackId;
	label: string;
	short: string;
	blurb: string;
	unit: string;
	unitPlural: string;
	accent: string;
};

export type RoadmapOrigin = 'bundled' | 'dropped';

export type Roadmap = {
	id: string;
	trackId: TrackId;
	title: string;
	filename: string;
	source: string;
	hash: string;
	origin: RoadmapOrigin;
	addedAt: number;
	updatedAt: number;
};

export type RoadmapItem = {
	id: string;
	trackId: TrackId;
	roadmapId: string;
	section: string;
	subsection: string;
	title: string;
	order: number;
	done: boolean;
	doneAt?: number;
};

export type Drop = {
	id: string;
	date: string;
	trackId: TrackId;
	count: number;
	minutes: number;
	itemIds: string[];
	note: string;
	createdAt: number;
};

export type WorkSession = {
	id: string;
	itemId: string;
	ticketId: string;
	trackId: TrackId;
	title: string;
	startedAt: number;
	elapsedMs?: number;
	pausedAt?: number;
	endedAt?: number;
};

export type Completion = {
	id: string;
	itemId: string;
	ticketId: string;
	trackId: TrackId;
	title: string;
	section: string;
	date: string;
	elapsedMs: number;
	minutes: number;
	effort: Score;
	review: Score;
	notes: string;
	completedAt: number;
	evidenceNotes?: string;
	evidenceUrls?: string[];
};

export type Sprint = {
	id: string;
	title: string;
	name?: string;
	startDate: string;
	endDate: string;
	createdAt: number;
	userId?: string;
};

export type Ticket = {
	id: string;
	userId?: string;
	kind: TicketKind;
	sprintId: string;
	title: string;
	description: string;
	scope: string;
	topicIds: string[];
	tags: string[];
	estimatedEffort: Score;
	priority: Priority;
	plannedDate: string;
	status: TicketStatus;
	createdAt: number;
	originalTitle?: string;
};

export type Settings = {
	activeTrack: TrackId;
	dailyTargets: Record<TrackId, number>;
	focusTrack: TrackId;
	enabledTracks: TrackId[];
};

export type Profile = {
	id: string;
	name: string;
	nameKey?: string;
	focusTrack: TrackId;
	pinSalt: string;
	pinHash: string;
	createdAt: number;
	lastSeenAt: number;
	googleEmail?: string;
};

export type UserIdentity = {
	userId: string;
	name: string;
	nameKey: string;
	focusTrack: TrackId;
	createdAt: number;
};

export type BackupFile = {
	kind: 'stride-personal-backup';
	version: 1 | 2 | 3;
	exportedAt: number;
	profile: {
		id?: string;
		name: string;
		focusTrack: TrackId;
	};
	settings: Settings;
	roadmaps: Roadmap[];
	items: RoadmapItem[];
	drops: Drop[];
	completions: Completion[];
	sessions: WorkSession[];
	sprints: Sprint[];
	tickets: Ticket[];
	reviews?: ReviewCard[];
};

export type ToastMessage = {
	id: string;
	title: string;
	body: string;
};

export type ParsedRoadmap = {
	title: string;
	trackId: TrackId;
	items: ParsedItem[];
};

export type ParsedItem = {
	section: string;
	subsection: string;
	title: string;
	done: boolean;
	order: number;
};

export type DayCount = {
	date: string;
	count: number;
};

export type TrackStats = {
	trackId: TrackId;
	total: number;
	done: number;
	percent: number;
	currentSection: string;
	nextItems: RoadmapItem[];
	streak: number;
	todayCount: number;
	target: number;
	last7: DayCount[];
};

export type CoachNote = {
	tone: 'start' | 'steady' | 'protect' | 'floor' | 'rotate';
	headline: string;
	body: string;
};

export type TodayPlan = {
	trackId: TrackId;
	reason: string;
	target: number;
	items: RoadmapItem[];
	also: TrackId | null;
};
