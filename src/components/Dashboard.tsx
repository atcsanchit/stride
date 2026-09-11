import { useMemo, useRef, type CSSProperties } from 'react';
import { firstName, trackMeta } from '../constants';
import { consistencyScore, suggestedFloor } from '../lib/coach';
import { DAILY_REVIEW_CAP, dueQueue, reviewedOn } from '../lib/revise';
import { todayKey, weekdayLabel } from '../lib/time';
import { ticketOnSprintDay } from '../lib/sprint';
import { useStride } from '../store/StrideState';
import { AppNav } from './AppNav';
import { HappeningCard } from './HappeningCard';
import { Heatmap } from './Heatmap';
import { TaskRow } from './TaskRow';
import { TicketCard } from './TicketCard';
import { TicketStatusGroups } from './TicketStatusGroups';

export function Dashboard() {
	const { stats, plan, coach, openTrack, openRevise, importFiles, settings, setTarget, profile, tickets, sprints, reviews, items } =
		useStride();
	const fileRef = useRef<HTMLInputElement>(null);
	const overall = consistencyScore(
		stats.flatMap((track) => track.last7).length
			? stats[0].last7.map((_, index) => {
					const date = stats[0].last7[index].date;
					const count = stats.reduce((sum, track) => sum + (track.last7[index]?.count ?? 0), 0);
					return { date, count };
				})
			: [],
	);
	const also = plan.also ? trackMeta(plan.also) : null;
	const todaySprint = useMemo(
		() =>
			tickets
				.filter(
					(ticket) =>
						ticket.kind !== 'chore' &&
						ticketOnSprintDay(ticket, todayKey(), sprints) &&
						ticket.status !== 'done' &&
						ticket.status !== 'cancelled',
				)
				.sort((a, b) => a.priority - b.priority),
		[sprints, tickets],
	);
	const todayChores = useMemo(
		() =>
			tickets
				.filter(
					(ticket) =>
						ticket.kind === 'chore' &&
						ticket.plannedDate === todayKey() &&
						ticket.status !== 'done' &&
						ticket.status !== 'cancelled',
				)
				.sort((a, b) => a.priority - b.priority),
		[tickets],
	);
	const reviseDue = useMemo(() => dueQueue(reviews, items), [items, reviews]);
	const reviseToday = reviews.filter((card) => reviewedOn(card, todayKey())).length;

	return (
		<div className="page">
			<header className="topbar">
				<div>
					<p className="eyebrow">Skill cadence</p>
					<h1>Stride</h1>
				</div>
				<AppNav active="home" />
			</header>

			<p className="lede">
				{profile ? `${firstName(profile.name)}, l` : 'L'}earning is production, not consumption. Blurt first, apply the
				same day, write one sentence of what you learned. Watching a video does not mark the heatmap. The week below is
				the live plan.
			</p>

			<section className="coach">
				<span className="tone">{coach.tone}</span>
				<h2>{coach.headline}</h2>
				<p>{coach.body}</p>
			</section>

			<HappeningCard />

			<section className="tracks">
				{stats.map((track) => {
					const meta = trackMeta(track.trackId);
					return (
						<button
							key={track.trackId}
							className={`track-card${settings.activeTrack === track.trackId ? ' is-focus' : ''}`}
							type="button"
							style={{ '--accent': meta.accent } as CSSProperties}
							onClick={() => openTrack(track.trackId)}
						>
							<span className="kicker">{meta.label}</span>
							<strong className="pct">{track.percent}%</strong>
							<p>
								{track.done}/{track.total} · {track.currentSection}
							</p>
							<div className="bar">
								<span style={{ width: `${track.percent}%` }} />
							</div>
							<p>
								{track.todayCount}/{track.target} today · streak {track.streak}
							</p>
							<div className="week" aria-hidden="true">
								{track.last7.map((day) => (
									<i
										key={day.date}
										title={`${weekdayLabel(day.date)} ${day.count}`}
										style={{
											background: day.count > 0 ? meta.accent : undefined,
											opacity: day.count > 0 ? Math.min(1, 0.35 + day.count / Math.max(track.target, 1)) : 1,
										}}
									/>
								))}
							</div>
						</button>
					);
				})}
			</section>

			<section className="plan">
				<div className="plan-head">
					<div>
						<p className="eyebrow">Spaced retrieval</p>
						<h2>Revise completed topics</h2>
					</div>
					<button type="button" onClick={() => openRevise()}>
						Open queue
					</button>
				</div>
				<p className="muted">
					{reviseDue.length === 0
						? items.some((item) => item.done)
							? 'Nothing due. Retrieve after a gap — that wait is the method.'
							: 'Complete a course item and it will land here tomorrow.'
						: `${reviseDue.length} due · retrieved ${reviseToday}/${DAILY_REVIEW_CAP} today. Cover the notes, then rate the retrieval.`}
				</p>
				{reviseDue.length > 0 ? (
					<ul className="plan-list" style={{ marginTop: '0.7rem' }}>
						{reviseDue.slice(0, 3).map((row) => (
							<li key={row.item.id}>
								<TaskRow item={row.item} compact />
							</li>
						))}
					</ul>
				) : null}
			</section>

			<div className="home-grid">
				<div className="home-stack">
					<section className="plan">
						<div className="plan-head">
							<div>
								<p className="eyebrow">Today</p>
								<h2>Sprint tickets</h2>
							</div>
							<span className="pill is-on">Course work</span>
						</div>
						{todaySprint.length === 0 ? (
							<p className="muted">Nothing assigned today. Add a High ticket on the Sprint board, or start a course item below.</p>
						) : (
							<TicketStatusGroups
								tickets={todaySprint}
								idPrefix="today-sprint"
								listClassName="plan-list"
								empty={null}
								renderTicket={(ticket) => <TicketCard ticket={ticket} compact />}
							/>
						)}
					</section>
					<section className="plan">
						<div className="plan-head">
							<div>
								<p className="eyebrow">Today</p>
								<h2>Chores</h2>
							</div>
							<span className="pill is-on">Desk work</span>
						</div>
						{todayChores.length === 0 ? (
							<p className="muted">No Peakflo / assigned work for today. Capture it on Chores instead of a notepad.</p>
						) : (
							<TicketStatusGroups
								tickets={todayChores}
								idPrefix="today-chores"
								listClassName="plan-list"
								empty={null}
								renderTicket={(ticket) => <TicketCard ticket={ticket} compact />}
							/>
						)}
					</section>
				</div>
				<section className="plan">
					<div className="plan-head">
						<div>
							<p className="eyebrow">Course of action</p>
							<h2>{trackMeta(plan.trackId).label} next</h2>
						</div>
						<span className="pill is-on">
							{plan.target} {trackMeta(plan.trackId).unitPlural}
						</span>
					</div>
					<p className="reason">{plan.reason}</p>
					{also ? (
						<p className="muted">
							If energy remains: one {also.unit} on {also.label}.
						</p>
					) : null}
					<ul className="plan-list">
						{plan.items.length === 0 ? (
							<li className="muted">This track is clear. Drop a new roadmap or open another field.</li>
						) : (
							plan.items.map((item) => (
								<li key={item.id}>
									<TaskRow item={item} />
								</li>
							))
						)}
					</ul>
					<div className="meta-row">
						<span className="muted">Cadence score {overall}/100</span>
						{stats.map((track) => {
							const floor = suggestedFloor(track.last7, track.target);
							if (floor >= track.target) {
								return null;
							}
							return (
								<button key={track.trackId} className="ghost" type="button" onClick={() => void setTarget(track.trackId, floor)}>
									Set {trackMeta(track.trackId).short} floor to {floor}
								</button>
							);
						})}
					</div>
				</section>
			</div>

			<Heatmap />

			<section className="drop-hint">
				<strong>Drop a .md roadmap</strong>
				<p className="muted" style={{ margin: '0.35rem 0 0.8rem' }}>
					Use headings for modules and <code>- [ ]</code> checklists for skills. Completing those items is what marks a
					day.
				</p>
				<button type="button" onClick={() => fileRef.current?.click()}>
					Upload markdown
				</button>
				<input
					ref={fileRef}
					className="sr-only"
					type="file"
					accept=".md,text/markdown"
					multiple
					onChange={(event) => {
						if (event.target.files) {
							void importFiles(event.target.files);
							event.target.value = '';
						}
					}}
				/>
			</section>
		</div>
	);
}
