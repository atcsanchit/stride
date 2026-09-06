import { happeningForDate, learnedThisWeek, weekHappenings } from '../lib/happenings';
import { todayKey } from '../lib/time';
import { useStride } from '../store/StrideState';

export function HappeningCard() {
	const { completions, goTo } = useStride();
	const today = todayKey();
	const happening = happeningForDate(today);
	const week = weekHappenings(today);
	const learned = learnedThisWeek(completions, today);

	return (
		<section className="happening">
			<div className="plan-head">
				<div>
					<p className="eyebrow">{happening.kicker}</p>
					<h2>{happening.title}</h2>
				</div>
				<button className="primary" type="button" onClick={() => goTo(happening.view)}>
					{happening.cta}
				</button>
			</div>
			<p>{happening.body}</p>
			<div className="week-events" aria-label="This week">
				{week.map((row) => (
					<button
						key={row.date}
						className={row.date === today ? 'week-event is-today' : 'week-event'}
						type="button"
						onClick={() => goTo(row.view)}
						title={row.title}
					>
						<small>{row.weekday}</small>
						<span>{row.chip}</span>
					</button>
				))}
			</div>
			{learned.length > 0 ? (
				<div className="interest-trail">
					<p className="eyebrow">What I learned this week</p>
					<ul>
						{learned.slice(0, 5).map((row) => (
							<li key={row.id}>
								<strong>{row.title}</strong>
								<span>{row.notes}</span>
							</li>
						))}
					</ul>
				</div>
			) : (
				<p className="muted">
					Complete a task and write one sentence of what you learned. That trail is how you follow the interest
					instead of collecting more courses.
				</p>
			)}
		</section>
	);
}
