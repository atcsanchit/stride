import { useEffect, useState, type ReactNode } from 'react';
import { EFFORTS, PRIORITIES, REVIEWS, STATUSES, trackMeta } from '../constants';
import { datesInclusive, formatElapsed, prettyDate } from '../lib/time';
import { ticketPracticalChallenges } from '../lib/practical';
import { isChoreTicket, ticketCompletions, ticketIsClosed, ticketTags, ticketTopics } from '../lib/ticket';
import { isSessionPaused, isSessionRunning, openSessionForTicket } from '../lib/work-session';
import type { Completion, Ticket, TicketStatus } from '../types';
import { useStride } from '../store/StrideState';
import { ChoreTagger } from './ChoreTagger';
import { StatusPills } from './StatusPills';
import { EffortPills } from './EffortPills';
import { PriorityPills } from './PriorityPills';
import { TagChip } from './TagChip';
import { TopicTagger } from './TopicTagger';
import { PracticalChallengeCard } from './PracticalChallengeCard';

function LockedBlock({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="ticket-locked-block">
			<p className="field-label">{label}</p>
			{children}
		</div>
	);
}

function CloseoutCard({ record }: { record: Completion }) {
	const review = REVIEWS.find((entry) => entry.value === record.review);
	const felt = EFFORTS.find((entry) => entry.value === record.effort);
	return (
		<div className="ticket-closeout">
			<p className="eyebrow">Close-out · {prettyDate(record.date)}</p>
			<div className="ticket-closeout-meta">
				{review ? <span className={`review-chip review-${review.value}`}>{review.label}</span> : null}
				{felt ? <span className={`effort effort-${felt.value}`}>{felt.label}</span> : null}
				<span className="muted">{record.elapsedMs ? formatElapsed(record.elapsedMs) : 'No timer'}</span>
			</div>
			{record.notes.trim() ? <p className="ticket-closeout-notes">{record.notes}</p> : <p className="muted">No notes left on this close-out.</p>}
			{record.evidenceNotes?.trim() ? (
				<p className="ticket-closeout-notes">
					<strong>Shipped. </strong>
					{record.evidenceNotes}
				</p>
			) : null}
			{record.evidenceUrls?.length ? (
				<ul className="topic-links">
					{record.evidenceUrls.map((href) => (
						<li key={href}>
							<a href={href} target="_blank" rel="noreferrer noopener">
								{href}
							</a>
						</li>
					))}
				</ul>
			) : null}
		</div>
	);
}

export function TicketCard({ ticket, compact = false }: { ticket: Ticket; compact?: boolean }) {
	const {
		items,
		sessions,
		startTask,
		pauseTimer,
		resumeTimer,
		setTicketStatus,
		requestComplete,
		updateTicket,
		removeTicket,
		currentSprint,
		spillTicket,
		cloneTicket,
		completions,
	} = useStride();
	const [title, setTitle] = useState(ticket.title);
	const [description, setDescription] = useState(ticket.description);
	const [scope, setScope] = useState(ticket.scope);
	const topics = ticketTopics(ticket, items);
	const estimate = EFFORTS.find((entry) => entry.value === ticket.estimatedEffort);
	const priority = PRIORITIES.find((entry) => entry.value === ticket.priority);
	const status = STATUSES.find((entry) => entry.value === ticket.status);
	const session = openSessionForTicket(sessions, ticket.id);
	const running = Boolean(session && isSessionRunning(session));
	const paused = Boolean(session && isSessionPaused(session));
	const closed = ticketIsClosed(ticket.status);
	const done = ticket.status === 'done';
	const chore = isChoreTicket(ticket);
	const tags = ticketTags(ticket);
	const tracks = [...new Set(topics.map((item) => item.trackId))];
	const days = currentSprint
		? datesInclusive(currentSprint.startDate, currentSprint.endDate)
		: [ticket.plannedDate];
	const closeouts = ticketCompletions(ticket, completions);
	const latestCloseout = closeouts.at(-1);
	const practicals = ticketPracticalChallenges(ticket, items);

	useEffect(() => {
		setTitle(ticket.title);
		setDescription(ticket.description);
		setScope(ticket.scope);
	}, [ticket.description, ticket.scope, ticket.title]);

	function changeStatus(next: TicketStatus) {
		void setTicketStatus(ticket.id, next);
	}

	return (
		<article
			className={`ticket-note${done ? ' is-done' : ''}${ticket.status === 'cancelled' ? ' is-cancelled' : ''}${running ? ' is-running' : ''}${paused ? ' is-paused' : ''}`}
		>
			<div className="ticket-props">
				{priority ? <span className={`prio prio-${priority.value}`}>{priority.label}</span> : null}
				{status ? <span className={`status-chip status-${status.value}`}>{status.label}</span> : null}
				{estimate ? <span className={`effort effort-${estimate.value}`}>{estimate.label}</span> : null}
				<span className="muted">{prettyDate(ticket.plannedDate)}</span>
				{chore
					? tags.map((tag) => <TagChip key={tag} tag={tag} />)
					: tracks.map((id) => (
							<span key={id} className={`tag-chip tag-track-${id}`}>
								{trackMeta(id).short}
							</span>
						))}
				{running ? <span className="muted">timer on</span> : null}
				{paused ? <span className="muted">timer paused</span> : null}
			</div>
			{closed || compact ? (
				<h3>{ticket.title}</h3>
			) : (
				<label className="field ticket-title">
					Title
					<input
						value={title}
						onChange={(event) => setTitle(event.target.value)}
						onBlur={() => {
							if (title.trim() && title.trim() !== ticket.title) {
								void updateTicket(ticket.id, { title });
							} else {
								setTitle(ticket.title);
							}
						}}
					/>
				</label>
			)}
			{compact ? (
				<>
					{ticket.description ? <p>{ticket.description}</p> : null}
					{chore ? (
						tags.length > 0 ? (
							<div className="topic-chips">
								{tags.map((tag) => (
									<TagChip key={tag} tag={tag} />
								))}
							</div>
						) : (
							<p className="muted">No work tags.</p>
						)
					) : topics.length > 0 ? (
						<div className="topic-chips">
							{topics.map((item) => (
								<span key={item.id} className={`topic-chip is-static tag-chip tag-track-${item.trackId}`}>
									<span>{trackMeta(item.trackId).short}</span>
									{item.title}
								</span>
							))}
						</div>
					) : (
						<p className="muted">No course topics tagged.</p>
					)}
					<StatusPills value={ticket.status} onChange={changeStatus} locked={done} />
					<PracticalChallengeCard challenges={practicals} compact />
					{done && latestCloseout ? <CloseoutCard record={latestCloseout} /> : null}
				</>
			) : closed ? (
				<>
					<div className="ticket-locked">
						<LockedBlock label="Description">
							<p>{ticket.description.trim() || 'No description.'}</p>
						</LockedBlock>
						<LockedBlock label="Scope">
							<p>{ticket.scope.trim() || 'No scope written.'}</p>
						</LockedBlock>
						<LockedBlock label={chore ? 'Tags' : 'Course topics'}>
							{chore ? (
								tags.length > 0 ? (
									<div className="topic-chips">
										{tags.map((tag) => (
											<TagChip key={tag} tag={tag} />
										))}
									</div>
								) : (
									<p className="muted">No work tags.</p>
								)
							) : topics.length > 0 ? (
								<div className="topic-chips">
									{topics.map((item) => (
										<span key={item.id} className={`topic-chip is-static tag-chip tag-track-${item.trackId}`}>
											<span>{trackMeta(item.trackId).short}</span>
											{item.title}
										</span>
									))}
								</div>
							) : (
								<p className="muted">No course topics tagged.</p>
							)}
						</LockedBlock>
						<LockedBlock label="Estimate · priority · day">
							<p>
								{estimate?.label ?? 'Fair'} · {priority?.label ?? 'Medium'} · {prettyDate(ticket.plannedDate)}
							</p>
						</LockedBlock>
					</div>
					<PracticalChallengeCard challenges={practicals} />
					<StatusPills value={ticket.status} onChange={changeStatus} locked={done} />
					{done ? (
						closeouts.length > 0 ? (
							closeouts.map((record) => <CloseoutCard key={record.id} record={record} />)
						) : (
							<p className="muted">No close-out review was saved for this ticket.</p>
						)
					) : null}
				</>
			) : (
				<>
					<label className="field">
						Description
						<textarea
							value={description}
							onChange={(event) => setDescription(event.target.value)}
							onBlur={() => {
								if (description !== ticket.description) {
									void updateTicket(ticket.id, { description });
								}
							}}
							placeholder="What is this ticket?"
						/>
					</label>
					<label className="field">
						Scope
						<textarea
							value={scope}
							onChange={(event) => setScope(event.target.value)}
							onBlur={() => {
								if (scope !== ticket.scope) {
									void updateTicket(ticket.id, { scope });
								}
							}}
							placeholder="In / out of scope"
						/>
					</label>
					{chore ? (
						<ChoreTagger selected={tags} onChange={(next) => void updateTicket(ticket.id, { tags: next })} />
					) : (
						<TopicTagger
							selected={ticket.topicIds}
							onChange={(topicIds) => void updateTicket(ticket.id, { topicIds })}
							items={items}
						/>
					)}
					<PracticalChallengeCard challenges={practicals} />
					<EffortPills
						value={ticket.estimatedEffort}
						onChange={(next) => void updateTicket(ticket.id, { estimatedEffort: next })}
					/>
					<PriorityPills
						value={ticket.priority}
						onChange={(next) => void updateTicket(ticket.id, { priority: next })}
					/>
					<label className="field">
						Day
						{chore ? (
							<input
								type="date"
								value={ticket.plannedDate}
								onChange={(event) => void updateTicket(ticket.id, { plannedDate: event.target.value })}
							/>
						) : (
							<select
								value={ticket.plannedDate}
								onChange={(event) => void updateTicket(ticket.id, { plannedDate: event.target.value })}
							>
								{days.map((day) => (
									<option key={day} value={day}>
										{prettyDate(day)}
									</option>
								))}
							</select>
						)}
					</label>
					<StatusPills value={ticket.status} onChange={changeStatus} locked={done} />
				</>
			)}
			<div className="ticket-extra">
				{done ? null : (
					<>
						{running ? (
							<button type="button" onClick={() => void pauseTimer(ticket.id)}>
								Pause timer
							</button>
						) : paused || ticket.status === 'progress' ? (
							<button type="button" onClick={() => void resumeTimer(ticket.id)}>
								Resume timer
							</button>
						) : ticket.status === 'cancelled' ? null : (
							<button type="button" onClick={() => void startTask('', ticket.id)}>
								Start
							</button>
						)}
						{ticket.status === 'cancelled' ? null : (
							<button className="primary" type="button" onClick={() => requestComplete('', ticket.id)}>
								Complete
							</button>
						)}
						{ticket.status === 'cancelled' ? null : (
							<button type="button" onClick={() => void spillTicket(ticket.id)}>
								{chore ? 'Move to next day' : 'Move to next sprint'}
							</button>
						)}
					</>
				)}
				{compact ? null : chore ? null : (
					<button type="button" onClick={() => void cloneTicket(ticket.id)}>
						Clone to next sprint
					</button>
				)}
				{compact || done ? null : (
					<button className="ticket-remove" type="button" onClick={() => void removeTicket(ticket.id)}>
						Remove
					</button>
				)}
			</div>
		</article>
	);
}
