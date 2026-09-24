import type { Settings, TicketPullRequest, TrackId } from '../types';

const PULL_URL = /^https?:\/\/github\.com\/([^/\s]+)\/([^/\s]+)\/pull\/(\d+)(?:[/?#]|$)/i;

export function parseRepoSlug(value: string): { owner: string; repo: string } | null {
	const trimmed = value
		.trim()
		.replace(/^https?:\/\/github\.com\//i, '')
		.replace(/\.git$/i, '')
		.replace(/\/$/, '');
	const parts = trimmed.split('/').filter(Boolean);
	if (parts.length !== 2) {
		return null;
	}
	return { owner: parts[0], repo: parts[1] };
}

export function courseRepo(settings: Settings, courseId: TrackId | undefined): { owner: string; repo: string } | null {
	if (!courseId) {
		return null;
	}
	return parseRepoSlug(settings.courseRepos?.[courseId] ?? '');
}

export function parsePullRequest(input: string): TicketPullRequest | null {
	const match = input.trim().match(PULL_URL);
	if (!match) {
		return null;
	}
	return {
		url: `https://github.com/${match[1]}/${match[2]}/pull/${match[3]}`,
		owner: match[1],
		repo: match[2],
		number: Number(match[3]),
	};
}

export function sameRepo(
	pull: Pick<TicketPullRequest, 'owner' | 'repo'>,
	repo: { owner: string; repo: string },
): boolean {
	return pull.owner.toLowerCase() === repo.owner.toLowerCase() && pull.repo.toLowerCase() === repo.repo.toLowerCase();
}

export function ticketPrKey(ticket: { id: string; prKey?: string }): string {
	if (ticket.prKey?.trim()) {
		return ticket.prKey.trim();
	}
	const raw = ticket.id.replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase();
	return `STR-${raw || 'TICKET'}`;
}

export function matchingPullRequests(
	ticket: { courseId?: TrackId; pullRequests?: TicketPullRequest[] },
	settings: Settings,
): TicketPullRequest[] {
	const repo = courseRepo(settings, ticket.courseId);
	if (!repo) {
		return [];
	}
	return (ticket.pullRequests ?? []).filter((row) => sameRepo(row, repo));
}

export function mismatchedPullRequests(
	ticket: { courseId?: TrackId; pullRequests?: TicketPullRequest[] },
	settings: Settings,
): TicketPullRequest[] {
	const repo = courseRepo(settings, ticket.courseId);
	if (!repo) {
		return ticket.pullRequests ?? [];
	}
	return (ticket.pullRequests ?? []).filter((row) => !sameRepo(row, repo));
}

export function keepPullRequests(rows: TicketPullRequest[] | undefined): TicketPullRequest[] {
	const seen = new Set<string>();
	const next: TicketPullRequest[] = [];
	for (const row of rows ?? []) {
		if (!row?.url || seen.has(row.url)) {
			continue;
		}
		seen.add(row.url);
		next.push(row);
	}
	return next;
}

/** When needsPr is on, the ticket needs a course, that course’s Profile repo, and ≥1 PR from it. */
export function ticketPrReady(
	ticket: { needsPr?: boolean; courseId?: TrackId; pullRequests?: TicketPullRequest[] },
	settings: Settings,
): { ok: true } | { ok: false; message: string } {
	if (ticket.needsPr !== true) {
		return { ok: true };
	}
	if (!ticket.courseId) {
		return { ok: false, message: 'Choose a course before completing a ticket that needs a pull request.' };
	}
	const repo = courseRepo(settings, ticket.courseId);
	if (!repo) {
		return {
			ok: false,
			message: 'Set this course’s repository in Profile (owner/repo), then link a pull request from that repository.',
		};
	}
	if (matchingPullRequests(ticket, settings).length === 0) {
		const wrong = mismatchedPullRequests(ticket, settings);
		if (wrong.length > 0) {
			return {
				ok: false,
				message: `Wrong pull request for this course. Link one from ${repo.owner}/${repo.repo} before completing.`,
			};
		}
		return {
			ok: false,
			message: `Add a pull request from ${repo.owner}/${repo.repo} on this ticket before completing it.`,
		};
	}
	return { ok: true };
}
