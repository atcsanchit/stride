import type { Sprint, Ticket } from '../types';
import { addDays, diffDays } from './time';
import { isSprintTicket } from './ticket';

export const SPILOVER_MARK = '[SPILOVER]';

export function sprintLabel(sprint: Sprint): string {
	const named = sprint.name?.trim();
	return named || sprint.title || `Week of ${sprint.startDate}`;
}

export function normalizeSprint(raw: Sprint): Sprint {
	return {
		id: raw.id,
		title: raw.title || `Week of ${raw.startDate}`,
		name: raw.name ?? '',
		startDate: raw.startDate,
		endDate: raw.endDate,
		createdAt: raw.createdAt,
		userId: raw.userId,
	};
}

export function ticketPoints(ticket: Ticket): number {
	return ticket.estimatedEffort;
}

export function sprintScore(tickets: Ticket[]) {
	const active = tickets.filter((ticket) => ticket.status !== 'cancelled');
	const done = active.filter((ticket) => ticket.status === 'done');
	const open = active.filter((ticket) => ticket.status !== 'done');
	const estimatedPoints = active.reduce((sum, ticket) => sum + ticketPoints(ticket), 0);
	const completedPoints = done.reduce((sum, ticket) => sum + ticketPoints(ticket), 0);
	const total = active.length;
	return {
		estimatedPoints,
		completedPoints,
		total,
		completedCount: done.length,
		spilloverCount: open.length,
		completedPct: total ? Math.round((done.length / total) * 100) : 0,
		spilloverPct: total ? Math.round((open.length / total) * 100) : 0,
	};
}

export function originalTicketTitle(ticket: Ticket): string {
	if (ticket.originalTitle?.trim()) {
		return ticket.originalTitle.trim();
	}
	const trimmed = ticket.title.trim();
	if (trimmed.toUpperCase().startsWith(SPILOVER_MARK)) {
		return trimmed.slice(SPILOVER_MARK.length).trim() || trimmed;
	}
	return trimmed;
}

export function withSpiloverTitle(title: string): string {
	const trimmed = title.trim();
	if (trimmed.toUpperCase().startsWith(SPILOVER_MARK)) {
		return trimmed;
	}
	return `${SPILOVER_MARK} ${trimmed}`;
}

/** One row per chore title — prefer the spilled copy on the latest day. */
export function dedupeChoreTicketsForView(tickets: Ticket[]): Ticket[] {
	const groups = new Map<string, Ticket[]>();
	for (const ticket of tickets) {
		if (ticket.kind !== 'chore') {
			continue;
		}
		const key = originalTicketTitle(ticket).toLowerCase();
		const group = groups.get(key) ?? [];
		group.push(ticket);
		groups.set(key, group);
	}
	const keepIds = new Set<string>();
	for (const group of groups.values()) {
		if (group.length === 1) {
			keepIds.add(group[0].id);
			continue;
		}
		const winner = [...group].sort((a, b) => {
			const aSpill = a.title.trim().toUpperCase().startsWith(SPILOVER_MARK) ? 1 : 0;
			const bSpill = b.title.trim().toUpperCase().startsWith(SPILOVER_MARK) ? 1 : 0;
			if (aSpill !== bSpill) {
				return bSpill - aSpill;
			}
			return b.plannedDate.localeCompare(a.plannedDate) || b.createdAt - a.createdAt;
		})[0];
		keepIds.add(winner.id);
	}
	return tickets.filter((ticket) => ticket.kind !== 'chore' || keepIds.has(ticket.id));
}

export function followingSprintRange(sprint: Sprint): { startDate: string; endDate: string } {
	const length = Math.max(0, diffDays(sprint.startDate, sprint.endDate));
	const startDate = addDays(sprint.endDate, 1);
	return { startDate, endDate: addDays(startDate, length) };
}

export function previousSprintRange(sprint: Sprint): { startDate: string; endDate: string } {
	const length = Math.max(0, diffDays(sprint.startDate, sprint.endDate));
	const endDate = addDays(sprint.startDate, -1);
	return { startDate: addDays(endDate, -length), endDate };
}

export function ticketOnSprintDay(ticket: Ticket, day: string, sprints: Sprint[]): boolean {
	if (!isSprintTicket(ticket)) {
		return ticket.plannedDate === day;
	}
	const sprint = sprints.find((entry) => entry.id === ticket.sprintId);
	if (sprint) {
		return day >= sprint.startDate && day <= sprint.endDate;
	}
	return ticket.plannedDate === day;
}
