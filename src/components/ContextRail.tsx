import { CHAIR_FLOOR_MS, craftClock, formatCraftHours, metChairFloor } from '../lib/craft';
import { DAILY_REVIEW_CAP, dueQueue, reviewedOn } from '../lib/revise';
import { formatElapsed, todayKey } from '../lib/time';
import { isSessionPaused, sessionElapsed } from '../lib/work-session';
import { useStride } from '../store/StrideState';

export function ContextRail() {
	const { completions, coach, activeSession, reviews, items, openRevise, openSprint, openChores } = useStride();
	const clock = craftClock(completions);
	const today = todayKey();
	const todayMs = completions.reduce((sum, row) => {
		if (row.date !== today) {
			return sum;
		}
		return sum + Math.max(0, row.elapsedMs || 0);
	}, 0);
	const todayMet = metChairFloor(todayMs);
	const reviseDue = dueQueue(reviews, items).length;
	const reviseToday = reviews.filter((card) => reviewedOn(card, todayKey())).length;
	const paused = Boolean(activeSession && isSessionPaused(activeSession));

	return (
		<aside className="context-rail" aria-label="Context">
			<section className="rail-card">
				<p className="eyebrow">Craft clock</p>
				<div className="rail-stats">
					<div>
						<span className="kicker">Week</span>
						<strong>{formatCraftHours(clock.weekMs)}</strong>
					</div>
					<div>
						<span className="kicker">Year</span>
						<strong>{formatCraftHours(clock.yearMs)}</strong>
					</div>
					<div>
						<span className="kicker">Life</span>
						<strong>{formatCraftHours(clock.lifetimeMs)}</strong>
					</div>
				</div>
				<p className="muted rail-note">of 10,000h · closed sessions only</p>
			</section>

			<section className="rail-card">
				<p className="eyebrow">Today in the chair</p>
				<strong className="rail-hours">{formatCraftHours(todayMs)}</strong>
				<p className="muted">
					{todayMet ? 'Floor met' : `Floor ${formatCraftHours(CHAIR_FLOOR_MS)}`} · empty days are fine
				</p>
			</section>

			{activeSession ? (
				<section className={`rail-card${paused ? ' is-paused' : ' is-live'}`}>
					<p className="eyebrow">{paused ? 'Paused' : 'Timer live'}</p>
					<strong className="rail-timer-title">{activeSession.title}</strong>
					<p className="muted">{formatElapsed(sessionElapsed(activeSession))}</p>
				</section>
			) : null}

			<section className="rail-card">
				<p className="eyebrow">{coach.tone}</p>
				<h2 className="rail-coach-title">{coach.headline}</h2>
				<p className="muted">{coach.body}</p>
			</section>

			<section className="rail-card">
				<p className="eyebrow">Quick</p>
				<div className="rail-actions">
					<button type="button" onClick={() => openRevise()}>
						Revise {reviseDue > 0 ? `(${reviseDue})` : ''}
					</button>
					<button type="button" onClick={openSprint}>
						Sprint board
					</button>
					<button type="button" onClick={openChores}>
						Chores
					</button>
				</div>
				<p className="muted rail-note">
					Retrieved {reviseToday}/{DAILY_REVIEW_CAP} today
				</p>
			</section>
		</aside>
	);
}
