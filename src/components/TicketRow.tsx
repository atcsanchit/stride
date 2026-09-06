import { EFFORTS, PRIORITIES, REVIEWS, STATUSES, trackMeta } from '../constants';
import { prettyDate } from '../lib/time';
import { isChoreTicket, ticketCompletions, ticketTags, ticketTopics } from '../lib/ticket';
import { isSessionPaused, isSessionRunning, openSessionForTicket } from '../lib/work-session';
import type { Ticket } from '../types';
import { useStride } from '../store/StrideState';
import { TagChip } from './TagChip';

export function TicketRow({
	ticket,
	open = false,
	onOpen,
}: {
	ticket: Ticket;
	open?: boolean;
	onOpen: () => void;
}) {
	const { items, sessions, spillTicket, completions } = useStride();
	const chore = isChoreTicket(ticket);
	const tags = ticketTags(ticket);
	const estimate = EFFORTS.find((entry) => entry.value === ticket.estimatedEffort);
	const priority = PRIORITIES.find((entry) => entry.value === ticket.priority);
	const status = STATUSES.find((entry) => entry.value === ticket.status);
	const session = openSessionForTicket(sessions, ticket.id);
	const running = Boolean(session && isSessionRunning(session));
	const paused = Boolean(session && isSessionPaused(session));
	const tracks = [...new Set(ticketTopics(ticket, items).map((item) => item.trackId))];
	const closeout = ticketCompletions(ticket, completions).at(-1);
	const review = closeout ? REVIEWS.find((entry) => entry.value === closeout.review) : undefined;

	return (
		<div
			className={`ticket-row${open ? ' is-open' : ''}${ticket.status === 'done' ? ' is-done' : ''}${ticket.status === 'cancelled' ? ' is-cancelled' : ''}${running ? ' is-running' : ''}${paused ? ' is-paused' : ''}`}
		>
			<div className="ticket-row-prio">
				{priority ? <span className={`prio prio-${priority.value}`}>{priority.label}</span> : null}
			</div>
			<div className="ticket-row-main">
				<strong>{ticket.title}</strong>
				<div className="ticket-row-meta">
					{status ? <span className={`status-chip status-${status.value}`}>{status.label}</span> : null}
					{estimate ? <span className={`effort effort-${estimate.value}`}>{estimate.label}</span> : null}
					{review ? <span className={`review-chip review-${review.value}`}>{review.label}</span> : null}
					<small className="muted">
						{prettyDate(ticket.plannedDate)}
						{running ? ' · timer on' : ''}
						{paused ? ' · timer paused' : ''}
					</small>
					{chore
						? tags.map((tag) => <TagChip key={tag} tag={tag} />)
						: tracks.map((id) => (
								<span key={id} className={`tag-chip tag-track-${id}`}>
									{trackMeta(id).short}
								</span>
							))}
				</div>
			</div>
			<div className="ticket-row-actions">
				{ticket.status === 'cancelled' ? null : (
					<button type="button" onClick={() => void spillTicket(ticket.id)}>
						{chore ? 'Next day' : 'Next sprint'}
					</button>
				)}
				<button type="button" onClick={onOpen}>
					Open
				</button>
			</div>
		</div>
	);
}
