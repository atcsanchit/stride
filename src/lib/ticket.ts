import { BOARD_STATUS_ORDER, CHORE_TAGS, STATUSES } from '../constants';
import type {
	ChoreDomain,
	Completion,
	Priority,
	RoadmapItem,
	Score,
	Ticket,
	TicketKind,
	TicketPullRequest,
	TicketStatus,
	TrackId,
	WorkSession,
} from '../types';
import { isSessionPaused, openSessionForTicket } from './work-session';

type RawTicket = Ticket & { itemId?: string; trackId?: string; kind?: string; tags?: string[] };

export function normalizeTicketKind(value: string | undefined): TicketKind {
	return value === 'chore' ? 'chore' : 'sprint';
}

export function ticketTags(ticket: Ticket): string[] {
	return ticket.tags ?? [];
}

export function isChoreTicket(ticket: Ticket): boolean {
	return ticket.kind === 'chore';
}

export function isSprintTicket(ticket: Ticket): boolean {
	return ticket.kind !== 'chore';
}

export function normalizeTags(values: string[] | undefined): string[] {
	return [...new Set((values ?? []).map((tag) => tag.trim()).filter(Boolean))];
}

export function choreClientPalette(tickets: Ticket[], saved: string[] | undefined): string[] {
	const used = tickets
		.filter(isChoreTicket)
		.map((ticket) => ticket.choreClient?.trim())
		.filter((name): name is string => Boolean(name));
	return [...new Set([...(saved ?? []), ...used])].sort((a, b) => a.localeCompare(b));
}

function normalizeChoreDomain(value: unknown): ChoreDomain | undefined {
	return value === 'peakflo' || value === 'personal' ? value : undefined;
}

function normalizeOptionalScore(value: unknown, legacyDefault: Score): Score | null {
	if (value === null) {
		return null;
	}
	if (value === undefined) {
		return legacyDefault;
	}
	const n = Number(value);
	if (n === 1 || n === 2 || n === 3 || n === 4 || n === 5) {
		return n;
	}
	return legacyDefault;
}

function normalizeOptionalPriority(value: unknown, legacyDefault: Priority): Priority | null {
	if (value === null) {
		return null;
	}
	if (value === undefined) {
		return legacyDefault;
	}
	const n = Number(value);
	if (n === 0 || n === 1 || n === 2) {
		return n;
	}
	return legacyDefault;
}

export function normalizeTicketStatus(value: string | undefined): TicketStatus {
	if (value === 'doing' || value === 'progress') {
		return 'progress';
	}
	if (value === 'planned' || value === 'ready') {
		return 'ready';
	}
	if (value === 'requirements' || value === 'blocked' || value === 'done' || value === 'cancelled') {
		return value;
	}
	return 'ready';
}

export function ticketIsClosed(status: TicketStatus): boolean {
	return status === 'done' || status === 'cancelled';
}

export type TicketStatusGroup = {
	status: TicketStatus;
	label: string;
	hint: string;
	tickets: Ticket[];
};

export function groupTicketsByStatus(tickets: Ticket[]): TicketStatusGroup[] {
	const buckets = new Map<TicketStatus, Ticket[]>(BOARD_STATUS_ORDER.map((status) => [status, []]));
	for (const ticket of tickets) {
		const list = buckets.get(ticket.status) ?? buckets.get('ready');
		list?.push(ticket);
	}
	return BOARD_STATUS_ORDER.flatMap((status) => {
		const grouped = buckets.get(status) ?? [];
		if (grouped.length === 0) {
			return [];
		}
		const meta = STATUSES.find((entry) => entry.value === status);
		return [
			{
				status,
				label: meta?.label ?? status,
				hint: meta?.hint ?? '',
				tickets: grouped,
			},
		];
	});
}

export function ticketTimerPaused(ticket: Ticket, sessions: WorkSession[]): boolean {
	if (ticket.status !== 'progress') {
		return false;
	}
	const session = openSessionForTicket(sessions, ticket.id);
	return Boolean(session && isSessionPaused(session));
}

export function normalizePriority(value: number | undefined): Priority {
	if (value === 0) {
		return 0;
	}
	if (value === 1) {
		return 1;
	}
	if (value === 2 || value === 3) {
		return 2;
	}
	return 1;
}

function normalizePullRequests(value: TicketPullRequest[] | undefined): TicketPullRequest[] {
	if (!Array.isArray(value)) {
		return [];
	}
	const seen = new Set<string>();
	const next: TicketPullRequest[] = [];
	for (const row of value) {
		if (!row?.url || !row.owner || !row.repo || !row.number) {
			continue;
		}
		const url = row.url.trim();
		if (seen.has(url)) {
			continue;
		}
		seen.add(url);
		next.push({ url, owner: row.owner, repo: row.repo, number: row.number });
	}
	return next;
}

export function normalizeTicket(raw: RawTicket): Ticket {
	const kind = normalizeTicketKind(raw.kind);
	const topicIds =
		kind === 'chore' ? [] : raw.topicIds?.length ? raw.topicIds : raw.itemId ? [raw.itemId] : [];
	return {
		id: raw.id,
		kind,
		sprintId: kind === 'chore' ? '' : raw.sprintId,
		title: raw.title,
		description: raw.description ?? '',
		scope: raw.scope ?? '',
		topicIds,
		tags: kind === 'chore' ? normalizeTags(raw.tags) : [],
		estimatedEffort: normalizeOptionalScore(raw.estimatedEffort, 3),
		priority: normalizeOptionalPriority(raw.priority, 1),
		plannedDate: raw.plannedDate,
		status: normalizeTicketStatus(raw.status),
		statusReason: typeof raw.statusReason === 'string' ? raw.statusReason : undefined,
		courseId: kind === 'chore' ? undefined : raw.courseId,
		needsPr: kind === 'chore' ? false : raw.needsPr === true,
		prKey: typeof raw.prKey === 'string' ? raw.prKey : undefined,
		pullRequests: kind === 'chore' ? [] : normalizePullRequests(raw.pullRequests),
		choreDomain: kind === 'chore' ? normalizeChoreDomain((raw as { choreDomain?: unknown }).choreDomain) : undefined,
		choreClient:
			kind === 'chore' && typeof (raw as { choreClient?: unknown }).choreClient === 'string'
				? (raw as { choreClient: string }).choreClient.trim() || undefined
				: undefined,
		createdAt: raw.createdAt,
		userId: typeof (raw as { userId?: unknown }).userId === 'string' ? (raw as { userId: string }).userId : undefined,
		originalTitle:
			typeof (raw as { originalTitle?: unknown }).originalTitle === 'string'
				? (raw as { originalTitle: string }).originalTitle
				: undefined,
	};
}

export function ticketTopics(ticket: Ticket, items: RoadmapItem[]): RoadmapItem[] {
	const byId = new Map(items.map((item) => [item.id, item]));
	return ticket.topicIds.map((id) => byId.get(id)).filter((item): item is RoadmapItem => Boolean(item));
}

export function ticketTrackId(ticket: Ticket, items: RoadmapItem[], fallback: TrackId): TrackId {
	return ticketTopics(ticket, items)[0]?.trackId ?? fallback;
}

export function ticketCompletions(ticket: Ticket, completions: Completion[]): Completion[] {
	return completions
		.filter((row) => row.ticketId === ticket.id)
		.sort((a, b) => a.completedAt - b.completedAt);
}
