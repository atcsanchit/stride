import { useEffect, useState } from 'react';
import { addDays, clampDate, datesInclusive, prettyDate, todayKey, weekdayLabel, weekEnd, weekStart } from '../lib/time';
import { dedupeChoreTicketsForView, sprintLabel, sprintScore } from '../lib/sprint';
import { isChoreTicket, isSprintTicket, ticketTags, ticketTimerPaused } from '../lib/ticket';
import type { ChoreDomain, Priority, Score, TicketKind, TicketPullRequest, TicketStatus, TrackId } from '../types';
import { useStride } from '../store/StrideState';
import { ChoreDomainFields } from './ChoreDomainFields';
import { ChoreTagger } from './ChoreTagger';
import { EffortPills } from './EffortPills';
import { PriorityPills } from './PriorityPills';
import { ResumeTimerModal } from './ResumeTimerModal';
import { StatusPills } from './StatusPills';
import { TicketCard } from './TicketCard';
import { TicketRow } from './TicketRow';
import { TicketStatusGroups } from './TicketStatusGroups';
import { TicketCourseFields } from './TicketCourseFields';
import { TopicTagger } from './TopicTagger';
import { TagChip } from './TagChip';

type Pane = { mode: 'closed' } | { mode: 'new' } | { mode: 'ticket'; id: string };
type TimerPrompt = { ticketId: string; closeAfter: boolean };

export function TicketBoard({ kind }: { kind: TicketKind }) {
	const { currentSprint, tickets, sessions, sprints, resumeTimer, updateSprint, shiftSprint, selectSprint } = useStride();
	const [pane, setPane] = useState<Pane>({ mode: 'closed' });
	const [maximized, setMaximized] = useState(false);
	const [selectedDay, setSelectedDay] = useState<string | 'all'>('all');
	const [timerPrompt, setTimerPrompt] = useState<TimerPrompt | null>(null);
	const [weekOffset, setWeekOffset] = useState(0);
	const [tagFilter, setTagFilter] = useState<string | 'all'>('all');
	const [sprintName, setSprintName] = useState(currentSprint?.name ?? '');
	const chore = kind === 'chore';
	const weekBegin = addDays(weekStart(), weekOffset * 7);
	const days = chore
		? datesInclusive(weekBegin, weekEnd(weekBegin))
		: currentSprint
			? datesInclusive(currentSprint.startDate, currentSprint.endDate)
			: [];
	const boardTickets = tickets.filter((ticket) => (chore ? isChoreTicket(ticket) : isSprintTicket(ticket)));
	const weekEndDate = weekEnd(weekBegin);
	const scoped = chore
		? dedupeChoreTicketsForView(
				boardTickets.filter(
					(ticket) => ticket.plannedDate >= weekBegin && ticket.plannedDate <= weekEndDate,
				),
			)
		: boardTickets.filter(
				(ticket) => !currentSprint || ticket.sprintId === currentSprint.id || !ticket.sprintId,
			);

	useEffect(() => {
		setSprintName(currentSprint?.name ?? '');
	}, [currentSprint?.id, currentSprint?.name]);
	useEffect(() => {
		setSelectedDay('all');
	}, [currentSprint?.id]);

	useEffect(() => {
		if (selectedDay !== 'all' && !days.includes(selectedDay)) {
			setSelectedDay('all');
		}
	}, [days, selectedDay]);
	useEffect(() => {
		if (pane.mode !== 'ticket') {
			return;
		}
		const exists = tickets.some((ticket) => ticket.id === pane.id && (chore ? isChoreTicket(ticket) : isSprintTicket(ticket)));
		if (!exists) {
			setPane({ mode: 'closed' });
			setMaximized(false);
			setTimerPrompt(null);
		}
	}, [chore, pane, tickets]);
	useEffect(() => {
		if (!timerPrompt) {
			return;
		}
		const ticket = tickets.find((entry) => entry.id === timerPrompt.ticketId);
		if (!ticket || !ticketTimerPaused(ticket, sessions)) {
			setTimerPrompt(null);
		}
	}, [sessions, tickets, timerPrompt]);

	const sorted = [...scoped].sort(
		(a, b) =>
			(a.priority ?? 1) - (b.priority ?? 1) ||
			a.plannedDate.localeCompare(b.plannedDate) ||
			a.createdAt - b.createdAt,
	);
	const tagged =
		chore && tagFilter !== 'all' ? sorted.filter((ticket) => ticketTags(ticket).includes(tagFilter)) : sorted;
	const visible =
		chore && selectedDay !== 'all' ? tagged.filter((ticket) => ticket.plannedDate === selectedDay) : tagged;
	const openTicket = pane.mode === 'ticket' ? scoped.find((ticket) => ticket.id === pane.id) : undefined;
	const counts = new Map<string, number>();
	if (chore) {
		for (const ticket of tagged) {
			counts.set(ticket.plannedDate, (counts.get(ticket.plannedDate) ?? 0) + 1);
		}
	} else {
		for (const day of days) {
			counts.set(day, tagged.length);
		}
	}
	const filterTags = [...new Set(sorted.flatMap((ticket) => ticketTags(ticket)))].sort((a, b) => a.localeCompare(b));
	const score = chore ? null : sprintScore(tagged);
	const todaySprint = sprints.find((sprint) => sprint.startDate <= todayKey() && sprint.endDate >= todayKey());

	function closePane() {
		setPane({ mode: 'closed' });
		setMaximized(false);
		setTimerPrompt(null);
	}

	function requestClose() {
		if (pane.mode === 'ticket') {
			const ticket = scoped.find((entry) => entry.id === pane.id);
			if (ticket && ticketTimerPaused(ticket, sessions)) {
				setTimerPrompt({ ticketId: ticket.id, closeAfter: true });
				return;
			}
		}
		closePane();
	}

	function openNew() {
		setPane({ mode: 'new' });
		setMaximized(false);
		setTimerPrompt(null);
	}

	function openTicketPane(id: string) {
		setPane({ mode: 'ticket', id });
		setMaximized(false);
		const ticket = scoped.find((entry) => entry.id === id);
		if (ticket && ticketTimerPaused(ticket, sessions)) {
			setTimerPrompt({ ticketId: id, closeAfter: false });
		} else {
			setTimerPrompt(null);
		}
	}

	const promptTicket = timerPrompt ? scoped.find((ticket) => ticket.id === timerPrompt.ticketId) : undefined;
	const split = pane.mode !== 'closed' && !maximized;
	const maxed = pane.mode !== 'closed' && maximized;
	const defaultDay = chore
		? selectedDay === 'all'
			? todayKey()
			: selectedDay
		: currentSprint
			? clampDate(selectedDay === 'all' ? todayKey() : selectedDay, currentSprint.startDate, currentSprint.endDate)
			: todayKey();

	return (
		<div className={`page sprint-page${maxed ? ' is-max' : ''}${split ? ' is-split' : ''}`}>
			<header className="page-head">
				<div>
					<p className="eyebrow">{chore ? 'Desk work' : 'Planner'}</p>
					<h1>{chore ? 'Chores' : currentSprint ? sprintLabel(currentSprint) : 'Sprint'}</h1>
				</div>
			</header>

			{maxed ? null : (
				<>
					<section className="sprint-range heat-card">
						<div className="shelf-head">
							<h2>{chore ? 'This week' : 'Sprint'}</h2>
							<span className="muted">
								{chore
									? `${prettyDate(weekBegin)} – ${prettyDate(weekEnd(weekBegin))} · Peakflo and assigned work, not course lessons`
									: currentSprint
										? `${prettyDate(currentSprint.startDate)} – ${prettyDate(currentSprint.endDate)} · Tickets in this sprint show on every day`
										: 'No sprint'}
							</span>
						</div>
						{chore ? (
							<div className="sprint-dates sprint-nav">
								<button type="button" onClick={() => setWeekOffset((value) => value - 1)}>
									Previous week
								</button>
								<button type="button" onClick={() => setWeekOffset(0)} disabled={weekOffset === 0}>
									This week
								</button>
								<button type="button" onClick={() => setWeekOffset((value) => value + 1)}>
									Next week
								</button>
							</div>
						) : (
							<>
								<div className="sprint-dates sprint-nav">
									<button type="button" onClick={() => void shiftSprint(-1)}>
										Previous sprint
									</button>
									<button
										type="button"
										disabled={!todaySprint || todaySprint.id === currentSprint?.id}
										onClick={() => todaySprint && selectSprint(todaySprint.id)}
									>
										This sprint
									</button>
									<button type="button" onClick={() => void shiftSprint(1)}>
										Next sprint
									</button>
								</div>
								<div className="sprint-identity">
									<label className="field sprint-name">
										Sprint name
										<input
											value={sprintName}
											placeholder="Optional — this sprint's identity"
											onChange={(event) => setSprintName(event.target.value)}
											onBlur={() => {
												if ((currentSprint?.name ?? '') !== sprintName) {
													void updateSprint({ name: sprintName });
												}
											}}
										/>
									</label>
									<label className="field">
										Start
										<input
											type="date"
											value={currentSprint?.startDate ?? ''}
											onChange={(event) => void updateSprint({ startDate: event.target.value })}
										/>
									</label>
									<label className="field">
										End
										<input
											type="date"
											value={currentSprint?.endDate ?? ''}
											onChange={(event) => void updateSprint({ endDate: event.target.value })}
										/>
									</label>
								</div>
								{score ? (
									<div className="sprint-score">
										<p>
											<strong>
												{score.completedPoints} / {score.estimatedPoints}
											</strong>{' '}
											points
											<span className="muted"> · effort 1–5 per ticket</span>
										</p>
										<p>
											Completed {score.completedCount} of {score.total} tickets · {score.completedPct}%
										</p>
										<p>
											Spillover needed {score.spilloverCount} ticket
											{score.spilloverCount === 1 ? '' : 's'} · {score.spilloverPct}%
										</p>
									</div>
								) : null}
							</>
						)}
						<div className="sprint-cal" role="list">
							<button
								className={selectedDay === 'all' ? 'sprint-day is-on' : 'sprint-day'}
								type="button"
								onClick={() => setSelectedDay('all')}
							>
								<span className="dow">All</span>
								<strong>{tagged.length}</strong>
								<i>tickets</i>
							</button>
							{days.map((day) => {
								const count = counts.get(day) ?? 0;
								return (
									<button
										key={day}
										className={`sprint-day${selectedDay === day ? ' is-on' : ''}${day === todayKey() ? ' is-today' : ''}`}
										type="button"
										onClick={() => setSelectedDay(selectedDay === day ? 'all' : day)}
									>
										<span className="dow">{weekdayLabel(day)}</span>
										<strong>{prettyDate(day)}</strong>
										<i>{count ? `${count}` : '—'}</i>
									</button>
								);
							})}
						</div>
						{chore && filterTags.length > 0 ? (
							<div className="meta-row tag-row" style={{ marginTop: '0.75rem' }}>
								<button
									className={tagFilter === 'all' ? 'pill is-on' : 'pill'}
									type="button"
									onClick={() => setTagFilter('all')}
								>
									All tags
								</button>
								{filterTags.map((tag) => (
									<TagChip
										key={tag}
										tag={tag}
										selected={tagFilter === tag}
										onClick={() => setTagFilter(tagFilter === tag ? 'all' : tag)}
									/>
								))}
							</div>
						) : null}
					</section>

					<div className="sprint-actions">
						<button className="primary" type="button" onClick={openNew}>
							New
						</button>
						<span className="muted">
							{visible.length} {visible.length === 1 ? 'ticket' : 'tickets'}
							{selectedDay === 'all' ? '' : ` on ${prettyDate(selectedDay)}`}
							{chore && tagFilter !== 'all' ? ` · ${tagFilter}` : ''}
						</span>
					</div>
				</>
			)}

			<div className={`sprint-board${split ? ' is-split' : ''}${maxed ? ' is-max' : ''}`}>
				{maxed ? null : (
					<section className="sprint-list">
						<TicketStatusGroups
							tickets={visible}
							idPrefix={chore ? 'chore-board' : 'sprint-board'}
							empty={
								<p className="muted">
									{chore
										? 'No chores in this view. Press New to capture assigned work.'
										: 'No tickets in this view. Press New to write one.'}
								</p>
							}
							renderTicket={(ticket) => (
								<TicketRow
									ticket={ticket}
									hideStatus
									open={pane.mode === 'ticket' && pane.id === ticket.id}
									onOpen={() => openTicketPane(ticket.id)}
								/>
							)}
						/>
					</section>
				)}

				{pane.mode === 'closed' ? null : (
					<aside className="sprint-pane">
						<div className="sprint-pane-head">
							<p className="eyebrow">{pane.mode === 'new' ? (chore ? 'New chore' : 'New ticket') : chore ? 'Chore' : 'Ticket'}</p>
							<div className="sprint-pane-actions">
								{maximized ? (
									<button type="button" onClick={() => setMaximized(false)}>
										Split
									</button>
								) : (
									<button type="button" onClick={() => setMaximized(true)}>
										Maximize
									</button>
								)}
								<button className="ghost" type="button" onClick={requestClose}>
									Close
								</button>
							</div>
						</div>
						{pane.mode === 'new' ? (
							<NewTicketForm
								kind={kind}
								days={days}
								defaultDay={defaultDay}
								onCreated={(id) => {
									setPane({ mode: 'ticket', id });
									setMaximized(false);
								}}
							/>
						) : openTicket ? (
							<TicketCard ticket={openTicket} />
						) : (
							<p className="muted">That ticket is gone.</p>
						)}
					</aside>
				)}
			</div>
			{promptTicket ? (
				<ResumeTimerModal
					title={promptTicket.title}
					onResume={() => {
						const closeAfter = timerPrompt?.closeAfter;
						void resumeTimer(promptTicket.id).then(() => {
							setTimerPrompt(null);
							if (closeAfter) {
								setPane({ mode: 'closed' });
								setMaximized(false);
							}
						});
					}}
					onLater={() => {
						const closeAfter = timerPrompt?.closeAfter;
						setTimerPrompt(null);
						if (closeAfter) {
							setPane({ mode: 'closed' });
							setMaximized(false);
						}
					}}
				/>
			) : null}
		</div>
	);
}

function NewTicketForm({
	kind,
	days,
	defaultDay,
	onCreated,
}: {
	kind: TicketKind;
	days: string[];
	defaultDay: string;
	onCreated: (id: string) => void;
}) {
	const { items, settings, addTicket, saveChoreClient } = useStride();
	const chore = kind === 'chore';
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [scope, setScope] = useState('');
	const [courseId, setCourseId] = useState<TrackId | undefined>();
	const [needsPr, setNeedsPr] = useState(false);
	const [pullRequests, setPullRequests] = useState<TicketPullRequest[]>([]);
	const [choreDomain, setChoreDomain] = useState<ChoreDomain | undefined>();
	const [choreClient, setChoreClient] = useState<string | undefined>();
	const [topicIds, setTopicIds] = useState<string[]>([]);
	const [tags, setTags] = useState<string[]>([]);
	const [estimatedEffort, setEstimatedEffort] = useState<Score | null>(3);
	const [priority, setPriority] = useState<Priority | null>(1);
	const [status, setStatus] = useState<TicketStatus>('requirements');
	const [plannedDate, setPlannedDate] = useState(defaultDay);

	return (
		<form
			onSubmit={(event) => {
				event.preventDefault();
				void addTicket({
					kind,
					title,
					description,
					scope,
					topicIds: chore ? [] : topicIds,
					tags: chore ? tags : [],
					courseId: chore ? undefined : courseId,
					needsPr: chore ? false : needsPr,
					pullRequests: chore ? [] : pullRequests,
					choreDomain: chore ? choreDomain : undefined,
					choreClient: chore ? choreClient : undefined,
					estimatedEffort,
					priority,
					plannedDate,
					status,
				}).then((ticket) => {
					if (ticket) {
						onCreated(ticket.id);
					}
				});
			}}
		>
			<label className="field">
				Title
				<input
					value={title}
					onChange={(event) => setTitle(event.target.value)}
					placeholder={chore ? 'What was assigned, or what needs doing today?' : 'What are you shipping this sprint?'}
					required
				/>
			</label>
			<label className="field">
				Description
				<textarea
					value={description}
					onChange={(event) => setDescription(event.target.value)}
					placeholder={chore ? 'Ticket context, who asked, what done looks like' : 'Context, why this exists, what done looks like'}
				/>
			</label>
			<label className="field">
				Scope
				<textarea
					className="ticket-scope"
					value={scope}
					onChange={(event) => setScope(event.target.value)}
					placeholder="In scope / out of scope"
				/>
			</label>
			{chore ? (
				<ChoreDomainFields
					ticket={{ choreDomain, choreClient }}
					settings={settings}
					onChange={(patch) => {
						if ('choreDomain' in patch) {
							setChoreDomain(patch.choreDomain ?? undefined);
						}
						if ('choreClient' in patch) {
							setChoreClient(patch.choreClient ?? undefined);
						}
					}}
					onAddClient={saveChoreClient}
				/>
			) : (
				<TicketCourseFields
					ticket={{ id: '', courseId, needsPr, pullRequests }}
					settings={settings}
					onChange={(patch) => {
						if ('courseId' in patch) {
							const next = patch.courseId ?? undefined;
							setCourseId(next);
							setTopicIds((current) =>
								next
									? current.filter((id) => items.find((item) => item.id === id)?.trackId === next)
									: [],
							);
						}
						if (patch.needsPr !== undefined) {
							setNeedsPr(patch.needsPr);
						}
						if (patch.pullRequests) {
							setPullRequests(patch.pullRequests);
						}
					}}
				/>
			)}
			{chore ? (
				<ChoreTagger selected={tags} onChange={setTags} />
			) : courseId ? (
				<TopicTagger selected={topicIds} onChange={setTopicIds} items={items} lockTrack={courseId} />
			) : (
				<p className="muted">Choose a course to tag lessons.</p>
			)}
			<div className="ticket-meta-grid">
				<EffortPills value={estimatedEffort} onChange={setEstimatedEffort} />
				<PriorityPills value={priority} onChange={setPriority} />
				<StatusPills value={status} onChange={setStatus} omit={['done']} />
				<label className="field" style={{ marginBottom: 0 }}>
					Day
					{chore ? (
						<input type="date" value={plannedDate} onChange={(event) => setPlannedDate(event.target.value)} />
					) : (
						<select value={plannedDate} onChange={(event) => setPlannedDate(event.target.value)}>
							{days.map((day) => (
								<option key={day} value={day}>
									{prettyDate(day)}
									{day === todayKey() ? ' · today' : ''}
								</option>
							))}
						</select>
					)}
				</label>
			</div>
			<button className="primary" type="submit">
				{chore ? 'Create chore' : 'Create ticket'}
			</button>
		</form>
	);
}
