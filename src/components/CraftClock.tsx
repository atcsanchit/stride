import { craftClock, formatCraftHours } from '../lib/craft';
import { useStride } from '../store/StrideState';

export function CraftClock() {
	const { completions } = useStride();
	const clock = craftClock(completions);

	return (
		<section className="craft-clock heat-card" aria-label="Craft clock">
			<div className="shelf-head">
				<div>
					<p className="eyebrow">Craft clock</p>
					<h2>Deliberate hours</h2>
				</div>
				<span className="muted">Closed sessions only. Running timers do not count.</span>
			</div>
			<div className="craft-clock-stats">
				<div className="craft-stat">
					<span className="kicker">This week</span>
					<strong>{formatCraftHours(clock.weekMs)}</strong>
				</div>
				<div className="craft-stat">
					<span className="kicker">This year</span>
					<strong>{formatCraftHours(clock.yearMs)}</strong>
				</div>
				<div className="craft-stat">
					<span className="kicker">Lifetime</span>
					<strong>{formatCraftHours(clock.lifetimeMs)}</strong>
					<small className="muted">of 10,000h</small>
				</div>
			</div>
		</section>
	);
}
