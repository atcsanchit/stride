import type { ReactNode } from 'react';
import { groupTicketsByStatus } from '../lib/ticket';
import type { Ticket } from '../types';

export function TicketStatusGroups({
	tickets,
	empty,
	idPrefix,
	listClassName = 'ticket-list',
	renderTicket,
}: {
	tickets: Ticket[];
	empty: ReactNode;
	idPrefix: string;
	listClassName?: string;
	renderTicket: (ticket: Ticket) => ReactNode;
}) {
	const groups = groupTicketsByStatus(tickets);
	if (groups.length === 0) {
		return empty;
	}

	return (
		<div className="ticket-groups">
			{groups.map((group) => {
				const headingId = `${idPrefix}-${group.status}`;
				return (
					<section
						key={group.status}
						className={`ticket-group ticket-group-${group.status}`}
						aria-labelledby={headingId}
					>
						<header className="ticket-group-head">
							<h3 id={headingId} className={`status-${group.status}`} title={group.hint}>
								{group.label}
							</h3>
							<span className="muted">
								{group.tickets.length} {group.tickets.length === 1 ? 'ticket' : 'tickets'}
							</span>
						</header>
						<ul className={listClassName}>
							{group.tickets.map((ticket) => (
								<li key={ticket.id}>{renderTicket(ticket)}</li>
							))}
						</ul>
					</section>
				);
			})}
		</div>
	);
}
