import { EFFORTS, REVIEWS, TRACKS } from '../constants';
import { dayBreakdown } from '../lib/day';
import { formatElapsed, formatMinutes, prettyDateLong } from '../lib/time';
import { AppNav } from './AppNav';
import { useStride } from '../store/StrideState';

export function DayLog({ date }: { date: string }) {
	const { completions, openHome } = useStride();
	const day = dayBreakdown(date, completions);
	const maxMinutes = Math.max(1, ...day.byTrack.map((track) => track.minutes));
	const hasCourse = day.taskCount > 0;

	return (
		<div className="page">
			<button className="ghost back" type="button" onClick={openHome}>
				← Today
			</button>
			<header className="topbar">
				<div>
					<p className="eyebrow">Daily record</p>
					<h1>{prettyDateLong(date)}</h1>
				</div>
				<AppNav active="home" />
			</header>

			{!hasCourse ? (
				<p className="lede">
					No loaded-course tasks were completed this day. Starting a timer, running the lab, or closing a loose sprint
					ticket does not mark the heatmap.
				</p>
			) : (
				<p className="lede">
					{day.taskCount} course {day.taskCount === 1 ? 'task' : 'tasks'} · {formatMinutes(day.minutes)} · avg effort{' '}
					{day.avgEffort.toFixed(1)} · avg review {day.avgReview.toFixed(1)}
				</p>
			)}

			{hasCourse ? (
				<>
					<section className="day-stats">
						<div className="stat-card">
							<p className="eyebrow">Time</p>
							<strong>{formatMinutes(day.minutes)}</strong>
						</div>
						<div className="stat-card">
							<p className="eyebrow">Effort</p>
							<div className="score-meter" aria-label={`Effort ${day.avgEffort.toFixed(1)}`}>
								{EFFORTS.map((entry) => (
									<i key={entry.value} className={entry.value <= Math.round(day.avgEffort) ? 'is-on' : ''} />
								))}
							</div>
							<span className="muted">{EFFORTS[Math.max(0, Math.round(day.avgEffort) - 1)]?.label}</span>
						</div>
						<div className="stat-card">
							<p className="eyebrow">Review</p>
							<div className="score-meter is-review" aria-label={`Review ${day.avgReview.toFixed(1)}`}>
								{REVIEWS.map((entry) => (
									<i key={entry.value} className={entry.value <= Math.round(day.avgReview) ? 'is-on' : ''} />
								))}
							</div>
							<span className="muted">{REVIEWS[Math.max(0, Math.round(day.avgReview) - 1)]?.label}</span>
						</div>
					</section>

					<section className="heat-card">
						<div className="shelf-head">
							<h2>Time by field</h2>
						</div>
						<ul className="track-bars">
							{day.byTrack.map((track) => (
								<li key={track.trackId}>
									<div className="bar-label">
										<span>{track.label}</span>
										<span className="muted">
											{track.count} · {formatMinutes(track.minutes)}
										</span>
									</div>
									<div className="bar">
										<span
											style={{
												width: `${Math.round((track.minutes / maxMinutes) * 100)}%`,
												background: TRACKS.find((entry) => entry.id === track.trackId)?.accent,
											}}
										/>
									</div>
								</li>
							))}
						</ul>
					</section>

					<section className="heat-card">
						<div className="shelf-head">
							<h2>What you finished</h2>
						</div>
						<ul className="day-tasks">
							{day.course.map((row) => (
								<li key={row.id} className="day-task">
									<div>
										<strong>{row.title}</strong>
										<p className="muted">
											{row.section} · {formatElapsed(row.elapsedMs)} · effort {row.effort} ·{' '}
											{REVIEWS[row.review - 1]?.label}
										</p>
										{row.notes ? <p>{row.notes}</p> : null}
									</div>
								</li>
							))}
						</ul>
					</section>
				</>
			) : null}

			{day.other.length > 0 ? (
				<section className="heat-card">
					<div className="shelf-head">
						<h2>Off-course and chores</h2>
						<span className="muted">Not on the heatmap</span>
					</div>
					<ul className="day-tasks">
						{day.other.map((row) => (
							<li key={row.id} className="day-task">
								<strong>{row.title}</strong>
								<p className="muted">
									{formatElapsed(row.elapsedMs)} · effort {row.effort} · {REVIEWS[row.review - 1]?.label}
								</p>
								{row.notes ? <p>{row.notes}</p> : null}
							</li>
						))}
					</ul>
				</section>
			) : null}
		</div>
	);
}
