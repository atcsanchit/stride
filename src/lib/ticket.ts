import { CHORE_TAGS } from '../constants';
import type {
	Completion,
	Priority,
	RoadmapItem,
	Score,
	Ticket,
	TicketKind,
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

export function choreTagPalette(tickets: Ticket[]): string[] {
	const used = tickets.flatMap((ticket) => (isChoreTicket(ticket) ? ticketTags(ticket) : []));
	return [...new Set([...CHORE_TAGS, ...used])];
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
		estimatedEffort: (raw.estimatedEffort as Score | undefined) ?? 3,
		priority: normalizePriority(raw.priority),
		plannedDate: raw.plannedDate,
		status: normalizeTicketStatus(raw.status),
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
